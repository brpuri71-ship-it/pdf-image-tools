import jsPDF from 'jspdf';

export interface ImageData {
  src: string;
  file?: File | Blob;
}

export class PdfService {
  /**
   * Convert images to PDF
   */
  static async convertImagesToPdf(images: ImageData[]): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);

        for (let i = 0; i < images.length; i++) {
          const imgData = images[i];
          
          // Load the image
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          let imageUrl = imgData.src;
          
          // Handle different URL types
          if (!imgData.src.startsWith('data:') && !imgData.src.startsWith('blob:')) {
            // It's a file:// or http:// URL, need to fetch it
            try {
              const response = await fetch(imgData.src);
              const blob = await response.blob();
              imageUrl = URL.createObjectURL(blob);
              img.src = imageUrl;
            } catch (fetchError) {
              console.error('Error fetching image:', fetchError);
              continue; // Skip this image and continue with others
            }
          } else {
            img.src = imgData.src;
          }

          // Wait for image to load
          await new Promise<void>((imgResolve) => {
            img.onload = () => {
              // Calculate dimensions maintaining aspect ratio
              let imgWidth = img.width;
              let imgHeight = img.height;
              
              // Convert pixels to mm (assuming 96 DPI screen)
              const pxToMm = 25.4 / 96;
              imgWidth = imgWidth * pxToMm;
              imgHeight = imgHeight * pxToMm;
              
              // Scale down if too large for page
              if (imgWidth > maxWidth || imgHeight > maxHeight) {
                const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                imgWidth *= ratio;
                imgHeight *= ratio;
              }
              
              // Add new page for all images after the first
              if (i > 0) {
                doc.addPage();
              }
              
              // Center the image on the page
              const x = (pageWidth - imgWidth) / 2;
              const y = (pageHeight - imgHeight) / 2;
              
              // Add image to PDF
              const format = imgData.src.includes('png') ? 'PNG' : 'JPEG';
              doc.addImage(img, format, x, y, imgWidth, imgHeight);
              
              imgResolve();
            };
            
            img.onerror = () => {
              console.error('Error loading image:', imgData.src);
              imgResolve(); // Continue with next image
            };
          });
          
          // Clean up object URL if we created one
          if (imageUrl !== imgData.src && imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl);
          }
        }

        // Return PDF as blob
        const pdfBlob = doc.output('blob');
        resolve(pdfBlob);
      } catch (error) {
        console.error('Error creating PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Convert PDF to images using PDF.js
   */
  static async convertPdfToImages(pdfFile: File | Blob, scale: number = 2): Promise<Blob[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Dynamically import PDF.js to avoid bundling issues
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set up worker - use CDN for production
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Read the PDF file as array buffer
        const arrayBuffer = await pdfFile.arrayBuffer();
        
        // Load the PDF document
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const images: Blob[] = [];
        
        // Process each page
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          
          // Get viewport for rendering
          const viewport = page.getViewport({ scale });
          
          // Create canvas for rendering
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Could not get canvas context');
          }
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Render the page
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          await page.render(renderContext).promise;
          
          // Convert canvas to blob
          const pageBlob = await new Promise<Blob>((res) => {
            canvas.toBlob((blob) => {
              if (blob) res(blob);
              else reject(new Error('Could not convert canvas to blob'));
            }, 'image/png');
          });
          
          images.push(pageBlob);
          
          // Clean up
          canvas.remove();
        }
        
        resolve(images);
      } catch (error) {
        console.error('Error converting PDF to images:', error);
        reject(error);
      }
    });
  }
}
