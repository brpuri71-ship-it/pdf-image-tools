import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Download, Loader2, ImageIcon, Share2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { saveToPhone, shareFile } from '../utils/fileSaver';

// Set up PDF.js worker - use public path that works in production Capacitor builds
const workerPath = '/pdf.worker.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

export default function PdfToImage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setImages([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setImages([]);
    }
  };

  const convertToImages = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setImages([]);
    setProgress(0);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const convertedImages: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport,
        } as any).promise;

        convertedImages.push(canvas.toDataURL('image/png'));
        setProgress(Math.round((i / numPages) * 100));
      }

      setImages(convertedImages);
    } catch (err) {
      console.error('Error converting PDF:', err);
      alert('Error converting PDF to images');
    }

    setProcessing(false);
  };

  const downloadImage = async (dataUrl: string, index: number) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await saveToPhone(blob, `page-${index + 1}.png`);
  };

  const handleShare = async (dataUrl: string, index: number) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await shareFile(blob, `page-${index + 1}.png`);
  };

  const reset = () => {
    setPdfFile(null);
    setImages([]);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
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
              <FileText className="w-8 h-8 text-purple-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{pdfFile.name}</p>
                <p className="text-sm text-slate-400">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

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
              <div className="grid grid-cols-2 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`Page ${i + 1}`}
                      className="w-full rounded-lg border border-slate-200"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={() => downloadImage(img, i)}
                        className="w-24 px-2 py-1.5 bg-white rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={() => handleShare(img, i)}
                        className="w-24 px-2 py-1.5 bg-blue-600 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        Share
                      </button>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                      Page {i + 1}
                    </span>
                  </div>
                ))}
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
