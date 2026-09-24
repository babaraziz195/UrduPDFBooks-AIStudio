import React from 'react';
import { CATEGORIES } from '../data/mockData';
import { CategoryCard } from '../components/CategoryCard';
import { BookOpen } from 'lucide-react';

interface CategoriesPageProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onSelectCategory,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="border-b border-[#1A3E2F]/12 pb-6 max-w-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A3E2F]">
          <BookOpen className="w-3.5 h-3.5 text-[#C5A869]" />
          <span>Curated Genres</span>
        </div>
        <h1 className="font-literary text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F2421] mt-1">
          Explore Categories
        </h1>
        <p className="text-sm text-[#647067] mt-1.5 leading-relaxed">
          From legendary romantic epics and philosophical poetry to profound Islamic scholarship and historical chronicles, browse literature organized by genre.
        </p>
      </div>

      {/* Grid of all categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onSelectCategory={onSelectCategory}
          />
        ))}
      </div>
    </div>
  );
};
