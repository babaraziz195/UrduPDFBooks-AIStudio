import React, { useState, useEffect, useRef } from 'react';
import { Book, ViewMode } from '../types';
import { BOOKS } from '../data/mockData';
import { publicBookService } from '../services/publicBookService';
import { storageService } from '../services/storageService';
import {
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Share2,
  RotateCcw,
  Check,
  ExternalLink,
  Lock,
  Download,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface PdfReaderPageProps {
  bookId: string;
  onNavigate: (view: ViewMode) => void;
  onBackToBook: (bookId: string) => void;
}

type ReaderTheme = 'paper' | 'sepia' | 'dark' | 'clean';

export const PdfReaderPage: React.FC<PdfReaderPageProps> = ({
  bookId,
  onNavigate,
  onBackToBook,
}) => {
  const [activeBook, setActiveBook] = useState<Book>(
    () => BOOKS.find((b) => b.id === bookId) || BOOKS[0]
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [theme, setTheme] = useState<ReaderTheme>('paper');
  const [copiedLink, setCopiedLink] = useState(false);

  // PDF & Signed URL states
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [isSigningPdf, setIsSigningPdf] = useState(false);
  const [pdfAccessError, setPdfAccessError] = useState<string | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);

  // Determine initial reading mode
  const [readingMode, setReadingMode] = useState<'b2-pdf' | 'archive' | 'typeset'>('typeset');

  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Load latest book from public service if available
  useEffect(() => {
    let mounted = true;
    publicBookService.getBookById(bookId).then((loaded) => {
      if (mounted && loaded) {
        setActiveBook(loaded);
      }
    });
    return () => {
      mounted = false;
    };
  }, [bookId]);

  // When activeBook changes, determine reading mode and signed URL
  useEffect(() => {
    let mounted = true;

    const key = activeBook.pdfObjectKey || activeBook.pdfUrl;
    if (key) {
      setReadingMode('b2-pdf');
      setIsSigningPdf(true);
      setPdfAccessError(null);
      setIsIframeLoading(true);

      storageService
        .getSignedPdfUrl(key, activeBook.id)
        .then((res) => {
          if (mounted) {
            if (res.error) {
              setPdfAccessError(res.error);
            } else if (res.url) {
              setSignedPdfUrl(res.url);
            } else {
              setPdfAccessError('PDF not accessible');
            }
            setIsSigningPdf(false);
          }
        })
        .catch((err: Error) => {
          if (mounted) {
            setPdfAccessError(err.message || 'Access denied for this private PDF book.');
            setIsSigningPdf(false);
          }
        });
    } else if (activeBook.archiveId) {
      setReadingMode('archive');
    } else {
      setReadingMode('typeset');
    }

    return () => {
      mounted = false;
    };
  }, [activeBook]);

  const totalPages = activeBook.pages || 350;
  const sampleData = activeBook.samplePages || [];
  const currentSamplePage = sampleData.find((p) => p.pageNumber === currentPage) || sampleData[0];

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      } else if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 15, 160));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 15, 75));
  };

  const handleFitWidth = () => {
    setZoomLevel(100);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Theme styling helpers
  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia':
        return {
          wrapper: 'bg-[#F4ECD8]',
          pageBg: 'bg-[#FAF3E0] text-[#3E342B] border-[#E2D5BA]',
          headerText: 'text-[#3E342B]',
          ornamentColor: 'text-[#B89858]',
          borderTone: 'border-[#DECDB2]',
        };
      case 'dark':
        return {
          wrapper: 'bg-[#141A17]',
          pageBg: 'bg-[#1B2420] text-[#E0EBE4] border-[#2A3B33]',
          headerText: 'text-[#E0EBE4]',
          ornamentColor: 'text-[#C5A869]',
          borderTone: 'border-[#2A3B33]',
        };
      case 'clean':
        return {
          wrapper: 'bg-[#F2F2F2]',
          pageBg: 'bg-white text-[#1A1A1A] border-[#E5E5E5]',
          headerText: 'text-[#1A1A1A]',
          ornamentColor: 'text-[#1A3E2F]',
          borderTone: 'border-[#E5E5E5]',
        };
      case 'paper':
      default:
        return {
          wrapper: 'bg-[#ECE8DF]',
          pageBg: 'bg-[#FDFBF7] text-[#1F2421] border-[#E3DDD1]',
          headerText: 'text-[#1F2421]',
          ornamentColor: 'text-[#C5A869]',
          borderTone: 'border-[#DFD9CC]',
        };
    }
  };

  const currentThemeStyles = getThemeClasses();

  return (
    <div
      ref={readerContainerRef}
      className={`min-h-screen flex flex-col ${currentThemeStyles.wrapper} transition-colors duration-200 select-none`}
    >
      {/* TOP READER BAR */}
      <header className="sticky top-0 z-50 bg-[#122A1E] text-white border-b border-[#1C3E2D] px-3 sm:px-6 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Back to Book & Logo */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onBackToBook(activeBook.id)}
              className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#C5A869]" />
              <span className="hidden sm:inline">Back to Book</span>
            </button>

            <div className="hidden md:flex items-center gap-2 border-l border-white/15 pl-3">
              <BookOpen className="w-4 h-4 text-[#C5A869]" />
              <span className="font-literary text-sm font-bold tracking-tight">
                Urdu<span className="text-[#C5A869]">PDF</span>Books
              </span>
            </div>
          </div>

          {/* Center: Book Title & Urdu Subtitle */}
          <div className="text-center truncate px-2 max-w-xs sm:max-w-md lg:max-w-lg">
            <h1 className="font-literary text-xs sm:text-sm font-semibold truncate leading-tight">
              {activeBook.title}
            </h1>
            <p className="font-urdu text-[11px] sm:text-xs text-[#C5A869] truncate">
              {activeBook.titleUrdu} — {activeBook.authorNameUrdu || activeBook.authorName}
            </p>
          </div>

          {/* Right: Controls & Options */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* View Mode Switcher */}
            {(activeBook.pdfObjectKey || activeBook.pdfUrl) && (
              <button
                type="button"
                onClick={() =>
                  setReadingMode((prev) => (prev === 'b2-pdf' ? 'typeset' : 'b2-pdf'))
                }
                className="py-1 px-2 sm:px-2.5 rounded bg-white/10 hover:bg-white/20 text-[#C5A869] text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Switch between Original PDF Edition and Typeset View"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {readingMode === 'b2-pdf' ? 'Typeset View' : `PDF Edition (${activeBook.pages}p)`}
                </span>
              </button>
            )}

            {activeBook.archiveId && !activeBook.pdfObjectKey && (
              <button
                type="button"
                onClick={() =>
                  setReadingMode((prev) => (prev === 'archive' ? 'typeset' : 'archive'))
                }
                className="py-1 px-2 sm:px-2.5 rounded bg-white/10 hover:bg-white/20 text-[#C5A869] text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Switch between Original Scanned Archive and Typeset View"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {readingMode === 'archive' ? 'Typeset View' : `Full Edition (${activeBook.pages}p)`}
                </span>
              </button>
            )}

            {/* If signed URL exists, offer download / open */}
            {signedPdfUrl && (
              <a
                href={signedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open PDF in new window"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer hidden md:flex items-center gap-1 text-[11px]"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C5A869]" />
                <span className="hidden lg:inline text-white/80">Popout</span>
              </a>
            )}

            {/* Theme switcher (only in typeset mode) */}
            {readingMode === 'typeset' && (
              <div className="hidden sm:flex items-center bg-black/20 rounded-lg p-0.5 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setTheme('paper')}
                  title="Paper Warm"
                  className={`px-2 py-1 rounded text-[11px] ${
                    theme === 'paper' ? 'bg-[#FAF8F5] text-[#122A1E] font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Paper
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('sepia')}
                  title="Sepia"
                  className={`px-2 py-1 rounded text-[11px] ${
                    theme === 'sepia' ? 'bg-[#FAF3E0] text-[#3E342B] font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Sepia
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  title="Night Mode"
                  className={`px-2 py-1 rounded text-[11px] ${
                    theme === 'dark' ? 'bg-[#1B2420] text-emerald-400 font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Night
                </button>
              </div>
            )}

            {/* Zoom Controls (only in typeset mode) */}
            {readingMode === 'typeset' && (
              <div className="hidden md:flex items-center bg-black/20 rounded-lg p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  aria-label="Zoom out"
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] px-1.5 tabular-nums text-white/90">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  aria-label="Zoom in"
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFitWidth}
                  title="Fit Width"
                  className="text-[10px] px-1.5 py-1 text-[#C5A869] hover:underline"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-[#C5A869]" />
              ) : (
                <Maximize2 className="w-4 h-4 text-[#C5A869]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CENTER DOCUMENT VIEWING AREA */}
      {readingMode === 'b2-pdf' ? (
        /* BACKBLAZE B2 PRIVATE SIGNED PDF READER */
        <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden relative">
          <div className="w-full max-w-7xl h-[calc(100vh-130px)] min-h-[640px] bg-white rounded-xl shadow-2xl border border-[#1A3E2F]/20 overflow-hidden relative flex flex-col">
            {isSigningPdf && (
              <div className="absolute inset-0 bg-[#FAF8F5] flex flex-col items-center justify-center gap-3 z-20">
                <div className="w-10 h-10 border-3 border-[#1A3E2F] border-t-transparent rounded-full animate-spin" />
                <p className="font-literary text-sm font-semibold text-[#1F2421]">
                  Generating Secure Signed PDF Token from Backblaze B2...
                </p>
                <p className="font-urdu text-xs text-[#1A3E2F]">
                  کتاب کی تصدیق اور محفوظ پی ڈی ایف لوڈ ہو رہی ہے
                </p>
              </div>
            )}

            {pdfAccessError && !isSigningPdf && (
              <div className="absolute inset-0 bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center gap-4 z-20">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="font-literary text-lg font-bold text-gray-900">
                  {activeBook.isPaid ? 'Premium Book Purchase Required' : 'PDF Access Restricted'}
                </h3>
                <p className="text-xs text-gray-600 max-w-md leading-relaxed">
                  {pdfAccessError}
                </p>
                {activeBook.isPaid && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2 max-w-md">
                    <p className="font-bold">
                      Price: PKR {activeBook.price || 500}
                    </p>
                    <p>
                      Please sign in with your authorized reader account or complete payment to unlock full Backblaze B2 download and reading access.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setReadingMode('typeset')}
                    className="px-4 py-2 bg-[#1A3E2F] text-white text-xs font-bold rounded-xl hover:bg-[#133224] transition-colors"
                  >
                    Read Typeset Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => onBackToBook(activeBook.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Back to Book Details
                  </button>
                </div>
              </div>
            )}

            {signedPdfUrl && !pdfAccessError && (
              <>
                {isIframeLoading && (
                  <div className="absolute inset-0 bg-[#FAF8F5] flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
                    <div className="w-10 h-10 border-3 border-[#1A3E2F] border-t-transparent rounded-full animate-spin" />
                    <p className="font-literary text-sm font-semibold text-[#1F2421]">
                      Rendering Original PDF ({activeBook.pages} Pages)...
                    </p>
                  </div>
                )}
                <iframe
                  src={`${signedPdfUrl}#toolbar=1&navpanes=1`}
                  title={`${activeBook.title} PDF Reader`}
                  allowFullScreen
                  onLoad={() => setIsIframeLoading(false)}
                  className="w-full h-full border-0 flex-1"
                />
              </>
            )}
          </div>
        </main>
      ) : readingMode === 'archive' && activeBook.archiveId ? (
        /* COMPLETE ORIGINAL SCANNED BOOK READER */
        <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden relative">
          <div className="w-full max-w-7xl h-[calc(100vh-130px)] min-h-[640px] bg-white rounded-xl shadow-2xl border border-[#1A3E2F]/20 overflow-hidden relative flex flex-col">
            {isIframeLoading && (
              <div className="absolute inset-0 bg-[#FAF8F5] flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-10 h-10 border-3 border-[#1A3E2F] border-t-transparent rounded-full animate-spin" />
                <p className="font-literary text-sm font-semibold text-[#1F2421]">
                  Opening Complete Original Edition ({activeBook.pages} Pages)...
                </p>
                <p className="font-urdu text-xs text-[#1A3E2F]">
                  مکمل اور اصلی کتاب انٹرنیٹ آرکائیو سے لوڈ ہو رہی ہے
                </p>
              </div>
            )}
            <iframe
              src={`https://archive.org/details/${activeBook.archiveId}?view=theater&ui=embed&wrapper=false`}
              title={`${activeBook.title} Complete Reader`}
              allowFullScreen
              onLoad={() => setIsIframeLoading(false)}
              className="w-full h-full border-0 flex-1"
            />
          </div>
        </main>
      ) : (
        /* TYPESET FLOWING READER */
        <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-x-auto relative">
          {/* Floating Side Navigation Buttons (Desktop) */}
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
            className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#122A1E]/80 hover:bg-[#122A1E] text-white items-center justify-center shadow-xl backdrop-blur-xs disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer border border-[#C5A869]/30"
          >
            <ChevronLeft className="w-6 h-6 text-[#C5A869]" />
          </button>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Next Page"
            className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#122A1E]/80 hover:bg-[#122A1E] text-white items-center justify-center shadow-xl backdrop-blur-xs disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer border border-[#C5A869]/30"
          >
            <ChevronRight className="w-6 h-6 text-[#C5A869]" />
          </button>

          {/* Book Sheet Container */}
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150 my-auto"
          >
            <article
              className={`w-[340px] sm:w-[500px] md:w-[620px] min-h-[580px] sm:min-h-[720px] rounded-lg shadow-2xl p-6 sm:p-12 flex flex-col justify-between border ${currentThemeStyles.pageBg} relative overflow-hidden`}
            >
              {/* Classical Ornate Border */}
              <div
                className={`absolute inset-3 border-2 ${currentThemeStyles.borderTone} rounded pointer-events-none`}
              />
              <div
                className={`absolute inset-4 border ${currentThemeStyles.borderTone} opacity-60 rounded pointer-events-none`}
              />

              {/* Book Sheet Header */}
              <div className="text-center pt-2 relative z-10">
                <span className={`text-[10px] sm:text-xs font-serif tracking-wider ${currentThemeStyles.ornamentColor} uppercase`}>
                  {activeBook.title} — {activeBook.authorName}
                </span>
                {currentSamplePage?.chapterTitleUrdu && (
                  <h2 className="font-urdu text-lg sm:text-2xl mt-1 text-[#C5A869] font-bold">
                    {currentSamplePage.chapterTitleUrdu}
                  </h2>
                )}
                <div className="w-16 h-0.5 bg-[#C5A869]/40 mx-auto mt-2" />
              </div>

              {/* Classical Urdu Text Body */}
              <div className="my-auto py-6 sm:py-10 text-center relative z-10 px-2 sm:px-6">
                <div className="font-urdu text-xl sm:text-2xl md:text-3xl leading-[2.5] tracking-wide text-right dir-rtl space-y-4">
                  {currentSamplePage?.contentUrdu?.map((line, idx) => (
                    <p key={idx} className="text-center">
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {/* Sheet Footer */}
              <div className="border-t border-black/10 pt-3 flex items-center justify-between text-[11px] text-gray-500 relative z-10">
                <span>{currentSamplePage?.footnote || `${activeBook.title}`}</span>
                <span className="font-mono font-bold">
                  {currentPage} / {totalPages}
                </span>
              </div>
            </article>
          </div>
        </main>
      )}

      {/* BOTTOM READER FOOTER (Typeset mode navigation bar) */}
      {readingMode === 'typeset' && (
        <footer className="bg-[#122A1E] text-white border-t border-[#1C3E2D] px-4 py-2 shadow-inner">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Page</span>
              <span className="font-bold text-[#C5A869]">{currentPage}</span>
              <span className="text-gray-400">of</span>
              <span className="font-bold">{totalPages}</span>
            </div>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};
