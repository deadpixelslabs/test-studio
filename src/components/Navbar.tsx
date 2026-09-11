import React from 'react';
import { Layers, Sparkles, Image as ImageIcon, BarChart3, RotateCcw, Box, Wand2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'generator' | 'layers' | 'gallery' | 'rarity';
  setActiveTab: (tab: 'generator' | 'layers' | 'gallery' | 'rarity') => void;
  totalCombinations: number;
  sampleCount: number;
  isGenerating: boolean;
  onResetToPreset: () => void;
  onOpenAiModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalCombinations,
  sampleCount,
  isGenerating,
  onResetToPreset,
  onOpenAiModal,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Box className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-['Space_Grotesk']">
                GLITCH NFT STUDIO
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                ERC-721
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Prompt → Layers → 10K NFTs + Metadata + ZIP
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            id="tab-generator-btn"
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'generator'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generator</span>
          </button>

          <button
            id="tab-layers-btn"
            onClick={() => setActiveTab('layers')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'layers'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Layers</span>
          </button>

          <button
            id="tab-gallery-btn"
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'gallery'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Gallery</span>
            {sampleCount > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                {sampleCount}
              </span>
            )}
          </button>

          <button
            id="tab-rarity-btn"
            onClick={() => setActiveTab('rarity')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'rarity'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Rarity</span>
          </button>
        </nav>

        {/* Right Actions: AI Studio & Reset */}
        <div className="flex items-center gap-2">
          {/* AI Concept Studio Trigger */}
          <button
            id="open-ai-prompt-studio-btn"
            onClick={onOpenAiModal}
            disabled={isGenerating}
            title="Create a collection from any safe prompt"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Wand2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">AI Studio</span>
            <span className="sm:hidden">AI</span>
          </button>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Permutations:</span>
            <span className="text-emerald-400 font-mono font-semibold">
              {totalCombinations.toLocaleString()}
            </span>
          </div>

          <button
            id="reset-preset-btn"
            onClick={onResetToPreset}
            disabled={isGenerating}
            title="Reset studio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
