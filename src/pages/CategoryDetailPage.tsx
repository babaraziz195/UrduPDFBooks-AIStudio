import React, { useState } from 'react';
import { Category, Book, ViewMode } from '../types';
import { CATEGORIES, BOOKS } from '../data/mockData';
import { BookGrid } from '../components/BookGrid';
import { EmptyState } from '../components/EmptyState';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';

interface CategoryDetailPageProps {
  categoryId: string;
  onNavigate: (view: ViewMode) => void;
  onSelectBook: (bookId: string) => void;
  onReadBook: (bookId: string) => void;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  categoryId,
  onNavigate,
  onSelectBook,
  onReadBook,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'title'>('popular');

  const category = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];

  const categoryBooks = BOOKS.filter((b) => b.categoryId === category.id)
    .filter((b) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.titleUrdu.includes(q) ||
        b.authorName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.publishedYear - a.publishedYear;
      if (sortBy === 'popular') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('categories')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:underline cursor-pointer mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Categories</span>
        </button>

        {/* Category Banner Card */}
        <div className="bg-[#1A3E2F] rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-[#C5A869]/20">
          <div className="relative z-10 max-w-2xl">
            <span className="font-urdu text-xl text-[#C5A869] block mb-1">
              {category.nameUrdu}
            </span>
            <h1 className="font-literary text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F8F5EE]">
              {category.name}
            </h1>
            <p className="text-sm sm:text-base text-[#D0DFD6] mt-3 leading-relaxed">
              {category.description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#C5A869] tabular-nums font-medium">
              <span>{categoryBooks.length} Books Available</span>
              <span aria-hidden="true">·</span>
              <span>Online Browser Reading</span>
            </div>
          </div>

          {/* Subtle Decorative Emblem in Background */}
          <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none hidden md:block">
            <span className="font-urdu text-9xl text-white">
              {category.nameUrdu.slice(0, 4)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#1A3E2F]/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#1A3E2F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={`Search within ${category.name}...`}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#1A3E2F]/15 text-xs text-[#1F2421] placeholder-[#7A8A7F] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#647067]" />
          <span className="text-xs text-[#647067]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-1.5 px-2.5 rounded-md bg-[#FAF8F5] border border-[#1A3E2F]/15 text-xs text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F]"
          >
            <option value="popular">Popular First</option>
            <option value="newest">Newest Releases</option>
            <option value="title">A – Z (Title)</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {categoryBooks.length === 0 ? (
        <EmptyState
          title={`No books found in ${category.name}`}
          message="We are constantly expanding our collection. More titles in this category will be uploaded soon."
          actionText="Browse All Library Books"
          onAction={() => onNavigate('library')}
        />
      ) : (
        <BookGrid
          books={categoryBooks}
          onSelectBook={onSelectBook}
          onReadBook={onReadBook}
        />
      )}
    </div>
  );
};
