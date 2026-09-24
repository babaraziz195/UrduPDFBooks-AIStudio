import React, { useState, useMemo } from 'react';
import { Book, Category, Author } from '../types';
import { BOOKS, CATEGORIES, AUTHORS } from '../data/mockData';
import { BookGrid } from '../components/BookGrid';
import { EmptyState } from '../components/EmptyState';
import { Search, Filter, SlidersHorizontal, RotateCcw, BookOpen } from 'lucide-react';

interface LibraryPageProps {
  onSelectBook: (bookId: string) => void;
  onReadBook: (bookId: string) => void;
  initialCategory?: string;
  initialSort?: 'newest' | 'popular' | 'title';
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onSelectBook,
  onReadBook,
  initialCategory,
  initialSort = 'popular',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'title'>(initialSort);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const filteredBooks = useMemo(() => {
    return BOOKS.filter((book) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(q) || book.titleUrdu.includes(q);
        const matchesAuthor = book.authorName.toLowerCase().includes(q) || book.authorNameUrdu.includes(q);
        const matchesCategory = book.categoryName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesCategory) return false;
      }

      // Category
      if (selectedCategory !== 'all' && book.categoryId !== selectedCategory) {
        return false;
      }

      // Author
      if (selectedAuthor !== 'all' && book.authorId !== selectedAuthor) {
        return false;
      }

      // Language
      if (selectedLanguage !== 'all' && book.language !== selectedLanguage) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return b.publishedYear - a.publishedYear;
      if (sortBy === 'popular') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedAuthor, selectedLanguage, sortBy]);

  const displayedBooks = filteredBooks.slice(0, visibleCount);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAuthor('all');
    setSelectedLanguage('all');
    setSortBy('popular');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedAuthor !== 'all' ||
    selectedLanguage !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Page Header */}
      <div className="border-b border-[#1A3E2F]/12 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
              <BookOpen className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Comprehensive Digital Archive</span>
            </div>
            <h1 className="font-literary text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F2421] mt-1">
              Explore Our Library
            </h1>
            <p className="text-sm text-[#647067] mt-1.5 max-w-xl">
              Browse hundreds of Urdu books across diverse genres, read online comfortably, or filter by your favorite author.
            </p>
          </div>

          <div className="text-xs text-[#647067] tabular-nums font-medium">
            Showing <strong className="text-[#1F2421]">{displayedBooks.length}</strong> of{' '}
            <strong className="text-[#1F2421]">{filteredBooks.length}</strong> volumes
          </div>
        </div>

        {/* Search bar inside Library top */}
        <div className="mt-6 max-w-2xl relative">
          <Search className="w-4 h-4 text-[#1A3E2F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books or authors in library..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-[#1A3E2F]/18 text-sm text-[#1F2421] placeholder-[#7A8A7F] focus:outline-none focus:ring-2 focus:ring-[#1A3E2F] shadow-2xs"
          />
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-[#1A3E2F]/10 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-grow max-w-3xl">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#647067] mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-md bg-[#FAF8F5] border border-[#1A3E2F]/15 text-xs text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F] cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.nameUrdu})
                  </option>
                ))}
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#647067] mb-1">
                Author
              </label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-md bg-[#FAF8F5] border border-[#1A3E2F]/15 text-xs text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F] cursor-pointer"
              >
                <option value="all">All Authors</option>
                {AUTHORS.map((auth) => (
                  <option key={auth.id} value={auth.id}>
                    {auth.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#647067] mb-1">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-md bg-[#FAF8F5] border border-[#1A3E2F]/15 text-xs text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F] cursor-pointer"
              >
                <option value="all">All Languages</option>
                <option value="Urdu">Urdu (اردو)</option>
              </select>
            </div>
          </div>

          {/* Sorting & Reset */}
          <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#1A3E2F]/10">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#647067]" />
              <label className="text-xs text-[#647067] whitespace-nowrap">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1.5 px-2.5 rounded-md bg-[#FAF8F5] border border-[#1A3E2F]/15 text-xs text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F] cursor-pointer"
              >
                <option value="popular">Popular Reads</option>
                <option value="newest">Newest Releases</option>
                <option value="title">A – Z (Title)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-[#C5A869] hover:text-[#1A3E2F] font-medium py-1 px-2 rounded cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Book Grid or Empty State */}
      {displayedBooks.length === 0 ? (
        <EmptyState
          title="No books match your criteria"
          message="Try changing the category or author filter, or clear your search to browse all Urdu books."
          actionText="Clear All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          <BookGrid
            books={displayedBooks}
            onSelectBook={onSelectBook}
            onReadBook={onReadBook}
          />

          {/* Pagination / Load More UI */}
          {visibleCount < filteredBooks.length && (
            <div className="text-center pt-8">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="py-3 px-8 rounded-lg bg-white hover:bg-[#F2EFE9] text-[#1A3E2F] border border-[#1A3E2F]/20 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                Load More Books ({filteredBooks.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
