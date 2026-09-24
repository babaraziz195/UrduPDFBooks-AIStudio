import React, { useState } from 'react';
import { AUTHORS } from '../data/mockData';
import { AuthorCard } from '../components/AuthorCard';
import { EmptyState } from '../components/EmptyState';
import { Search, BookOpen } from 'lucide-react';

interface AuthorsPageProps {
  onSelectAuthor: (authorId: string) => void;
}

export const AuthorsPage: React.FC<AuthorsPageProps> = ({ onSelectAuthor }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAuthors = AUTHORS.filter((author) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      author.name.toLowerCase().includes(q) ||
      author.nameUrdu.includes(q) ||
      author.genres.some((g) => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1A3E2F]/12 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
            <BookOpen className="w-3.5 h-3.5 text-[#C5A869]" />
            <span>Literary Pioneers</span>
          </div>
          <h1 className="font-literary text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F2421] mt-1">
            Explore Authors
          </h1>
          <p className="text-sm text-[#647067] mt-1.5 max-w-xl">
            Discover the thinkers, novelists, poets, and historians who enriched the heritage of the Urdu language.
          </p>
        </div>

        {/* Search author input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#1A3E2F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search author name..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[#1A3E2F]/15 text-xs text-[#1F2421] placeholder-[#7A8A7F] focus:outline-none focus:ring-1 focus:ring-[#1A3E2F] shadow-2xs"
          />
        </div>
      </div>

      {/* Authors Grid */}
      {filteredAuthors.length === 0 ? (
        <EmptyState
          title="No authors found"
          message={`No author matching "${searchQuery}". Please try another name or clear your search.`}
          actionText="Show All Authors"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {filteredAuthors.map((author) => (
            <AuthorCard
              key={author.id}
              author={author}
              onSelectAuthor={onSelectAuthor}
            />
          ))}
        </div>
      )}
    </div>
  );
};
