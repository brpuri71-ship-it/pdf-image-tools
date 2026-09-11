import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Maximize, Loader2, X } from 'lucide-react';
import { saveFileFromDataUrl } from '../utils/fileSaver';

export default function ImageResizer() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [newSize, setNewSize] = useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState(1);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setImage(dataUrl);
        const img = new window.Image();
        img.onload = () => {
          setOriginalSize({ width: img.width, height: img.height });
          setNewSize({ width: img.width, height: img.height });
          setAspectRatio(img.width / img.height);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWidthChange = (width: number) => {
    if (maintainAspectRatio) {
      setNewSize({ width, height: Math.round(width / aspectRatio) });
    } else {
      setNewSize((prev) => ({ ...prev, width }));
    }
  };

  const handleHeightChange = (height: number) => {
    if (maintainAspectRatio) {
      setNewSize({ width: Math.round(height * aspectRatio), height });
    } else {
      setNewSize((prev) => ({ ...prev, height }));
    }
  };

  const resizeImage = async () => {
    if (!image) return;
    setProcessing(true);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = image;
      });

      const canvas = document.createElement('canvas');
      canvas.width = newSize.width;
      canvas.height = newSize.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, newSize.width, newSize.height);

      const resizedDataUrl = canvas.toDataURL('image/png');
      const name = fileName.replace(/\.[^.]+$/, '');
      await saveFileFromDataUrl(resizedDataUrl, `${name}-resized.png`);
    } catch (err) {
      console.error('Error resizing:', err);
      alert('Error resizing image');
    }

    setProcessing(false);
  };

  const reset = () => {
    setImage(null);
    setFileName('');
    setNewSize({ width: 0, height: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Image Resizer</h1>
        <p className="text-slate-500">Change image dimensions easily</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Click to pick an image</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Width (px)</label>
                <input
                  type="number"
                  value={newSize.width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Height (px)</label>
                <input
                  type="number"
                  value={newSize.height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aspectRatio"
                checked={maintainAspectRatio}
                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="aspectRatio" className="text-sm text-slate-600">
                Maintain Aspect Ratio
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Choose Another
              </button>
              <button
                onClick={resizeImage}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Maximize className="w-4 h-4" />
                    Resize & Save
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
