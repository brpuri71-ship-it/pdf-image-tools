import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, FileType, FileText, Languages,
  PenTool, Eraser, CreditCard, Flashlight, Wand2, MonitorPlay,
  MoreVertical, X, Check, Trash2, ArrowRight, Download, Plus,
  MoveUp, MoveDown, Layers, Loader2, Share2
} from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from 'jspdf';
import Tesseract from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import SignatureCanvas from 'react-signature-canvas';
import { saveToPhone, shareFile } from '../utils/fileSaver';

interface ScannedPage {
  id: string;
  dataUrl: string;
  name: string;
  enhanced?: boolean;
}

type ScannerView = 'main' | 'review' | 'edit' | 'ocr' | 'sign' | 'erase' | 'idcard';

export default function Scanner() {
  const [view, setView] = useState<ScannerView>('main');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isBatch, setIsBatch] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [flashMode, setFlashMode] = useState(false);
  const [hdMode, setHdMode] = useState(true);

  const sigCanvas = useRef<SignatureCanvas>(null);
  const eraseCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Core Scanner Functions ---

  const takePhoto = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: hdMode ? 100 : 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        const newPage: ScannedPage = {
          id: Math.random().toString(36).slice(2),
          dataUrl: image.dataUrl,
          name: `Scan ${pages.length + 1}`,
        };
        setPages(prev => [...prev, newPage]);
        if (!isBatch) {
          setSelectedPageIndex(pages.length);
          setView('review');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const importImages = async () => {
    try {
      const images = await CapCamera.pickImages({
        quality: 90,
        limit: 0,
      });

      const newPages = images.photos.map((p, i) => ({
        id: Math.random().toString(36).slice(2),
        dataUrl: p.webPath, // pickImages returns webPath, we might need to fetch it to dataUrl
        name: `Import ${pages.length + i + 1}`,
      }));

      // Convert webPath to dataUrl for consistent local processing
      const processedPages = await Promise.all(newPages.map(async p => {
        const response = await fetch(p.dataUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise<string>(res => {
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(blob);
        });
        return { ...p, dataUrl };
      }));

      setPages(prev => [...prev, ...processedPages]);
      setView('review');
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const importFiles = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newPages = await Promise.all(Array.from(files).map(async (file, i) => {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>(res => {
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(file);
          });
          return {
            id: Math.random().toString(36).slice(2),
            dataUrl,
            name: file.name,
          };
        }));
        setPages(prev => [...prev, ...newPages]);
        setView('review');
      }
    };
    input.click();
  };

  // --- Enhancement & Editing ---

  const enhanceImage = async () => {
    const page = pages[selectedPageIndex];
    setProcessing(true);

    const img = new Image();
    img.src = page.dataUrl;
    await new Promise(res => img.onload = res);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;

    // Apply basic enhancement (contrast & sharpness)
    ctx.filter = 'contrast(1.2) brightness(1.05) saturate(1.1)';
    ctx.drawImage(img, 0, 0);

    const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const updatedPages = [...pages];
    updatedPages[selectedPageIndex] = { ...page, dataUrl: enhancedDataUrl, enhanced: true };
    setPages(updatedPages);
    setProcessing(false);
  };

  const startErase = () => setView('erase');

  const handleErase = () => {
    const canvas = eraseCanvasRef.current;
    if (canvas) {
      const updatedPages = [...pages];
      updatedPages[selectedPageIndex] = { ...updatedPages[selectedPageIndex], dataUrl: canvas.toDataURL() };
      setPages(updatedPages);
    }
    setView('review');
  };

  const startSign = () => setView('sign');

  const handleSign = () => {
    if (sigCanvas.current) {
      const sigData = sigCanvas.current.toDataURL();
      const img = new Image();
      img.src = pages[selectedPageIndex].dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const sig = new Image();
        sig.src = sigData;
        sig.onload = () => {
          // Place signature at bottom right
          const sWidth = img.width * 0.3;
          const sHeight = (sig.height / sig.width) * sWidth;
          ctx.drawImage(sig, img.width - sWidth - 50, img.height - sHeight - 50, sWidth, sHeight);

          const updatedPages = [...pages];
          updatedPages[selectedPageIndex] = { ...updatedPages[selectedPageIndex], dataUrl: canvas.toDataURL() };
          setPages(updatedPages);
          setView('review');
        };
      };
    }
  };

  // --- OCR & Export ---

  const performOCR = async () => {
    setView('ocr');
    setProcessing(true);
    try {
      const result = await Tesseract.recognize(pages[selectedPageIndex].dataUrl, 'eng', {
        logger: m => console.log(m)
      });
      setOcrText(result.data.text);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('OCR failed. Make sure you are connected for the first run to download language data.');
    }
    setProcessing(false);
  };

  const exportToWord = async () => {
    if (!ocrText) return;
    setProcessing(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(ocrText)],
            }),
          ],
        }],
      });

      const buffer = await Packer.toBlob(doc);
      await saveToPhone(buffer, 'scanned-text.docx');
    } catch (error) {
      console.error('Word Export Error:', error);
    }
    setProcessing(false);
  };

  const exportToPdf = async (action: 'save' | 'share' = 'save') => {
    setProcessing(true);
    try {
      const pdf = new jsPDF();
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const img = new Image();
        img.src = pages[i].dataUrl;
        await new Promise(res => img.onload = res);

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;

        pdf.addImage(pages[i].dataUrl, 'JPEG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
      }
      const blob = pdf.output('blob');
      if (action === 'share') {
        await shareFile(blob, 'scanned-document.pdf');
      } else {
        await saveToPhone(blob, 'scanned-document.pdf');
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
    }
    setProcessing(false);
  };

  // --- Render Helpers ---

  const renderMain = () => (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIsBatch(false); takePhoto(); }}
          className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200"
        >
          <Camera className="w-12 h-12 text-white" />
        </motion.button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Scan Document</h2>
          <p className="text-slate-500 mt-1">Capture single or multiple pages</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { setIsBatch(false); setView('main'); }}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${!isBatch ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500'}`}
        >
          <Layers className="w-6 h-6" />
          <span className="font-semibold">Single</span>
        </button>
        <button
          onClick={() => setIsBatch(true)}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isBatch ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500'}`}
        >
          <Layers className="w-6 h-6" />
          <span className="font-semibold">Batch</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={importImages} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
          <Upload className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-slate-700">Import Images</span>
        </button>
        <button onClick={importFiles} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
          <FileType className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-slate-700">Import Files</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Features</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Languages, label: 'OCR', color: 'bg-blue-50 text-blue-600', action: () => pages.length > 0 ? setView('ocr') : alert('Scan first') },
            { icon: FileText, label: 'To Word', color: 'bg-indigo-50 text-indigo-600', action: () => pages.length > 0 ? setView('ocr') : alert('Scan first') },
            { icon: PenTool, label: 'Sign', color: 'bg-pink-50 text-pink-600', action: () => pages.length > 0 ? setView('sign') : alert('Scan first') },
            { icon: CreditCard, label: 'ID Cards', color: 'bg-amber-50 text-amber-600', action: () => setView('idcard') },
            { icon: Eraser, label: 'Erase', color: 'bg-rose-50 text-rose-600', action: () => pages.length > 0 ? setView('erase') : alert('Scan first') },
            { icon: Wand2, label: 'Enhance', color: 'bg-emerald-50 text-emerald-600', action: enhanceImage },
            { icon: MonitorPlay, label: 'HD', color: hdMode ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-400', action: () => setHdMode(!hdMode) },
            { icon: Flashlight, label: 'Flash', color: flashMode ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-50 text-slate-400', action: () => setFlashMode(!flashMode) },
          ].map((f, i) => (
            <button key={i} onClick={f.action} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center`}>
                <f.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 bg-slate-100 rounded-3xl overflow-hidden relative border border-slate-200">
        <img
          src={pages[selectedPageIndex].dataUrl}
          className="w-full h-full object-contain"
          alt="Preview"
        />
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button onClick={() => {
            const newPages = pages.filter((_, i) => i !== selectedPageIndex);
            setPages(newPages);
            if (newPages.length === 0) setView('main');
            else setSelectedPageIndex(Math.max(0, selectedPageIndex - 1));
          }} className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-lg">
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {pages.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setSelectedPageIndex(i)}
            className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedPageIndex === i ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60'}`}
          >
            <img src={p.dataUrl} className="w-full h-full object-cover" />
          </button>
        ))}
        {isBatch && (
          <button
            onClick={takePhoto}
            className="flex-shrink-0 w-16 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setView('main')} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600">
          Add More
        </button>
        <div className="flex-[2] flex gap-2">
          <button
            onClick={() => exportToPdf('save')}
            disabled={processing}
            className="flex-1 p-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 text-sm"
          >
            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <><Download className="w-4 h-4" /> Save</>}
          </button>
          <button
            onClick={() => exportToPdf('share')}
            disabled={processing}
            className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-sm"
          >
            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <><Share2 className="w-4 h-4" /> Share</>}
          </button>
        </div>
      </div>
    </div>
  );

  const renderOCR = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 min-h-[300px]">
        {processing ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-slate-500 font-medium">Extracting text...</p>
          </div>
        ) : (
          <textarea
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            className="w-full h-full min-h-[250px] text-slate-700 focus:outline-none resize-none"
            placeholder="Text will appear here..."
          />
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setView('review')} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600">
          Back
        </button>
        {!processing && ocrText && (
          <>
            <button
              onClick={() => { navigator.clipboard.writeText(ocrText); alert('Copied!'); }}
              className="flex-1 p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold"
            >
              Copy
            </button>
            <button
              onClick={exportToWord}
              className="flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" /> Word
            </button>
          </>
        )}
        {!processing && !ocrText && (
          <button onClick={performOCR} className="flex-[2] p-4 bg-emerald-600 text-white rounded-2xl font-bold">
            Start OCR
          </button>
        )}
      </div>
    </div>
  );

  const renderSign = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <span className="font-bold text-slate-700">Draw Signature</span>
          <button onClick={() => sigCanvas.current?.clear()} className="text-sm text-red-500 font-bold">Clear</button>
        </div>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ className: 'w-full h-64 bg-slate-50 cursor-crosshair' }}
        />
      </div>
      <div className="flex gap-3">
        <button onClick={() => setView('review')} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600">Cancel</button>
        <button onClick={handleSign} className="flex-[2] p-4 bg-pink-600 text-white rounded-2xl font-bold">Apply Signature</button>
      </div>
    </div>
  );

  const renderErase = () => {
    // Basic eraser implementation
    return (
      <div className="space-y-4">
        <div className="bg-slate-900 rounded-3xl overflow-hidden relative min-h-[400px]">
           <canvas
             ref={eraseCanvasRef}
             className="w-full h-full max-h-[500px] object-contain cursor-crosshair"
             onMouseDown={(e) => {
               const canvas = eraseCanvasRef.current;
               if (canvas) {
                 const ctx = canvas.getContext('2d')!;
                 ctx.strokeStyle = 'white'; // Eraser is just white paint for simple cases
                 ctx.lineWidth = 20;
                 ctx.lineCap = 'round';
                 ctx.beginPath();
                 ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
               }
             }}
             onMouseMove={(e) => {
               if (e.buttons !== 1) return;
               const canvas = eraseCanvasRef.current;
               if (canvas) {
                 const ctx = canvas.getContext('2d')!;
                 ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                 ctx.stroke();
               }
             }}
             onMouseUp={() => {
                const canvas = eraseCanvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext('2d')!;
                  ctx.closePath();
                }
             }}
           />
           {/* In a real app, we'd draw the image to canvas first */}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setView('review')} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600">Cancel</button>
          <button onClick={handleErase} className="flex-[2] p-4 bg-emerald-600 text-white rounded-2xl font-bold">Save Changes</button>
        </div>
        <p className="text-xs text-center text-slate-400">Use your finger/mouse to erase areas (White brush)</p>
      </div>
    );
  };

  const renderIDCard = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800">ID Card Scanner</h2>
        <p className="text-sm text-slate-500">Scan both sides of your card</p>
      </div>

      <div className="grid gap-4">
        <div className="aspect-[1.6/1] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
           <CreditCard className="w-10 h-10 text-slate-300" />
           <span className="text-sm font-bold text-slate-400">Front Side</span>
           <button onClick={takePhoto} className="absolute inset-0 z-10 opacity-0">Capture</button>
        </div>
        <div className="aspect-[1.6/1] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
           <CreditCard className="w-10 h-10 text-slate-300" />
           <span className="text-sm font-bold text-slate-400">Back Side</span>
           <button onClick={takePhoto} className="absolute inset-0 z-10 opacity-0">Capture</button>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setView('main')} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600">Cancel</button>
        <button onClick={exportToPdf} className="flex-[2] p-4 bg-amber-600 text-white rounded-2xl font-bold">Combine & Save PDF</button>
      </div>
    </div>
  );

  useEffect(() => {
    if (view === 'erase' && eraseCanvasRef.current) {
      const canvas = eraseCanvasRef.current;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.src = pages[selectedPageIndex].dataUrl;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
    }
  }, [view]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto pb-12"
    >
      <AnimatePresence mode="wait">
        {view === 'main' && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {renderMain()}
          </motion.div>
        )}
        {view === 'review' && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {renderReview()}
          </motion.div>
        )}
        {view === 'ocr' && (
          <motion.div key="ocr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {renderOCR()}
          </motion.div>
        )}
        {view === 'sign' && (
          <motion.div key="sign" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {renderSign()}
          </motion.div>
        )}
        {view === 'erase' && (
          <motion.div key="erase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {renderErase()}
          </motion.div>
        )}
        {view === 'idcard' && (
          <motion.div key="idcard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {renderIDCard()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
