import React, { useState } from 'react';
import { Search, Eye, Sparkles, Filter, FileCode } from 'lucide-react';
import { GeneratedNFTRecord } from '../types';

interface GalleryViewProps {
  samples: GeneratedNFTRecord[];
  totalGenerated: number;
  onSelectNFT: (nft: GeneratedNFTRecord) => void;
  onSwitchToGenerator: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  samples,
  totalGenerated,
  onSelectNFT,
  onSwitchToGenerator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTraitFilter, setSelectedTraitFilter] = useState('');

  // Extract all unique trait values for filtering
  const allTraitValues = Array.from(
    new Set(
      samples.flatMap((s) => s.metadata.attributes.map((a) => `${a.trait_type}: ${a.value}`))
    )
  ).sort();

  const filteredSamples = samples.filter((sample) => {
    // Filter by edition search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace('#', '');
      const matchesEdition = sample.edition.toString().includes(q);
      const matchesName = sample.metadata.name.toLowerCase().includes(q);
      if (!matchesEdition && !matchesName) return false;
    }

    // Filter by selected trait
    if (selectedTraitFilter) {
      const [type, val] = selectedTraitFilter.split(': ');
      const hasTrait = sample.metadata.attributes.some(
        (a) => a.trait_type === type && a.value === val
      );
      if (!hasTrait) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Collection Gallery Preview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Displaying {samples.length} sampled previews from {totalGenerated.toLocaleString()} generated NFTs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search by Edition */}
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search #Edition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Trait Filter */}
          {allTraitValues.length > 0 && (
            <div className="relative flex-1 sm:w-52">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <select
                value={selectedTraitFilter}
                onChange={(e) => setSelectedTraitFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
              >
                <option value="">All Traits ({allTraitValues.length})</option>
                {allTraitValues.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid of NFTs */}
      {samples.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">
              No NFTs Generated Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Go to the Generator tab to synthesize up to 10,000 unique NFT permutations and package them into a ZIP archive.
            </p>
          </div>
          <button
            onClick={onSwitchToGenerator}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors"
          >
            Go to Generator
          </button>
        </div>
      ) : filteredSamples.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No NFTs matched your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredSamples.map((item) => (
            <div
              key={item.edition}
              onClick={() => onSelectNFT(item)}
              className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-2.5 space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.metadata.name}
                    className="w-full h-full object-cover [image-rendering:pixelated]"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-slate-600 text-xs">#{item.edition}</div>
                )}

                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1.5">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  <span>Inspect</span>
                </div>

                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-mono text-emerald-400 font-semibold border border-slate-800">
                  #{item.edition}
                </span>
              </div>

              {/* Trait Tags preview */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-white truncate">
                  {item.metadata.name}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                  <FileCode className="h-3 w-3 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{item.metadata.attributes.length} Traits</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
