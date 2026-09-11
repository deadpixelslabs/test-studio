import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Wand2,
  Layers,
  Zap,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { Layer, CollectionConfig } from '../types';

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
  'Dead Pixels (16-Bit Cyberpunk)',
  '8-Bit Arcade Retro',
  'Neon Synthwave 80s',
  'Dark Dystopian Gothic',
  'Futuristic Mecha Sci-Fi',
];

export const AIPromptModal: React.FC<AIPromptModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedCollection,
  onApplyCollection,
  currentLayerCount,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPromptText?: string) => {
    const textToUse = customPromptText || prompt;
    if (!textToUse.trim()) return;

    setIsLoading(true);
    setError(null);
    setLoadingStep('Analyzing prompt and building collection concept...');

    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Designing layers, traits, and rarity weights...');
    }, 1500);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Preparing collection architecture for generation...');
    }, 3200);

    try {
      const combinedPrompt = `${textToUse}. Visual style: ${selectedStyle}`;
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20000);
      const res = await fetch('/api/ai/generate-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: combinedPrompt }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to generate' }));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.layers || data.layers.length === 0) {
        throw new Error('Received empty layer configuration from AI generator.');
      }

      const newConfig: CollectionConfig = {
        name: data.name,
        description: data.description,
        baseUri: data.baseUri || 'ipfs://QmCustomNewCollection/',
        width: data.width || 512,
        height: data.height || 512,
        count: data.count || 10000,
        batchSize: data.batchSize || 500,
        zipChunkSize: data.zipChunkSize || 10000,
      };

      const applyFn = onApplyGeneratedCollection || onApplyCollection;
      if (applyFn) {
        applyFn(data.layers, newConfig);
      }
      onClose();
    } catch (err: unknown) {
      console.error('AI Generation failed:', err);
      const msg = err instanceof Error && err.name === 'AbortError' ? 'Generation request took too long. Please try again.' : err instanceof Error ? err.message : 'Unknown generation error occurred';
      setError(msg);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
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
                <span>AI Collection Concept Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  FAST LOCAL GENERATOR
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Type any idea in your own words. The engine will build a 10K-ready collection concept, layered traits, and rarity structure without waiting on slow cloud calls.
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
                Fast Mode // No Cloud Timeout
              </span>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Cyberpunk samurai robots with neon katanas, cracked skull helmets, and matrix rain backgrounds..."
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
                The generator is turning your prompt into a collection blueprint, layered traits, and a generation-ready architecture.
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
                <span>Designing Collection with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate Collection Architecture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
