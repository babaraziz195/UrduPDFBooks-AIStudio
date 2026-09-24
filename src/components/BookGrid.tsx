import React from 'react';
import { Book } from '../types';
import { BookCard } from './BookCard';

interface BookGridProps {
  books: Book[];
  onSelectBook: (bookId: string) => void;
  onReadBook: (bookId: string) => void;
  columns?: 'standard' | 'dense';
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  onSelectBook,
  onReadBook,
  columns = 'standard',
}) => {
  if (books.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid gap-4 sm:gap-6 ${
        columns === 'dense'
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      }`}
    >
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onSelectBook={onSelectBook}
          onReadBook={onReadBook}
        />
      ))}
    </div>
  );
};
