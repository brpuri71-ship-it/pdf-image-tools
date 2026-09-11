import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Minimize2, Loader2, X, Settings2, Maximize, Share2 } from 'lucide-react';
import { saveToPhone, shareFile } from '../utils/fileSaver';

export default function ImageCompressor() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [quality, setQuality] = useState(70);
  const [processing, setProcessing] = useState(false);
  const [compressed, setCompressed] = useState<string | null>(null);

  // Advanced controls
  const [format, setFormat] = useState('image/jpeg');
  const [targetSize, setTargetSize] = useState<string>('');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [useTargetSize, setUseTargetSize] = useState(false);

  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setOriginalSize(file.size);
    setCompressed(null);
    setCompressedSize(0);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImage(dataUrl);

      const img = new Image();
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
        setAspectRatio(img.width / img.height);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (maintainAspectRatio) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (maintainAspectRatio) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const compressImage = async () => {
    if (!image) return;
    setProcessing(true);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new window.Image();
        i.onload = () => resolve(i);
        i.onerror = (e) => {
          console.error('Image load error:', e);
          reject(new Error('Failed to load image'));
        };
        i.src = image;
      });

      const canvas = document.createElement('canvas');
      const finalWidth = resize ? width : img.width;
      const finalHeight = resize ? height : img.height;
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Background for transparent images when converting to JPEG
      if (format === 'image/jpeg') {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      }

      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      let resultDataUrl = '';
      let resultSize = 0;

      if (useTargetSize && targetSize && (format === 'image/jpeg' || format === 'image/webp')) {
        const targetBytes = parseFloat(targetSize) * (targetUnit === 'KB' ? 1024 : 1024 * 1024);

        // Binary search for optimal quality
        let minQ = 0.01;
        let maxQ = 1.0;
        let bestQ = 0.7;

        for (let i = 0; i < 7; i++) { // 7 iterations for precision
          const midQ = (minQ + maxQ) / 2;
          const dataUrl = canvas.toDataURL(format, midQ);
          const size = Math.round((dataUrl.split(',')[1].length * 3) / 4);

          if (size <= targetBytes) {
            bestQ = midQ;
            minQ = midQ;
            resultDataUrl = dataUrl;
            resultSize = size;
          } else {
            maxQ = midQ;
            if (!resultDataUrl) { // Fallback to lowest quality if even that is too big
              resultDataUrl = dataUrl;
              resultSize = size;
            }
          }
        }
        setQuality(Math.round(bestQ * 100));
      } else {
        const q = format === 'image/png' ? undefined : quality / 100;
        resultDataUrl = canvas.toDataURL(format, q);
        resultSize = Math.round((resultDataUrl.split(',')[1].length * 3) / 4);
      }
      
      setCompressed(resultDataUrl);
      setCompressedSize(resultSize);
      
      if (useTargetSize && resultSize > (parseFloat(targetSize) * (targetUnit === 'KB' ? 1024 : 1024 * 1024)) * 1.1) {
        alert('Could not reach target size. Try reducing resolution.');
      }
    } catch (err) {
      console.error('Error compressing:', err);
      alert('Error compressing image: ' + (err as Error).message);
      setProcessing(false);
      return;
    }

    setProcessing(false);
  };

  const handleSave = async () => {
    if (!compressed) return;
    const response = await fetch(compressed);
    const blob = await response.blob();
    const ext = format.split('/')[1].replace('jpeg', 'jpg');
    const name = fileName.replace(/\.[^.]+$/, '');
    await saveToPhone(blob, `${name}-compressed.${ext}`);
  };

  const handleShare = async () => {
    if (!compressed) return;
    const response = await fetch(compressed);
    const blob = await response.blob();
    const ext = format.split('/')[1].replace('jpeg', 'jpg');
    const name = fileName.replace(/\.[^.]+$/, '');
    await shareFile(blob, `${name}-compressed.${ext}`);
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
    setTargetSize('');
    setUseTargetSize(false);
    setResize(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reduction = originalSize > 0 && compressedSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pb-12"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Image Compressor</h1>
        <p className="text-slate-500">Reduce image size locally on your device</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-6">
        {!image ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all"
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Click to select an image</p>
            <p className="text-sm text-slate-400 mt-2">JPG, PNG, WebP supported</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Preview & Info */}
              <div className="space-y-4">
                <div className="relative aspect-video bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={compressed || image}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase">
                    {compressed ? 'Compressed' : 'Original'}
                  </div>
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Original:</span>
                    <span className="font-bold text-slate-700">{formatSize(originalSize)}</span>
                  </div>
                  {compressedSize > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Result:</span>
                        <span className="font-bold text-green-600">{formatSize(compressedSize)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 mt-1">
                        <span className="text-slate-500">Reduction:</span>
                        <span className="font-bold text-blue-600">{reduction}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-5">
                {/* Format & Mode */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Settings2 className="w-4 h-4" /> Output Settings
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Format</label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="image/jpeg">JPG / JPEG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Mode</label>
                      <button
                        onClick={() => setUseTargetSize(!useTargetSize)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${useTargetSize ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                        {useTargetSize ? 'Target Size' : 'Manual Quality'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Target Size / Quality */}
                <AnimatePresence mode="wait">
                  {useTargetSize ? (
                    <motion.div
                      key="target"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-slate-700">Target File Size</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="e.g. 200"
                          value={targetSize}
                          onChange={(e) => setTargetSize(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <select
                          value={targetUnit}
                          onChange={(e) => setTargetUnit(e.target.value as 'KB' | 'MB')}
                          className="px-2 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                        >
                          <option value="KB">KB</option>
                          <option value="MB">MB</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-slate-400">Target size optimization works best for JPG and WebP.</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-700">Quality: {quality}%</label>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={quality}
                        disabled={format === 'image/png'}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-green-600 disabled:opacity-30"
                      />
                      {format === 'image/png' && <p className="text-[10px] text-slate-400">PNG is lossless; quality slider is disabled.</p>}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Resolution */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Maximize className="w-4 h-4" /> Change Resolution
                    </div>
                    <button
                      onClick={() => setResize(!resize)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${resize ? 'bg-green-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${resize ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>

                  {resize && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Width (px)</label>
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => handleWidthChange(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Height (px)</label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => handleHeightChange(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="ratio"
                          checked={maintainAspectRatio}
                          onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                          className="w-4 h-4 accent-green-600"
                        />
                        <label htmlFor="ratio" className="text-xs text-slate-500">Lock Aspect Ratio</label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={compressImage}
                disabled={processing}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-5 h-5" />
                    Compress Image
                  </>
                )}
              </button>
              {compressed && (
                <div className="flex flex-1 gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-5 h-5" />
                    Save
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 px-4 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
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
