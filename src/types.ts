export interface Trait {
  id: string;
  name: string;
  weight: number; // 1 - 100 for rarity weighting
  // Can be a data URL (custom uploaded PNG/SVG) or a built-in vector identifier / SVG string
  imageSrc: string; 
  svgData?: string; // Optional raw SVG string or vector generator key
}

export interface Layer {
  id: string;
  name: string;
  required: boolean; // if false, "None" can be rolled
  noneWeight?: number; // weight of having no trait for this layer
  traits: Trait[];
  enabled: boolean;
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
  rarityScore?: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  dna: string;
  edition: number;
  date: number;
  attributes: NFTAttribute[];
  compiler?: string;
}

export interface GeneratedNFTRecord {
  edition: number;
  dna: string;
  metadata: NFTMetadata;
  // For preview gallery (we store sample thumbnails or data URLs for first N items to avoid memory pressure)
  thumbnailUrl?: string; 
}

export interface CollectionConfig {
  name: string;
  description: string;
  baseUri: string; // e.g. "ipfs://NewTokenURI/"
  width: number; // e.g. 512
  height: number; // e.g. 512
  count: number; // e.g. 10000
  batchSize: number; // e.g. 500 for chunked processing
  zipChunkSize: number; // e.g. 10000 (all in one) or 2500 for multi-part
}

export interface GenerationProgress {
  isGenerating: boolean;
  isPaused: boolean;
  isZipping: boolean;
  isComplete: boolean;
  currentCount: number;
  targetCount: number;
  percentage: number;
  speed: number; // items/sec
  estimatedSecondsLeft: number;
  currentDna: string;
  zipProgress?: number; // 0 - 100
  zipStatusText?: string;
  zipBlob?: Blob;
  zipFileName?: string;
  error?: string;
}

export interface TraitOccurrence {
  layerName: string;
  traitName: string;
  count: number;
  percentage: number;
  rarityScore: number;
}
