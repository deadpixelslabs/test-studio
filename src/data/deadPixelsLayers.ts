import { Layer } from '../types';

export function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// Common CRT Scanline Pattern definition for pixel aesthetics
const CRT_SCANLINES = `
  <pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="512" y2="0" stroke="#000000" stroke-width="1.5" opacity="0.25"/>
  </pattern>
`;

export const DEAD_PIXELS_LAYERS: Layer[] = [
  // ==========================================
  // LAYER 1: BACKGROUND & ENVIRONMENT
  // ==========================================
  {
    id: 'layer-bg',
    name: '1. Background',
    required: true,
    enabled: true,
    traits: [
      {
        id: 'bg-cyber-alley',
        name: 'Cyber Alley Rain',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <defs>
              ${CRT_SCANLINES}
              <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#020617"/>
                <stop offset="60%" stop-color="#0b1120"/>
                <stop offset="100%" stop-color="#020617"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(#wallGrad)"/>
            <!-- Dark brick pixel grid -->
            <g fill="#1e293b" opacity="0.25">
              <rect x="20" y="40" width="70" height="24"/>
              <rect x="100" y="40" width="70" height="24"/>
              <rect x="180" y="40" width="70" height="24"/>
              <rect x="260" y="40" width="70" height="24"/>
              <rect x="340" y="40" width="70" height="24"/>
              <rect x="420" y="40" width="70" height="24"/>
              <rect x="55" y="70" width="70" height="24"/>
              <rect x="135" y="70" width="70" height="24"/>
              <rect x="215" y="70" width="70" height="24"/>
              <rect x="295" y="70" width="70" height="24"/>
              <rect x="375" y="70" width="70" height="24"/>
              <rect x="20" y="100" width="70" height="24"/>
              <rect x="100" y="100" width="70" height="24"/>
              <rect x="180" y="100" width="70" height="24"/>
              <rect x="340" y="100" width="70" height="24"/>
              <rect x="420" y="100" width="70" height="24"/>
            </g>
            <!-- Wet floor reflection -->
            <rect x="0" y="380" width="512" height="132" fill="#030712"/>
            <!-- Neon puddle reflection lines -->
            <g opacity="0.7">
              <rect x="140" y="400" width="120" height="4" fill="#f43f5e"/>
              <rect x="110" y="412" width="180" height="4" fill="#ec4899"/>
              <rect x="260" y="420" width="150" height="4" fill="#00f0ff"/>
              <rect x="160" y="432" width="210" height="4" fill="#38bdf8"/>
              <rect x="180" y="448" width="160" height="4" fill="#f43f5e" opacity="0.5"/>
              <rect x="130" y="464" width="240" height="4" fill="#00f0ff" opacity="0.4"/>
            </g>
            <!-- Vertical wires / rain streaks -->
            <g stroke="#38bdf8" stroke-width="2" opacity="0.15">
              <line x1="80" y1="0" x2="80" y2="380"/>
              <line x1="430" y1="0" x2="430" y2="380"/>
            </g>
            <!-- Scanline overlay -->
            <rect width="512" height="512" fill="url(#scanlines)" pointer-events="none"/>
          </svg>
        `),
      },
      {
        id: 'bg-blood-moon',
        name: 'Blood Moon Eclipse',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <defs>
              ${CRT_SCANLINES}
            </defs>
            <rect width="512" height="512" fill="#090204"/>
            <!-- Crimson Glow -->
            <circle cx="360" cy="140" r="130" fill="#dc2626" opacity="0.15"/>
            <!-- Pixel Blood Moon -->
            <g fill="#ef4444">
              <rect x="300" y="80" width="120" height="120"/>
              <rect x="280" y="100" width="160" height="80"/>
              <rect x="320" y="60" width="80" height="160"/>
            </g>
            <g fill="#991b1b">
              <!-- Moon craters -->
              <rect x="320" y="90" width="20" height="20"/>
              <rect x="380" y="120" width="30" height="20"/>
              <rect x="330" y="150" width="40" height="30"/>
              <rect x="300" y="130" width="20" height="20"/>
            </g>
            <!-- Distant cross/antenna silhouettes -->
            <g fill="#170407">
              <rect x="40" y="260" width="12" height="120"/>
              <rect x="26" y="280" width="40" height="10"/>
              <rect x="110" y="300" width="8" height="80"/>
              <rect x="440" y="240" width="14" height="140"/>
              <rect x="425" y="265" width="44" height="12"/>
            </g>
            <!-- Ground -->
            <rect x="0" y="380" width="512" height="132" fill="#050102"/>
            <rect x="140" y="410" width="160" height="4" fill="#ef4444" opacity="0.6"/>
            <rect x="200" y="430" width="200" height="4" fill="#dc2626" opacity="0.4"/>
            <rect width="512" height="512" fill="url(#scanlines)" pointer-events="none"/>
          </svg>
        `),
      },
      {
        id: 'bg-city-skyline',
        name: 'Cyber City Skyline',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <defs>
              ${CRT_SCANLINES}
            </defs>
            <rect width="512" height="512" fill="#040817"/>
            <!-- Distant City Silhouette -->
            <g fill="#0b1329">
              <rect x="20" y="180" width="60" height="200"/>
              <rect x="90" y="130" width="70" height="250"/>
              <rect x="170" y="200" width="50" height="180"/>
              <rect x="230" y="100" width="80" height="280"/>
              <rect x="320" y="160" width="65" height="220"/>
              <rect x="395" y="110" width="85" height="270"/>
            </g>
            <!-- Antenna / Spire beacons -->
            <rect x="268" y="50" width="4" height="50" fill="#00f0ff"/>
            <rect x="266" y="46" width="8" height="8" fill="#ff0055"/>
            <rect x="438" y="70" width="4" height="40" fill="#00f0ff"/>
            <rect x="436" y="66" width="8" height="8" fill="#ff0055"/>
            <!-- Glowing windows in city -->
            <g fill="#38bdf8" opacity="0.8">
              <rect x="105" y="150" width="8" height="12"/>
              <rect x="125" y="150" width="8" height="12"/>
              <rect x="145" y="150" width="8" height="12"/>
              <rect x="105" y="180" width="8" height="12"/>
              <rect x="125" y="180" width="8" height="12" fill="#facc15"/>
              <rect x="245" y="130" width="10" height="16"/>
              <rect x="265" y="130" width="10" height="16" fill="#f43f5e"/>
              <rect x="285" y="130" width="10" height="16"/>
              <rect x="245" y="170" width="10" height="16"/>
              <rect x="285" y="170" width="10" height="16"/>
              <rect x="410" y="140" width="10" height="14"/>
              <rect x="430" y="140" width="10" height="14" fill="#facc15"/>
              <rect x="450" y="140" width="10" height="14"/>
            </g>
            <!-- Dark Wet Ground -->
            <rect x="0" y="380" width="512" height="132" fill="#02040a"/>
            <rect x="160" y="415" width="220" height="4" fill="#38bdf8" opacity="0.4"/>
            <rect x="120" y="435" width="260" height="4" fill="#0284c7" opacity="0.3"/>
            <rect width="512" height="512" fill="url(#scanlines)" pointer-events="none"/>
          </svg>
        `),
      },
      {
        id: 'bg-matrix-terminal',
        name: 'Matrix Code Terminal',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <defs>
              ${CRT_SCANLINES}
            </defs>
            <rect width="512" height="512" fill="#010a04"/>
            <!-- Green falling matrix pixel code -->
            <g fill="#22c55e" opacity="0.35">
              <rect x="30" y="30" width="8" height="16"/>
              <rect x="30" y="60" width="8" height="24"/>
              <rect x="30" y="110" width="8" height="32"/>
              <rect x="70" y="20" width="8" height="40"/>
              <rect x="70" y="90" width="8" height="20"/>
              <rect x="120" y="50" width="8" height="60"/>
              <rect x="160" y="20" width="8" height="40"/>
              <rect x="160" y="80" width="8" height="50"/>
              <rect x="360" y="30" width="8" height="70"/>
              <rect x="410" y="10" width="8" height="50"/>
              <rect x="410" y="90" width="8" height="30"/>
              <rect x="460" y="40" width="8" height="90"/>
            </g>
            <g fill="#86efac" opacity="0.7">
              <rect x="30" y="150" width="8" height="8"/>
              <rect x="70" y="120" width="8" height="8"/>
              <rect x="120" y="120" width="8" height="8"/>
              <rect x="160" y="140" width="8" height="8"/>
              <rect x="360" y="110" width="8" height="8"/>
              <rect x="410" y="130" width="8" height="8"/>
              <rect x="460" y="140" width="8" height="8"/>
            </g>
            <!-- Ground reflection -->
            <rect x="0" y="380" width="512" height="132" fill="#010602"/>
            <rect x="120" y="420" width="280" height="4" fill="#22c55e" opacity="0.5"/>
            <rect x="180" y="440" width="200" height="4" fill="#15803d" opacity="0.3"/>
            <rect width="512" height="512" fill="url(#scanlines)" pointer-events="none"/>
          </svg>
        `),
      },
      {
        id: 'bg-deep-space',
        name: 'Deep Space Error 404',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <defs>
              ${CRT_SCANLINES}
            </defs>
            <rect width="512" height="512" fill="#020208"/>
            <!-- Pixel Stars -->
            <g fill="#ffffff">
              <rect x="40" y="40" width="4" height="4"/>
              <rect x="90" y="80" width="6" height="6" fill="#38bdf8"/>
              <rect x="150" y="30" width="4" height="4"/>
              <rect x="220" y="90" width="4" height="4"/>
              <rect x="310" y="40" width="6" height="6" fill="#f43f5e"/>
              <rect x="420" y="60" width="4" height="4"/>
              <rect x="470" y="110" width="6" height="6"/>
              <rect x="50" y="180" width="4" height="4"/>
              <rect x="440" y="210" width="4" height="4"/>
              <rect x="110" y="250" width="4" height="4"/>
              <rect x="390" y="280" width="4" height="4"/>
            </g>
            <!-- Crescent Pixel Moon -->
            <g fill="#e2e8f0">
              <rect x="380" y="40" width="40" height="40"/>
              <rect x="370" y="50" width="50" height="20"/>
            </g>
            <g fill="#020208">
              <rect x="370" y="35" width="30" height="40"/>
            </g>
            <!-- Ground -->
            <rect x="0" y="380" width="512" height="132" fill="#010104"/>
            <rect x="180" y="420" width="180" height="4" fill="#a855f7" opacity="0.4"/>
            <rect width="512" height="512" fill="url(#scanlines)" pointer-events="none"/>
          </svg>
        `),
      },
      {
        id: 'bg-purple-glitch',
        name: 'Dystopian Purple Fog',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <defs>
              ${CRT_SCANLINES}
              <linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#180a2e"/>
                <stop offset="70%" stop-color="#2d1254"/>
                <stop offset="100%" stop-color="#090214"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(#fogGrad)"/>
            <!-- Distant glowing moon orb -->
            <circle cx="256" cy="180" r="140" fill="#a855f7" opacity="0.12"/>
            <circle cx="256" cy="180" r="80" fill="#f43f5e" opacity="0.1"/>
            <!-- Ground reflection -->
            <rect x="0" y="380" width="512" height="132" fill="#090214"/>
            <rect x="150" y="415" width="220" height="6" fill="#a855f7" opacity="0.6"/>
            <rect x="120" y="435" width="260" height="4" fill="#ec4899" opacity="0.4"/>
            <rect width="512" height="512" fill="url(#scanlines)" pointer-events="none"/>
          </svg>
        `),
      },
    ],
  },

  // ==========================================
  // LAYER 2: CHARACTER BASE / ARCHETYPE
  // ==========================================
  {
    id: 'layer-body',
    name: '2. Character Base',
    required: true,
    enabled: true,
    traits: [
      {
        id: 'body-broken-bear',
        name: 'Broken Bear Head',
        weight: 18,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Chibi bear head outline & base -->
            <g fill="#27272a">
              <!-- Left round ear (intact) -->
              <rect x="150" y="110" width="48" height="48"/>
              <rect x="162" y="98" width="24" height="72"/>
              <!-- Right round ear (chipped/glitched) -->
              <rect x="314" y="110" width="36" height="36"/>
              <rect x="326" y="98" width="12" height="48"/>
              <!-- Main head boxy shape -->
              <rect x="150" y="146" width="212" height="150"/>
              <rect x="138" y="170" width="236" height="102"/>
              <rect x="162" y="296" width="188" height="16"/>
            </g>
            <!-- Inner ear tones -->
            <g fill="#3f3f46">
              <rect x="162" y="122" width="24" height="24"/>
              <rect x="326" y="122" width="16" height="16"/>
            </g>
            <!-- Ear floating dead pixel fragments (Image 2 style) -->
            <g fill="#22d3ee">
              <rect x="360" y="90" width="12" height="12"/>
              <rect x="382" y="110" width="8" height="8"/>
              <rect x="350" y="74" width="8" height="8"/>
            </g>
            <g fill="#f43f5e">
              <rect x="380" y="70" width="10" height="10"/>
              <rect x="368" y="130" width="8" height="8"/>
            </g>
            <!-- Muzzle & stitched mouth base -->
            <g fill="#18181b">
              <rect x="236" y="240" width="40" height="24"/>
            </g>
            <!-- Stitched cheek / repair seam -->
            <g fill="#71717a">
              <rect x="310" y="220" width="4" height="24"/>
              <rect x="306" y="226" width="12" height="4"/>
              <rect x="306" y="238" width="12" height="4"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'body-glitched-skull',
        name: 'Glitched Skull',
        weight: 16,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Ivory Bone Skull Head -->
            <g fill="#f1f5f9">
              <!-- Upper Cranium -->
              <rect x="160" y="120" width="192" height="130"/>
              <rect x="146" y="140" width="220" height="90"/>
              <!-- Cheeks & Temples -->
              <rect x="160" y="240" width="192" height="40"/>
              <!-- Upper Jaw -->
              <rect x="180" y="270" width="152" height="30"/>
            </g>
            <!-- Bone Shading -->
            <g fill="#cbd5e1">
              <rect x="146" y="200" width="14" height="30"/>
              <rect x="352" y="200" width="14" height="30"/>
              <rect x="180" y="290" width="152" height="10"/>
            </g>
            <!-- Forehead crack -->
            <g fill="#0f172a">
              <rect x="240" y="130" width="4" height="16"/>
              <rect x="244" y="146" width="4" height="12"/>
              <rect x="240" y="158" width="6" height="10"/>
              <!-- Nasal cavity -->
              <rect x="250" y="240" width="12" height="16"/>
              <rect x="246" y="250" width="20" height="6"/>
            </g>
            <!-- Skull Teeth -->
            <g fill="#0f172a">
              <rect x="194" y="280" width="6" height="20"/>
              <rect x="214" y="280" width="6" height="20"/>
              <rect x="234" y="280" width="6" height="20"/>
              <rect x="254" y="280" width="6" height="20"/>
              <rect x="274" y="280" width="6" height="20"/>
              <rect x="294" y="280" width="6" height="20"/>
              <rect x="314" y="280" width="6" height="20"/>
            </g>
            <!-- Chromatic glitch artifacts -->
            <g fill="#f43f5e" opacity="0.6">
              <rect x="360" y="160" width="12" height="4"/>
              <rect x="364" y="190" width="8" height="4"/>
            </g>
            <g fill="#00f0ff" opacity="0.6">
              <rect x="136" y="170" width="10" height="4"/>
              <rect x="140" y="210" width="6" height="4"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'body-crt-boy',
        name: 'CRT Monitor Box',
        weight: 14,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Antenna -->
            <rect x="230" y="80" width="4" height="40" fill="#94a3b8"/>
            <rect x="280" y="70" width="4" height="50" fill="#94a3b8"/>
            <rect x="228" y="76" width="8" height="8" fill="#cbd5e1"/>
            <rect x="278" y="66" width="8" height="8" fill="#cbd5e1"/>
            <!-- CRT Outer Casing (Beige/Grey retro plastic) -->
            <rect x="140" y="120" width="232" height="170" fill="#64748b"/>
            <rect x="132" y="130" width="248" height="150" fill="#64748b"/>
            <!-- Bevel shadow -->
            <rect x="140" y="278" width="232" height="12" fill="#334155"/>
            <!-- Inner screen bezel -->
            <rect x="156" y="136" width="180" height="136" fill="#1e293b"/>
            <!-- Screen Dark Glass -->
            <rect x="166" y="146" width="160" height="116" fill="#090d16"/>
            <!-- Screen glass corner highlight -->
            <rect x="170" y="150" width="20" height="8" fill="#38bdf8" opacity="0.3"/>
            <rect x="170" y="158" width="8" height="16" fill="#38bdf8" opacity="0.3"/>
            <!-- Side Control Knobs -->
            <rect x="346" y="154" width="18" height="14" fill="#334155"/>
            <rect x="346" y="180" width="18" height="14" fill="#334155"/>
            <!-- Power LED -->
            <rect x="348" y="250" width="8" height="8" fill="#22c55e"/>
          </svg>
        `),
      },
      {
        id: 'body-null-shadow',
        name: 'Null Shadow Void',
        weight: 14,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Void black chibi head -->
            <rect x="160" y="130" width="192" height="160" fill="#030712"/>
            <rect x="148" y="150" width="216" height="120" fill="#030712"/>
            <rect x="170" y="280" width="172" height="20" fill="#030712"/>
            <!-- Cyan edge rim highlights -->
            <rect x="144" y="160" width="4" height="80" fill="#00f0ff" opacity="0.6"/>
            <rect x="364" y="160" width="4" height="80" fill="#f43f5e" opacity="0.6"/>
          </svg>
        `),
      },
      {
        id: 'body-pixel-demon',
        name: 'Pixel Demon Skull',
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Curved Blood-Red Demon Horns -->
            <g fill="#dc2626">
              <!-- Left Horn -->
              <rect x="130" y="70" width="20" height="60"/>
              <rect x="110" y="50" width="24" height="40"/>
              <rect x="94" y="30" width="20" height="30"/>
              <!-- Right Horn -->
              <rect x="362" y="70" width="20" height="60"/>
              <rect x="378" y="50" width="24" height="40"/>
              <rect x="398" y="30" width="20" height="30"/>
            </g>
            <g fill="#991b1b">
              <rect x="130" y="100" width="20" height="30"/>
              <rect x="362" y="100" width="20" height="30"/>
            </g>
            <!-- White skull chibi head -->
            <rect x="160" y="130" width="192" height="150" fill="#f8fafc"/>
            <rect x="148" y="150" width="216" height="110" fill="#f8fafc"/>
            <rect x="170" y="270" width="172" height="30" fill="#e2e8f0"/>
            <!-- Nasal hole & mouth slit -->
            <rect x="250" y="240" width="12" height="16" fill="#0f172a"/>
            <rect x="210" y="276" width="92" height="8" fill="#0f172a"/>
          </svg>
        `),
      },
      {
        id: 'body-astro-error',
        name: 'Astro Cosmonaut',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- White EVA Pressure Helmet -->
            <rect x="140" y="120" width="232" height="170" fill="#f8fafc"/>
            <rect x="130" y="140" width="252" height="130" fill="#f8fafc"/>
            <!-- Helmet collar lock ring -->
            <rect x="160" y="284" width="192" height="16" fill="#94a3b8"/>
            <rect x="180" y="296" width="152" height="10" fill="#cbd5e1"/>
            <!-- Dark Helmet Visor Frame -->
            <rect x="156" y="140" width="200" height="130" fill="#1e293b"/>
            <!-- Inner Visor Glass (Dark mirror) -->
            <rect x="166" y="150" width="180" height="110" fill="#050811"/>
          </svg>
        `),
      },
      {
        id: 'body-bad-cat',
        name: 'Tabby Bad Cat',
        weight: 8,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Cat Pointed Ears -->
            <g fill="#d97706">
              <rect x="146" y="90" width="40" height="50"/>
              <rect x="156" y="70" width="24" height="40"/>
              <rect x="326" y="90" width="40" height="50"/>
              <rect x="336" y="70" width="24" height="40"/>
            </g>
            <g fill="#fef3c7">
              <rect x="156" y="94" width="20" height="30"/>
              <rect x="336" y="94" width="20" height="30"/>
            </g>
            <!-- Main Cat Head -->
            <rect x="150" y="130" width="212" height="160" fill="#d97706"/>
            <rect x="138" y="150" width="236" height="120" fill="#d97706"/>
            <!-- Tabby Stripes -->
            <g fill="#92400e">
              <rect x="246" y="130" width="20" height="30"/>
              <rect x="220" y="130" width="12" height="24"/>
              <rect x="280" y="130" width="12" height="24"/>
            </g>
            <!-- White Snout -->
            <rect x="226" y="240" width="60" height="36" fill="#fef3c7"/>
            <rect x="248" y="244" width="16" height="10" fill="#78350f"/>
          </svg>
        `),
      },
      {
        id: 'body-ghost-data',
        name: 'Ghost Data Phantom',
        weight: 8,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Translucent Cyan Ghost Head & Body -->
            <g fill="#06b6d4" opacity="0.85">
              <rect x="170" y="120" width="172" height="170"/>
              <rect x="156" y="140" width="200" height="140"/>
              <!-- Wavy dripping pixel bottom -->
              <rect x="160" y="280" width="24" height="40"/>
              <rect x="194" y="280" width="24" height="20"/>
              <rect x="228" y="280" width="24" height="50"/>
              <rect x="262" y="280" width="24" height="30"/>
              <rect x="296" y="280" width="24" height="45"/>
              <rect x="330" y="280" width="24" height="24"/>
            </g>
            <g fill="#67e8f9" opacity="0.9">
              <rect x="180" y="130" width="152" height="140"/>
            </g>
          </svg>
        `),
      },
    ],
  },

  // ==========================================
  // LAYER 3: OUTFIT & STREETWEAR
  // ==========================================
  {
    id: 'layer-outfit',
    name: '3. Outfit & Apparel',
    required: true,
    enabled: true,
    traits: [
      {
        id: 'outfit-black-hoodie',
        name: "Black 'X X' Streetwear Hoodie",
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Black Hoodie Body -->
            <g fill="#18181b">
              <!-- Hood collar/neckline -->
              <rect x="180" y="280" width="152" height="30"/>
              <!-- Shoulders & Arms -->
              <rect x="130" y="300" width="252" height="80"/>
              <rect x="110" y="320" width="50" height="70"/>
              <rect x="352" y="320" width="50" height="70"/>
              <!-- Torso Body -->
              <rect x="150" y="310" width="212" height="90"/>
            </g>
            <!-- White drawstring ties -->
            <rect x="226" y="296" width="6" height="30" fill="#ffffff"/>
            <rect x="280" y="296" width="6" height="30" fill="#ffffff"/>
            <!-- Chest Print: Yellow Smiley + Crosses -->
            <g fill="#facc15">
              <rect x="236" y="336" width="8" height="8"/>
              <rect x="268" y="336" width="8" height="8"/>
              <!-- Smile -->
              <rect x="232" y="356" width="8" height="8"/>
              <rect x="240" y="362" width="32" height="8"/>
              <rect x="272" y="356" width="8" height="8"/>
            </g>
            <!-- Dark pants & sneakers -->
            <g fill="#09090b">
              <rect x="180" y="396" width="60" height="40"/>
              <rect x="272" y="396" width="60" height="40"/>
            </g>
            <!-- Chunky White & Black Cyber Sneakers -->
            <g fill="#f8fafc">
              <rect x="166" y="430" width="80" height="24"/>
              <rect x="266" y="430" width="80" height="24"/>
            </g>
            <g fill="#18181b">
              <rect x="176" y="434" width="24" height="8"/>
              <rect x="312" y="434" width="24" height="8"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'outfit-broken-heart',
        name: 'Broken Heart Hoodie',
        weight: 18,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Charcoal grey hoodie -->
            <g fill="#27272a">
              <rect x="180" y="280" width="152" height="30"/>
              <rect x="130" y="300" width="252" height="80"/>
              <rect x="110" y="320" width="50" height="70"/>
              <rect x="352" y="320" width="50" height="70"/>
              <rect x="150" y="310" width="212" height="90"/>
            </g>
            <!-- Cracked Heart on Chest (Image 2 style with glowing magenta core) -->
            <g fill="#f43f5e">
              <rect x="236" y="330" width="40" height="30"/>
              <rect x="226" y="336" width="60" height="24"/>
              <rect x="246" y="356" width="20" height="16"/>
            </g>
            <!-- Crack fracture inside heart -->
            <g fill="#09090b">
              <rect x="252" y="332" width="6" height="14"/>
              <rect x="246" y="344" width="8" height="6"/>
              <rect x="252" y="348" width="6" height="14"/>
            </g>
            <!-- Dripping neon tear on hoodie -->
            <rect x="252" y="370" width="6" height="16" fill="#f43f5e"/>
            <!-- Pants & Shoes -->
            <g fill="#18181b">
              <rect x="180" y="396" width="60" height="40"/>
              <rect x="272" y="396" width="60" height="40"/>
            </g>
            <g fill="#f43f5e">
              <rect x="166" y="430" width="80" height="24"/>
              <rect x="266" y="430" width="80" height="24"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'outfit-white-null-hoodie',
        name: 'White Glitched Null Hoodie',
        weight: 16,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- White oversized hoodie with frayed bottom -->
            <g fill="#f8fafc">
              <rect x="180" y="280" width="152" height="30"/>
              <rect x="130" y="300" width="252" height="80"/>
              <rect x="110" y="320" width="50" height="70"/>
              <rect x="352" y="320" width="50" height="70"/>
              <rect x="150" y="310" width="212" height="90"/>
              <!-- Frayed fringe hem -->
              <rect x="154" y="396" width="14" height="18"/>
              <rect x="180" y="396" width="16" height="14"/>
              <rect x="210" y="396" width="16" height="22"/>
              <rect x="240" y="396" width="14" height="16"/>
              <rect x="270" y="396" width="18" height="24"/>
              <rect x="300" y="396" width="16" height="16"/>
              <rect x="330" y="396" width="18" height="20"/>
            </g>
            <!-- Grey fold shading -->
            <g fill="#cbd5e1">
              <rect x="246" y="320" width="20" height="60"/>
              <rect x="170" y="370" width="30" height="10"/>
              <rect x="310" y="370" width="30" height="10"/>
            </g>
            <!-- Black cyber sneakers -->
            <g fill="#09090b">
              <rect x="166" y="430" width="80" height="24"/>
              <rect x="266" y="430" width="80" height="24"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'outfit-blue-puffer',
        name: 'Blue Quilted Puffer Jacket',
        weight: 14,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Royal Blue Puffer Jacket -->
            <g fill="#2563eb">
              <!-- Left Puffy Sleeve -->
              <rect x="110" y="310" width="56" height="84"/>
              <rect x="120" y="336" width="46" height="8" fill="#1d4ed8"/>
              <rect x="120" y="364" width="46" height="8" fill="#1d4ed8"/>
              <!-- Right Puffy Sleeve -->
              <rect x="346" y="310" width="56" height="84"/>
              <rect x="346" y="336" width="46" height="8" fill="#1d4ed8"/>
              <rect x="346" y="364" width="46" height="8" fill="#1d4ed8"/>
              <!-- Main Quilted Body -->
              <rect x="156" y="300" width="200" height="100"/>
              <!-- Quilt horizontal divisions -->
              <rect x="156" y="330" width="200" height="6" fill="#1d4ed8"/>
              <rect x="156" y="360" width="200" height="6" fill="#1d4ed8"/>
            </g>
            <!-- Inner White Undershirt -->
            <rect x="240" y="300" width="32" height="96" fill="#f8fafc"/>
            <!-- Dark pants & blue sneakers -->
            <g fill="#0f172a">
              <rect x="180" y="396" width="60" height="40"/>
              <rect x="272" y="396" width="60" height="40"/>
            </g>
            <g fill="#3b82f6">
              <rect x="166" y="430" width="80" height="24"/>
              <rect x="266" y="430" width="80" height="24"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'outfit-astro-suit',
        name: 'Astro EVA Cyber Suit',
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- White pressurized suit -->
            <g fill="#f8fafc">
              <rect x="130" y="300" width="252" height="90"/>
              <rect x="110" y="320" width="50" height="80"/>
              <rect x="352" y="320" width="50" height="80"/>
            </g>
            <!-- Chest Life Support Control Unit -->
            <rect x="216" y="320" width="80" height="60" fill="#1e293b"/>
            <rect x="224" y="328" width="64" height="24" fill="#334155"/>
            <!-- Status Diodes -->
            <rect x="228" y="360" width="8" height="8" fill="#22c55e"/>
            <rect x="244" y="360" width="8" height="8" fill="#f43f5e"/>
            <rect x="260" y="360" width="8" height="8" fill="#38bdf8"/>
            <!-- Heavy Lunar Boots -->
            <g fill="#cbd5e1">
              <rect x="180" y="386" width="60" height="50"/>
              <rect x="272" y="386" width="60" height="50"/>
              <rect x="166" y="430" width="80" height="24"/>
              <rect x="266" y="430" width="80" height="24"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'outfit-demon-hoodie',
        name: 'Demon Crest Hoodie',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Black hoodie -->
            <rect x="130" y="300" width="252" height="90" fill="#18181b"/>
            <rect x="110" y="320" width="50" height="70" fill="#18181b"/>
            <rect x="352" y="320" width="50" height="70" fill="#18181b"/>
            <!-- Glowing Red Skull Crest -->
            <g fill="#ef4444">
              <rect x="240" y="336" width="32" height="24"/>
              <rect x="244" y="360" width="24" height="10"/>
              <rect x="236" y="330" width="8" height="8"/>
              <rect x="268" y="330" width="8" height="8"/>
            </g>
            <!-- Black shoes with red sole -->
            <rect x="166" y="430" width="80" height="20" fill="#18181b"/>
            <rect x="266" y="430" width="80" height="20" fill="#18181b"/>
            <rect x="166" y="446" width="80" height="8" fill="#ef4444"/>
            <rect x="266" y="446" width="80" height="8" fill="#ef4444"/>
          </svg>
        `),
      },
      {
        id: 'outfit-reaper-cloak',
        name: 'Tattered Reaper Cloak',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Flowing ragged obsidian robe -->
            <g fill="#09090b">
              <rect x="130" y="290" width="252" height="150"/>
              <rect x="100" y="320" width="50" height="120"/>
              <rect x="362" y="320" width="50" height="120"/>
              <!-- Torn ragged hem -->
              <rect x="120" y="430" width="20" height="24"/>
              <rect x="156" y="430" width="26" height="16"/>
              <rect x="198" y="430" width="24" height="28"/>
              <rect x="236" y="430" width="30" height="20"/>
              <rect x="280" y="430" width="26" height="26"/>
              <rect x="320" y="430" width="30" height="18"/>
              <rect x="364" y="430" width="26" height="24"/>
            </g>
          </svg>
        `),
      },
    ],
  },

  // ==========================================
  // LAYER 4: EYES & FACE EXPRESSION
  // ==========================================
  {
    id: 'layer-face',
    name: '4. Eyes & Face Expression',
    required: true,
    enabled: true,
    traits: [
      {
        id: 'face-neon-magenta-eye',
        name: 'Neon Magenta Dripping Eye & Stitched X',
        weight: 22,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- LEFT EYE: Hot pink / magenta glowing pupil with dripping tear (Image 2) -->
            <!-- Pink Outer Glow aura -->
            <rect x="180" y="180" width="48" height="48" fill="#f43f5e" opacity="0.4"/>
            <!-- Bright Core pupil -->
            <rect x="188" y="188" width="32" height="32" fill="#ec4899"/>
            <rect x="194" y="194" width="20" height="20" fill="#ffffff"/>
            <!-- Dripping tears down cheek -->
            <g fill="#ec4899">
              <rect x="198" y="228" width="12" height="18"/>
              <rect x="200" y="246" width="8" height="24"/>
              <rect x="202" y="270" width="6" height="16"/>
            </g>
            <!-- RIGHT EYE: Thick stitched black X patch with white sutures -->
            <g fill="#09090b">
              <rect x="280" y="180" width="56" height="56"/>
            </g>
            <!-- White cross sutures inside patch -->
            <g fill="#f8fafc">
              <rect x="290" y="190" width="12" height="12"/>
              <rect x="314" y="190" width="12" height="12"/>
              <rect x="302" y="202" width="12" height="12"/>
              <rect x="290" y="214" width="12" height="12"/>
              <rect x="314" y="214" width="12" height="12"/>
            </g>
            <!-- Cute stitched zigzag mouth -->
            <g fill="#18181b">
              <rect x="242" y="256" width="28" height="6"/>
              <rect x="246" y="250" width="6" height="6"/>
              <rect x="260" y="250" width="6" height="6"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'face-white-cross-eyes',
        name: "Stark White 'X X' Cross Eyes",
        weight: 18,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Left X -->
            <g fill="#ffffff">
              <rect x="186" y="186" width="14" height="14"/>
              <rect x="214" y="186" width="14" height="14"/>
              <rect x="200" y="200" width="14" height="14"/>
              <rect x="186" y="214" width="14" height="14"/>
              <rect x="214" y="214" width="14" height="14"/>
            </g>
            <!-- Right X -->
            <g fill="#ffffff">
              <rect x="284" y="186" width="14" height="14"/>
              <rect x="312" y="186" width="14" height="14"/>
              <rect x="298" y="200" width="14" height="14"/>
              <rect x="284" y="214" width="14" height="14"/>
              <rect x="312" y="214" width="14" height="14"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'face-crt-cyan-smile',
        name: 'CRT Cyan Phosphor Smile (:))',
        weight: 16,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Phosphor Cyan Eyes -->
            <g fill="#00f0ff">
              <rect x="200" y="180" width="18" height="24"/>
              <rect x="294" y="180" width="18" height="24"/>
              <!-- Smiling Mouth -->
              <rect x="210" y="236" width="16" height="12"/>
              <rect x="226" y="244" width="60" height="12"/>
              <rect x="286" y="236" width="16" height="12"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'face-demonic-red-eyes',
        name: 'Demonic Crimson Gaze',
        weight: 14,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Left Red Demonic Eye -->
            <rect x="180" y="186" width="44" height="34" fill="#0f172a"/>
            <rect x="190" y="192" width="24" height="20" fill="#dc2626"/>
            <rect x="196" y="196" width="12" height="12" fill="#ef4444"/>
            <!-- Right Red Demonic Eye -->
            <rect x="288" y="186" width="44" height="34" fill="#0f172a"/>
            <rect x="298" y="192" width="24" height="20" fill="#dc2626"/>
            <rect x="304" y="196" width="12" height="12" fill="#ef4444"/>
            <!-- Angry V-slit Brows -->
            <g fill="#991b1b">
              <rect x="176" y="174" width="52" height="8"/>
              <rect x="284" y="174" width="52" height="8"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'face-pixel-shades-cig',
        name: 'Pixel Dark Shades & Smoke',
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- 8-bit Black Sunglasses -->
            <g fill="#09090b">
              <rect x="170" y="180" width="172" height="36"/>
              <rect x="180" y="216" width="60" height="14"/>
              <rect x="272" y="216" width="60" height="14"/>
            </g>
            <!-- White diagonal glare glint -->
            <g fill="#ffffff">
              <rect x="190" y="188" width="12" height="6"/>
              <rect x="184" y="194" width="12" height="6"/>
              <rect x="282" y="188" width="12" height="6"/>
              <rect x="276" y="194" width="12" height="6"/>
            </g>
            <!-- Lit pixel cigarette in mouth -->
            <g fill="#f8fafc">
              <rect x="270" y="254" width="30" height="8"/>
            </g>
            <rect x="300" y="254" width="10" height="8" fill="#ea580c"/>
            <rect x="308" y="254" width="4" height="8" fill="#facc15"/>
            <!-- Rising grey smoke pixel clouds -->
            <g fill="#94a3b8" opacity="0.6">
              <rect x="316" y="244" width="8" height="8"/>
              <rect x="322" y="230" width="10" height="10"/>
              <rect x="318" y="212" width="12" height="12"/>
              <rect x="326" y="196" width="16" height="12"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'face-cosmic-visor-glitch',
        name: 'Cosmic Rainbow Visor Glitch',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Chromatic RGB rainbow noise inside visor -->
            <g opacity="0.85">
              <rect x="180" y="170" width="150" height="8" fill="#ef4444"/>
              <rect x="176" y="184" width="160" height="8" fill="#f59e0b"/>
              <rect x="180" y="198" width="152" height="8" fill="#22c55e"/>
              <rect x="174" y="212" width="164" height="8" fill="#06b6d4"/>
              <rect x="182" y="226" width="148" height="8" fill="#a855f7"/>
              <rect x="178" y="240" width="156" height="8" fill="#ec4899"/>
            </g>
            <!-- Glass crack fracture -->
            <g fill="#ffffff">
              <rect x="240" y="160" width="4" height="24"/>
              <rect x="244" y="184" width="14" height="4"/>
              <rect x="256" y="188" width="4" height="30"/>
              <rect x="236" y="192" width="10" height="4"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'face-cyan-ghost-tears',
        name: 'Cyan Spectral Ghost Tears',
        weight: 8,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Black cavernous ghost eyes -->
            <rect x="190" y="180" width="28" height="36" fill="#090d16"/>
            <rect x="294" y="180" width="28" height="36" fill="#090d16"/>
            <!-- Streaming glowing cyan tears -->
            <g fill="#00f0ff">
              <rect x="198" y="216" width="12" height="24"/>
              <rect x="200" y="240" width="8" height="30"/>
              <rect x="302" y="216" width="12" height="24"/>
              <rect x="304" y="240" width="8" height="30"/>
            </g>
            <!-- Sad mouth -->
            <rect x="244" y="246" width="24" height="12" fill="#090d16"/>
          </svg>
        `),
      },
    ],
  },

  // ==========================================
  // LAYER 5: HEADWEAR & ACCESSORIES
  // ==========================================
  {
    id: 'layer-head',
    name: '5. Headwear & Accessories',
    required: false,
    noneWeight: 15,
    enabled: true,
    traits: [
      {
        id: 'head-glitch-crown',
        name: 'Floating Glitched Gold Crown',
        weight: 22,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Floating Imperial Gold Crown (Card 1 style) -->
            <g fill="#f59e0b">
              <!-- Base band -->
              <rect x="200" y="70" width="112" height="16"/>
              <!-- Center peak -->
              <rect x="244" y="36" width="24" height="34"/>
              <!-- Left peak -->
              <rect x="200" y="46" width="20" height="24"/>
              <!-- Right peak -->
              <rect x="292" y="46" width="20" height="24"/>
            </g>
            <g fill="#fde047">
              <rect x="248" y="40" width="16" height="16"/>
              <rect x="204" y="50" width="12" height="12"/>
              <rect x="296" y="50" width="12" height="12"/>
            </g>
            <!-- Center Ruby Jewel -->
            <rect x="250" y="72" width="12" height="12" fill="#dc2626"/>
            <!-- Floating detached glitch pixel bits -->
            <g fill="#fbbf24">
              <rect x="180" y="40" width="10" height="10"/>
              <rect x="326" y="54" width="8" height="8"/>
              <rect x="230" y="26" width="8" height="8"/>
            </g>
            <g fill="#f43f5e">
              <rect x="320" y="34" width="8" height="8"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'head-angel-halo',
        name: 'Glitched Angel Halo',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Hovering Cyan Neon Halo Ring (Card 5 style) -->
            <g fill="#00f0ff">
              <rect x="180" y="50" width="152" height="12"/>
              <rect x="164" y="56" width="184" height="8"/>
              <!-- Broken glitch segments -->
              <rect x="356" y="46" width="12" height="12"/>
              <rect x="150" y="60" width="8" height="8"/>
            </g>
            <g fill="#ffffff">
              <rect x="190" y="52" width="132" height="6"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'head-demon-horns',
        name: 'Curved Cyber Demon Horns',
        weight: 18,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Crimson curved horns -->
            <g fill="#dc2626">
              <rect x="120" y="60" width="24" height="50"/>
              <rect x="100" y="40" width="24" height="30"/>
              <rect x="80" y="24" width="24" height="20"/>
              <rect x="368" y="60" width="24" height="50"/>
              <rect x="388" y="40" width="24" height="30"/>
              <rect x="408" y="24" width="24" height="20"/>
            </g>
            <g fill="#ef4444">
              <rect x="84" y="28" width="12" height="12"/>
              <rect x="412" y="28" width="12" height="12"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'head-backward-skull-cap',
        name: 'Backward Skull Cap',
        weight: 16,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Backward Baseball Cap (Card 8 style) -->
            <rect x="160" y="110" width="192" height="46" fill="#18181b"/>
            <!-- Backward Snapback strap -->
            <rect x="236" y="118" width="40" height="16" fill="#09090b"/>
            <!-- Mini Embroidered Skull Badge -->
            <g fill="#ffffff">
              <rect x="246" y="122" width="20" height="12"/>
              <rect x="248" y="134" width="16" height="4"/>
            </g>
            <g fill="#18181b">
              <rect x="248" y="126" width="4" height="4"/>
              <rect x="258" y="126" width="4" height="4"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'head-reaper-scythe',
        name: "Reaper's Pixel Scythe",
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Massive curved Scythe behind shoulder (Card 10 style) -->
            <!-- Wooden shaft -->
            <rect x="400" y="110" width="14" height="340" fill="#78350f"/>
            <rect x="404" y="110" width="6" height="340" fill="#92400e"/>
            <!-- Huge curved silver blade -->
            <g fill="#e2e8f0">
              <rect x="330" y="80" width="120" height="28"/>
              <rect x="270" y="96" width="90" height="24"/>
              <rect x="220" y="116" width="70" height="20"/>
              <rect x="180" y="136" width="50" height="16"/>
              <rect x="150" y="152" width="40" height="12"/>
            </g>
            <g fill="#94a3b8">
              <rect x="340" y="74" width="90" height="8"/>
              <rect x="280" y="90" width="70" height="8"/>
            </g>
            <!-- Blood drop on tip -->
            <rect x="150" y="164" width="8" height="12" fill="#dc2626"/>
          </svg>
        `),
      },
    ],
  },

  // ==========================================
  // LAYER 6: GLITCH AURA & DISSOLVE PARTICLES
  // ==========================================
  {
    id: 'layer-aura',
    name: '6. Glitch Aura & Particles',
    required: false,
    noneWeight: 20,
    enabled: true,
    traits: [
      {
        id: 'aura-dead-pixels-drift',
        name: 'Floating Dead Pixels (Pink & Cyan)',
        weight: 35,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <!-- Floating square pixel blocks (Image 2 style) -->
            <g fill="#ec4899">
              <rect x="110" y="140" width="12" height="12"/>
              <rect x="80" y="220" width="14" height="14"/>
              <rect x="130" y="320" width="10" height="10"/>
              <rect x="380" y="140" width="12" height="12"/>
              <rect x="410" y="240" width="14" height="14"/>
              <rect x="370" y="330" width="10" height="10"/>
            </g>
            <g fill="#00f0ff">
              <rect x="140" y="180" width="10" height="10"/>
              <rect x="90" y="290" width="12" height="12"/>
              <rect x="360" y="190" width="10" height="10"/>
              <rect x="420" y="310" width="12" height="12"/>
            </g>
            <g fill="#09090b">
              <rect x="120" y="250" width="12" height="12"/>
              <rect x="380" y="280" width="14" height="14"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'aura-matrix-rain',
        name: 'Matrix Code Rain Cascade',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <g fill="#22c55e" opacity="0.6">
              <rect x="70" y="130" width="8" height="24"/>
              <rect x="70" y="170" width="8" height="32"/>
              <rect x="100" y="210" width="8" height="40"/>
              <rect x="410" y="120" width="8" height="32"/>
              <rect x="410" y="170" width="8" height="48"/>
              <rect x="440" y="190" width="8" height="28"/>
            </g>
            <g fill="#86efac">
              <rect x="70" y="210" width="8" height="8"/>
              <rect x="100" y="260" width="8" height="8"/>
              <rect x="410" y="230" width="8" height="8"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'aura-demon-mist',
        name: 'Crimson Demon Mist',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <g fill="#dc2626" opacity="0.5">
              <rect x="80" y="360" width="80" height="12"/>
              <rect x="360" y="360" width="80" height="12"/>
              <rect x="100" y="380" width="60" height="8"/>
              <rect x="340" y="380" width="70" height="8"/>
              <!-- Sparks -->
              <rect x="120" y="330" width="8" height="8" fill="#facc15"/>
              <rect x="370" y="320" width="8" height="8" fill="#facc15"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'aura-chromatic-bars',
        name: 'Chromatic Glitch Static Bars',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">
            <g opacity="0.7">
              <rect x="60" y="160" width="120" height="4" fill="#f43f5e"/>
              <rect x="340" y="160" width="110" height="4" fill="#00f0ff"/>
              <rect x="80" y="270" width="90" height="4" fill="#00f0ff"/>
              <rect x="320" y="270" width="120" height="4" fill="#f43f5e"/>
              <rect x="50" y="360" width="140" height="4" fill="#a855f7"/>
              <rect x="310" y="360" width="150" height="4" fill="#f43f5e"/>
            </g>
          </svg>
        `),
      },
    ],
  },

  // ==========================================
  // LAYER 7: DEAD PIXELS TRADING CARD FRAME & LORE
  // (Matches the exact cards from the user's reference image!)
  // ==========================================
  {
    id: 'layer-card',
    name: '7. Dead Pixels Card Frame & Lore',
    required: false,
    noneWeight: 5,
    enabled: true,
    traits: [
      {
        id: 'card-error-404',
        name: 'Card: Error 404 Soul Not Found',
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Dark Border with fine neon red line -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#dc2626" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header: DEAD PIXELS -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="24" y="42" fill="#00f0ff" opacity="0.8">DEAD</text>
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="24" y="64" fill="#f43f5e" opacity="0.8">PIXELS</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="11" fill="#94a3b8" letter-spacing="1">
              <text x="24" y="140">ERROR</text>
              <text x="24" y="156">404</text>
              <text x="24" y="172">SOUL</text>
              <text x="24" y="188">NOT</text>
              <text x="24" y="204">FOUND</text>
            </g>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">GLITCHED KING</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// ERROR MAKES US UNIQUE</text>
            </g>
          </svg>
        `),
      },
      {
        id: 'card-system-corrupted',
        name: 'Card: System Corrupted',
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Neon Cyan Border -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#00f0ff" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="24" y="42" fill="#f43f5e" opacity="0.8">DEAD</text>
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="24" y="64" fill="#00f0ff" opacity="0.8">PIXELS</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="10" fill="#38bdf8" letter-spacing="1">
              <text x="24" y="140">&gt; SYSTEM</text>
              <text x="24" y="156">&gt; CORRUPTED</text>
              <text x="24" y="172">&gt; CONTINUE?</text>
              <text x="24" y="188">&gt; _</text>
            </g>
            <!-- Battery Icon top right -->
            <rect x="450" y="30" width="28" height="14" fill="none" stroke="#38bdf8" stroke-width="2"/>
            <rect x="478" y="34" width="3" height="6" fill="#38bdf8"/>
            <rect x="454" y="34" width="8" height="6" fill="#38bdf8"/>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">NULL HOODIE</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// NO DATA, NO PROBLEM</text>
            </g>
          </svg>
        `),
      },
      {
        id: 'card-hello-world',
        name: 'Card: Hello World',
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Neon Blue Border -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="11" fill="#93c5fd" letter-spacing="1">
              <text x="24" y="140">HELLO</text>
              <text x="24" y="156">WORLD?</text>
              <text x="24" y="172">-</text>
            </g>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">CRT BOY</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// OLD SCREEN, NEW STORIES</text>
            </g>
          </svg>
        `),
      },
      {
        id: 'card-cute-corrupted',
        name: 'Card: Cute But Corrupted',
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Neon Pink Border -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#ec4899" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="24" y="42" fill="#ec4899" opacity="0.8">DEAD</text>
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="24" y="64" fill="#00f0ff" opacity="0.8">PIXELS</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="11" fill="#f472b6" letter-spacing="1">
              <text x="24" y="140">CUTE</text>
              <text x="24" y="156">BUT</text>
              <text x="24" y="172">CORRUPTED</text>
              <text x="24" y="196" fill="#ec4899" font-size="14">♥</text>
            </g>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">BROKEN BEAR</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// STILL HUGGABLE</text>
            </g>
          </svg>
        `),
      },
      {
        id: 'card-hack-sleep',
        name: 'Card: Hack Sleep Repeat',
        weight: 12,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Neon Matrix Green Border -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="10" fill="#4ade80" letter-spacing="1">
              <text x="24" y="140">&gt; HACK</text>
              <text x="24" y="156">&gt; SLEEP</text>
              <text x="24" y="172">&gt; REPEAT</text>
              <text x="24" y="188">&gt; _</text>
            </g>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">BYTE THIEF</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// DATA IS FREEDOM</text>
            </g>
          </svg>
        `),
      },
      {
        id: 'card-game-over',
        name: 'Card: Game Over',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Neon Ruby Border -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#dc2626" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="11" fill="#f87171" letter-spacing="1">
              <text x="24" y="140">GAME</text>
              <text x="24" y="156">OVER</text>
              <text x="24" y="172">-</text>
            </g>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">PIXEL DEMON</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// STILL HERE</text>
            </g>
          </svg>
        `),
      },
      {
        id: 'card-lost-transaction',
        name: 'Card: Lost in Transaction',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Neon Silver/White Border -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#94a3b8" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="11" fill="#cbd5e1" letter-spacing="1">
              <text x="24" y="140">LOST</text>
              <text x="24" y="156">IN</text>
              <text x="24" y="172">TRANSACTION</text>
              <text x="24" y="188">...</text>
            </g>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">ASTRO ERROR</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// TO THE UNKNOWN</text>
            </g>
          </svg>
        `),
      },
      {
        id: 'card-no-rules',
        name: 'Card: No Rules Just Pixels',
        weight: 8,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Neon Amber Border -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="11" fill="#fcd34d" letter-spacing="1">
              <text x="24" y="140">NO</text>
              <text x="24" y="156">RULES</text>
              <text x="24" y="172">JUST</text>
              <text x="24" y="188">PIXELS</text>
            </g>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">BAD CAT</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// CHAOS LOOKS GOOD ON ME</text>
            </g>
          </svg>
        `),
      },
      {
        id: 'card-deleting-past',
        name: 'Card: Deleting The Past',
        weight: 8,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Neon Crimson Border -->
            <rect x="6" y="6" width="500" height="500" rx="8" fill="none" stroke="#991b1b" stroke-width="2" opacity="0.8"/>
            <rect x="10" y="10" width="492" height="492" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
            <!-- Top Header -->
            <g font-family="monospace" font-weight="900" font-size="22" letter-spacing="2">
              <text x="22" y="40" fill="#ffffff">DEAD</text>
              <text x="22" y="62" fill="#ffffff">PIXELS</text>
            </g>
            <!-- Left Terminal Text -->
            <g font-family="monospace" font-size="11" fill="#fca5a5" letter-spacing="1">
              <text x="24" y="140">DELETING</text>
              <text x="24" y="156">THE PAST</text>
              <text x="24" y="172">...</text>
            </g>
            <!-- Bottom Title Plaque -->
            <g text-anchor="middle" font-family="monospace">
              <text x="256" y="480" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="3">PIXEL REAPER</text>
              <text x="256" y="496" font-size="10" fill="#94a3b8" letter-spacing="1">// ALL FILES END HERE</text>
            </g>
          </svg>
        `),
      },
    ],
  },
];

export const DEAD_PIXELS_COLLECTION_CONFIG = {
  name: 'DEAD PIXELS (Corrupted Edition)',
  description: '10,000 unique cyberpunk dead pixel characters corrupted by glitch artifacts, terminal lore, and living in the digital void.',
  baseUri: 'ipfs://QmDeadPixelsCorruptedCollection/',
  width: 512,
  height: 512,
  count: 10000,
  batchSize: 500,
  zipChunkSize: 10000,
};
