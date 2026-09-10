import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Loader2, FileText, Scissors } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function PdfSplit() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState<'all' | 'range'>('all');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      // Get page count
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
      setRangeEnd(pdf.getPageCount());
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
      setRangeEnd(pdf.getPageCount());
    }
  };

  const splitPdf = async () => {
    if (!pdfFile) return;
    setProcessing(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      if (splitMode === 'all') {
        // Split into individual pages
        for (let i = 0; i < sourcePdf.getPageCount(); i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(sourcePdf, [i]);
          newPdf.addPage(page);
          const bytes = await newPdf.save();
          const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `page-${i + 1}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          
          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } else {
        // Split by range
        const start = Math.max(0, rangeStart - 1);
        const end = Math.min(rangeEnd, sourcePdf.getPageCount());
        
        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from(
          { length: end - start },
          (_, i) => start + i
        );
        const pages = await newPdf.copyPages(sourcePdf, pageIndices);
        pages.forEach((page) => newPdf.addPage(page));
        
        const bytes = await newPdf.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        const name = pdfFile.name.replace('.pdf', '');
        link.download = `${name}-pages-${rangeStart}-to-${rangeEnd}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error splitting PDF:', err);
      alert('Error splitting PDF. The file may be encrypted or corrupted.');
    }

    setProcessing(false);
  };

  const reset = () => {
    setPdfFile(null);
    setPageCount(0);
    setRangeStart(1);
    setRangeEnd(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">PDF Split</h1>
        <p className="text-slate-500">Split PDF into individual pages or extract a range</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        {!pdfFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all"
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
              <FileText className="w-8 h-8 text-amber-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{pdfFile.name}</p>
                <p className="text-sm text-slate-400">{pageCount} pages</p>
              </div>
            </div>

            {/* Split Mode */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Split Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSplitMode('all')}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    splitMode === 'all'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  All Pages
                  <p className="text-xs mt-0.5 opacity-70">Split each page</p>
                </button>
                <button
                  onClick={() => setSplitMode('range')}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    splitMode === 'range'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  Page Range
                  <p className="text-xs mt-0.5 opacity-70">Extract pages</p>
                </button>
              </div>
            </div>

            {splitMode === 'range' && (
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">From</label>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <span className="text-slate-400 mt-5">—</span>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">To</label>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
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
                onClick={splitPdf}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Splitting...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    Split PDF
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
