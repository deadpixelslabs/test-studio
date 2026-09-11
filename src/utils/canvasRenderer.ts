import { Trait } from '../types';

// Global cache for preloaded image elements
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Preload an image from URL or Data URL and cache it
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => {
      console.warn(`Failed to preload image: ${src.substring(0, 60)}...`, err);
      // Fallback: resolve with img anyway so generator does not halt
      resolve(img);
    };
    img.src = src;
  });
}

/**
 * Preload all traits across all active layers
 */
export async function preloadAllTraits(traits: Trait[]): Promise<void> {
  const promises = traits.map((t) => preloadImage(t.imageSrc));
  await Promise.all(promises);
}

/**
 * Render selected traits sequentially onto a 2D canvas context
 */
export function drawTraitsToContext(
  ctx: CanvasRenderingContext2D,
  traits: (Trait | null)[],
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
  // Ensure razor-sharp pixel art rendering without blur
  ctx.imageSmoothingEnabled = false;

  for (const trait of traits) {
    if (!trait) continue;
    const img = imageCache.get(trait.imageSrc);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, width, height);
    }
  }
}

/**
 * Convert canvas to Blob safely
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Create a lightweight downscaled thumbnail data URL for gallery preview
 * (e.g. 128x128) to keep memory footprint super small when generating 10,000 items
 */
export function createThumbnail(
  sourceCanvas: HTMLCanvasElement,
  thumbSize = 120
): string {
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbSize;
  thumbCanvas.height = thumbSize;
  const tCtx = thumbCanvas.getContext('2d');
  if (tCtx) {
    tCtx.imageSmoothingEnabled = true;
    tCtx.imageSmoothingQuality = 'medium';
    tCtx.drawImage(sourceCanvas, 0, 0, thumbSize, thumbSize);
    return thumbCanvas.toDataURL('image/webp', 0.7);
  }
  return '';
}
