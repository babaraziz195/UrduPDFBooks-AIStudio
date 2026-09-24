import React from 'react';
import { Category } from '../types';
import {
  Book,
  Feather,
  Compass,
  Landmark,
  BookOpen,
  User,
  GraduationCap,
  Smile,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onSelectCategory,
}) => {
  const getIcon = () => {
    switch (category.iconName) {
      case 'Book':
        return <Book className="w-5 h-5" />;
      case 'Feather':
        return <Feather className="w-5 h-5" />;
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'User':
        return <User className="w-5 h-5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Smile':
        return <Smile className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Book className="w-5 h-5" />;
    }
  };

  return (
    <div
      onClick={() => onSelectCategory(category.id)}
      className="group relative cursor-pointer bg-white rounded-lg p-5 border border-[#1A3E2F]/10 book-shadow-hover transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      {/* Decorative subtle corner emblem */}
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-[#1A3E2F]">
          <path d="M0,0 L100,0 L100,100 Z" />
        </svg>
      </div>

      <div>
        {/* Icon & Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded bg-[#FAF8F5] border border-[#1A3E2F]/12 text-[#1A3E2F] flex items-center justify-center group-hover:bg-[#1A3E2F] group-hover:text-[#F8F5EE] group-hover:border-[#1A3E2F] transition-colors">
            {getIcon()}
          </div>
          <span className="text-xs font-medium text-[#647067] tabular-nums">
            {category.booksCount} Books
          </span>
        </div>

        {/* Urdu & English Title */}
        <p className="font-urdu text-base text-[#1A3E2F] font-bold mb-0.5">
          {category.nameUrdu}
        </p>
        <h3 className="font-literary text-lg font-semibold text-[#1F2421] group-hover:text-[#1A3E2F] transition-colors">
          {category.name}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-[#647067] mt-1.5 line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      </div>

      {/* Explore Action Link */}
      <div className="mt-4 pt-3 border-t border-[#1A3E2F]/8 flex items-center justify-between text-xs font-medium text-[#1A3E2F]">
        <span>Explore Collection</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#C5A869] group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
