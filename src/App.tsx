import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layer,
  Trait,
  CollectionConfig,
  GeneratedNFTRecord,
  GenerationProgress,
  TraitOccurrence,
} from './types';
import { DEAD_PIXELS_LAYERS, INITIAL_COLLECTION_CONFIG } from './data/presetCollections';
import { preloadAllTraits } from './utils/canvasRenderer';
import {
  calculateTotalPossibleCombinations,
  selectWeightedTrait,
  generateDNA,
  runNFTGeneration,
} from './utils/generatorEngine';
import { Navbar } from './components/Navbar';
import { LayerManager } from './components/LayerManager';
import { LiveShowcase } from './components/LiveShowcase';
import { GeneratorControls } from './components/GeneratorControls';
import { GalleryView } from './components/GalleryView';
import { RarityStats } from './components/RarityStatsModal';
import { NFTDetailModal } from './components/NFTDetailModal';
import { AIPromptModal } from './components/AIPromptModal';

export default function App() {
  const [layers, setLayers] = useState<Layer[]>(DEAD_PIXELS_LAYERS);
  const [config, setConfig] = useState<CollectionConfig>(INITIAL_COLLECTION_CONFIG);
  const [activeTab, setActiveTab] = useState<'generator' | 'layers' | 'gallery' | 'rarity'>('generator');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Preview & Live Canvas state
  const [activeTraits, setActiveTraits] = useState<(Trait | null)[]>([]);
  const [currentDna, setCurrentDna] = useState<string>('');

  // Generation status
  const [progress, setProgress] = useState<GenerationProgress>({
    isGenerating: false,
    isPaused: false,
    isZipping: false,
    isComplete: false,
    currentCount: 0,
    targetCount: 10000,
    percentage: 0,
    speed: 0,
    estimatedSecondsLeft: 0,
    currentDna: '',
    zipProgress: 0,
  });

  // Generated results
  const [samples, setSamples] = useState<GeneratedNFTRecord[]>([]);
  const [traitOccurrences, setTraitOccurrences] = useState<TraitOccurrence[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<GeneratedNFTRecord | null>(null);

  // Total possible permutations calculated mathematically
  const totalCombinations = useMemo(() => {
    return calculateTotalPossibleCombinations(layers);
  }, [layers]);

  // Initial trait roll and preload
  useEffect(() => {
    const allTraits = layers.flatMap((l) => l.traits);
    preloadAllTraits(allTraits).then(() => {
      // Pick initial random sample
      const activeLayers = layers.filter((l) => l.enabled && l.traits.length > 0);
      const combo = activeLayers.map((layer) => ({
        layer,
        trait: selectWeightedTrait(layer),
      }));
      setActiveTraits(combo.map((c) => c.trait));
      setCurrentDna(generateDNA(combo));
    });
  }, [layers]);

  // Handler to start generating 10,000 (or configured count) NFTs and building ZIP
  const handleStartGeneration = async () => {
    try {
      // 1. Reset progress & samples
      setSamples([]);
      setProgress({
        isGenerating: true,
        isPaused: false,
        isZipping: false,
        isComplete: false,
        currentCount: 0,
        targetCount: config.count,
        percentage: 0,
        speed: 0,
        estimatedSecondsLeft: 0,
        currentDna: '',
        zipProgress: 0,
      });

      // 2. Ensure all layer traits are preloaded
      const allTraits = layers.flatMap((l) => l.traits);
      await preloadAllTraits(allTraits);

      // 3. Execute generator engine
      const result = await runNFTGeneration(
        layers,
        config,
        (progressUpdate) => {
          setProgress((prev) => ({ ...prev, ...progressUpdate }));
        },
        (sampleRecord) => {
          setSamples((prev) => [...prev, sampleRecord]);
        },
        (traits, dna) => {
          setActiveTraits(traits);
          setCurrentDna(dna);
        }
      );

      setTraitOccurrences(result.traitOccurrences);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error during generation:', err);
      setProgress((prev) => ({
        ...prev,
        isGenerating: false,
        isZipping: false,
        error: msg,
      }));
      alert(`Error during generation process: ${msg}`);
    }
  };

  // Handler to download the finished ZIP
  const handleDownloadZip = useCallback(() => {
    if (!progress.zipBlob) return;

    const url = URL.createObjectURL(progress.zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = progress.zipFileName || `${config.name.toLowerCase().replace(/\s+/g, '-')}-10000.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up memory
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }, [progress.zipBlob, progress.zipFileName, config.name]);

  const handleResetToPreset = () => {
    if (confirm('Reset all layers and settings back to the default studio preset?')) {
      setLayers(DEAD_PIXELS_LAYERS);
      setConfig(INITIAL_COLLECTION_CONFIG);
      setSamples([]);
      setTraitOccurrences([]);
      setProgress({
        isGenerating: false,
        isPaused: false,
        isZipping: false,
        isComplete: false,
        currentCount: 0,
        targetCount: 10000,
        percentage: 0,
        speed: 0,
        estimatedSecondsLeft: 0,
        currentDna: '',
        zipProgress: 0,
      });
    }
  };

  // Handler to apply AI Prompt Studio generated collection
  const handleApplyAiCollection = (generatedLayers: Layer[], generatedConfig: CollectionConfig) => {
    setLayers(generatedLayers);
    setConfig(generatedConfig);
    setSamples([]);
    setTraitOccurrences([]);
    setProgress({
      isGenerating: false,
      isPaused: false,
      isZipping: false,
      isComplete: false,
      currentCount: 0,
      targetCount: generatedConfig.count,
      percentage: 0,
      speed: 0,
      estimatedSecondsLeft: 0,
      currentDna: '',
      zipProgress: 0,
    });
    // Switch to generator tab so user can preview and run
    setActiveTab('generator');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCombinations={totalCombinations}
        sampleCount={samples.length}
        isGenerating={progress.isGenerating || progress.isZipping}
        onResetToPreset={handleResetToPreset}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: Generator Dashboard (Main Split View) */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live Render Showcase & Interactive Preview */}
            <div className="lg:col-span-5 space-y-6">
              <LiveShowcase
                layers={layers}
                activeTraits={activeTraits}
                currentDna={currentDna}
                isGenerating={progress.isGenerating}
                currentCount={progress.currentCount}
                targetCount={progress.targetCount}
                onRandomize={(traits, dna) => {
                  setActiveTraits(traits);
                  setCurrentDna(dna);
                }}
              />
            </div>

            {/* Right Column: Configuration, Presets, Progress & ZIP Export */}
            <div className="lg:col-span-7 space-y-6">
              <GeneratorControls
                config={config}
                setConfig={setConfig}
                totalPossibleCombinations={totalCombinations}
                progress={progress}
                onStartGeneration={handleStartGeneration}
                onDownloadZip={handleDownloadZip}
                onOpenAiModal={() => setIsAiModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Layer & Trait Management */}
        {activeTab === 'layers' && (
          <LayerManager
            layers={layers}
            setLayers={setLayers}
            isGenerating={progress.isGenerating || progress.isZipping}
          />
        )}

        {/* Tab 3: Collection Gallery Preview */}
        {activeTab === 'gallery' && (
          <GalleryView
            samples={samples}
            totalGenerated={progress.currentCount}
            onSelectNFT={(nft) => setSelectedNFT(nft)}
            onSwitchToGenerator={() => setActiveTab('generator')}
          />
        )}

        {/* Tab 4: Rarity & Trait Distribution */}
        {activeTab === 'rarity' && (
          <RarityStats
            traitOccurrences={traitOccurrences}
            totalGenerated={progress.currentCount}
            onSwitchToGenerator={() => setActiveTab('generator')}
          />
        )}
      </main>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          nft={selectedNFT}
          onClose={() => setSelectedNFT(null)}
        />
      )}

      {/* AI Prompt Studio Modal */}
      <AIPromptModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedCollection={handleApplyAiCollection}
        onApplyCollection={handleApplyAiCollection}
        currentLayerCount={layers.length}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          GLITCH NFT STUDIO — prompt-driven generative NFT engine with Gemini planning, Gemini Image artwork, composable raster layers, ERC-721 metadata, rarity controls, and ZIP export.
        </p>
      </footer>
    </div>
  );
}
