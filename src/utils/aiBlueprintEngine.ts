import type { Layer } from '../types';

export interface AiBlueprintTrait {
  name: string;
  weight: number;
  image?: string;
  svg?: string;
}

export interface AiBlueprintLayer {
  name: string;
  role: string;
  required: boolean;
  noneWeight: number;
  traits: AiBlueprintTrait[];
}

export interface AiCollectionBlueprint {
  collectionName: string;
  description: string;
  subject: string;
  styleLabel: string;
  count: number;
  width: number;
  height: number;
  layers: AiBlueprintLayer[];
  _pipeline?: Record<string, unknown>;
}

const ROLE_ORDER: Record<string, number> = {
  background: 10,
  base: 20,
  body: 20,
  texture: 30,
  outfit: 40,
  face: 50,
  eyes: 50,
  accessory: 60,
  headwear: 70,
  overlay: 80,
  effect: 90,
  foreground: 100,
};

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isNoneTrait(name: string): boolean {
  const n = String(name || '').trim().toLowerCase();
  return n === 'none' || n.startsWith('no ') || n.includes(' transparent') || n.includes('empty');
}

function normalizeSvgMarkup(raw: string): string {
  let svg = String(raw || '').trim();

  // Remove accidental Markdown fences / XML declarations and normalize smart quotes.
  svg = svg
    .replace(/^```(?:svg|xml)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();

  const first = svg.indexOf('<svg');
  const last = svg.lastIndexOf('</svg>');
  if (first >= 0) svg = svg.slice(first, last >= first ? last + 6 : undefined);

  // Escape bare ampersands, a common LLM SVG failure mode.
  svg = svg.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');

  // Geometry elements are leaf nodes in our renderer. Normalize them to self-closing XML.
  const leafTags = ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'stop'];
  for (const tag of leafTags) {
    const closeRe = new RegExp(`</${tag}\\s*>`, 'gi');
    svg = svg.replace(closeRe, '');
    const openRe = new RegExp(`<${tag}\\b([^<>]*)>`, 'gi');
    svg = svg.replace(openRe, (match, attrs) => {
      if (/\/\s*>$/.test(match)) return match;
      const cleanAttrs = String(attrs || '').replace(/\/\s*$/, '').trimEnd();
      return `<${tag}${cleanAttrs ? ` ${cleanAttrs.trimStart()}` : ''}/>`;
    });
  }

  if (!svg.endsWith('</svg>')) svg += '</svg>';
  if (!/xmlns\s*=/.test(svg)) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!/viewBox\s*=\s*['"][^'"]+['"]/i.test(svg)) {
    svg = svg.replace('<svg', '<svg viewBox="0 0 128 128"');
  }

  return svg;
}

function browserNormalizeSvg(svg: string): string {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') return svg;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('AI returned malformed SVG markup.');
  }
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') {
    throw new Error('AI returned an invalid SVG document.');
  }
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!root.getAttribute('viewBox')) root.setAttribute('viewBox', '0 0 128 128');
  root.setAttribute('width', '128');
  root.setAttribute('height', '128');
  return new XMLSerializer().serializeToString(root);
}

function sanitizeSvg(raw: string, allowTransparent = false): string {
  let svg = normalizeSvgMarkup(raw);
  if (!svg.startsWith('<svg')) {
    throw new Error('AI returned a trait without a valid SVG root.');
  }

  // Defense in depth: generated art is rendered as an image, but still strip active/external content.
  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<(?:iframe|object|embed|audio|video)[\s\S]*?<\/(?:iframe|object|embed|audio|video)>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\s(?:href|xlink:href)\s*=\s*(['"])(?!#)[\s\S]*?\1/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/url\s*\(\s*['"]?https?:[^)]*\)/gi, 'none');

  const hasVisual = /<(rect|circle|ellipse|line|polyline|polygon|path|text)\b/i.test(svg);
  if (!allowTransparent && !hasVisual) {
    throw new Error('AI returned an empty required trait.');
  }

  if (svg.length > 12000) {
    throw new Error('AI returned an SVG that is too large.');
  }

  return browserNormalizeSvg(svg);
}

function svgToDataUrl(svg: string): string {
  try {
    const bytes = new TextEncoder().encode(svg);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return `data:image/svg+xml;base64,${btoa(binary)}`;
  } catch {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}

function roleScore(role: string, index: number): number {
  const key = String(role || '').toLowerCase();
  return (ROLE_ORDER[key] ?? 55) + index / 100;
}

export function createCollectionFromBlueprint(userPrompt: string, blueprint: AiCollectionBlueprint) {
  if (!blueprint || !Array.isArray(blueprint.layers)) {
    throw new Error('AI returned an invalid collection blueprint.');
  }

  if (blueprint.layers.length < 4) {
    throw new Error('AI returned too few layers for a usable generative collection.');
  }

  const seed = hashSeed(`${userPrompt}::${JSON.stringify(blueprint)}`);

  const sortedLayers = blueprint.layers
    .slice(0, 8)
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => roleScore(a.layer.role, a.index) - roleScore(b.layer.role, b.index));

  const layers: Layer[] = sortedLayers.map(({ layer }, layerIndex) => {
    const required = layer.required !== false;
    const rawTraits = Array.isArray(layer.traits) ? layer.traits.slice(0, 8) : [];
    if (rawTraits.length === 0) {
      throw new Error(`Layer "${layer.name}" has no traits.`);
    }

    const traits = rawTraits.map((trait, traitIndex) => {
      const name = String(trait?.name || `Trait ${traitIndex + 1}`).trim();
      const image = String(trait?.image || '').trim();

      if (image.startsWith('data:image/')) {
        return {
          id: `ai-${seed}-${layerIndex}-${traitIndex}`,
          name,
          weight: Math.max(1, Math.min(100, Number(trait?.weight || 1))),
          imageSrc: image,
        };
      }

      const allowTransparent = !required && isNoneTrait(name);
      const svg = sanitizeSvg(String(trait?.svg || ''), allowTransparent);
      return {
        id: `ai-${seed}-${layerIndex}-${traitIndex}`,
        name,
        weight: Math.max(1, Math.min(100, Number(trait?.weight || 1))),
        imageSrc: svgToDataUrl(svg),
        svgData: svg,
      };
    });

    return {
      id: `ai-layer-${seed}-${layerIndex}`,
      name: String(layer.name || `Layer ${layerIndex + 1}`).trim(),
      required,
      enabled: true,
      noneWeight: required ? 0 : Math.max(0, Math.min(60, Number(layer.noneWeight || 0))),
      traits,
    };
  });

  const totalCombinations = layers.reduce((acc, layer) => {
    const variants = layer.traits.length + (!layer.required && layer.noneWeight > 0 ? 1 : 0);
    return acc * Math.max(1, variants);
  }, 1);

  if (totalCombinations < 10000) {
    throw new Error(`AI blueprint only creates ${totalCombinations.toLocaleString()} combinations. Please generate again.`);
  }

  return {
    name: String(blueprint.collectionName || 'Untitled Collection').trim(),
    description: String(blueprint.description || 'AI-generated generative NFT collection.').trim(),
    baseUri: `ipfs://glitch-${seed.toString(16)}/`,
    width: 512,
    height: 512,
    count: Math.max(10, Math.min(10000, Number(blueprint.count || 10000))),
    batchSize: 500,
    zipChunkSize: 2500,
    layers,
    subject: String(blueprint.subject || '').trim(),
    styleLabel: String(blueprint.styleLabel || 'AI Generated').trim(),
    activeLlm: 'Mistral Text + Mistral Image Generation',
    generationMode: 'ai-raster-layers',
  };
}
