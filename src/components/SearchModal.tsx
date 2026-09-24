import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../types';
import { BOOKS } from '../data/mockData';
import { Search, X, BookOpen, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (bookId: string) => void;
  onViewAllResults: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectBook,
  onViewAllResults,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();
  const filteredBooks = trimmed
    ? BOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(trimmed) ||
          b.titleUrdu.includes(trimmed) ||
          b.authorName.toLowerCase().includes(trimmed) ||
          b.authorNameUrdu.includes(trimmed) ||
          b.categoryName.toLowerCase().includes(trimmed)
      ).slice(0, 6)
    : BOOKS.slice(0, 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmed) {
      onViewAllResults(trimmed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative mx-auto max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#1A3E2F]/15 overflow-hidden z-10">
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center border-b border-[#1A3E2F]/12 px-4 py-3 sm:px-6">
          <Search className="w-5 h-5 text-[#1A3E2F] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Urdu novels, poetry, authors, or categories..."
            className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-[#1F2421] placeholder-[#7A8A7F] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[#7A8A7F] hover:text-[#1F2421] mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647067] hover:bg-[#F2EFE9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Results / Suggestions */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-[#647067] mb-3">
            <span>{trimmed ? `Search Results (${filteredBooks.length})` : 'Popular Suggestions'}</span>
            {trimmed && (
              <button
                type="button"
                onClick={() => {
                  onViewAllResults(trimmed);
                  onClose();
                }}
                className="text-[#1A3E2F] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Results</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C5A869]" />
              </button>
            )}
          </div>

          {filteredBooks.length === 0 ? (
            <div className="text-center py-10 px-4">
              <BookOpen className="w-10 h-10 text-[#7A8A7F] mx-auto mb-2 opacity-50" />
              <h4 className="font-literary text-lg font-semibold text-[#1F2421]">No books found</h4>
              <p className="text-xs text-[#647067] mt-1 max-w-sm mx-auto">
                We couldn’t find matches for "{query}". Try searching by another keyword or explore our categories.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => {
                    onSelectBook(book.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FAF8F5] border border-transparent hover:border-[#1A3E2F]/10 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Thumbnail Cover */}
                    <div
                      className="w-10 h-14 rounded overflow-hidden shrink-0 shadow-2xs flex items-center justify-center p-1 text-center"
                      style={{ backgroundColor: book.accentColor }}
                    >
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-urdu text-[11px] text-[#F8F5EE] leading-none line-clamp-1">
                          {book.titleUrdu}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-literary text-sm sm:text-base font-semibold text-[#1F2421] group-hover:text-[#1A3E2F] transition-colors line-clamp-1">
                        {book.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#647067] mt-0.5">
                        <span className="font-urdu text-[#1A3E2F]">{book.titleUrdu}</span>
                        <span aria-hidden="true" className="text-[#C5A869]">·</span>
                        <span>{book.authorName}</span>
                        <span aria-hidden="true" className="text-[#C5A869]">·</span>
                        <span className="text-[#1A3E2F]">{book.categoryName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#1A3E2F] font-semibold group-hover:translate-x-1 transition-transform shrink-0">
                    <span className="hidden sm:inline">Open</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A869]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer with keyboard shortcuts */}
        <div className="bg-[#FAF8F5] px-6 py-3 border-t border-[#1A3E2F]/10 flex items-center justify-between text-[11px] text-[#7A8A7F]">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-[#1A3E2F]/15 rounded font-mono text-[10px]">ESC</kbd> to exit</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-[#1A3E2F]/15 rounded font-mono text-[10px]">↵ Enter</kbd> for full results</span>
          </div>
          <span className="font-urdu text-[#1A3E2F]">آن لائن مطالعہ</span>
        </div>
      </div>
    </div>
  );
};
