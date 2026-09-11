import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileText } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] overflow-y-auto">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isHome && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-800 hidden sm:block">
                PDF & Image Tools
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!isHome && (
              <Link
                to="/"
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Home"
              >
                <Home className="w-5 h-5 text-slate-600" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full overflow-y-visible">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-slate-500">
            100% Free • No API • All processing done in your browser
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Your files never leave your device 🔒
          </p>
        </div>
      </footer>
    </div>
  );
}
