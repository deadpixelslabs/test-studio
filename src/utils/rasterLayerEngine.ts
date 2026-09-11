const CANVAS_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Generated image could not be decoded by the browser.'));
    img.src = src;
  });
}

async function imageToImageData(src: string, size = CANVAS_SIZE): Promise<ImageData> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D is unavailable.');
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

function imageDataToPngDataUrl(data: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable.');
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Remove the production chroma-key background (#00FF00).
 * The prompt explicitly tells the image model not to use that exact green in the subject.
 */
export async function removeChromaKey(src: string): Promise<string> {
  const data = await imageToImageData(src);
  const px = data.data;

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const a = px[i + 3];

    const dr = r;
    const dg = g - 255;
    const db = b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    const greenDominant = g > 170 && g > r + 75 && g > b + 75;

    if (greenDominant && distance <= 75) {
      px[i + 3] = 0;
    } else if (greenDominant && distance <= 125) {
      const t = Math.max(0, Math.min(1, (distance - 75) / 50));
      px[i + 3] = Math.round(a * t);
    }
  }

  return imageDataToPngDataUrl(data);
}

/**
 * Extract only pixels changed by an image-to-image edit.
 * This turns a full edited reference into a composable overlay layer.
 */
export async function extractDifferenceLayer(baseSrc: string, editedSrc: string): Promise<string> {
  const [base, edited] = await Promise.all([
    imageToImageData(baseSrc),
    imageToImageData(editedSrc),
  ]);

  const out = new ImageData(CANVAS_SIZE, CANVAS_SIZE);
  const b = base.data;
  const e = edited.data;
  const o = out.data;

  let kept = 0;
  for (let i = 0; i < e.length; i += 4) {
    const ea = e[i + 3];
    if (ea < 8) continue;

    const ba = b[i + 3];
    const rgbDelta = Math.abs(e[i] - b[i]) + Math.abs(e[i + 1] - b[i + 1]) + Math.abs(e[i + 2] - b[i + 2]);
    const alphaDelta = Math.abs(ea - ba);

    // New pixels are always part of the layer. Existing pixels must change enough
    // to survive small image-model texture noise.
    const changed = (ba < 8 && ea >= 8) || rgbDelta >= 78 || alphaDelta >= 34;
    if (!changed) continue;

    o[i] = e[i];
    o[i + 1] = e[i + 1];
    o[i + 2] = e[i + 2];
    o[i + 3] = ea;
    kept += 1;
  }

  const coverage = kept / (CANVAS_SIZE * CANVAS_SIZE);
  if (coverage < 0.0004) {
    throw new Error('The AI edit did not create a visible trait.');
  }

  return imageDataToPngDataUrl(out);
}

export async function validateRasterImage(src: string): Promise<boolean> {
  try {
    const img = await loadImage(src);
    return img.naturalWidth > 0 && img.naturalHeight > 0;
  } catch {
    return false;
  }
}
