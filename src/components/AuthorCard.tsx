import React from 'react';
import { Author } from '../types';
import { User, BookOpen } from 'lucide-react';

interface AuthorCardProps {
  author: Author;
  onSelectAuthor: (authorId: string) => void;
}

export const AuthorCard: React.FC<AuthorCardProps> = ({
  author,
  onSelectAuthor,
}) => {
  return (
    <div
      onClick={() => onSelectAuthor(author.id)}
      className="group cursor-pointer bg-white rounded-lg p-5 border border-[#1A3E2F]/10 book-shadow-hover transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Avatar / Portrait */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#C5A869]/50 bg-[#F4F1EA] shrink-0 shadow-sm">
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#1A3E2F] text-[#F8F5EE] font-urdu text-lg font-bold">
                {author.nameUrdu.slice(0, 1)}
              </div>
            )}
          </div>

          <div>
            <span className="text-[11px] text-[#647067] block tabular-nums">
              {author.era}
            </span>
            <h3 className="font-literary text-base sm:text-lg font-semibold text-[#1F2421] leading-tight group-hover:text-[#1A3E2F] transition-colors">
              {author.name}
            </h3>
            <p className="font-urdu text-sm text-[#1A3E2F] font-medium mt-0.5">
              {author.nameUrdu}
            </p>
          </div>
        </div>

        {/* Short Bio */}
        <p className="text-xs text-[#647067] line-clamp-2 leading-relaxed">
          {author.bio}
        </p>

        {/* Genres unboxed list */}
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[#7A8A7F]">
          {author.genres.slice(0, 2).map((genre, idx) => (
            <React.Fragment key={genre}>
              <span>{genre}</span>
              {idx < Math.min(author.genres.length - 1, 1) && (
                <span aria-hidden="true" className="text-[#C5A869]">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer view books */}
      <div className="mt-4 pt-3 border-t border-[#1A3E2F]/8 flex items-center justify-between text-xs">
        <span className="text-[#647067] tabular-nums font-medium">
          {author.booksCount} Available Books
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectAuthor(author.id);
          }}
          className="text-[#1A3E2F] font-semibold flex items-center gap-1 group-hover:underline cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#C5A869]" />
          <span>View Books</span>
        </button>
      </div>
    </div>
  );
};
