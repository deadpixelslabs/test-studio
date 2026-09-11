import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  Layers as LayersIcon,
  Eye,
  EyeOff,
  Sliders,
  MoveUp,
  MoveDown,
  Info,
} from 'lucide-react';
import { Layer, Trait } from '../types';
import { preloadImage } from '../utils/canvasRenderer';

interface LayerManagerProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  isGenerating: boolean;
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  setLayers,
  isGenerating,
}) => {
  const [expandedLayerId, setExpandedLayerId] = useState<string>(layers[0]?.id || '');
  const [newLayerName, setNewLayerName] = useState('');

  // Calculate percentage for each trait in a layer
  const getTraitPercentage = (layer: Layer, traitWeight: number): string => {
    const noneWeight = !layer.required ? layer.noneWeight ?? 10 : 0;
    const total = layer.traits.reduce((sum, t) => sum + (t.weight || 1), 0) + noneWeight;
    if (total === 0) return '0%';
    return `${((traitWeight / total) * 100).toFixed(1)}%`;
  };

  const handleToggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleToggleRequired = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, required: !l.required } : l))
    );
  };

  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    setLayers((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleAddLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) return;

    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `${layers.length + 1}. ${newLayerName.trim()}`,
      required: true,
      enabled: true,
      traits: [],
    };

    setLayers((prev) => [...prev, newLayer]);
    setExpandedLayerId(newLayer.id);
    setNewLayerName('');
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length <= 1) {
      alert('You must have at least 1 layer in the collection!');
      return;
    }
    if (confirm('Are you sure you want to delete this layer and all its traits?')) {
      setLayers((prev) => prev.filter((l) => l.id !== layerId));
    }
  };

  const handleUpdateTraitWeight = (layerId: string, traitId: string, weight: number) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          traits: l.traits.map((t) => (t.id === traitId ? { ...t, weight } : t)),
        };
      })
    );
  };

  const handleUpdateTraitName = (layerId: string, traitId: string, name: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          traits: l.traits.map((t) => (t.id === traitId ? { ...t, name } : t)),
        };
      })
    );
  };

  const handleDeleteTrait = (layerId: string, traitId: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          traits: l.traits.filter((t) => t.id !== traitId),
        };
      })
    );
  };

  const handleAddTrait = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const traitNumber = layer.traits.length + 1;
    // Default placeholder SVG so trait renders immediately even before custom upload
    const dummySvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="156" y="156" width="200" height="200" rx="20" fill="%2310b981" opacity="0.8"/><text x="256" y="270" text-anchor="middle" fill="white" font-size="28" font-family="sans-serif">Trait ${traitNumber}</text></svg>`;

    const newTrait: Trait = {
      id: `trait-${Date.now()}`,
      name: `New Variant #${traitNumber}`,
      weight: 20,
      imageSrc: dummySvg,
    };

    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, traits: [...l.traits, newTrait] } : l))
    );
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    layerId: string,
    traitId?: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;

        // Preload image
        preloadImage(result);

        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

        if (traitId) {
          // Replace existing trait image
          setLayers((prev) =>
            prev.map((l) => {
              if (l.id !== layerId) return l;
              return {
                ...l,
                traits: l.traits.map((t) =>
                  t.id === traitId ? { ...t, imageSrc: result, name: cleanName } : t
                ),
              };
            })
          );
        } else {
          // Add as new trait
          const newTrait: Trait = {
            id: `trait-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: cleanName,
            weight: 20,
            imageSrc: result,
          };
          setLayers((prev) =>
            prev.map((l) =>
              l.id === layerId ? { ...l, traits: [...l.traits, newTrait] } : l
            )
          );
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LayersIcon className="h-5 w-5 text-emerald-400" />
            Layer Hierarchy & Trait Rarity
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Layer order from top to bottom dictates visual stacking composition (Background sits at the bottom). You can also upload your own custom PNG/SVG files.
          </p>
        </div>

        {/* Add New Layer Form */}
        <form onSubmit={handleAddLayer} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="New layer name..."
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            disabled={isGenerating}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
          />
          <button
            type="submit"
            disabled={isGenerating || !newLayerName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Add Layer</span>
          </button>
        </form>
      </div>

      {/* Layer List */}
      <div className="space-y-4">
        {layers.map((layer, index) => {
          const isExpanded = expandedLayerId === layer.id;
          return (
            <div
              key={layer.id}
              className={`rounded-2xl border transition-all ${
                layer.enabled
                  ? isExpanded
                    ? 'border-emerald-500/50 bg-slate-900/80 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  : 'border-slate-800/60 bg-slate-950/40 opacity-60'
              }`}
            >
              {/* Layer Header */}
              <div className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3">
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-[200px]"
                  onClick={() => setExpandedLayerId(isExpanded ? '' : layer.id)}
                >
                  <button
                    type="button"
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm sm:text-base">
                        {layer.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {layer.traits.length} Traits
                      </span>
                      {!layer.required && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Optional (Can be None)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Layer Quick Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Reorder Buttons */}
                  <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      disabled={index === 0 || isGenerating}
                      onClick={() => handleMoveLayer(index, 'up')}
                      title="Move Up"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === layers.length - 1 || isGenerating}
                      onClick={() => handleMoveLayer(index, 'down')}
                      title="Move Down"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Toggle Required/Optional */}
                  <button
                    type="button"
                    onClick={() => handleToggleRequired(layer.id)}
                    disabled={isGenerating}
                    title={
                      layer.required
                        ? 'Mandatory trait (cannot be empty)'
                        : 'Optional trait (can receive None variant)'
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      layer.required
                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {layer.required ? 'Required' : 'Optional'}
                  </button>

                  {/* Enable / Disable Layer */}
                  <button
                    type="button"
                    onClick={() => handleToggleLayer(layer.id)}
                    disabled={isGenerating}
                    title={layer.enabled ? 'Disable Layer' : 'Enable Layer'}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      layer.enabled
                        ? 'bg-slate-800 border-slate-700 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {layer.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  {/* Delete Layer */}
                  <button
                    type="button"
                    onClick={() => handleDeleteLayer(layer.id)}
                    disabled={isGenerating}
                    title="Delete Layer"
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-red-900/50 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Layer Body / Traits Table */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 p-4 sm:p-6 space-y-4 bg-slate-950/40">
                  {/* Layer Traits Header & Bulk Upload */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-slate-500" />
                      Adjust weights to control the mathematical rarity probability of each trait variant.
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Upload Multiple Images */}
                      <label
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors border border-slate-700 ${
                          isGenerating ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Upload PNG/SVG</span>
                        <input
                          type="file"
                          multiple
                          accept="image/png,image/svg+xml,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, layer.id)}
                          disabled={isGenerating}
                        />
                      </label>

                      {/* Add Trait Manually */}
                      <button
                        type="button"
                        onClick={() => handleAddTrait(layer.id)}
                        disabled={isGenerating}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Variant</span>
                      </button>
                    </div>
                  </div>

                  {/* Traits List */}
                  {layer.traits.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                      <p className="text-sm text-slate-400">
                        No trait variants in this layer yet.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click "Upload PNG/SVG" or "Add Variant" to add trait artwork to this layer.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {layer.traits.map((trait) => {
                        const pct = getTraitPercentage(layer, trait.weight);
                        const isRare = parseFloat(pct) < 15;
                        const isLegendary = parseFloat(pct) < 6;

                        return (
                          <div
                            key={trait.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors group"
                          >
                            {/* Preview Thumbnail */}
                            <div className="relative h-14 w-14 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <img
                                src={trait.imageSrc}
                                alt={trait.name}
                                className="h-full w-full object-contain"
                              />
                              <label
                                title="Change Image"
                                className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white"
                              >
                                <Upload className="h-4 w-4" />
                                <input
                                  type="file"
                                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, layer.id, trait.id)}
                                  disabled={isGenerating}
                                />
                              </label>
                            </div>

                            {/* Details & Inputs */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <input
                                  type="text"
                                  value={trait.name}
                                  onChange={(e) =>
                                    handleUpdateTraitName(layer.id, trait.id, e.target.value)
                                  }
                                  disabled={isGenerating}
                                  className="text-xs font-semibold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none w-full truncate"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTrait(layer.id, trait.id)}
                                  disabled={isGenerating}
                                  title="Delete Trait"
                                  className="text-slate-600 hover:text-red-400 p-0.5 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Sliders className="h-3 w-3 text-slate-500" />
                                  <span>Weight:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={trait.weight}
                                    onChange={(e) =>
                                      handleUpdateTraitWeight(
                                        layer.id,
                                        trait.id,
                                        Math.max(1, parseInt(e.target.value) || 1)
                                      )
                                    }
                                    disabled={isGenerating}
                                    className="w-10 px-1 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono text-emerald-400"
                                  />
                                </div>

                                <span
                                  className={`px-1.5 py-0.5 rounded font-mono font-medium text-[10px] ${
                                    isLegendary
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : isRare
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {pct} {isLegendary ? '★' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
