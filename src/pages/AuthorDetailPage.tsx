import React from 'react';
import { Author, Book, ViewMode } from '../types';
import { AUTHORS, BOOKS } from '../data/mockData';
import { BookGrid } from '../components/BookGrid';
import { EmptyState } from '../components/EmptyState';
import { ArrowLeft, BookOpen, Feather } from 'lucide-react';

interface AuthorDetailPageProps {
  authorId: string;
  onNavigate: (view: ViewMode) => void;
  onSelectBook: (bookId: string) => void;
  onReadBook: (bookId: string) => void;
}

export const AuthorDetailPage: React.FC<AuthorDetailPageProps> = ({
  authorId,
  onNavigate,
  onSelectBook,
  onReadBook,
}) => {
  const author = AUTHORS.find((a) => a.id === authorId) || AUTHORS[0];
  const authorBooks = BOOKS.filter((b) => b.authorId === author.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Breadcrumb Navigation */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('authors')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:underline cursor-pointer mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Authors</span>
        </button>

        {/* Author Bio Profile Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#1A3E2F]/12 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Author Portrait */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-[#C5A869]/50 bg-[#FAF8F5] shrink-0 shadow-md">
              {author.avatar ? (
                <img
                  src={author.avatar}
                  alt={author.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale contrast-115"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1A3E2F] text-[#FAF8F5] font-urdu text-4xl font-bold">
                  {author.nameUrdu.slice(0, 1)}
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="text-center sm:text-left flex-grow">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-xs font-medium text-[#647067] tabular-nums">
                  {author.era}
                </span>
                <span aria-hidden="true" className="text-[#C5A869]">·</span>
                <span className="text-xs text-[#1A3E2F] font-semibold tabular-nums">
                  {author.booksCount} Archival Works
                </span>
              </div>

              <h1 className="font-literary text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2421]">
                {author.name}
              </h1>

              <p className="font-urdu text-xl sm:text-2xl text-[#1A3E2F] font-bold mt-1 mb-3">
                {author.nameUrdu}
              </p>

              <p className="text-sm text-[#4A554E] max-w-3xl leading-relaxed">
                {author.bio}
              </p>

              {/* Genres list - unboxed */}
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#647067]">
                <span className="font-semibold text-[#1F2421]">Primary Genres:</span>
                {author.genres.map((genre, idx) => (
                  <React.Fragment key={genre}>
                    <span className="text-[#1A3E2F]">{genre}</span>
                    {idx < author.genres.length - 1 && (
                      <span aria-hidden="true" className="text-[#C5A869]">·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books by this Author */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#1A3E2F]/12 pb-4">
          <div>
            <h2 className="font-literary text-2xl font-bold text-[#1F2421]">
              Books by {author.name}
            </h2>
            <p className="text-xs text-[#647067] mt-0.5">
              Available to read online in our library
            </p>
          </div>
          <span className="text-xs text-[#1A3E2F] font-medium tabular-nums">
            {authorBooks.length} titles
          </span>
        </div>

        {authorBooks.length === 0 ? (
          <EmptyState
            title="More works being digitized"
            message={`We are currently processing more classical titles by ${author.name}. Check back soon!`}
            actionText="Explore Library"
            onAction={() => onNavigate('library')}
          />
        ) : (
          <BookGrid
            books={authorBooks}
            onSelectBook={onSelectBook}
            onReadBook={onReadBook}
          />
        )}
      </section>
    </div>
  );
};
