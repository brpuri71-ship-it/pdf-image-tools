import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Loader2, X, Share2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { saveToPhone, shareFile } from '../utils/fileSaver';

interface ImageItem {
  id: string;
  dataUrl: string;
  name: string;
}

export default function ImagesToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImages((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).slice(2),
                dataUrl: ev.target?.result as string,
                name: file.name,
              },
            ]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).slice(2),
              dataUrl: ev.target?.result as string,
              name: file.name,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    setProcessing(true);

    try {
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(new Error('Failed to load image'));
          img.src = images[i].dataUrl;
        });

        const imgWidth = img.width;
        const imgHeight = img.height;

        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 2 * margin;

        let width = maxWidth;
        let height = (imgHeight / imgWidth) * maxWidth;

        if (height > maxHeight) {
          height = maxHeight;
          width = (imgWidth / imgHeight) * maxHeight;
        }

        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        const format = images[i].dataUrl.includes('png') ? 'PNG' : 'JPEG';
        pdf.addImage(images[i].dataUrl, format, x, y, width, height);
      }

      const pdfOutput = pdf.output('blob');
      setResultBlob(pdfOutput);
    } catch (err) {
      console.error('Error converting:', err);
      alert('Error converting images to PDF');
    }

    setProcessing(false);
  };

  const reset = () => {
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Images → PDF</h1>
        <p className="text-slate-500">Convert multiple images into a single PDF</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/50 transition-all"
        >
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            Drop images here or click to browse
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Add multiple images • Drag to reorder
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {images.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                {images.length} image{images.length > 1 ? 's' : ''} added
              </p>
              <button
                onClick={reset}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className="flex items-center gap-3 bg-slate-50 rounded-lg p-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                  />
                  <span className="flex-1 text-sm text-slate-600 truncate">
                    {img.name}
                  </span>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>

            {!resultBlob ? (
              <button
                onClick={convertToPdf}
                disabled={processing}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Convert to PDF
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => saveToPhone(resultBlob, 'images-to-pdf.pdf')}
                    className="flex-1 px-4 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-5 h-5" />
                    Save
                  </button>
                  <button
                    onClick={() => shareFile(resultBlob, 'images-to-pdf.pdf')}
                    className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
                <button
                  onClick={() => { setResultBlob(null); reset(); }}
                  className="w-full py-2 text-slate-500 text-sm font-medium"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
