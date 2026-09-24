import React, { useState, useEffect } from 'react';
import { Book, ViewMode } from '../types';
import { BOOKS } from '../data/mockData';
import { publicBookService } from '../services/publicBookService';
import { storageService } from '../services/storageService';
import { BookGrid } from '../components/BookGrid';
import {
  BookOpen,
  ArrowLeft,
  Bookmark,
  Share2,
  Check,
  Calendar,
  FileText,
  Globe,
  Layers,
  Sparkles,
  Star,
  Download,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface BookDetailPageProps {
  bookId: string;
  onNavigate: (view: ViewMode) => void;
  onSelectBook: (bookId: string) => void;
  onReadBook: (bookId: string) => void;
  onSelectAuthor: (authorId: string) => void;
  onSelectCategory: (categoryId: string) => void;
}

export const BookDetailPage: React.FC<BookDetailPageProps> = ({
  bookId,
  onNavigate,
  onSelectBook,
  onReadBook,
  onSelectAuthor,
  onSelectCategory,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [book, setBook] = useState<Book>(
    () => BOOKS.find((b) => b.id === bookId) || BOOKS[0]
  );

  useEffect(() => {
    publicBookService.getBookById(bookId).then((loaded) => {
      if (loaded) {
        setBook(loaded);
      }
    });
  }, [bookId]);

  const handleDownloadPdf = async () => {
    const key = book.pdfObjectKey || book.pdfUrl;
    if (!key) {
      onReadBook(book.id);
      return;
    }

    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await storageService.getSignedPdfUrl(key, book.id);
      if (res.error) {
        setDownloadError(res.error);
      } else if (res.url) {
        window.open(res.url, '_blank');
      } else {
        setDownloadError('Unable to generate download URL');
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Could not generate download link');
    } finally {
      setDownloading(false);
    }
  };

  // Books from same author
  const moreFromAuthor = BOOKS.filter(
    (b) => b.authorId === book.authorId && b.id !== book.id
  ).slice(0, 4);

  // Books in same category
  const youMayAlsoLike = BOOKS.filter(
    (b) => b.categoryId === book.categoryId && b.id !== book.id && b.authorId !== book.authorId
  ).slice(0, 4);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* Top Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Library</span>
        </button>
      </div>

      {/* Main Book Showcase (Left: Large Portrait Cover, Right: Info & Actions) */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#1A3E2F]/12 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT: Large Portrait Book Cover */}
          <div className="lg:col-span-4 xl:col-span-4 max-w-sm mx-auto w-full">
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-2xl border border-[#1A3E2F]/20 group">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={`${book.title} cover`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Tailored Deluxe Classical Clothbound Cover */
                <div
                  className="w-full h-full p-6 flex flex-col justify-between relative overflow-hidden"
                  style={{ backgroundColor: book.accentColor }}
                >
                  {/* Spine depth shadow */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-black/20 pointer-events-none" />

                  {/* Ornate Gilt Border */}
                  <div className="absolute inset-3 border-2 border-[#C5A869]/50 rounded pointer-events-none" />
                  <div className="absolute inset-4.5 border border-[#C5A869]/25 rounded pointer-events-none" />

                  {/* Top Emblem */}
                  <div className="relative z-10 text-center pt-4">
                    <span className="font-urdu text-sm text-[#C5A869] block tracking-widest">
                      مکتبہ اردو ڈیجیٹل ایڈیشن
                    </span>
                    <div className="w-12 h-px bg-[#C5A869]/50 mx-auto my-2" />
                  </div>

                  {/* Center Urdu Calligraphy */}
                  <div className="relative z-10 text-center my-auto px-2">
                    <h2 className="font-urdu text-2xl sm:text-3xl font-bold text-[#FAF8F5] leading-relaxed drop-shadow-md">
                      {book.titleUrdu}
                    </h2>
                    <p className="font-literary text-base text-[#C5A869] italic mt-2">
                      {book.title}
                    </p>
                  </div>

                  {/* Bottom Author Tag */}
                  <div className="relative z-10 text-center pb-4">
                    <div className="w-14 h-px bg-[#C5A869]/50 mx-auto mb-2" />
                    <p className="font-urdu text-base text-[#E5E0D4] font-medium">
                      {book.authorNameUrdu}
                    </p>
                  </div>
                </div>
              )}

              {/* Book Spine Highlight Overlay */}
              <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-white/10 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Quick action buttons below cover */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#1A3E2F] text-white border-[#1A3E2F]'
                    : 'bg-[#FAF8F5] text-[#1F2421] border-[#1A3E2F]/15 hover:bg-[#F2EFE9]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isBookmarked ? 'Bookmarked' : 'Add to Favorites'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-2 px-3 rounded-lg border border-[#1A3E2F]/15 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-xs font-medium text-[#1F2421] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#647067]" />
                    <span>Share Book</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Book Information, Metadata & Reading CTA */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              {/* Category & Status - unboxed typography */}
              <div className="flex items-center gap-2 text-xs text-[#647067] mb-2">
                <button
                  type="button"
                  onClick={() => onSelectCategory(book.categoryId)}
                  className="font-semibold text-[#1A3E2F] tracking-wide uppercase hover:underline cursor-pointer"
                >
                  {book.categoryName}
                </button>
                <span aria-hidden="true" className="text-[#C5A869]">·</span>
                <span className="font-urdu text-sm text-[#1A3E2F]">{book.categoryNameUrdu}</span>
                <span aria-hidden="true" className="text-[#C5A869]">·</span>
                <span className="tabular-nums">{book.publishedYear}</span>
              </div>

              {/* Title in Urdu Calligraphy */}
              <h1 className="font-urdu text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A3E2F] leading-snug">
                {book.titleUrdu}
              </h1>

              {/* Title in English Serif */}
              <h2 className="font-literary text-2xl sm:text-3xl font-semibold text-[#1F2421] mt-1">
                {book.title}
              </h2>

              {/* Author name with link */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-[#647067]">Written by:</span>
                <button
                  type="button"
                  onClick={() => onSelectAuthor(book.authorId)}
                  className="font-literary text-lg font-bold text-[#1A3E2F] hover:underline cursor-pointer"
                >
                  {book.authorName} ({book.authorNameUrdu})
                </button>
              </div>

              {/* Rating and Format indicators */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#647067] pb-6 border-b border-[#1A3E2F]/10">
                <div className="flex items-center gap-1 text-[#C5A869] font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-[#1F2421]">{book.rating || 4.9}</span>
                  <span className="text-[#7A8A7F] font-normal">(Curated Archive)</span>
                </div>
                <span aria-hidden="true" className="text-[#1A3E2F]/20">|</span>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <FileText className="w-4 h-4 text-[#1A3E2F]" />
                  <span>{book.pages} Pages</span>
                </div>
                <span aria-hidden="true" className="text-[#1A3E2F]/20">|</span>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#1A3E2F]" />
                  <span>Language: {book.language}</span>
                </div>
                {book.isPaid ? (
                  <>
                    <span aria-hidden="true" className="text-[#1A3E2F]/20">|</span>
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Premium Book (PKR {book.price || 500})</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" className="text-[#1A3E2F]/20">|</span>
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Free Public Edition</span>
                    </div>
                  </>
                )}
                {book.isComplete && (
                  <>
                    <span aria-hidden="true" className="text-[#1A3E2F]/20">|</span>
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Complete Book (All {book.pages} Pages Available)</span>
                    </div>
                  </>
                )}
              </div>

              {/* Short Summary */}
              <p className="mt-6 text-base text-[#4A554E] leading-relaxed">
                {book.description}
              </p>

              {/* Primary Reading CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onReadBook(book.id)}
                  className="py-3.5 px-8 rounded-xl bg-[#1A3E2F] hover:bg-[#133224] text-white text-base font-semibold shadow-md flex items-center gap-2.5 transition-all cursor-pointer border border-[#C5A869]/30"
                >
                  <BookOpen className="w-5 h-5 text-[#C5A869]" />
                  <span>Read Book Online</span>
                </button>

                {(book.pdfObjectKey || book.pdfUrl) && (
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={handleDownloadPdf}
                    className="py-3.5 px-6 rounded-xl bg-[#C5A869] hover:bg-[#b59858] text-[#12281E] text-sm font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {downloading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloading ? 'Authorizing...' : 'Download PDF'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onNavigate('library')}
                  className="py-3.5 px-6 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#1A3E2F] border border-[#1A3E2F]/20 text-sm font-semibold transition-all cursor-pointer"
                >
                  Back to Library
                </button>
              </div>

              {downloadError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {downloadError}
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-[#7A8A7F]">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A869]" />
                <span>
                  {book.isComplete
                    ? `Complete Original Book — all ${book.pages} pages readable from first to final page directly in the online reader.`
                    : 'Instant in-browser PDF reader with zoom, page jumps, and comfortable typography.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About This Book & Detailed Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* About This Book */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-[#1A3E2F]/10 shadow-2xs space-y-4">
          <h3 className="font-literary text-2xl font-bold text-[#1F2421] border-b border-[#1A3E2F]/10 pb-3">
            About This Book
          </h3>
          <p className="text-sm sm:text-base text-[#4A554E] leading-relaxed">
            {book.synopsis}
          </p>
          <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#1A3E2F]/10 mt-4">
            <h4 className="font-urdu text-lg text-[#1A3E2F] font-bold mb-2">
              کتاب کا تعارف و فکری جائزہ
            </h4>
            <p className="font-urdu text-sm sm:text-base text-[#4A554E] leading-loose text-right">
              یہ کتاب اردو ادب میں ایک ممتاز اور تاریخی مقام رکھتی ہے۔ مصنف نے جس اسلوب اور فکری گہرائی کے ساتھ انسانی نفسیات، معاشرتی رویوں اور روحانی سفر کو قلمبند کیا ہے، وہ قاری کو آغاز سے انجام تک اپنے سحر میں باندھے رکھتا ہے۔
            </p>
          </div>
        </div>

        {/* Book Details Metadata Grid */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 sm:p-8 border border-[#1A3E2F]/10 shadow-2xs space-y-4">
          <h3 className="font-literary text-xl font-bold text-[#1F2421] border-b border-[#1A3E2F]/10 pb-3">
            Book Details
          </h3>
          <dl className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#1A3E2F]/8">
              <dt className="text-[#647067]">Format</dt>
              <dd className="font-semibold text-[#1F2421]">Digital In-Browser PDF</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1A3E2F]/8">
              <dt className="text-[#647067]">Language</dt>
              <dd className="font-semibold text-[#1F2421]">{book.language} (اردو)</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1A3E2F]/8">
              <dt className="text-[#647067]">Total Pages</dt>
              <dd className="font-semibold text-[#1F2421] tabular-nums">{book.pages}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1A3E2F]/8">
              <dt className="text-[#647067]">First Published</dt>
              <dd className="font-semibold text-[#1F2421] tabular-nums">{book.publishedYear}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1A3E2F]/8">
              <dt className="text-[#647067]">Digital File Size</dt>
              <dd className="font-semibold text-[#1F2421] tabular-nums">{book.fileSize}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-[#647067]">Online Access</dt>
              <dd className="font-semibold text-[#1A3E2F]">Free & Unlimited</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* More From This Author */}
      {moreFromAuthor.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[#1A3E2F]/12 pb-4">
            <div>
              <h3 className="font-literary text-2xl font-bold text-[#1F2421]">
                More From {book.authorName}
              </h3>
              <p className="text-xs text-[#647067] mt-0.5">
                Explore other celebrated writings by this author
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectAuthor(book.authorId)}
              className="text-xs font-semibold text-[#1A3E2F] hover:underline"
            >
              View Author Profile →
            </button>
          </div>

          <BookGrid
            books={moreFromAuthor}
            onSelectBook={onSelectBook}
            onReadBook={onReadBook}
          />
        </section>
      )}

      {/* You May Also Like */}
      {youMayAlsoLike.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[#1A3E2F]/12 pb-4">
            <div>
              <h3 className="font-literary text-2xl font-bold text-[#1F2421]">
                You May Also Like
              </h3>
              <p className="text-xs text-[#647067] mt-0.5">
                Recommended titles from the {book.categoryName} collection
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectCategory(book.categoryId)}
              className="text-xs font-semibold text-[#1A3E2F] hover:underline"
            >
              Browse Category →
            </button>
          </div>

          <BookGrid
            books={youMayAlsoLike}
            onSelectBook={onSelectBook}
            onReadBook={onReadBook}
          />
        </section>
      )}
    </div>
  );
};
