import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import Layout from './components/Layout';
import Home from './pages/Home';
import ImageToPdf from './pages/ImageToPdf';
import PdfToImage from './pages/PdfToImage';
import ImageCompressor from './pages/ImageCompressor';
import PdfCompressor from './pages/PdfCompressor';
import ImagesToPdf from './pages/ImagesToPdf';
import PdfMerge from './pages/PdfMerge';
import PdfSplit from './pages/PdfSplit';
import ImageResizer from './pages/ImageResizer';
import ImageConverter from './pages/ImageConverter';
import Scanner from './pages/Scanner';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = CapApp.addListener('backButton', (data) => {
      if (location.pathname === '/') {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      handleBackButton.then(h => h.remove());
    };
  }, [location, navigate]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/image-to-pdf" element={<ImageToPdf />} />
        <Route path="/pdf-to-image" element={<PdfToImage />} />
        <Route path="/image-compressor" element={<ImageCompressor />} />
        <Route path="/pdf-compressor" element={<PdfCompressor />} />
        <Route path="/images-to-pdf" element={<ImagesToPdf />} />
        <Route path="/pdf-merge" element={<PdfMerge />} />
        <Route path="/pdf-split" element={<PdfSplit />} />
        <Route path="/image-resizer" element={<ImageResizer />} />
        <Route path="/image-converter" element={<ImageConverter />} />
        <Route path="/scanner" element={<Scanner />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
