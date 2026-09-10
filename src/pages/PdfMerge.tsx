import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Loader2, X, FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface PdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function PdfMerge() {
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type === 'application/pdf') {
          setPdfs((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).slice(2),
              file,
              name: file.name,
              size: file.size,
            },
          ]);
        }
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    Array.from(files).forEach((file) => {
      if (file.type === 'application/pdf') {
        setPdfs((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            file,
            name: file.name,
            size: file.size,
          },
        ]);
      }
    });
  };

  const removePdf = (id: string) => {
    setPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
  };

  const movePdf = (index: number, direction: 'up' | 'down') => {
    const newPdfs = [...pdfs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPdfs.length) return;
    [newPdfs[index], newPdfs[targetIndex]] = [newPdfs[targetIndex], newPdfs[index]];
    setPdfs(newPdfs);
  };

  const mergePdfs = async () => {
    if (pdfs.length < 2) return;
    setProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfItem of pdfs) {
        const arrayBuffer = await pdfItem.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error merging PDFs:', err);
      alert('Error merging PDFs. Some files may be encrypted or corrupted.');
    }

    setProcessing(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const reset = () => {
    setPdfs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">PDF Merge</h1>
        <p className="text-slate-500">Combine multiple PDFs into a single document</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition-all"
        >
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            Drop PDFs here or click to browse
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Add multiple PDFs • Reorder as needed
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {pdfs.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                {pdfs.length} PDF{pdfs.length > 1 ? 's' : ''} added
              </p>
              <button
                onClick={reset}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pdfs.map((pdf, index) => (
                <div
                  key={pdf.id}
                  className="flex items-center gap-3 bg-slate-50 rounded-lg p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => movePdf(index, 'up')}
                      disabled={index === 0}
                      className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => movePdf(index, 'down')}
                      disabled={index === pdfs.length - 1}
                      className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <FileText className="w-8 h-8 text-rose-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate font-medium">
                      {pdf.name}
                    </p>
                    <p className="text-xs text-slate-400">{formatSize(pdf.size)}</p>
                  </div>
                  <button
                    onClick={() => removePdf(pdf.id)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>

            {pdfs.length >= 2 && (
              <button
                onClick={mergePdfs}
                disabled={processing}
                className="w-full px-4 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Merge PDFs
                  </>
                )}
              </button>
            )}

            {pdfs.length < 2 && (
              <p className="text-center text-sm text-slate-400">
                Add at least 2 PDFs to merge
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
