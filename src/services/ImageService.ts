export interface ImageDimensions {
  width: number;
  height: number;
}

export class ImageService {
  /**
   * Compress an image with quality control and optional target size
   */
  static async compressImage(
    file: File | Blob,
    quality: number = 0.8,
    targetSizeKB?: number,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg'
  ): Promise<{ blob: Blob; actualSize: number }> {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the image on canvas
            ctx.drawImage(img, 0, 0);

            let compressedBlob: Blob | null = null;
            let currentQuality = quality;
            const mimeType = `image/${format}`;

            // If target size is specified, iteratively adjust quality
            if (targetSizeKB !== undefined && targetSizeKB > 0) {
              const targetBytes = targetSizeKB * 1024;
              let attempts = 0;
              const maxAttempts = 15;
              const minQuality = 0.05;

              while (attempts < maxAttempts) {
                compressedBlob = await new Promise<Blob>((res) => {
                  canvas.toBlob(
                    (blob) => res(blob || new Blob()),
                    mimeType,
                    currentQuality
                  );
                });

                // Check if we've reached the target or hit minimum quality
                if (compressedBlob.size <= targetBytes || currentQuality <= minQuality) {
                  break;
                }

                // Reduce quality for next attempt
                currentQuality = Math.max(minQuality, currentQuality - 0.1);
                attempts++;
              }
            } else {
              // Just compress with the given quality
              compressedBlob = await new Promise<Blob>((res) => {
                canvas.toBlob(
                  (blob) => res(blob || new Blob()),
                  mimeType,
                  currentQuality
                );
              });
            }

            if (compressedBlob) {
              resolve({
                blob: compressedBlob,
                actualSize: compressedBlob.size
              });
            } else {
              reject(new Error('Failed to compress image'));
            }

            // Clean up
            URL.revokeObjectURL(url);
            canvas.remove();
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };

        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };

        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Resize an image to specific dimensions
   */
  static async resizeImage(
    file: File | Blob,
    width: number,
    height: number,
    maintainAspectRatio: boolean = true
  ): Promise<{ blob: Blob; actualWidth: number; actualHeight: number }> {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            let newWidth = width;
            let newHeight = height;

            // Calculate dimensions based on aspect ratio
            if (maintainAspectRatio) {
              const aspectRatio = img.width / img.height;
              const targetRatio = width / height;

              if (targetRatio > aspectRatio) {
                // Width is relatively larger, adjust based on height
                newWidth = height * aspectRatio;
                newHeight = height;
              } else {
                // Height is relatively larger, adjust based on width
                newWidth = width;
                newHeight = width / aspectRatio;
              }
            }

            canvas.width = newWidth;
            canvas.height = newHeight;

            // Use high-quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw resized image
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({
                    blob: blob,
                    actualWidth: Math.round(newWidth),
                    actualHeight: Math.round(newHeight)
                  });
                } else {
                  reject(new Error('Failed to resize image'));
                }
                // Clean up
                URL.revokeObjectURL(url);
                canvas.remove();
              },
              'image/jpeg',
              0.85
            );
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };

        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };

        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get image dimensions from a file
   */
  static async getImageDimensions(file: File | Blob): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
        URL.revokeObjectURL(url);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    });
  }

  /**
   * Apply basic image enhancement (contrast, brightness, saturation)
   */
  static async enhanceImage(
    file: File | Blob,
    options: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
    } = {}
  ): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            canvas.width = img.width;
            canvas.height = img.height;

            // Apply CSS filters
            const brightness = options.brightness ?? 100;
            const contrast = options.contrast ?? 100;
            const saturation = options.saturation ?? 100;

            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
            ctx.drawImage(img, 0, 0);

            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to enhance image'));
                }
                URL.revokeObjectURL(url);
                canvas.remove();
              },
              'image/jpeg',
              0.9
            );
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };

        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };

        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }
}
