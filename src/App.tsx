import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ImageToPdf from './pages/ImageToPdf';
import PdfToImage from './pages/PdfToImage';
import ImageCompressor from './pages/ImageCompressor';
import PdfCompressor from './pages/PdfCompressor';
import ImagesToPdf from './pages/ImagesToPdf';
import PdfMerge from './pages/PdfMerge';
import PdfSplit from './pages/PdfSplit';

function App() {
  return (
    <Router>
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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
