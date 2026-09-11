import React from 'react';
import {
  Sparkles,
  Download,
  CheckCircle,
  AlertTriangle,
  FolderArchive,
  Clock,
  Zap,
  HardDrive,
  FileCode2,
  FileImage,
  Wand2,
} from 'lucide-react';
import { CollectionConfig, GenerationProgress } from '../types';

interface GeneratorControlsProps {
  config: CollectionConfig;
  setConfig: React.Dispatch<React.SetStateAction<CollectionConfig>>;
  totalPossibleCombinations: number;
  progress: GenerationProgress;
  onStartGeneration: () => void;
  onDownloadZip: () => void;
  onOpenAiModal?: () => void;
}

export const GeneratorControls: React.FC<GeneratorControlsProps> = ({
  config,
  setConfig,
  totalPossibleCombinations,
  progress,
  onStartGeneration,
  onDownloadZip,
  onOpenAiModal,
}) => {
  const isOverLimit = config.count > totalPossibleCombinations && totalPossibleCombinations > 0;
  const countPresets = [10, 100, 1000, 5000, 10000];

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-sm shadow-xl">
      {/* AI Concept Banner */}
      {onOpenAiModal && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Want to build your own NFT theme?</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  Prompt-Powered
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Describe any safe concept. Gemini plans the traits and rarity; Gemini Image creates the real visual assets and composable layers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAiModal}
            disabled={progress.isGenerating || progress.isZipping}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap self-start sm:self-auto"
          >
            Open AI Studio →
          </button>
        </div>
      )}

      {/* Configuration Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-400" />
          Collection Settings & ZIP Exporter
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Define supply targets (up to 10,000 distinct items), ERC-721 metadata attributes, and download the full ZIP archive.
        </p>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Collection Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            NFT Collection Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
            disabled={progress.isGenerating || progress.isZipping}
            placeholder="e.g. DOGE PUNKS, Neon Sushi Bots, Alien Garden Club"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Base URI (IPFS) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Base URI (IPFS / Web3 Gateway)
          </label>
          <input
            type="text"
            value={config.baseUri}
            onChange={(e) => setConfig((c) => ({ ...c, baseUri: e.target.value }))}
            disabled={progress.isGenerating || progress.isZipping}
            placeholder="ipfs://Qm.../"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Collection Lore / Description
          </label>
          <input
            type="text"
            value={config.description}
            onChange={(e) => setConfig((c) => ({ ...c, description: e.target.value }))}
            disabled={progress.isGenerating || progress.isZipping}
            placeholder="Short lore description for OpenSea and marketplace metadata..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Target Supply Selection */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>Target NFT Edition Count:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {config.count.toLocaleString()} Items
            </span>
          </label>

          {/* Combinations status warning / pass */}
          <div className="flex items-center gap-1.5 text-xs">
            {isOverLimit ? (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Max permutations: {totalPossibleCombinations.toLocaleString()}
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {totalPossibleCombinations.toLocaleString()} unique permutations possible
              </span>
            )}
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {countPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={progress.isGenerating || progress.isZipping}
              onClick={() => setConfig((c) => ({ ...c, count: preset }))}
              className={`py-2 px-1 text-center rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                config.count === preset
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {preset === 10000 ? (
                <div className="flex flex-col items-center">
                  <span>10,000</span>
                  <span className="text-[9px] uppercase tracking-wider font-normal">Full 10K</span>
                </div>
              ) : preset === 10 ? (
                <div className="flex flex-col items-center">
                  <span>10</span>
                  <span className="text-[9px] uppercase tracking-wider font-normal">Quick Test</span>
                </div>
              ) : (
                <span>{preset.toLocaleString()}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Monitor & Stats (During Generation / Zipping) */}
      {(progress.isGenerating || progress.isZipping || progress.isComplete) && (
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-300 flex items-center gap-2">
              {progress.isZipping ? (
                <>
                  <FolderArchive className="h-4 w-4 text-cyan-400 animate-spin" />
                  <span className="text-cyan-400">{progress.zipStatusText || 'Packaging ZIP archive...'}</span>
                </>
              ) : progress.isComplete ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">100% Generation Completed!</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span>
                    Rendering NFT: #{progress.currentCount.toLocaleString()} / #{progress.targetCount.toLocaleString()}
                  </span>
                </>
              )}
            </span>

            <span className="font-mono text-emerald-400 font-bold text-sm">
              {progress.isZipping ? `${progress.zipProgress || 0}%` : `${progress.percentage}%`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                progress.isZipping
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{
                width: `${progress.isZipping ? progress.zipProgress || 0 : progress.percentage}%`,
              }}
            />
          </div>

          {/* Speed & ETA Metrics */}
          {progress.isGenerating && (
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Speed:</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {progress.speed} NFT/sec
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 justify-end">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>ETA:</span>
                <span className="font-mono text-slate-200 font-semibold">
                  ~{progress.estimatedSecondsLeft}s
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {progress.isComplete && progress.zipBlob ? (
          <div className="space-y-2">
            <button
              id="download-zip-btn"
              type="button"
              onClick={onDownloadZip}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="h-5 w-5" />
              <span>
                Download Collection ZIP ({formatFileSize(progress.zipBlob.size)})
              </span>
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Contains {config.count.toLocaleString()} PNG images + {config.count.toLocaleString()} JSON metadata files + master _metadata.json
            </p>
          </div>
        ) : (
          <button
            id="start-generation-btn"
            type="button"
            disabled={progress.isGenerating || progress.isZipping || isOverLimit}
            onClick={onStartGeneration}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {progress.isGenerating ? (
              <>
                <Zap className="h-5 w-5 animate-spin" />
                <span>Generating {config.count.toLocaleString()} NFTs...</span>
              </>
            ) : progress.isZipping ? (
              <>
                <FolderArchive className="h-5 w-5 animate-spin" />
                <span>Archiving into ZIP file...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate {config.count.toLocaleString()} NFTs & Build ZIP</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Package Contents Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-slate-400" />
          Exported ZIP Archive Structure
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <FileImage className="h-4 w-4 text-emerald-400" />
            <span>📁 images/*.png</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <FileCode2 className="h-4 w-4 text-cyan-400" />
            <span>📁 metadata/*.json</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <FolderArchive className="h-4 w-4 text-amber-400" />
            <span>📄 _metadata.json</span>
          </div>
        </div>
      </div>
    </div>
  );
};
