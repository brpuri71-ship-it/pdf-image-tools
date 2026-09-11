import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, RefreshCw, Loader2, X } from 'lucide-react';
import { saveFileFromDataUrl } from '../utils/fileSaver';

export default function ImageConverter() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState('image/png');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formats = [
    { label: 'PNG', value: 'image/png' },
    { label: 'JPG', value: 'image/jpeg' },
    { label: 'WebP', value: 'image/webp' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImage = async () => {
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
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const convertedDataUrl = canvas.toDataURL(format);
      const ext = format.split('/')[1].replace('jpeg', 'jpg');
      const name = fileName.replace(/\.[^.]+$/, '');
      await saveFileFromDataUrl(convertedDataUrl, `${name}.${ext}`);
    } catch (err) {
      console.error('Error converting:', err);
      alert('Error converting image');
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
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Image Converter</h1>
        <p className="text-slate-500">Convert images between PNG, JPG, and WebP</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
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

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Target Format</label>
              <div className="grid grid-cols-3 gap-3">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      format === f.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Choose Another
              </button>
              <button
                onClick={convertImage}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Convert & Save
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
