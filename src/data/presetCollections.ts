import { Layer } from '../types';

// Helper to convert SVG strings to standard Data URL for canvas rendering and preview
export function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const CYBER_APE_LAYERS: Layer[] = [
  {
    id: 'layer-bg',
    name: '1. Background',
    required: true,
    enabled: true,
    traits: [
      {
        id: 'bg-cyber-grid',
        name: 'Cyber Grid Cyan',
        weight: 30,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <defs>
              <linearGradient id="bg1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0a051b"/>
                <stop offset="100%" stop-color="#190e38"/>
              </linearGradient>
              <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.1"/>
                <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.8"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(#bg1)"/>
            <path d="M0 320 L512 320 M0 350 L512 350 M0 390 L512 390 M0 440 L512 440 M0 500 L512 500" stroke="#00f0ff" stroke-width="2" opacity="0.4"/>
            <path d="M256 300 L50 512 M256 300 L120 512 M256 300 L200 512 M256 300 L256 512 M256 300 L312 512 M256 300 L392 512 M256 300 L462 512" stroke="#00f0ff" stroke-width="2" opacity="0.4"/>
            <circle cx="256" cy="220" r="100" fill="#ff0077" opacity="0.2" filter="blur(20px)"/>
          </svg>
        `),
      },
      {
        id: 'bg-matrix-green',
        name: 'Matrix Acid Rain',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <rect width="512" height="512" fill="#031408"/>
            <g fill="#00ff66" opacity="0.25" font-family="monospace" font-size="14">
              <text x="30" y="50">01101001</text><text x="30" y="90">11001010</text><text x="30" y="140">00101101</text>
              <text x="120" y="70">10110011</text><text x="120" y="120">01010101</text><text x="120" y="180">11100010</text>
              <text x="220" y="40">11010110</text><text x="220" y="95">00110010</text><text x="220" y="160">10101001</text>
              <text x="340" y="60">01110101</text><text x="340" y="110">10001110</text><text x="340" y="170">01010011</text>
              <text x="440" y="45">11001100</text><text x="440" y="100">01010110</text><text x="440" y="150">10100101</text>
            </g>
            <circle cx="256" cy="256" r="140" fill="#00ff66" opacity="0.08"/>
          </svg>
        `),
      },
      {
        id: 'bg-vaporwave-sunset',
        name: 'Vaporwave Sunset',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <defs>
              <linearGradient id="vp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#12042b"/>
                <stop offset="60%" stop-color="#4c125e"/>
                <stop offset="100%" stop-color="#fd5e53"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(#vp)"/>
            <circle cx="256" cy="280" r="110" fill="#ffe066"/>
            <rect x="146" y="270" width="220" height="6" fill="#4c125e"/>
            <rect x="146" y="290" width="220" height="10" fill="#4c125e"/>
            <rect x="146" y="315" width="220" height="15" fill="#4c125e"/>
            <rect x="146" y="345" width="220" height="22" fill="#4c125e"/>
          </svg>
        `),
      },
      {
        id: 'bg-deep-void',
        name: 'Obsidian Void Gold',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <rect width="512" height="512" fill="#0b0e14"/>
            <circle cx="256" cy="256" r="180" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 8" opacity="0.3"/>
            <circle cx="256" cy="256" r="210" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.2"/>
            <polygon points="256,40 265,58 285,58 269,70 275,90 256,77 237,90 243,70 227,58 247,58" fill="#f59e0b" opacity="0.4"/>
          </svg>
        `),
      },
      {
        id: 'bg-neon-tokyo',
        name: 'Tokyo Neon Violet',
        weight: 5,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <defs>
              <linearGradient id="nt" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#2e0854"/>
                <stop offset="100%" stop-color="#a80077"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(#nt)"/>
            <circle cx="100" cy="100" r="160" fill="#00f0ff" opacity="0.2"/>
            <circle cx="420" cy="400" r="180" fill="#ff0077" opacity="0.25"/>
          </svg>
        `),
      },
    ],
  },
  {
    id: 'layer-body',
    name: '2. Body / Character',
    required: true,
    enabled: true,
    traits: [
      {
        id: 'body-cyborg-chrome',
        name: 'Cyborg Chrome',
        weight: 30,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Ears -->
            <circle cx="130" cy="260" r="45" fill="#94a3b8" stroke="#475569" stroke-width="6"/>
            <circle cx="130" cy="260" r="25" fill="#64748b"/>
            <circle cx="382" cy="260" r="45" fill="#94a3b8" stroke="#475569" stroke-width="6"/>
            <circle cx="382" cy="260" r="25" fill="#64748b"/>
            <!-- Head -->
            <rect x="146" y="140" width="220" height="240" rx="70" fill="#cbd5e1" stroke="#334155" stroke-width="6"/>
            <!-- Cybernetic plates and seams -->
            <path d="M190 140 L190 230 L256 250 L322 230 L322 140" stroke="#00f0ff" stroke-width="4" fill="none" opacity="0.7"/>
            <path d="M256 140 L256 210" stroke="#334155" stroke-width="4"/>
            <!-- Neck & Shoulders -->
            <rect x="216" y="370" width="80" height="70" fill="#64748b"/>
            <path d="M110 440 C140 390 372 390 402 440 L440 512 L72 512 Z" fill="#94a3b8" stroke="#334155" stroke-width="6"/>
            <circle cx="256" cy="460" r="20" fill="#00f0ff" opacity="0.9"/>
          </svg>
        `),
      },
      {
        id: 'body-golden-god',
        name: 'Golden Mythic',
        weight: 10,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#fffbeb"/>
                <stop offset="30%" stop-color="#f59e0b"/>
                <stop offset="70%" stop-color="#d97706"/>
                <stop offset="100%" stop-color="#78350f"/>
              </linearGradient>
            </defs>
            <circle cx="130" cy="260" r="45" fill="url(#gold)" stroke="#b45309" stroke-width="6"/>
            <circle cx="130" cy="260" r="25" fill="#b45309"/>
            <circle cx="382" cy="260" r="45" fill="url(#gold)" stroke="#b45309" stroke-width="6"/>
            <circle cx="382" cy="260" r="25" fill="#b45309"/>
            <rect x="146" y="140" width="220" height="240" rx="70" fill="url(#gold)" stroke="#78350f" stroke-width="6"/>
            <path d="M110 440 C140 390 372 390 402 440 L440 512 L72 512 Z" fill="url(#gold)" stroke="#78350f" stroke-width="6"/>
            <path d="M256 160 L264 185 L289 185 L269 200 L277 225 L256 210 L235 225 L243 200 L223 185 L248 185 Z" fill="#ffffff" opacity="0.7"/>
          </svg>
        `),
      },
      {
        id: 'body-alien-blue',
        name: 'Cosmic Alien Blue',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <circle cx="130" cy="260" r="45" fill="#0284c7" stroke="#0369a1" stroke-width="6"/>
            <circle cx="130" cy="260" r="25" fill="#075985"/>
            <circle cx="382" cy="260" r="45" fill="#0284c7" stroke="#0369a1" stroke-width="6"/>
            <circle cx="382" cy="260" r="25" fill="#075985"/>
            <rect x="146" y="140" width="220" height="240" rx="70" fill="#38bdf8" stroke="#0369a1" stroke-width="6"/>
            <path d="M110 440 C140 390 372 390 402 440 L440 512 L72 512 Z" fill="#0284c7" stroke="#0369a1" stroke-width="6"/>
            <circle cx="210" cy="180" r="10" fill="#bae6fd"/>
            <circle cx="302" cy="180" r="10" fill="#bae6fd"/>
          </svg>
        `),
      },
      {
        id: 'body-zombie-green',
        name: 'Toxic Zombie Green',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <circle cx="130" cy="260" r="45" fill="#4d7c0f" stroke="#365314" stroke-width="6"/>
            <circle cx="130" cy="260" r="25" fill="#365314"/>
            <circle cx="382" cy="260" r="45" fill="#4d7c0f" stroke="#365314" stroke-width="6"/>
            <circle cx="382" cy="260" r="25" fill="#365314"/>
            <rect x="146" y="140" width="220" height="240" rx="70" fill="#84cc16" stroke="#365314" stroke-width="6"/>
            <path d="M110 440 C140 390 372 390 402 440 L440 512 L72 512 Z" fill="#4d7c0f" stroke="#365314" stroke-width="6"/>
            <!-- Stitches -->
            <path d="M190 170 L230 200" stroke="#1c1917" stroke-width="4"/>
            <path d="M195 188 L208 178 M212 200 L225 190" stroke="#1c1917" stroke-width="3"/>
          </svg>
        `),
      },
      {
        id: 'body-shadow-black',
        name: 'Shadow Stealth',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <circle cx="130" cy="260" r="45" fill="#1e293b" stroke="#0f172a" stroke-width="6"/>
            <circle cx="130" cy="260" r="25" fill="#0f172a"/>
            <circle cx="382" cy="260" r="45" fill="#1e293b" stroke="#0f172a" stroke-width="6"/>
            <circle cx="382" cy="260" r="25" fill="#0f172a"/>
            <rect x="146" y="140" width="220" height="240" rx="70" fill="#334155" stroke="#0f172a" stroke-width="6"/>
            <path d="M110 440 C140 390 372 390 402 440 L440 512 L72 512 Z" fill="#1e293b" stroke="#0f172a" stroke-width="6"/>
          </svg>
        `),
      },
    ],
  },
  {
    id: 'layer-clothing',
    name: '3. Outfit / Clothing',
    required: false,
    noneWeight: 10,
    enabled: true,
    traits: [
      {
        id: 'cloth-cyber-hoodie',
        name: 'Neon Cyber Hoodie',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M96 430 C130 380 382 380 416 430 L450 512 L62 512 Z" fill="#0f172a" stroke="#00f0ff" stroke-width="6"/>
            <path d="M180 390 Q256 460 332 390" fill="none" stroke="#ff0077" stroke-width="6"/>
            <path d="M226 430 L226 490 M286 430 L286 490" stroke="#e2e8f0" stroke-width="4"/>
          </svg>
        `),
      },
      {
        id: 'cloth-tactical-vest',
        name: 'Kevlar Tactical Armor',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M100 435 C130 385 382 385 412 435 L445 512 L67 512 Z" fill="#1e293b" stroke="#475569" stroke-width="5"/>
            <rect x="176" y="420" width="160" height="80" rx="10" fill="#334155" stroke="#f59e0b" stroke-width="3"/>
            <rect x="196" y="440" width="40" height="24" rx="4" fill="#0f172a"/>
            <rect x="276" y="440" width="40" height="24" rx="4" fill="#0f172a"/>
            <circle cx="256" cy="452" r="6" fill="#10b981"/>
          </svg>
        `),
      },
      {
        id: 'cloth-spacesuit',
        name: 'Orbital Spacesuit',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M96 425 C130 380 382 380 416 425 L450 512 L62 512 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="6"/>
            <circle cx="256" cy="450" r="32" fill="#0284c7" stroke="#e2e8f0" stroke-width="4"/>
            <path d="M140 460 L190 460 M322 460 L372 460" stroke="#ef4444" stroke-width="6"/>
          </svg>
        `),
      },
      {
        id: 'cloth-tuxedo',
        name: 'Dapper Tuxedo VIP',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M96 425 C130 380 382 380 416 425 L450 512 L62 512 Z" fill="#09090b" stroke="#27272a" stroke-width="5"/>
            <polygon points="256,400 216,512 296,512" fill="#ffffff"/>
            <!-- Bow tie -->
            <polygon points="236,410 276,430 276,410 236,430" fill="#ef4444"/>
            <circle cx="256" cy="420" r="5" fill="#b91c1c"/>
          </svg>
        `),
      },
      {
        id: 'cloth-samurai-robe',
        name: 'Ronin Kimono Robe',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M96 425 C130 380 382 380 416 425 L450 512 L62 512 Z" fill="#7f1d1d" stroke="#f59e0b" stroke-width="5"/>
            <path d="M176 390 L256 512 M336 390 L256 512" stroke="#fef08a" stroke-width="8"/>
            <rect x="216" y="470" width="80" height="24" fill="#18181b"/>
          </svg>
        `),
      },
    ],
  },
  {
    id: 'layer-mouth',
    name: '4. Mouth / Expression',
    required: true,
    enabled: true,
    traits: [
      {
        id: 'mouth-cyber-mask',
        name: 'Cyber Respirator Mask',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M196 290 L316 290 L300 370 L212 370 Z" fill="#0f172a" stroke="#00f0ff" stroke-width="5"/>
            <circle cx="226" cy="330" r="14" fill="#334155" stroke="#00f0ff" stroke-width="3"/>
            <circle cx="286" cy="330" r="14" fill="#334155" stroke="#00f0ff" stroke-width="3"/>
            <line x1="246" y1="315" x2="266" y2="315" stroke="#ff0077" stroke-width="4"/>
          </svg>
        `),
      },
      {
        id: 'mouth-bubblegum',
        name: 'Pink Bubblegum Pop',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <circle cx="256" cy="325" r="42" fill="#ec4899" stroke="#be185d" stroke-width="4"/>
            <ellipse cx="240" cy="310" rx="12" ry="7" fill="#fbcfe8" opacity="0.8"/>
          </svg>
        `),
      },
      {
        id: 'mouth-gold-grillz',
        name: 'Diamond Gold Grillz',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <rect x="206" y="310" width="100" height="34" rx="10" fill="#18181b" stroke="#71717a" stroke-width="3"/>
            <rect x="216" y="315" width="16" height="24" rx="3" fill="#facc15"/>
            <rect x="236" y="315" width="16" height="24" rx="3" fill="#38bdf8"/>
            <rect x="260" y="315" width="16" height="24" rx="3" fill="#facc15"/>
            <rect x="280" y="315" width="16" height="24" rx="3" fill="#38bdf8"/>
          </svg>
        `),
      },
      {
        id: 'mouth-cigar-smoke',
        name: 'Cyber Cigar with Smoke',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M216 320 Q256 335 296 320" stroke="#09090b" stroke-width="6" fill="none" stroke-linecap="round"/>
            <rect x="270" y="312" width="50" height="14" rx="3" transform="rotate(-15 270 312)" fill="#78350f" stroke="#451a03" stroke-width="2"/>
            <rect x="312" y="299" width="8" height="14" rx="2" transform="rotate(-15 312 299)" fill="#ef4444"/>
            <path d="M330 290 Q345 260 325 240 Q350 210 335 180" stroke="#cbd5e1" stroke-width="4" fill="none" opacity="0.6"/>
          </svg>
        `),
      },
      {
        id: 'mouth-laser-fangs',
        name: 'Vampire Fangs Grin',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M206 315 C226 345 286 345 306 315 Z" fill="#09090b" stroke="#3f3f46" stroke-width="4"/>
            <polygon points="226,315 234,330 242,315" fill="#ffffff"/>
            <polygon points="270,315 278,330 286,315" fill="#ffffff"/>
          </svg>
        `),
      },
    ],
  },
  {
    id: 'layer-eyes',
    name: '5. Eyes / Eyewear',
    required: true,
    enabled: true,
    traits: [
      {
        id: 'eyes-laser-beams',
        name: 'Red Laser Beams',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <circle cx="206" cy="225" r="22" fill="#ef4444" stroke="#991b1b" stroke-width="4"/>
            <circle cx="306" cy="225" r="22" fill="#ef4444" stroke="#991b1b" stroke-width="4"/>
            <line x1="206" y1="225" x2="0" y2="280" stroke="#ff0044" stroke-width="10" opacity="0.9"/>
            <line x1="206" y1="225" x2="0" y2="280" stroke="#ffffff" stroke-width="4"/>
            <line x1="306" y1="225" x2="0" y2="330" stroke="#ff0044" stroke-width="10" opacity="0.9"/>
            <line x1="306" y1="225" x2="0" y2="330" stroke="#ffffff" stroke-width="4"/>
          </svg>
        `),
      },
      {
        id: 'eyes-vr-headset',
        name: 'Metaverse VR Visor',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <rect x="160" y="200" width="192" height="54" rx="14" fill="#0f172a" stroke="#00f0ff" stroke-width="5"/>
            <rect x="176" y="212" width="160" height="30" rx="8" fill="#1e293b"/>
            <line x1="186" y1="227" x2="326" y2="227" stroke="#00f0ff" stroke-width="4"/>
            <path d="M160 220 L126 230 M352 220 L386 230" stroke="#475569" stroke-width="8"/>
          </svg>
        `),
      },
      {
        id: 'eyes-pixel-thug',
        name: '8-Bit Thug Life Shades',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <g fill="#000000" stroke="#ffffff" stroke-width="1.5">
              <rect x="166" y="210" width="70" height="24"/>
              <rect x="180" y="234" width="42" height="12"/>
              <rect x="276" y="210" width="70" height="24"/>
              <rect x="290" y="234" width="42" height="12"/>
              <rect x="236" y="216" width="40" height="8"/>
              <!-- white reflections -->
              <rect x="172" y="214" width="10" height="10" fill="#ffffff"/>
              <rect x="282" y="214" width="10" height="10" fill="#ffffff"/>
            </g>
          </svg>
        `),
      },
      {
        id: 'eyes-bionic-target',
        name: 'Bionic HUD Scanner',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <!-- Normal Eye Left -->
            <circle cx="206" cy="225" r="18" fill="#ffffff" stroke="#18181b" stroke-width="4"/>
            <circle cx="210" cy="225" r="8" fill="#10b981"/>
            <!-- Bionic Eye Right -->
            <circle cx="306" cy="225" r="26" fill="#0f172a" stroke="#ef4444" stroke-width="4"/>
            <circle cx="306" cy="225" r="16" fill="#7f1d1d"/>
            <circle cx="306" cy="225" r="6" fill="#ef4444"/>
            <line x1="306" y1="195" x2="306" y2="255" stroke="#ef4444" stroke-width="2"/>
            <line x1="276" y1="225" x2="336" y2="225" stroke="#ef4444" stroke-width="2"/>
          </svg>
        `),
      },
      {
        id: 'eyes-retro-3d',
        name: 'Retro Anaglyph 3D Glasses',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <rect x="166" y="210" width="75" height="36" rx="6" fill="#ef4444" opacity="0.85" stroke="#ffffff" stroke-width="5"/>
            <rect x="271" y="210" width="75" height="36" rx="6" fill="#00f0ff" opacity="0.85" stroke="#ffffff" stroke-width="5"/>
            <rect x="241" y="218" width="30" height="8" fill="#ffffff"/>
          </svg>
        `),
      },
    ],
  },
  {
    id: 'layer-headwear',
    name: '6. Headwear / Crown',
    required: false,
    noneWeight: 15,
    enabled: true,
    traits: [
      {
        id: 'head-cyber-crown',
        name: 'King Cyber Crown',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <polygon points="176,145 196,80 226,120 256,60 286,120 316,80 336,145" fill="#facc15" stroke="#ca8a04" stroke-width="6"/>
            <circle cx="196" cy="80" r="8" fill="#ef4444"/>
            <circle cx="256" cy="60" r="10" fill="#38bdf8"/>
            <circle cx="316" cy="80" r="8" fill="#10b981"/>
            <rect x="176" y="135" width="160" height="16" fill="#a16207"/>
          </svg>
        `),
      },
      {
        id: 'head-neon-halo',
        name: 'Angelic Neon Halo',
        weight: 20,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <ellipse cx="256" cy="90" rx="100" ry="24" fill="none" stroke="#00f0ff" stroke-width="12" opacity="0.9"/>
            <ellipse cx="256" cy="90" rx="100" ry="24" fill="none" stroke="#ffffff" stroke-width="4"/>
          </svg>
        `),
      },
      {
        id: 'head-astro-helmet',
        name: 'Cosmonaut Dome Ring',
        weight: 15,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M140 180 C140 70 372 70 372 180" fill="none" stroke="#e2e8f0" stroke-width="12" opacity="0.8"/>
            <circle cx="256" cy="50" r="16" fill="#ef4444" stroke="#ffffff" stroke-width="4"/>
          </svg>
        `),
      },
      {
        id: 'head-neon-mohawk',
        name: 'Electric Pink Mohawk',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M236 140 L246 40 L266 40 L276 140 Z" fill="#ec4899" stroke="#be185d" stroke-width="4"/>
            <path d="M246 50 L256 20 L266 50" fill="#f43f5e"/>
            <path d="M226 140 L236 65 L246 140" fill="#ec4899"/>
            <path d="M266 140 L276 65 L286 140" fill="#ec4899"/>
          </svg>
        `),
      },
      {
        id: 'head-backward-cap',
        name: 'Streetwear Cap (Backwards)',
        weight: 25,
        imageSrc: svgToDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
            <path d="M166 145 C166 85 346 85 346 145 Z" fill="#4f46e5" stroke="#3730a3" stroke-width="5"/>
            <rect x="236" y="140" width="40" height="15" rx="4" fill="#1e1b4b"/>
            <!-- Brim at back -->
            <path d="M340 135 Q400 135 390 155 Q350 150 340 145" fill="#312e81"/>
          </svg>
        `),
      },
    ],
  },
];

export { DEAD_PIXELS_LAYERS, DEAD_PIXELS_COLLECTION_CONFIG } from './deadPixelsLayers';
import { DEAD_PIXELS_LAYERS, DEAD_PIXELS_COLLECTION_CONFIG } from './deadPixelsLayers';

export const INITIAL_COLLECTION_CONFIG = DEAD_PIXELS_COLLECTION_CONFIG;

