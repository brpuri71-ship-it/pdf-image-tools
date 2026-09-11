import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileImage, Download, X, Loader2, Share2, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { saveToPhone, shareFile } from '../utils/fileSaver';

export default function ImageToPdf() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
        setResultBlob(null);
        setPreviewUrl(null);
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
        setResultBlob(null);
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToPdf = async () => {
    if (!image) return;
    setProcessing(true);
    setProgress(0);

    try {
      // Step 1: Load image (30%)
      setProgress(30);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error('Failed to load image: ' + String(e)));
        img.src = image;
      });

      setProgress(40);

      const imgWidth = img.width;
      const imgHeight = img.height;
      
      // Determine orientation based on image dimensions
      const isLandscape = imgWidth > imgHeight;
      const orient: 'portrait' | 'landscape' = isLandscape ? 'landscape' : 'portrait';
      
      // Step 2: Create PDF (50%)
      setProgress(50);
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
      
      // Detect format
      const format = image.includes('png') || fileName.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
      
      // Step 3: Add image to PDF (70%)
      setProgress(70);
      pdf.addImage(image, format, x, y, width, height);
      
      // Step 4: Generate output (90%)
      setProgress(90);
      const pdfOutput = pdf.output('blob');
      
      if (!pdfOutput || pdfOutput.size === 0) {
        throw new Error('PDF generation failed: empty output');
      }

      setResultBlob(pdfOutput);
      
      // Create preview URL
      const previewBlobUrl = URL.createObjectURL(pdfOutput);
      setPreviewUrl(previewBlobUrl);
      
      setProgress(100);
    } catch (err) {
      console.error('Error converting:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Error converting image to PDF:\n${errorMsg}`);
    }

    setProcessing(false);
  };

  const handleSave = async () => {
    if (!resultBlob) return;
    try {
      const name = fileName.replace(/\.[^.]+$/, '');
      await saveToPhone(resultBlob, `${name}.pdf`);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save PDF');
    }
  };

  const handleShare = async () => {
    if (!resultBlob) return;
    try {
      const name = fileName.replace(/\.[^.]+$/, '');
      await shareFile(resultBlob, `${name}.pdf`);
    } catch (err) {
      console.error('Share error:', err);
      alert('Failed to share PDF');
    }
  };

  const reset = () => {
    setImage(null);
    setFileName('');
    setResultBlob(null);
    setProgress(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pb-8"
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

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Converting...</span>
                  <span className="text-blue-600 font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {!resultBlob ? (
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
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    ✅ PDF created successfully!
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Save
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                  </div>
                  <button
                    onClick={() => { reset(); }}
                    className="w-full py-2 text-slate-500 text-sm font-medium hover:text-slate-700"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
