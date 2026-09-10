import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ImageIcon,
  FileImage,
  Minimize2,
  FileDown,
  GalleryHorizontal,
  Combine,
  Scissors,
  Shield,
  Zap,
} from 'lucide-react';

const tools = [
  {
    name: 'Image → PDF',
    description: 'Convert a single image to PDF',
    icon: FileImage,
    path: '/image-to-pdf',
    color: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-200',
  },
  {
    name: 'PDF → Image',
    description: 'Convert PDF pages to images',
    icon: ImageIcon,
    path: '/pdf-to-image',
    color: 'from-purple-500 to-purple-600',
    shadow: 'shadow-purple-200',
  },
  {
    name: 'Image Compressor',
    description: 'Reduce image file size',
    icon: Minimize2,
    path: '/image-compressor',
    color: 'from-green-500 to-green-600',
    shadow: 'shadow-green-200',
  },
  {
    name: 'PDF Compressor',
    description: 'Reduce PDF file size',
    icon: FileDown,
    path: '/pdf-compressor',
    color: 'from-orange-500 to-orange-600',
    shadow: 'shadow-orange-200',
  },
  {
    name: 'Images → PDF',
    description: 'Convert multiple images to one PDF',
    icon: GalleryHorizontal,
    path: '/images-to-pdf',
    color: 'from-cyan-500 to-cyan-600',
    shadow: 'shadow-cyan-200',
  },
  {
    name: 'PDF Merge',
    description: 'Combine multiple PDFs into one',
    icon: Combine,
    path: '/pdf-merge',
    color: 'from-rose-500 to-rose-600',
    shadow: 'shadow-rose-200',
  },
  {
    name: 'PDF Split',
    description: 'Split PDF into separate pages',
    icon: Scissors,
    path: '/pdf-split',
    color: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-200',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
          All-in-One{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PDF & Image
          </span>{' '}
          Tools
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Free, fast, and private. All processing happens right in your browser —
          no uploads, no servers, no limits.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">100% Private</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">Lightning Fast</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-200">
            <Shield className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700 font-medium">No API Required</span>
          </div>
        </div>
      </motion.div>

      {/* Tools Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {tools.map((tool) => (
          <motion.div key={tool.path} variants={item}>
            <Link to={tool.path}>
              <div className="group bg-white rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center shadow-lg ${tool.shadow} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
