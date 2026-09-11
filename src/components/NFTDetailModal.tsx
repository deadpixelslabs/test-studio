import React, { useState } from 'react';
import { X, Copy, Check, Download, Dna, FileCode, Sparkles } from 'lucide-react';
import { GeneratedNFTRecord } from '../types';

interface NFTDetailModalProps {
  nft: GeneratedNFTRecord | null;
  onClose: () => void;
}

export const NFTDetailModal: React.FC<NFTDetailModalProps> = ({ nft, onClose }) => {
  const [copiedDna, setCopiedDna] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!nft) return null;

  const jsonString = JSON.stringify(nft.metadata, null, 2);

  const handleCopyDna = () => {
    navigator.clipboard.writeText(nft.dna);
    setCopiedDna(true);
    setTimeout(() => setCopiedDna(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadThumbnail = () => {
    if (!nft.thumbnailUrl) return;
    const a = document.createElement('a');
    a.href = nft.thumbnailUrl;
    a.download = `${nft.edition}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              #{nft.edition}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {nft.metadata.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Image Preview & Download */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg">
              {nft.thumbnailUrl ? (
                <img
                  src={nft.thumbnailUrl}
                  alt={nft.metadata.name}
                  className="w-full h-full object-contain [image-rendering:pixelated]"
                />
              ) : (
                <div className="text-slate-600">No Image</div>
              )}
            </div>

            <button
              onClick={handleDownloadThumbnail}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm border border-slate-700 transition-colors"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Download Image ({nft.edition}.png)</span>
            </button>
          </div>

          {/* Right: Traits, DNA & Metadata JSON */}
          <div className="space-y-5">
            {/* DNA Hash */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Dna className="h-3.5 w-3.5 text-emerald-400" />
                <span>Unique DNA Hash</span>
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <code className="font-mono text-emerald-400 truncate max-w-[240px]">
                  {nft.dna}
                </code>
                <button
                  onClick={handleCopyDna}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Copy DNA"
                >
                  {copiedDna ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Traits & Attributes ({nft.metadata.attributes.length})</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {nft.metadata.attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-0.5"
                  >
                    <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      {attr.trait_type}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {attr.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ERC-721 Metadata JSON Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold">
                  <FileCode className="h-3.5 w-3.5 text-amber-400" />
                  <span>Metadata ERC-721 ({nft.edition}.json)</span>
                </span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                >
                  {copiedJson ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-36 overflow-y-auto">
                {jsonString}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
