import React from 'react';
import { Book } from '../types';
import { BookOpen, Bookmark } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelectBook: (bookId: string) => void;
  onReadBook: (bookId: string) => void;
  compact?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelectBook,
  onReadBook,
  compact = false,
}) => {
  return (
    <article
      onClick={() => onSelectBook(book.id)}
      className="group relative flex flex-col cursor-pointer bg-white rounded-lg p-2.5 sm:p-3 border border-[#1A3E2F]/10 book-shadow-hover transition-all duration-200"
    >
      {/* Book Cover Container with authentic 3:4 portrait ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-[#1B362A] shadow-inner mb-3">
        {book.isComplete && (
          <span className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded bg-[#122A1E]/90 text-[#E0C68C] text-[10px] font-semibold tracking-tight border border-[#C5A869]/40 shadow-xs">
            Complete Book
          </span>
        )}
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={`${book.title} cover`}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Tailored Classical Urdu Book Cover Artwork with gilded border */
          <div
            className="h-full w-full p-4 flex flex-col justify-between relative overflow-hidden"
            style={{ backgroundColor: book.accentColor }}
          >
            {/* Spine Highlight Shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-black/20 pointer-events-none" />

            {/* Subtle Gilded Geometric Border */}
            <div className="absolute inset-2 border border-[#C5A869]/40 rounded pointer-events-none" />
            <div className="absolute inset-3 border border-[#C5A869]/20 rounded pointer-events-none" />

            {/* Top Ornamental Emblem */}
            <div className="relative z-10 text-center pt-2">
              <span className="font-urdu text-[11px] text-[#C5A869]/80 block tracking-wider">
                مکتبہ اردو
              </span>
              <div className="w-8 h-px bg-[#C5A869]/40 mx-auto my-1" />
            </div>

            {/* Center Book Title in Urdu Calligraphy & English */}
            <div className="relative z-10 text-center my-auto px-1">
              <h3 className="font-urdu text-lg sm:text-xl font-bold text-[#F8F5EE] leading-relaxed drop-shadow-sm">
                {book.titleUrdu}
              </h3>
              <p className="font-literary text-xs sm:text-sm text-[#C5A869] italic mt-1 line-clamp-1">
                {book.title}
              </p>
            </div>

            {/* Bottom Author Tag in Gilt */}
            <div className="relative z-10 text-center pb-2">
              <div className="w-10 h-px bg-[#C5A869]/40 mx-auto mb-1.5" />
              <p className="font-urdu text-xs text-[#E6E0D2] font-medium">
                {book.authorNameUrdu}
              </p>
            </div>
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReadBook(book.id);
            }}
            className="w-full py-2 px-3 bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-semibold rounded shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#C5A869]/40"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C5A869]" />
            <span>Read Online</span>
          </button>
        </div>
      </div>

      {/* Book Metadata - Zero-Pill Typography */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          {/* Category - unboxed clean text */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-[#647067] mb-1">
            <span className="font-medium text-[#1A3E2F] tracking-wide uppercase">
              {book.categoryName}
            </span>
            <span className="font-urdu text-xs text-[#7A8A7F]">{book.categoryNameUrdu}</span>
          </div>

          {/* Book Title */}
          <h4 className="font-literary text-base sm:text-lg font-semibold text-[#1F2421] leading-snug line-clamp-1 group-hover:text-[#1A3E2F] transition-colors">
            {book.title}
          </h4>

          {/* Urdu Title & Author */}
          <p className="font-urdu text-xs sm:text-sm text-[#4A554E] line-clamp-1 mt-0.5">
            {book.authorNameUrdu}
          </p>
        </div>

        {/* Bottom Unboxed Meta Separators */}
        <div className="mt-3 pt-2 border-t border-[#1A3E2F]/8 flex items-center justify-between text-xs text-[#647067]">
          <div className="flex items-center gap-1.5 tabular-nums">
            <span>{book.pages} pages</span>
            <span aria-hidden="true" className="text-[#C5A869]">·</span>
            <span>{book.language}</span>
          </div>
          <span className="text-[#1A3E2F] font-medium text-[11px] group-hover:underline">
            Details →
          </span>
        </div>
      </div>
    </article>
  );
};
