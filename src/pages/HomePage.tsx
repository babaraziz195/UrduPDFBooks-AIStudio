import React from 'react';
import { ViewMode, Book } from '../types';
import { HeroSection } from '../components/HeroSection';
import { FeatureStrip } from '../components/FeatureStrip';
import { CategoryCard } from '../components/CategoryCard';
import { BookGrid } from '../components/BookGrid';
import { AuthorCard } from '../components/AuthorCard';
import { OnlineReadingPromotion } from '../components/OnlineReadingPromotion';
import { CATEGORIES, AUTHORS, BOOKS } from '../data/mockData';
import { ArrowRight, BookOpen, Sparkles, Star } from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: ViewMode) => void;
  onSelectBook: (bookId: string) => void;
  onReadBook: (bookId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectAuthor: (authorId: string) => void;
  onSearchSubmit: (query: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectBook,
  onReadBook,
  onSelectCategory,
  onSelectAuthor,
  onSearchSubmit,
}) => {
  const featuredBooks = BOOKS.filter((b) => b.isFeatured).slice(0, 5);
  const popularBooks = BOOKS.filter((b) => b.isPopular).slice(0, 5);
  const newReleases = BOOKS.filter((b) => b.isNewRelease).slice(0, 5);
  const displayedCategories = CATEGORIES;
  const displayedAuthors = AUTHORS.slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* Hero Section */}
      <HeroSection
        onNavigate={onNavigate}
        onSearchSubmit={onSearchSubmit}
        onSelectBook={onSelectBook}
      />

      {/* Feature Strip */}
      <div className="-mt-16 sm:-mt-20">
        <FeatureStrip />
      </div>

      {/* 1. Browse Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Genres & Themes</span>
            </div>
            <h2 className="font-literary text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2421] mt-1">
              Explore by Category
            </h2>
            <p className="text-sm text-[#647067] mt-1">
              Find your next read from your favorite genre.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('categories')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:text-[#133224] group cursor-pointer"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 text-[#C5A869] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayedCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      </section>

      {/* 2. Featured Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
              <Star className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Editor’s Pick</span>
            </div>
            <h2 className="font-literary text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2421] mt-1">
              Featured Books
            </h2>
            <p className="text-sm text-[#647067] mt-1">
              Selected reads from our growing Urdu library.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:text-[#133224] group cursor-pointer"
          >
            <span>Explore All Books</span>
            <ArrowRight className="w-4 h-4 text-[#C5A869] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <BookGrid
          books={featuredBooks}
          onSelectBook={onSelectBook}
          onReadBook={onReadBook}
        />
      </section>

      {/* 3. Online Reading Promotion Section */}
      <OnlineReadingPromotion onNavigate={onNavigate} />

      {/* 4. Popular Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
              <BookOpen className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Most Visited</span>
            </div>
            <h2 className="font-literary text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2421] mt-1">
              Popular Reads
            </h2>
            <p className="text-sm text-[#647067] mt-1">
              The timeless classics and modern volumes readers return to most often.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:text-[#133224] group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 text-[#C5A869] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <BookGrid
          books={popularBooks}
          onSelectBook={onSelectBook}
          onReadBook={onReadBook}
        />
      </section>

      {/* 5. Newly Added */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Fresh Additions</span>
            </div>
            <h2 className="font-literary text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2421] mt-1">
              Newly Added
            </h2>
            <p className="text-sm text-[#647067] mt-1">
              Discover the latest additions to UrduPDFBooks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:text-[#133224] group cursor-pointer"
          >
            <span>View All Books</span>
            <ArrowRight className="w-4 h-4 text-[#C5A869] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <BookGrid
          books={newReleases}
          onSelectBook={onSelectBook}
          onReadBook={onReadBook}
        />
      </section>

      {/* 6. Authors Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
              <BookOpen className="w-3.5 h-3.5 text-[#C5A869]" />
              <span>Literary Masters</span>
            </div>
            <h2 className="font-literary text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2421] mt-1">
              Explore Authors
            </h2>
            <p className="text-sm text-[#647067] mt-1">
              Learn about the visionaries and pens that shaped the Urdu language.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('authors')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3E2F] hover:text-[#133224] group cursor-pointer"
          >
            <span>View All Authors</span>
            <ArrowRight className="w-4 h-4 text-[#C5A869] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayedAuthors.map((author) => (
            <AuthorCard
              key={author.id}
              author={author}
              onSelectAuthor={onSelectAuthor}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
