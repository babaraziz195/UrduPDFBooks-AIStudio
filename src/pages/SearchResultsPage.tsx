import React, { useState } from 'react';
import { ViewMode, Book } from '../types';
import { BOOKS, CATEGORIES } from '../data/mockData';
import { BookGrid } from '../components/BookGrid';
import { EmptyState } from '../components/EmptyState';
import { Search, ArrowLeft, Filter } from 'lucide-react';

interface SearchResultsPageProps {
  initialQuery: string;
  onNavigate: (view: ViewMode) => void;
  onSelectBook: (bookId: string) => void;
  onReadBook: (bookId: string) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  initialQuery,
  onNavigate,
  onSelectBook,
  onReadBook,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const trimmed = query.trim().toLowerCase();

  const results = BOOKS.filter((book) => {
    // Search match
    if (trimmed) {
      const matchTitle = book.title.toLowerCase().includes(trimmed) || book.titleUrdu.includes(trimmed);
      const matchAuthor = book.authorName.toLowerCase().includes(trimmed) || book.authorNameUrdu.includes(trimmed);
      const matchCat = book.categoryName.toLowerCase().includes(trimmed) || book.categoryNameUrdu.includes(trimmed);
      const matchDesc = book.description.toLowerCase().includes(trimmed);
      if (!matchTitle && !matchAuthor && !matchCat && !matchDesc) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && book.categoryId !== selectedCategory) {
      return false;
    }

    return true;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Top back navigation */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:underline cursor-pointer mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Library</span>
        </button>

        {/* Heading */}
        <h1 className="font-literary text-3xl sm:text-4xl font-bold text-[#1F2421]">
          Search Results for “<span className="text-[#1A3E2F]">{query || 'All Books'}</span>”
        </h1>
        <p className="text-sm text-[#647067] mt-1">
          Found <strong className="text-[#1F2421] tabular-nums">{results.length}</strong> matching{' '}
          {results.length === 1 ? 'volume' : 'volumes'} in the Urdu digital library.
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#1A3E2F]/12 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Modify search input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-[#1A3E2F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Change search query..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#1A3E2F]/15 text-xs text-[#1F2421] placeholder-[#7A8A7F] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F]"
          />
        </form>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-[#647067]" />
          <span className="text-xs text-[#647067]">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-2.5 rounded-md bg-[#FAF8F5] border border-[#1A3E2F]/15 text-xs text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F]"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results or Empty State */}
      {results.length === 0 ? (
        <EmptyState
          title="No books found"
          message={`We couldn't find any results matching "${query}". Try searching with a different term, author name, or explore our curated categories.`}
          actionText="Browse All Categories"
          onAction={() => onNavigate('categories')}
          secondaryActionText="View Entire Library"
          onSecondaryAction={() => onNavigate('library')}
        />
      ) : (
        <BookGrid
          books={results}
          onSelectBook={onSelectBook}
          onReadBook={onReadBook}
        />
      )}
    </div>
  );
};
