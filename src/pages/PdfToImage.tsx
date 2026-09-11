import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Download, Loader2, ImageIcon, Share2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { saveToPhone, shareFile } from '../utils/fileSaver';

// Configure PDF.js worker - this works both in web and Capacitor Android
// The worker file is bundled with pdfjs-dist in node_modules
const setupPdfWorker = () => {
  // Try multiple approaches to set the worker
  try {
    // First, try the standard approach for bundled environments
    if (typeof window !== 'undefined') {
      // Use the CDN as fallback for Capacitor WebView
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  } catch (e) {
    console.warn('PDF worker configuration warning:', e);
  }
};

setupPdfWorker();

export default function PdfToImage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [images, setImages] = useState<Array<{ dataUrl: string; index: number }>>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setImages([]);
      setError(null);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setImages([]);
      setError(null);
      setProgress(0);
    }
  };

  const convertToImages = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setImages([]);
    setProgress(0);
    setError(null);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document
      let pdf;
      try {
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      } catch (err) {
        throw new Error(`Failed to load PDF: ${err instanceof Error ? err.message : String(err)}`);
      }

      const numPages = pdf.numPages;
      if (numPages === 0) {
        throw new Error('PDF has no pages');
      }

      const convertedImages: Array<{ dataUrl: string; index: number }> = [];

      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const scale = 2; // 2x scale for better quality
          const viewport = page.getViewport({ scale });

          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get 2D context');
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Render page to canvas
          try {
            await page.render({
              canvasContext: ctx,
              viewport,
            } as any).promise;
          } catch (renderErr) {
            throw new Error(`Failed to render page ${i}: ${renderErr instanceof Error ? renderErr.message : String(renderErr)}`);
          }

          // Convert to data URL (PNG)
          const dataUrl = canvas.toDataURL('image/png');
          if (!dataUrl || dataUrl.length === 0) {
            throw new Error(`Page ${i} rendering produced empty image`);
          }

          convertedImages.push({ dataUrl, index: i });
          setProgress(Math.round((i / numPages) * 100));
        } catch (pageErr) {
          console.error(`Error processing page ${i}:`, pageErr);
          throw pageErr;
        }
      }

      if (convertedImages.length === 0) {
        throw new Error('No pages were successfully converted');
      }

      setImages(convertedImages);
      setProgress(100);
    } catch (err) {
      console.error('Error converting PDF:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Conversion failed: ${errorMsg}`);
      alert(`Error converting PDF:\n${errorMsg}`);
    }

    setProcessing(false);
  };

  const downloadImage = async (dataUrl: string, index: number) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const fileName = pdfFile?.name.replace('.pdf', '') || 'page';
      await saveToPhone(blob, `${fileName}-page-${index}.png`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to save image');
    }
  };

  const handleShare = async (dataUrl: string, index: number) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const fileName = pdfFile?.name.replace('.pdf', '') || 'page';
      await shareFile(blob, `${fileName}-page-${index}.png`);
    } catch (err) {
      console.error('Share error:', err);
      alert('Failed to share image');
    }
  };

  const downloadAllImages = async () => {
    try {
      for (const img of images) {
        const response = await fetch(img.dataUrl);
        const blob = await response.blob();
        const fileName = pdfFile?.name.replace('.pdf', '') || 'pdf';
        await saveToPhone(blob, `${fileName}-page-${img.index}.png`);
        // Small delay between saves to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      alert('All images saved successfully!');
    } catch (err) {
      console.error('Download all error:', err);
      alert('Failed to save all images');
    }
  };

  const reset = () => {
    setPdfFile(null);
    setImages([]);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pb-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">PDF → Image</h1>
        <p className="text-slate-500">Convert each PDF page to a PNG image</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        {!pdfFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-slate-400 mt-2">PDF files only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-4">
              <FileText className="w-8 h-8 text-purple-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{pdfFile.name}</p>
                <p className="text-sm text-slate-400">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ❌ {error}
              </div>
            )}

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Converting pages...</span>
                  <span className="text-purple-600 font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    {images.length} page{images.length > 1 ? 's' : ''} converted
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {images.map((img) => (
                    <div key={img.index} className="relative group">
                      <img
                        src={img.dataUrl}
                        alt={`Page ${img.index}`}
                        className="w-full rounded-lg border border-slate-200 aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={() => downloadImage(img.dataUrl, img.index)}
                          className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1 hover:bg-slate-100"
                        >
                          <Download className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={() => handleShare(img.dataUrl, img.index)}
                          className="px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1 hover:bg-blue-700"
                        >
                          <Share2 className="w-3 h-3" />
                          Share
                        </button>
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                        Page {img.index}
                      </span>
                    </div>
                  ))}
                </div>

                {images.length > 1 && (
                  <button
                    onClick={downloadAllImages}
                    className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Save All Images
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                {images.length > 0 ? 'Start Over' : 'Choose Another'}
              </button>
              {!processing && images.length === 0 && (
                <button
                  onClick={convertToImages}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-200 transition-all flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Convert to Images
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
