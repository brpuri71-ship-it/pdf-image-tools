import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileImage, Download, X, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function ImageToPdf() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToPdf = async () => {
    if (!image) return;
    setProcessing(true);

    try {
      const img = new window.Image();
      img.src = image;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = img.width;
      const imgHeight = img.height;
      
      // Determine orientation based on image dimensions
      const orient = imgWidth > imgHeight ? 'landscape' : 'portrait';
      
      const pdf = new jsPDF(orient, 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
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
      
      pdf.addImage(image, 'JPEG', x, y, width, height);
      pdf.save('converted.pdf');
    } catch (err) {
      console.error('Error converting:', err);
      alert('Error converting image to PDF');
    }

    setProcessing(false);
  };

  const reset = () => {
    setImage(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Image → PDF</h1>
        <p className="text-slate-500">Convert a single image to a PDF document</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        {!image ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">
              Drop your image here or click to browse
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Supports JPG, PNG, WebP
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={image}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg border border-slate-200"
              />
              <button
                onClick={reset}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              <FileImage className="w-4 h-4" />
              <span className="truncate">{fileName}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Choose Another
              </button>
              <button
                onClick={convertToPdf}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
