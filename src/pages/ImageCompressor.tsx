import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Minimize2, Loader2, X } from 'lucide-react';

export default function ImageCompressor() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [quality, setQuality] = useState(70);
  const [processing, setProcessing] = useState(false);
  const [compressed, setCompressed] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      setOriginalSize(file.size);
      setCompressed(null);
      setCompressedSize(0);
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
      setOriginalSize(file.size);
      setCompressed(null);
      setCompressedSize(0);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = async () => {
    if (!image) return;
    setProcessing(true);

    try {
      const img = new window.Image();
      img.src = image;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const qualityValue = quality / 100;
      const compressedDataUrl = canvas.toDataURL('image/jpeg', qualityValue);
      
      // Calculate compressed size
      const base64Length = compressedDataUrl.split(',')[1].length;
      const sizeInBytes = (base64Length * 3) / 4;
      
      setCompressed(compressedDataUrl);
      setCompressedSize(sizeInBytes);
    } catch (err) {
      console.error('Error compressing:', err);
      alert('Error compressing image');
    }

    setProcessing(false);
  };

  const downloadCompressed = () => {
    if (!compressed) return;
    const link = document.createElement('a');
    link.href = compressed;
    const name = fileName.replace(/\.[^.]+$/, '');
    link.download = `${name}-compressed.jpg`;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const reset = () => {
    setImage(null);
    setFileName('');
    setOriginalSize(0);
    setCompressedSize(0);
    setCompressed(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reduction = originalSize > 0 && compressedSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Image Compressor</h1>
        <p className="text-slate-500">Reduce image file size without losing quality</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        {!image ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all"
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
                className="max-h-48 mx-auto rounded-lg border border-slate-200"
              />
              <button
                onClick={reset}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              <Minimize2 className="w-4 h-4" />
              <span className="truncate">{fileName}</span>
              <span className="ml-auto font-medium">{formatSize(originalSize)}</span>
            </div>

            {/* Quality Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                  Quality: {quality}%
                </label>
                <span className="text-xs text-slate-400">
                  {quality < 30 ? 'Low size' : quality < 70 ? 'Balanced' : 'High quality'}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            {compressed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Compressed: {formatSize(compressedSize)}
                    </p>
                    <p className="text-xs text-green-600">
                      {reduction > 0 ? `${reduction}% smaller` : 'No reduction'}
                    </p>
                  </div>
                  <button
                    onClick={downloadCompressed}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Choose Another
              </button>
              <button
                onClick={compressImage}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    Compress
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
