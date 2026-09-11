import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Wand2,
  Zap,
  Lightbulb,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { Layer, CollectionConfig } from '../types';
import { createCollectionFromBlueprint } from '../utils/aiBlueprintEngine';
import {
  removeChromaKey,
  extractDifferenceLayer,
  validateRasterImage,
} from '../utils/rasterLayerEngine';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedCollection?: (newLayers: Layer[], newConfig: CollectionConfig) => void;
  onApplyCollection?: (newLayers: Layer[], newConfig: CollectionConfig) => void;
  currentLayerCount?: number;
}

const INSPIRATION_PROMPTS = [
  {
    title: 'Cyberpunk Samurai Cats',
    prompt: 'Cyberpunk feline samurai warriors with glowing neon katanas, cybernetic armor, and holographic battle masks in a rainy neo-Tokyo alley',
  },
  {
    title: 'Glitched Mecha Skulls',
    prompt: 'Corrupted cybernetic robotic skulls with floating pixel crowns, RGB chromatic glitch halos, and glowing radioactive visors',
  },
  {
    title: 'Retro 8-Bit Space Explorers',
    prompt: 'Cosmic pixel-art astronaut droids exploring strange neon alien planets with crystal helmets and retro arcade jetpacks',
  },
  {
    title: 'Dark Fantasy Pixel Necromancers',
    prompt: 'Pixelated dark sorcerers with cursed bone masks, ethereal spectral flames, and ancient grimoires in a haunted graveyard',
  },
  {
    title: 'Neon Streetwear Demons',
    prompt: 'Chibi pixel demons with glowing horns, oversized cyberpunk streetwear hoodies, cyber sneakers, and graffiti backgrounds',
  },
];

const STYLE_PRESETS = [
  'AUTO — Follow User Prompt',
  'Pixel Art / 16-Bit',
  'Clean Vector Cartoon',
  'Neon Cyberpunk',
  'Dark Gothic',
  'Retro Arcade',
];

export const AIPromptModal: React.FC<AIPromptModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedCollection,
  onApplyCollection,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const fetchJsonWithRetry = async (
    url: string,
    body: Record<string, unknown>,
    label: string,
    maxRetries = 5
  ) => {
    let lastError = '';
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 60000);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);

        let payload: any = {};
        try {
          payload = await res.json();
        } catch {
          payload = {};
        }

        if (res.ok) return payload;

        const retryable = res.status === 429 || res.status === 502 || res.status === 503;
        if (retryable && attempt < maxRetries) {
          const headerSeconds = Number(res.headers.get('Retry-After') || 0);
          const exponentialBackoff = Math.min(30000, 1200 * (2 ** attempt));
          const jitter = Math.floor(Math.random() * 1200);
          const waitMs = Math.max(
            1800,
            Number(payload?.retryAfterMs || 0),
            Number.isFinite(headerSeconds) ? headerSeconds * 1000 : 0,
            exponentialBackoff + jitter
          );
          setLoadingStep(`${label} — AI busy, retrying in ${Math.ceil(waitMs / 1000)}s...`);
          await sleep(waitMs);
          continue;
        }

        const stage = payload?.stage ? ` [${payload.stage}]` : '';
        const detail = payload?.detail ? ` ${payload.detail}` : '';
        throw new Error(`${payload?.error || `${label} failed.`}${stage}${detail}`.slice(0, 620));
      } catch (err: unknown) {
        window.clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          lastError = `${label} timed out.`;
          if (attempt < maxRetries) {
            setLoadingStep(`${label} timed out — retrying...`);
            await sleep(3500 + attempt * 2000);
            continue;
          }
        }
        throw err;
      }
    }
    throw new Error(lastError || `${label} failed after retries.`);
  };

  const generateImage = async (
    body: Record<string, unknown>,
    label: string,
    maxRetries = 4
  ): Promise<{ image: string; conversationId: string; entryId: string }> => {
    const response = await fetchJsonWithRetry('/api/generate-image', body, label, maxRetries);
    const image = String(response?.image || '');
    if (!image.startsWith('data:image/')) throw new Error(`${label} returned no usable image.`);
    if (!(await validateRasterImage(image))) throw new Error(`${label} returned an image the browser cannot decode.`);
    return {
      image,
      conversationId: String(response?.conversationId || ''),
      entryId: String(response?.entryId || ''),
    };
  };

  const handleGenerate = async (customPromptText?: string) => {
    const textToUse = (customPromptText || prompt).trim();
    if (!textToUse) return;

    setIsLoading(true);
    setError(null);

    try {
      setLoadingStep('Mistral: checking safety and designing the 10K collection architecture...');
      const planResponse = await fetchJsonWithRetry(
        '/api/plan-collection',
        { prompt: textToUse, style: selectedStyle },
        'Collection planning',
        5
      );

      const plan = planResponse?.plan;
      if (!plan || !Array.isArray(plan.layers) || plan.layers.length !== 6) {
        throw new Error('AI plan did not contain the required 6-layer collection architecture.');
      }

      const backgroundLayer = plan.layers.find((layer: any) => layer.role === 'background');
      const baseLayer = plan.layers.find((layer: any) => layer.role === 'base');
      if (!backgroundLayer || !baseLayer || !baseLayer.traits?.length) {
        throw new Error('Collection plan is missing its required background or base layer.');
      }

      const totalAssets = plan.layers.reduce((sum: number, layer: any) => sum + layer.traits.length, 0);
      let completedAssets = 0;
      const progressLabel = (label: string) => `${label} — ${completedAssets}/${totalAssets} trait assets ready`;

      const masterTrait = baseLayer.traits[0];
      setLoadingStep('Mistral Image: creating the canonical master reference...');
      const masterResult = await generateImage(
        {
          task: 'master',
          prompt: textToUse,
          plan,
          layer: baseLayer,
          trait: masterTrait,
        },
        'Master reference',
        4
      );
      const masterOriginal = masterResult.image;
      if (!masterResult.conversationId || !masterResult.entryId) {
        throw new Error('Mistral master image did not return a reusable conversation reference.');
      }
      const masterTransparent = await removeChromaKey(masterOriginal);
      completedAssets += 1;

      const renderedLayers: any[] = [];

      for (let layerIndex = 0; layerIndex < plan.layers.length; layerIndex += 1) {
        const layer = plan.layers[layerIndex];
        const renderedTraits: any[] = [];

        for (let traitIndex = 0; traitIndex < layer.traits.length; traitIndex += 1) {
          const trait = layer.traits[traitIndex];

          // The master already represents the first base trait.
          if (layer.role === 'base' && traitIndex === 0) {
            renderedTraits.push({ ...trait, image: masterTransparent });
            continue;
          }

          setLoadingStep(progressLabel(`Mistral Image: ${layer.name} / ${trait.name}`));

          let finalImage = '';
          let assetError: unknown = null;
          for (let visualAttempt = 0; visualAttempt < 3; visualAttempt += 1) {
            try {
              if (layer.role === 'background') {
                const generated = await generateImage(
                  {
                    task: 'background',
                    prompt: textToUse,
                    plan,
                    layer,
                    trait,
                  },
                  `${layer.name}: ${trait.name}`,
                  4
                );
                finalImage = generated.image;
              } else if (layer.role === 'base') {
                const edited = await generateImage(
                  {
                    task: 'base-variant',
                    prompt: textToUse,
                    plan,
                    layer,
                    trait,
                    referenceConversationId: masterResult.conversationId,
                    referenceEntryId: masterResult.entryId,
                  },
                  `${layer.name}: ${trait.name}`,
                  4
                );
                finalImage = await removeChromaKey(edited.image);
              } else {
                const editedFull = await generateImage(
                  {
                    task: 'overlay-edit',
                    prompt: textToUse,
                    plan,
                    layer,
                    trait,
                    referenceConversationId: masterResult.conversationId,
                    referenceEntryId: masterResult.entryId,
                  },
                  `${layer.name}: ${trait.name}`,
                  4
                );
                const editedTransparent = await removeChromaKey(editedFull.image);
                finalImage = await extractDifferenceLayer(masterTransparent, editedTransparent);
              }

              if (!(await validateRasterImage(finalImage))) {
                throw new Error('Generated trait image failed browser validation.');
              }
              assetError = null;
              break;
            } catch (err) {
              assetError = err;
              if (visualAttempt < 2) {
                setLoadingStep(`${layer.name} / ${trait.name} needs a visual retry...`);
                await sleep(1200 + visualAttempt * 900);
              }
            }
          }

          if (assetError || !finalImage) {
            throw assetError instanceof Error
              ? assetError
              : new Error(`Could not create ${layer.name} / ${trait.name}.`);
          }

          renderedTraits.push({ ...trait, image: finalImage });
          completedAssets += 1;

          // Gentle pacing keeps interactive image-generation quotas stable.
          await sleep(450);
        }

        renderedLayers.push({ ...layer, traits: renderedTraits });
      }

      setLoadingStep('Finalizing composable layers, rarity, and metadata structure...');
      const blueprint = {
        collectionName: plan.collectionName,
        description: plan.description,
        subject: plan.subject,
        styleLabel: plan.styleLabel,
        count: 10000,
        width: 512,
        height: 512,
        layers: renderedLayers,
        _pipeline: {
          version: '1.3.0',
          mode: 'mistral-plan-mistral-image-raster-layers',
        },
      };

      const data = createCollectionFromBlueprint(textToUse, blueprint);
      if (!data.layers || data.layers.length === 0) {
        throw new Error('AI artwork did not produce usable NFT layers.');
      }

      const newConfig: CollectionConfig = {
        name: data.name,
        description: data.description,
        baseUri: data.baseUri || 'ipfs://QmCustomNewCollection/',
        width: data.width || 512,
        height: data.height || 512,
        count: data.count || 10000,
        batchSize: data.batchSize || 500,
        zipChunkSize: data.zipChunkSize || 2500,
      };

      const applyFn = onApplyGeneratedCollection || onApplyCollection;
      if (applyFn) applyFn(data.layers, newConfig);
      onClose();
    } catch (err: unknown) {
      console.error('AI Generation failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown generation error occurred';
      setError(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2 flex-wrap">
                <span>GLITCH AI Collection Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  MISTRAL BRAIN → MISTRAL IMAGE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Type any safe concept. Mistral designs the collection architecture, then Mistral Image Generation creates real visual assets that are converted into composable NFT layers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Text Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>What kind of NFT collection do you want to create?</span>
              <span className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                Prompt-Locked Generation
              </span>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. doge punk with laser eyes and ripped jackets, floating sushi robots, cute alien plants, abstract glitch masks..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Visual Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span>Aesthetic & Art Direction</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    selectedStyle === style
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Inspiration Chips */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span>Or Pick from Curated Inspirations</span>
            </div>
            <div className="space-y-2">
              {INSPIRATION_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setPrompt(item.prompt);
                    handleGenerate(item.prompt);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-medium">
                      Apply Concept →
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading status indicator */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>{loadingStep || 'Generating custom NFT collection...'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 w-full animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500">
                Mistral plans the collection, then Mistral Image Generation creates the master reference and raster trait assets. A full collection can take a few minutes to prepare.
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={isLoading || !prompt.trim()}
            onClick={() => handleGenerate()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Zap className="h-5 w-5 animate-spin" />
                <span>Generating Real AI Artwork...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate AI Collection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
