/**
 * Resizes an image file in the browser using HTML5 Canvas.
 * Max dimension: 600px on the longest side.
 * Output format: image/jpeg with quality 0.8.
 */
export async function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        return reject(new Error('Falha ao ler o arquivo de imagem'));
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 600;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(src); // fallback to original data url
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(jpegDataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Falha ao carregar a imagem para redimensionamento'));
      };

      img.src = src;
    };

    reader.onerror = () => {
      reject(new Error('Falha ao processar arquivo'));
    };

    reader.readAsDataURL(file);
  });
}
