import type { Layer, CollectionConfig } from '../types';

// Helper to encode SVG string to data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

// Procedural pixel art SVG generator based on trait concept and theme
function generatePixelSvg(
  layerType: string,
  traitName: string,
  theme: string,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string
): string {
  const tLower = traitName.toLowerCase();
  const thLower = theme.toLowerCase();

  // 1. BACKGROUND LAYERS
  if (layerType.includes('background') || layerType.includes('bg') || layerType.includes('environment')) {
    if (tLower.includes('matrix') || tLower.includes('code') || tLower.includes('terminal')) {
      return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
          <rect width="512" height="512" fill="#020617"/>
          <g fill="${accentColor}" opacity="0.4" font-family="monospace" font-size="14" font-weight="bold">
            <text x="20" y="40">10110010 01101001</text>
            <text x="20" y="80">&gt; RUN PROTOCOL_NFT</text>
            <text x="20" y="120">01000101 01010010</text>
            <text x="280" y="60">SYSTEM: ONLINE</text>
            <text x="280" y="100">01010010 01001111</text>
            <text x="280" y="140">HASH: 0xDEADBEEF</text>
            <text x="50" y="220">01000011 01001111</text>
            <text x="50" y="260">CORE: CORRUPTED</text>
            <text x="300" y="240">INITIALIZING...</text>
          </g>
          <rect x="0" y="400" width="512" height="112" fill="#050b14"/>
          <line x1="0" y1="400" x2="512" y2="400" stroke="${accentColor}" stroke-width="2" opacity="0.6"/>
        </svg>
      `);
    }

    if (tLower.includes('neon') || tLower.includes('city') || tLower.includes('skyline') || tLower.includes('cyber')) {
      return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
          <defs>
            <linearGradient id="bgSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#090514"/>
              <stop offset="60%" stop-color="#1e1035"/>
              <stop offset="100%" stop-color="#0d041a"/>
            </linearGradient>
          </defs>
          <rect width="512" height="512" fill="url(#bgSky)"/>
          <!-- Pixel stars -->
          <rect x="60" y="40" width="4" height="4" fill="#ffffff" opacity="0.8"/>
          <rect x="180" y="70" width="4" height="4" fill="${accentColor}" opacity="0.9"/>
          <rect x="320" y="50" width="4" height="4" fill="#ffffff" opacity="0.7"/>
          <rect x="440" y="90" width="4" height="4" fill="${secondaryColor}" opacity="0.8"/>
          <!-- Distant Pixel Buildings -->
          <rect x="40" y="180" width="60" height="240" fill="#130924"/>
          <rect x="120" y="140" width="80" height="280" fill="#180c30"/>
          <rect x="220" y="190" width="70" height="230" fill="#130924"/>
          <rect x="310" y="130" width="90" height="290" fill="#1a0d34"/>
          <rect x="420" y="170" width="60" height="250" fill="#130924"/>
          <!-- Lit Windows -->
          <rect x="140" y="160" width="8" height="12" fill="${accentColor}" opacity="0.7"/>
          <rect x="160" y="200" width="8" height="12" fill="${secondaryColor}" opacity="0.7"/>
          <rect x="330" y="150" width="8" height="12" fill="${accentColor}" opacity="0.7"/>
          <rect x="350" y="220" width="8" height="12" fill="${primaryColor}" opacity="0.7"/>
          <!-- Street Floor -->
          <rect x="0" y="420" width="512" height="92" fill="#06020a"/>
          <line x1="0" y1="420" x2="512" y2="420" stroke="${secondaryColor}" stroke-width="2" opacity="0.5"/>
        </svg>
      `);
    }

    // Default Atmospheric Deep Background
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
        <defs>
          <linearGradient id="bgDeep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="50%" stop-color="${primaryColor}15"/>
            <stop offset="100%" stop-color="#000000"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" fill="url(#bgDeep)"/>
        <!-- Pixel Grid Pattern -->
        <g stroke="${secondaryColor}" stroke-width="1" opacity="0.12">
          <line x1="0" y1="64" x2="512" y2="64"/>
          <line x1="0" y1="128" x2="512" y2="128"/>
          <line x1="0" y1="192" x2="512" y2="192"/>
          <line x1="0" y1="256" x2="512" y2="256"/>
          <line x1="0" y1="320" x2="512" y2="320"/>
          <line x1="0" y1="384" x2="512" y2="384"/>
          <line x1="64" y1="0" x2="64" y2="512"/>
          <line x1="128" y1="0" x2="128" y2="512"/>
          <line x1="192" y1="0" x2="192" y2="512"/>
          <line x1="256" y1="0" x2="256" y2="512"/>
          <line x1="320" y1="0" x2="320" y2="512"/>
          <line x1="384" y1="0" x2="384" y2="512"/>
          <line x1="448" y1="0" x2="448" y2="512"/>
        </g>
        <rect x="0" y="420" width="512" height="92" fill="#02040a"/>
        <line x1="0" y1="420" x2="512" y2="420" stroke="${primaryColor}" stroke-width="2" opacity="0.4"/>
      </svg>
    `);
  }

  // 2. CHARACTER BASE / BODY
  if (layerType.includes('base') || layerType.includes('body') || layerType.includes('character') || layerType.includes('skull')) {
    const isSkull = tLower.includes('skull') || thLower.includes('skull') || thLower.includes('dead') || tLower.includes('bone');
    const isCat = tLower.includes('cat') || thLower.includes('cat') || tLower.includes('feline');
    const isMecha = tLower.includes('mech') || tLower.includes('cyborg') || tLower.includes('robot') || tLower.includes('droid');

    if (isSkull) {
      return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
          <!-- Skull Cranium -->
          <rect x="168" y="128" width="176" height="152" fill="${secondaryColor}"/>
          <rect x="184" y="112" width="144" height="16" fill="${secondaryColor}"/>
          <rect x="200" y="96" width="112" height="16" fill="${secondaryColor}"/>
          <!-- Jaw -->
          <rect x="200" y="280" width="112" height="48" fill="${secondaryColor}"/>
          <!-- Eye Sockets (Dark) -->
          <rect x="192" y="176" width="48" height="48" fill="#020617"/>
          <rect x="272" y="176" width="48" height="48" fill="#020617"/>
          <!-- Nose cavity -->
          <rect x="248" y="240" width="16" height="24" fill="#020617"/>
          <!-- Teeth blocks -->
          <rect x="216" y="296" width="16" height="20" fill="#020617"/>
          <rect x="248" y="296" width="16" height="20" fill="#020617"/>
          <rect x="280" y="296" width="16" height="20" fill="#020617"/>
          <!-- Neck & Shoulders -->
          <rect x="232" y="328" width="48" height="32" fill="#0f172a"/>
          <rect x="144" y="360" width="224" height="96" fill="#1e293b"/>
        </svg>
      `);
    }

    if (isCat) {
      return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
          <!-- Cat Ears -->
          <polygon points="176,140 144,80 208,120" fill="${primaryColor}"/>
          <polygon points="336,140 368,80 304,120" fill="${primaryColor}"/>
          <polygon points="176,130 156,96 196,120" fill="#f43f5e"/>
          <polygon points="336,130 356,96 316,120" fill="#f43f5e"/>
          <!-- Head -->
          <rect x="160" y="128" width="192" height="152" fill="${primaryColor}" rx="12"/>
          <rect x="144" y="160" width="224" height="96" fill="${primaryColor}"/>
          <!-- Whiskers -->
          <line x1="100" y1="216" x2="150" y2="216" stroke="${secondaryColor}" stroke-width="3"/>
          <line x1="100" y1="232" x2="150" y2="240" stroke="${secondaryColor}" stroke-width="3"/>
          <line x1="362" y1="216" x2="412" y2="216" stroke="${secondaryColor}" stroke-width="3"/>
          <line x1="362" y1="240" x2="412" y2="232" stroke="${secondaryColor}" stroke-width="3"/>
          <!-- Body / Shoulders -->
          <rect x="160" y="280" width="192" height="176" fill="${primaryColor}"/>
        </svg>
      `);
    }

    // Default Mecha / Cyber Warrior Body
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
        <!-- Chiseled Cyber Head -->
        <rect x="176" y="120" width="160" height="160" fill="${primaryColor}"/>
        <rect x="160" y="144" width="192" height="112" fill="${primaryColor}"/>
        <!-- Face plate panel lines -->
        <rect x="172" y="136" width="8" height="128" fill="${secondaryColor}" opacity="0.6"/>
        <rect x="332" y="136" width="8" height="128" fill="${secondaryColor}" opacity="0.6"/>
        <!-- Torso & Cybernetic Armor -->
        <rect x="192" y="280" width="128" height="40" fill="#0f172a"/>
        <rect x="136" y="320" width="240" height="136" fill="${secondaryColor}"/>
        <rect x="160" y="336" width="192" height="104" fill="${primaryColor}"/>
        <!-- Core Reactor Light -->
        <rect x="236" y="360" width="40" height="40" fill="${accentColor}"/>
      </svg>
    `);
  }

  // 3. EYES / EXPRESSION
  if (layerType.includes('eye') || layerType.includes('expression') || layerType.includes('face')) {
    if (tLower.includes('laser') || tLower.includes('neon') || tLower.includes('glow')) {
      return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
          <!-- Glowing Visor / Laser Eyes -->
          <rect x="180" y="180" width="64" height="24" fill="${accentColor}"/>
          <rect x="268" y="180" width="64" height="24" fill="${accentColor}"/>
          <!-- Pupil Core -->
          <rect x="196" y="184" width="32" height="16" fill="#ffffff"/>
          <rect x="284" y="184" width="32" height="16" fill="#ffffff"/>
          <!-- Glowing beams -->
          <line x1="212" y1="192" x2="40" y2="192" stroke="${accentColor}" stroke-width="4" opacity="0.6"/>
          <line x1="300" y1="192" x2="472" y2="192" stroke="${accentColor}" stroke-width="4" opacity="0.6"/>
        </svg>
      `);
    }

    if (tLower.includes('cross') || tLower.includes('x') || tLower.includes('dead') || tLower.includes('corrupted')) {
      return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
          <!-- X Eyes -->
          <g fill="${accentColor}">
            <!-- Left X -->
            <rect x="188" y="172" width="12" height="12"/>
            <rect x="200" y="184" width="12" height="12"/>
            <rect x="212" y="196" width="12" height="12"/>
            <rect x="212" y="172" width="12" height="12"/>
            <rect x="188" y="196" width="12" height="12"/>
            <!-- Right X -->
            <rect x="288" y="172" width="12" height="12"/>
            <rect x="300" y="184" width="12" height="12"/>
            <rect x="312" y="196" width="12" height="12"/>
            <rect x="312" y="172" width="12" height="12"/>
            <rect x="288" y="196" width="12" height="12"/>
          </g>
        </svg>
      `);
    }

    // Default Sharp Cyber Eyes
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
        <rect x="184" y="180" width="56" height="28" fill="#050811"/>
        <rect x="272" y="180" width="56" height="28" fill="#050811"/>
        <!-- Glowing Cyan/Red Iris -->
        <rect x="200" y="184" width="28" height="20" fill="${accentColor}"/>
        <rect x="284" y="184" width="28" height="20" fill="${accentColor}"/>
        <!-- White highlight -->
        <rect x="204" y="188" width="8" height="8" fill="#ffffff"/>
        <rect x="288" y="188" width="8" height="8" fill="#ffffff"/>
      </svg>
    `);
  }

  // 4. OUTFIT / ARMOR / STREETWEAR
  if (layerType.includes('outfit') || layerType.includes('cloth') || layerType.includes('armor') || layerType.includes('jacket')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
        <!-- Jacket / Armor Collar -->
        <polygon points="208,310 256,380 304,310" fill="#090d16"/>
        <!-- Main Torso Suit -->
        <rect x="136" y="328" width="240" height="128" fill="${primaryColor}"/>
        <rect x="120" y="352" width="272" height="104" fill="${primaryColor}"/>
        <!-- High-tech stripes -->
        <rect x="176" y="352" width="16" height="104" fill="${accentColor}"/>
        <rect x="320" y="352" width="16" height="104" fill="${accentColor}"/>
        <!-- Center Zipper/Plate -->
        <rect x="252" y="352" width="8" height="104" fill="${secondaryColor}"/>
      </svg>
    `);
  }

  // 5. HEADWEAR / HELMET / CROWN
  if (layerType.includes('head') || layerType.includes('hat') || layerType.includes('helmet') || layerType.includes('crown') || layerType.includes('hair')) {
    if (tLower.includes('crown') || tLower.includes('king')) {
      return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
          <!-- Pixel Golden Crown -->
          <polygon points="160,112 184,48 216,96 256,32 296,96 328,48 352,112" fill="#eab308"/>
          <rect x="160" y="112" width="192" height="24" fill="#ca8a04"/>
          <!-- Ruby Gems on crown -->
          <rect x="180" y="116" width="16" height="16" fill="#ef4444"/>
          <rect x="248" y="116" width="16" height="16" fill="${accentColor}"/>
          <rect x="316" y="116" width="16" height="16" fill="#ef4444"/>
        </svg>
      `);
    }

    if (tLower.includes('hood') || tLower.includes('cloak')) {
      return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
          <!-- Big Pixel Hoodie Cover -->
          <rect x="144" y="80" width="224" height="220" fill="${secondaryColor}"/>
          <rect x="160" y="64" width="192" height="40" fill="${secondaryColor}"/>
          <!-- Hood Opening Cutout -->
          <rect x="176" y="128" width="160" height="160" fill="none"/>
        </svg>
      `);
    }

    // Default Futuristic Cyber Horns / Headset
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
        <!-- Cyber Horns / Headset Antennas -->
        <rect x="120" y="160" width="32" height="48" fill="${secondaryColor}"/>
        <rect x="360" y="160" width="32" height="48" fill="${secondaryColor}"/>
        <line x1="136" y1="160" x2="96" y2="70" stroke="${accentColor}" stroke-width="6"/>
        <line x1="376" y1="160" x2="416" y2="70" stroke="${accentColor}" stroke-width="6"/>
        <rect x="92" y="64" width="12" height="12" fill="#ffffff"/>
        <rect x="412" y="64" width="12" height="12" fill="#ffffff"/>
      </svg>
    `);
  }

  // 6. CARD FRAME / RETRO OVERLAY
  if (layerType.includes('frame') || layerType.includes('card') || layerType.includes('border') || layerType.includes('overlay')) {
    return svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
        <!-- Trading Card Fine Border -->
        <rect x="12" y="12" width="488" height="488" fill="none" stroke="${accentColor}" stroke-width="4"/>
        <rect x="18" y="18" width="476" height="476" fill="none" stroke="#000000" stroke-width="3" opacity="0.8"/>
        <!-- Corner Pixels -->
        <rect x="8" y="8" width="16" height="16" fill="${accentColor}"/>
        <rect x="488" y="8" width="16" height="16" fill="${accentColor}"/>
        <rect x="8" y="488" width="16" height="16" fill="${accentColor}"/>
        <rect x="488" y="488" width="16" height="16" fill="${accentColor}"/>
        <!-- Top Collection Banner -->
        <rect x="32" y="24" width="160" height="24" fill="#020617"/>
        <text x="40" y="40" fill="${accentColor}" font-family="monospace" font-size="12" font-weight="bold">${theme.toUpperCase()}</text>
        <!-- Bottom Trait Label -->
        <rect x="32" y="460" width="220" height="24" fill="#020617"/>
        <text x="40" y="476" fill="#ffffff" font-family="monospace" font-size="11" font-weight="bold">${traitName.toUpperCase()}</text>
      </svg>
    `);
  }

  // Fallback Trait Badge / Graphic
  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
      <!-- Glow Particle Orbit -->
      <circle cx="256" cy="256" r="180" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="8,8" opacity="0.4"/>
      <rect x="120" y="200" width="16" height="16" fill="${accentColor}"/>
      <rect x="376" y="300" width="16" height="16" fill="${secondaryColor}"/>
    </svg>
  `);
}

// Fast local prompt engine: deterministic, zero-timeout collection architect
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function titleCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function pickMany<T>(rng: () => number, list: T[], count: number): T[] {
  const copy = [...list];
  const out: T[] = [];
  while (copy.length && out.length < count) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export function createLocalCollection(userPrompt: string) {
  const cleanPrompt = (userPrompt || '').trim() || 'Cyberpunk Pixel Legends';
  const lower = cleanPrompt.toLowerCase();
  const seed = hashSeed(cleanPrompt);
  const rng = mulberry32(seed);

  const archetypes = [
    { key: 'cat', terms: ['cat', 'kitty', 'feline'], label: 'Terminal Cats', base: ['Cyber Cat', 'Samurai Cat', 'Neon Cat', 'Shadow Cat', 'Royal Cat'] },
    { key: 'frog', terms: ['frog', 'toad'], label: 'Glitch Frogs', base: ['Neon Frog', 'Poison Frog', 'Terminal Frog', 'Samurai Frog', 'Mythic Frog'] },
    { key: 'skull', terms: ['skull', 'bone', 'dead', 'undead'], label: 'Dead Skulls', base: ['Cyber Skull', 'Bone Skull', 'Cursed Skull', 'Royal Skull', 'Mecha Skull'] },
    { key: 'robot', terms: ['robot', 'mecha', 'android', 'cyborg', 'droid'], label: 'Mecha Units', base: ['Chrome Android', 'Cyborg Unit', 'Mecha Samurai', 'Combat Droid', 'Titan Bot'] },
    { key: 'baby', terms: ['baby', 'kid', 'toddler'], label: 'Pixel Babies', base: ['Cyber Baby', 'Alien Baby', 'Street Baby', 'Royal Baby', 'Chaos Baby'] },
    { key: 'monster', terms: ['monster', 'beast', 'creature'], label: 'Pons Monsters', base: ['Chaos Monster', 'Toxic Monster', 'Mythic Monster', 'Void Monster', 'Neon Monster'] },
    { key: 'alien', terms: ['alien', 'ufo', 'space'], label: 'Cosmic Aliens', base: ['Cosmic Alien', 'Void Alien', 'Signal Alien', 'Ancient Alien', 'Radio Alien'] },
    { key: 'ape', terms: ['ape', 'gorilla', 'monkey'], label: 'Terminal Apes', base: ['Street Ape', 'Alpha Ape', 'Cyber Ape', 'King Ape', 'Mutant Ape'] },
    { key: 'default', terms: [], label: 'Glitch Legends', base: ['Cyber Warrior', 'Terminal Ghost', 'Neon Raider', 'Pixel Warden', 'Void Hero'] },
  ];

  const environments = [
    { key: 'matrix', terms: ['matrix', 'terminal', 'code', 'glitch'], options: ['Matrix Green Terminal', 'Corrupted Code Rain', 'Black Terminal Grid', 'Hex Core Chamber', 'Glitch Command Screen'] },
    { key: 'city', terms: ['city', 'street', 'urban', 'tokyo', 'cyberpunk'], options: ['Neon City Midnight', 'Tokyo Alley Lights', 'Synthwave Skyline', 'Rainy Street Grid', 'Chrome District'] },
    { key: 'space', terms: ['space', 'cosmic', 'planet', 'galaxy', 'astro'], options: ['Deep Space Nebula', 'Retro Orbit Deck', 'Alien Planet Surface', 'Starlight Command Bay', 'Void Horizon'] },
    { key: 'dark', terms: ['dark', 'grave', 'gothic', 'haunted', 'necro'], options: ['Obsidian Void', 'Haunted Grave Mist', 'Crimson Eclipse', 'Cursed Cathedral', 'Abyssal Night'] },
    { key: 'cute', terms: ['cute', 'kawaii', 'baby'], options: ['Candy Cloud Sky', 'Soft Pixel Dream', 'Toy Room Glow', 'Pastel Grid', 'Bubble Pop World'] },
    { key: 'default', terms: [], options: ['Deep Cyber Void', 'Quantum Holo Grid', 'Signal Fog', 'Data Chamber', 'Retro Vaporwave Sunset'] },
  ];

  const palettes = [
    { key: 'green', terms: ['green', 'matrix', 'toxic'], primary: '#052e16', secondary: '#22c55e', accent: '#86efac' },
    { key: 'pink', terms: ['pink', 'vaporwave', 'cute'], primary: '#3b0764', secondary: '#ec4899', accent: '#f9a8d4' },
    { key: 'red', terms: ['red', 'blood', 'crimson'], primary: '#1f0a0a', secondary: '#ef4444', accent: '#f59e0b' },
    { key: 'blue', terms: ['blue', 'ocean', 'space'], primary: '#0f172a', secondary: '#38bdf8', accent: '#67e8f9' },
    { key: 'gold', terms: ['gold', 'royal', 'king'], primary: '#111827', secondary: '#f59e0b', accent: '#fde68a' },
    { key: 'default', terms: [], primary: '#0f172a', secondary: '#38bdf8', accent: '#10b981' },
  ];

  const archetype = archetypes.find((a) => a.key !== 'default' && hasAny(lower, a.terms)) || archetypes[archetypes.length - 1];
  const environment = environments.find((e) => e.key !== 'default' && hasAny(lower, e.terms)) || environments[environments.length - 1];
  const palette = palettes.find((c) => c.key !== 'default' && hasAny(lower, c.terms)) || palettes[palettes.length - 1];
  const styleLabel = hasAny(lower, ['pixel', '8-bit', 'retro'])
    ? 'Retro Pixel'
    : hasAny(lower, ['cute', 'kawaii', 'baby'])
      ? 'Cute Chibi'
      : hasAny(lower, ['dark', 'gothic', 'grave'])
        ? 'Dark Dystopian'
        : 'Dead Pixels Cyberpunk';

  const collectionName = (() => {
    const direct = titleCase(cleanPrompt).split(' ').slice(0, 4).join(' ');
    if (direct.length >= 4 && direct.length <= 36) return direct;
    return `${titleCase(styleLabel)} ${archetype.label}`.slice(0, 40);
  })();

  const eyes = [
    'Cyan Laser Scan', 'Crimson X Eyes', 'Golden Sun Stare', 'Ghost White Iris', 'Holo HUD Matrix',
    'Toxic Glare', 'Pixel Sleepy Eyes', 'Void Visor', 'Rainbow Glitch Scan', 'Royal Sapphire Gaze'
  ];
  const outfits = [
    'Tactical Streetwear Hoodie', 'Heavy Titanium Plate', 'Neon Cyber Poncho', 'Royal Robe of Shards', 'Utility Battle Jacket',
    'Samurai Armor Coat', 'Glitched Leather Vest', 'Mythic Gold Plate', 'Noise Camo Suit', 'Terminal Operator Fit'
  ];
  const headwear = [
    'Retro VR Headset', 'Pixel Samurai Horns', 'Cursed Demon Halo', 'Tri-Spike Sovereign Crown', 'Cyber Cat Ears',
    'Noise Helmet', 'Signal Hood', 'Antenna Rig', 'Bone Crest', 'Glitch Laurel'
  ];
  const accessories = [
    'Warning Card Frame', 'Drone Companion', 'Data Scroll', 'Signal Blade', 'Toxic Aura',
    'Pixel Crown Frame', 'Emergency Beacon', 'Loot Crate', 'Energy Halo', 'Radioactive Rune'
  ];

  const backgroundTraits = pickMany(rng, environment.options, 5).map((name, idx) => ({ name, weight: [35, 25, 18, 12, 10][idx] }));
  const baseTraits = pickMany(rng, archetype.base, 5).map((name, idx) => ({ name, weight: [35, 25, 18, 12, 10][idx] }));
  const eyeTraits = pickMany(rng, eyes, 5).map((name, idx) => ({ name, weight: [35, 25, 18, 12, 10][idx] }));
  const outfitTraits = pickMany(rng, outfits, 5).map((name, idx) => ({ name, weight: [35, 25, 18, 12, 10][idx] }));
  const headTraits = pickMany(rng, headwear, 5).map((name, idx) => ({ name, weight: [30, 24, 18, 16, 12][idx] }));
  const accessoryTraits = pickMany(rng, accessories, 5).map((name, idx) => ({ name, weight: [34, 24, 18, 14, 10][idx] }));

  const layersData = [
    { name: '1. Background', required: true, traits: backgroundTraits },
    { name: `2. ${archetype.key === 'default' ? 'Character Base' : 'Character Base'}`, required: true, traits: baseTraits },
    { name: '3. Eyes & Visor', required: true, traits: eyeTraits },
    { name: '4. Outfit / Armor', required: true, traits: outfitTraits },
    { name: '5. Headwear / Aura', required: false, traits: headTraits },
    { name: '6. Accessories / Frame', required: false, traits: accessoryTraits },
  ];

  const processedLayers = layersData.map((layer, lIdx) => ({
    id: `layer-${lIdx + 1}-${seed}`,
    name: layer.name,
    required: layer.required,
    enabled: true,
    noneWeight: layer.required ? 0 : 14,
    traits: layer.traits.map((t, tIdx) => ({
      id: `trait-${lIdx + 1}-${tIdx + 1}-${seed}`,
      name: t.name,
      weight: t.weight,
      imageSrc: generatePixelSvg(layer.name, t.name, cleanPrompt, palette.primary, palette.secondary, palette.accent),
    })),
  }));

  return {
    name: `${collectionName} (10K Generative Edition)`,
    description: `${styleLabel} NFT collection inspired by "${cleanPrompt}". Includes layered trait architecture, rarity-ready metadata, and a deterministic 10K generative engine.`,
    baseUri: `ipfs://dp-${seed.toString(16)}/`,
    width: 512,
    height: 512,
    count: 10000,
    batchSize: 500,
    zipChunkSize: 2500,
    layers: processedLayers,
    activeLlm: 'Local Prompt Engine',
    generationMode: 'fast-local',
  };
}

