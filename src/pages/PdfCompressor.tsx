import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileDown, Loader2, FileText, Share2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { saveToPhone, shareFile } from '../utils/fileSaver';

export default function PdfCompressor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setOriginalSize(file.size);
      setCompressedBlob(null);
      setCompressedSize(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setOriginalSize(file.size);
      setCompressedBlob(null);
      setCompressedSize(0);
    }
  };

  const compressPdf = async () => {
    if (!pdfFile) return;
    setProcessing(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      // Re-save the PDF which can reduce size by removing unused objects
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      const blob = new Blob([compressedBytes as unknown as BlobPart], { type: 'application/pdf' });
      setCompressedBlob(blob);
      setCompressedSize(blob.size);
    } catch (err) {
      console.error('Error compressing PDF:', err);
      alert('Error compressing PDF. The file may be encrypted or corrupted.');
    }

    setProcessing(false);
  };

  const handleSave = async () => {
    if (!compressedBlob) return;
    const name = pdfFile?.name.replace('.pdf', '') || 'compressed';
    await saveToPhone(compressedBlob, `${name}-compressed.pdf`);
  };

  const handleShare = async () => {
    if (!compressedBlob) return;
    const name = pdfFile?.name.replace('.pdf', '') || 'compressed';
    await shareFile(compressedBlob, `${name}-compressed.pdf`);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const reduction = originalSize > 0 && compressedSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0;

  const reset = () => {
    setPdfFile(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setCompressedBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">PDF Compressor</h1>
        <p className="text-slate-500">Reduce PDF file size using object streams</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        {!pdfFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all"
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
              <FileText className="w-8 h-8 text-orange-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{pdfFile.name}</p>
                <p className="text-sm text-slate-400">{formatSize(originalSize)}</p>
              </div>
            </div>

            {compressedBlob && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-medium text-orange-800">
                      Compressed: {formatSize(compressedSize)}
                    </p>
                    <p className="text-xs text-orange-600">
                      {reduction > 0 ? `${reduction}% smaller` : reduction === 0 ? 'Already optimized' : 'Size increased'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleShare}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
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
                onClick={compressPdf}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Compress PDF
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
