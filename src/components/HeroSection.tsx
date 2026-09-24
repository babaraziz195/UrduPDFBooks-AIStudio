import React, { useState } from 'react';
import { ViewMode, Book } from '../types';
import { Search, ArrowRight, BookOpen, Sparkles, Feather } from 'lucide-react';
import heroBooksImage from '../assets/images/library_hero_books_1790203841582.jpg';
import { BOOKS } from '../data/mockData';

interface HeroSectionProps {
  onNavigate: (view: ViewMode) => void;
  onSearchSubmit: (query: string) => void;
  onSelectBook: (bookId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onSearchSubmit,
  onSelectBook,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    if (val.trim().length > 1) {
      const q = val.toLowerCase();
      const filtered = BOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.titleUrdu.includes(q) ||
          b.authorName.toLowerCase().includes(q) ||
          b.authorNameUrdu.includes(q) ||
          b.categoryName.toLowerCase().includes(q)
      ).slice(0, 4);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchSubmit(searchInput.trim());
      setIsFocused(false);
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-14 md:pt-14 md:pb-20 bg-gradient-to-b from-[#FAF8F5] via-[#FAF8F5] to-[#F5F2EB]">
      {/* Subtle oriental background motif pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#1A3E2F_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headlines & Search */}
          <div className="lg:col-span-7">
            {/* Literary eyebrow */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1A3E2F] bg-[#1A3E2F]/8 px-3 py-1.5 rounded-full mb-4">
              <Feather className="w-3.5 h-3.5 text-[#C5A869]" />
              <span className="font-urdu text-sm">مطالعہ، شعور اور اردو ادب کا سفر</span>
            </div>

            <h1 className="font-literary text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1F2421] tracking-tight leading-[1.15] text-balance">
              Read Urdu. Discover Stories. Build Your Library.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#55635B] leading-relaxed max-w-2xl">
              Discover Urdu literature, novels, poetry, history, Islamic books and more — all in one beautiful digital library designed for comfortable online reading on any screen.
            </p>

            {/* Elegant Search Input with Autocomplete Dropdown */}
            <div className="relative mt-8 max-w-xl">
              <form onSubmit={handleFormSubmit} className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-[#1A3E2F]">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleInputChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                  placeholder="Search by book, author or category..."
                  className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-xl bg-white border border-[#1A3E2F]/20 text-[#1F2421] placeholder-[#7A8A7F] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E2F] focus:border-transparent shadow-sm transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 sm:right-2.5 py-2 px-4 rounded-lg bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer border border-[#C5A869]/30"
                >
                  Search
                </button>
              </form>

              {/* Instant Search Suggestions Dropdown */}
              {isFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#1A3E2F]/15 overflow-hidden z-30">
                  <div className="p-2 border-b border-[#1A3E2F]/10 text-[11px] font-medium text-[#647067] flex justify-between items-center bg-[#FAF8F5]">
                    <span>Suggested Books</span>
                    <span>Press Enter to view all</span>
                  </div>
                  <div className="divide-y divide-[#1A3E2F]/8">
                    {suggestions.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={() => {
                          onSelectBook(item.id);
                        }}
                        className="p-3 hover:bg-[#F6F4ED] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-10 rounded bg-[#1A3E2F] text-white flex items-center justify-center text-[10px] font-urdu shrink-0 shadow-2xs">
                            {item.titleUrdu.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1F2421] line-clamp-1">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-[#647067]">
                              <span>{item.authorName}</span>
                              <span aria-hidden="true" className="text-[#C5A869]">·</span>
                              <span className="font-urdu text-[11px] text-[#1A3E2F]">{item.titleUrdu}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-[#1A3E2F] font-medium shrink-0">
                          Read →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="py-3 px-6 rounded-lg bg-[#1A3E2F] hover:bg-[#133224] text-white text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer border border-[#C5A869]/30"
              >
                <span>Browse Library</span>
                <ArrowRight className="w-4 h-4 text-[#C5A869]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className="py-3 px-6 rounded-lg bg-white hover:bg-[#F2EFE9] text-[#1A3E2F] border border-[#1A3E2F]/20 text-sm font-semibold shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Explore Categories</span>
              </button>
            </div>
          </div>

          {/* Right Column: Literary Bookshelf Presentation */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-[#1A3E2F]/15 shadow-2xl bg-[#1A3E2F]">
                <img
                  src={heroBooksImage}
                  alt="UrduPDFBooks library collection"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-[4/3] object-cover transition-transform duration-700 hover:scale-102"
                />

                {/* Overlaid Literary Quote in Urdu */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-2 text-xs text-[#C5A869] font-medium mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>مجموعہ ادب و حکمت</span>
                  </div>
                  <p className="font-urdu text-base sm:text-lg text-[#F8F5EE] leading-relaxed">
                    ”کتاب انسان کی بہترین اور سچی ساتھی ہے، جو تنہائی میں بھی فکر کو پرواز دیتی ہے۔“
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-[#D5E0D8]">
                    <span>Urdu Classical & Contemporary Archive</span>
                    <span className="text-[#C5A869] font-medium">Read Free Online</span>
                  </div>
                </div>
              </div>

              {/* Floating Book Highlight Badge */}
              <div className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-6 bg-white rounded-xl p-3.5 sm:p-4 shadow-xl border border-[#1A3E2F]/12 flex items-center gap-3 z-20 max-w-[260px]">
                <div className="w-10 h-10 rounded-lg bg-[#1A3E2F] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[#C5A869]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1F2421]">Read In Browser</h4>
                  <p className="text-[11px] text-[#647067] mt-0.5">
                    No forced downloads. Pure comfortable reading.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
