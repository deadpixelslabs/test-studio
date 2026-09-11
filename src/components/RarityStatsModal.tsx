import React, { useState } from 'react';
import { BarChart3, Search, Sparkles, Filter, Download } from 'lucide-react';
import { TraitOccurrence } from '../types';

interface RarityStatsProps {
  traitOccurrences: TraitOccurrence[];
  totalGenerated: number;
  onSwitchToGenerator: () => void;
}

export const RarityStats: React.FC<RarityStatsProps> = ({
  traitOccurrences,
  totalGenerated,
  onSwitchToGenerator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayer, setSelectedLayer] = useState('');

  const layersList = Array.from(new Set(traitOccurrences.map((t) => t.layerName)));

  const filteredStats = traitOccurrences.filter((stat) => {
    if (selectedLayer && stat.layerName !== selectedLayer) return false;
    if (
      searchQuery.trim() &&
      !stat.traitName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !stat.layerName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleDownloadReport = () => {
    const jsonStr = JSON.stringify(traitOccurrences, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rarity-distribution-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (traitOccurrences.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/20">
          <BarChart3 className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">
            No Collection Rarity Data Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Rarity scores and percentage distributions will be calculated automatically once you run the NFT generation process.
          </p>
        </div>
        <button
          onClick={onSwitchToGenerator}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors"
        >
          Go to Generator
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Collection Trait Rarity & Distribution
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyzed across {totalGenerated.toLocaleString()} generated NFTs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Filter */}
          <div className="relative flex-1 sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              <option value="">All Layers</option>
              {layersList.map((layer) => (
                <option key={layer} value={layer}>
                  {layer}
                </option>
              ))}
            </select>
          </div>

          {/* Search Trait */}
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search traits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Download JSON Report */}
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Rarity Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3.5 pl-5">Layer</th>
                <th className="p-3.5">Trait Name</th>
                <th className="p-3.5">Occurrences</th>
                <th className="p-3.5">Frequency & Distribution</th>
                <th className="p-3.5 pr-5 text-right">Rarity Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredStats.map((stat, idx) => {
                const isLegendary = stat.percentage <= 6;
                const isRare = stat.percentage > 6 && stat.percentage <= 18;

                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 pl-5 font-medium text-white">{stat.layerName}</td>
                    <td className="p-3.5 font-semibold text-emerald-300">{stat.traitName}</td>
                    <td className="p-3.5 font-mono">
                      {stat.count.toLocaleString()} <span className="text-slate-500">NFT</span>
                    </td>
                    <td className="p-3.5 min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-semibold text-white">{stat.percentage}%</span>
                          <span className="text-slate-500">Score: {stat.rarityScore}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isLegendary
                                ? 'bg-amber-400'
                                : isRare
                                ? 'bg-purple-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(2, stat.percentage))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      {isLegendary ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[10px]">
                          <Sparkles className="h-3 w-3" />
                          Legendary
                        </span>
                      ) : isRare ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold text-[10px]">
                          Rare
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                          Common
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
