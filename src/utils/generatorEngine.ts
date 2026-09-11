import JSZip from 'jszip';
import {
  Layer,
  Trait,
  CollectionConfig,
  NFTMetadata,
  NFTAttribute,
  GeneratedNFTRecord,
  GenerationProgress,
  TraitOccurrence,
} from '../types';
import { drawTraitsToContext, canvasToBlob, createThumbnail } from './canvasRenderer';

/**
 * Calculate total mathematically possible unique combinations
 */
export function calculateTotalPossibleCombinations(layers: Layer[]): number {
  const activeLayers = layers.filter((l) => l.enabled && l.traits.length > 0);
  if (activeLayers.length === 0) return 0;

  return activeLayers.reduce((acc, layer) => {
    const traitCount = layer.traits.length;
    const layerVariants = layer.required ? traitCount : traitCount + 1; // +1 for "None"
    return acc * layerVariants;
  }, 1);
}

/**
 * Weighted random selector for traits in a layer
 */
export function selectWeightedTrait(layer: Layer): Trait | null {
  const validTraits = layer.traits;
  if (validTraits.length === 0) return null;

  const noneWeight = !layer.required ? layer.noneWeight ?? 10 : 0;
  const totalWeight = validTraits.reduce((sum, t) => sum + (t.weight || 1), 0) + noneWeight;

  let randomVal = Math.random() * totalWeight;

  // Check if "None" was rolled
  if (noneWeight > 0) {
    if (randomVal <= noneWeight) {
      return null;
    }
    randomVal -= noneWeight;
  }

  for (const trait of validTraits) {
    const w = trait.weight || 1;
    if (randomVal <= w) {
      return trait;
    }
    randomVal -= w;
  }

  return validTraits[validTraits.length - 1];
}

/**
 * Generate a deterministic DNA string for a combination of traits
 */
export function generateDNA(traits: { layer: Layer; trait: Trait | null }[]): string {
  return traits
    .map(({ layer, trait }) => `${layer.id}:${trait ? trait.id : 'none'}`)
    .join('-');
}

/**
 * Hash string (simple fast non-cryptographic 32-bit hash for DNA display)
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  // Return pseudo-SHA representation
  return `${hex}${Math.abs(hash).toString(16)}${hex.split('').reverse().join('')}`.padEnd(32, 'a').slice(0, 32);
}

export interface GeneratorController {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

/**
 * Main batch generation runner
 */
export async function runNFTGeneration(
  layers: Layer[],
  config: CollectionConfig,
  onProgress: (progress: Partial<GenerationProgress>) => void,
  onSampleCreated: (sample: GeneratedNFTRecord) => void,
  onPreviewUpdate: (traits: (Trait | null)[], dna: string) => void
): Promise<{
  allMetadata: NFTMetadata[];
  zipBlob: Blob;
  totalGenerated: number;
  traitOccurrences: TraitOccurrence[];
}> {
  const activeLayers = layers.filter((l) => l.enabled && l.traits.length > 0);
  const targetCount = config.count;

  // Offscreen canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create canvas 2D rendering context.');
  }

  // Pre-initialize JSZip
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  const metadataFolder = zip.folder('metadata');

  const existingDnaSet = new Set<string>();
  const allMetadata: NFTMetadata[] = [];
  const traitStatsMap = new Map<string, { layerName: string; traitName: string; count: number }>();

  // Initialize traitStatsMap
  for (const layer of activeLayers) {
    for (const trait of layer.traits) {
      const key = `${layer.name}:${trait.name}`;
      traitStatsMap.set(key, { layerName: layer.name, traitName: trait.name, count: 0 });
    }
    if (!layer.required) {
      const key = `${layer.name}:None`;
      traitStatsMap.set(key, { layerName: layer.name, traitName: 'None', count: 0 });
    }
  }

  const startTime = performance.now();
  let lastSpeedCalcTime = startTime;
  let lastSpeedCount = 0;
  let currentSpeed = 0;

  // Track max attempts to prevent infinite loop if combinations are exhausted
  const maxPossible = calculateTotalPossibleCombinations(layers);
  const safeTarget = Math.min(targetCount, maxPossible || targetCount);

  let generatedCount = 0;
  const CHUNK_SIZE = Math.min(25, Math.max(5, Math.floor(config.batchSize / 10)));

  while (generatedCount < safeTarget) {
    const chunkTarget = Math.min(generatedCount + CHUNK_SIZE, safeTarget);

    while (generatedCount < chunkTarget) {
      // 1. Roll traits until a unique DNA is found
      let combo: { layer: Layer; trait: Trait | null }[] = [];
      let dna = '';
      let attempts = 0;

      do {
        combo = activeLayers.map((layer) => ({
          layer,
          trait: selectWeightedTrait(layer),
        }));
        dna = generateDNA(combo);
        attempts++;
      } while (existingDnaSet.has(dna) && attempts < 150);

      // If duplicate persisted after 150 attempts, randomize with fallback
      if (existingDnaSet.has(dna)) {
        dna = `${dna}-alt-${generatedCount}`;
      }
      existingDnaSet.add(dna);

      const edition = generatedCount + 1;
      const dnaHash = hashString(dna);
      const selectedTraits = combo.map((c) => c.trait);

      // 2. Render to canvas
      drawTraitsToContext(ctx, selectedTraits, config.width, config.height);

      // 3. Update live preview periodically
      if (generatedCount % 5 === 0 || generatedCount === safeTarget - 1) {
        onPreviewUpdate(selectedTraits, dna);
      }

      // 4. Create blob and add image to JSZip
      const blob = await canvasToBlob(canvas, 'image/png');
      if (imagesFolder) {
        imagesFolder.file(`${edition}.png`, blob, { binary: true });
      }

      // 5. Build attributes & metadata
      const attributes: NFTAttribute[] = combo.map(({ layer, trait }) => {
        const val = trait ? trait.name : 'None';
        const key = `${layer.name}:${val}`;
        const stat = traitStatsMap.get(key);
        if (stat) stat.count++;
        return {
          trait_type: layer.name.replace(/^\d+\.\s*/, ''), // Strip leading number like "1. "
          value: val,
        };
      });

      const nftMetadata: NFTMetadata = {
        name: `${config.name} #${edition}`,
        description: config.description,
        image: `${config.baseUri}${edition}.png`,
        dna: dnaHash,
        edition: edition,
        date: Date.now(),
        attributes,
        compiler: '10K NFT Collection Generator (ERC-721 Standard)',
      };

      allMetadata.push(nftMetadata);

      // Add individual JSON to metadata folder
      if (metadataFolder) {
        metadataFolder.file(`${edition}.json`, JSON.stringify(nftMetadata, null, 2));
      }

      // 6. Keep sample thumbnail for gallery view (store up to 250 items to keep RAM tiny)
      if (edition <= 250 || edition % 50 === 0) {
        const thumb = createThumbnail(canvas, 120);
        onSampleCreated({
          edition,
          dna: dnaHash,
          metadata: nftMetadata,
          thumbnailUrl: thumb,
        });
      }

      generatedCount++;
    }

    // Speed & progress calculations
    const now = performance.now();
    const elapsedSinceLast = (now - lastSpeedCalcTime) / 1000;
    if (elapsedSinceLast >= 0.25) {
      const itemsSinceLast = generatedCount - lastSpeedCount;
      currentSpeed = Math.round(itemsSinceLast / elapsedSinceLast);
      lastSpeedCalcTime = now;
      lastSpeedCount = generatedCount;
    }

    const itemsLeft = safeTarget - generatedCount;
    const estimatedSecondsLeft = currentSpeed > 0 ? Math.ceil(itemsLeft / currentSpeed) : 0;
    const percentage = Math.floor((generatedCount / safeTarget) * 100);

    onProgress({
      currentCount: generatedCount,
      targetCount: safeTarget,
      percentage,
      speed: currentSpeed,
      estimatedSecondsLeft,
    });

    // Yield control to browser so UI animations and progress bar remain silky smooth
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Add root _metadata.json (OpenSea master list format)
  zip.file('_metadata.json', JSON.stringify(allMetadata, null, 2));

  // Add rarity and collection summary report in text format
  const totalStats: TraitOccurrence[] = Array.from(traitStatsMap.values()).map((stat) => {
    const pct = Number(((stat.count / safeTarget) * 100).toFixed(2));
    const rarityScore = pct > 0 ? Number((100 / pct).toFixed(2)) : 0;
    return {
      layerName: stat.layerName,
      traitName: stat.traitName,
      count: stat.count,
      percentage: pct,
      rarityScore,
    };
  });

  zip.file(
    'collection_summary.json',
    JSON.stringify(
      {
        collectionName: config.name,
        totalItems: safeTarget,
        generatedAt: new Date().toISOString(),
        traitDistribution: totalStats,
      },
      null,
      2
    )
  );

  // Begin ZIP compression/packaging
  onProgress({
    isGenerating: false,
    isZipping: true,
    zipStatusText: 'Mengompresi dan membungkus file ZIP...',
    zipProgress: 0,
  });

  // Using 'STORE' (compression: 0) or DEFLATE level 1.
  // PNG is already compressed, so compression STORE creates the ZIP up to 10x faster with 0 CPU overhead!
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'STORE',
    },
    (metadata) => {
      onProgress({
        zipProgress: Math.floor(metadata.percent),
        zipStatusText: `Menyusun arsip ZIP (${Math.floor(metadata.percent)}%)...`,
      });
    }
  );

  onProgress({
    isZipping: false,
    isComplete: true,
    percentage: 100,
    zipBlob,
    zipFileName: `${config.name.toLowerCase().replace(/\s+/g, '-')}-${safeTarget}.zip`,
    zipStatusText: 'Selesai! File ZIP siap diunduh.',
  });

  return {
    allMetadata,
    zipBlob,
    totalGenerated: safeTarget,
    traitOccurrences: totalStats,
  };
}
