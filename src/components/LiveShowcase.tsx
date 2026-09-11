import React, { useRef, useEffect } from 'react';
import { Sparkles, Dna, Shuffle, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Layer, Trait } from '../types';
import { drawTraitsToContext, canvasToBlob } from '../utils/canvasRenderer';
import { selectWeightedTrait, generateDNA, hashString } from '../utils/generatorEngine';

interface LiveShowcaseProps {
  layers: Layer[];
  activeTraits: (Trait | null)[];
  currentDna: string;
  isGenerating: boolean;
  currentCount: number;
  targetCount: number;
  onRandomize: (traits: (Trait | null)[], dna: string) => void;
}

export const LiveShowcase: React.FC<LiveShowcaseProps> = ({
  layers,
  activeTraits,
  currentDna,
  isGenerating,
  currentCount,
  targetCount,
  onRandomize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw whenever activeTraits changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawTraitsToContext(ctx, activeTraits, canvas.width, canvas.height);
  }, [activeTraits]);

  const handleManualRandomize = () => {
    const activeLayers = layers.filter((l) => l.enabled && l.traits.length > 0);
    const combo = activeLayers.map((layer) => ({
      layer,
      trait: selectWeightedTrait(layer),
    }));
    const dna = generateDNA(combo);
    onRandomize(
      combo.map((c) => c.trait),
      dna
    );
  };

  const handleDownloadSample = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas, 'image/png');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preview-nft-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayHash = currentDna ? hashString(currentDna) : '0x7f4e92a83c1b65d';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-between shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {isGenerating ? 'Live Render Engine' : 'Live Canvas Preview'}
          </span>
        </div>

        {isGenerating ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
            #{currentCount} / #{targetCount}
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-mono">512 × 512 px</span>
        )}
      </div>

      {/* Main Showcase Canvas Container */}
      <div className="relative w-full max-w-[380px] aspect-square rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center group">
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          className="w-full h-full object-contain [image-rendering:pixelated]"
        />

        {/* Scanlines / subtle holographic overlay during generation */}
        {isGenerating && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/5 to-transparent pointer-events-none animate-pulse" />
        )}

        {/* Hover action overlay when idle */}
        {!isGenerating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownloadSample}
              title="Download This Sample PNG"
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Download PNG</span>
            </button>
          </div>
        )}
      </div>

      {/* DNA & Trait Pill Attributes */}
      <div className="w-full mt-4 space-y-3 z-10">
        {/* DNA Hash */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Dna className="h-4 w-4 text-emerald-400" />
            <span className="font-mono text-[11px] text-slate-300 truncate max-w-[220px]">
              DNA: {displayHash}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Unique</span>
          </div>
        </div>

        {/* Active Traits Badges */}
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {activeTraits.map((t, idx) => {
            if (!t) return null;
            return (
              <span
                key={t.id || idx}
                className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="truncate max-w-[120px]">{t.name}</span>
              </span>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleManualRandomize}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Shuffle className="h-4 w-4 text-emerald-400" />
            <span>Randomize Combination (Shuffle)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
