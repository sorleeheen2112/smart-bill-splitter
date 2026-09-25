/**
 * Image compression and resizing utility for bank transfer slips and receipts
 * Resizes large smartphone camera photos (e.g. 5-15MB) down to clean ~50-120KB images
 * Prevents LocalStorage QuotaExceededError and Supabase network payload limits
 */

export async function compressSlipImage(
  fileOrDataUrl: File | Blob | string,
  maxWidth = 1000,
  maxHeight = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If running in SSR environment, return as is or empty
    if (typeof window === 'undefined') {
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        resolve('');
      }
      return;
    }

    const img = new Image();

    const handleImageLoaded = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio downscaling
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const bestRatio = Math.min(widthRatio, heightRatio);

          width = Math.round(width * bestRatio);
          height = Math.round(height * bestRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // If canvas context unavailable, fallback to original
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Canvas compression error, falling back:', err);
        if (typeof fileOrDataUrl === 'string') {
          resolve(fileOrDataUrl);
        } else {
          // Fallback reading as plain DataURL
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.onerror = () => reject(err);
          reader.readAsDataURL(fileOrDataUrl as Blob);
        }
      }
    };

    img.onload = handleImageLoaded;
    img.onerror = (err) => {
      console.warn('Failed to load image for compression:', err);
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = (readErr) => reject(readErr);
        reader.readAsDataURL(fileOrDataUrl as Blob);
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      img.src = URL.createObjectURL(fileOrDataUrl);
    }
  });
}
