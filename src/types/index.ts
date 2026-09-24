export interface Book {
  id: string;
  title: string;
  titleUrdu: string;
  authorId: string;
  authorName: string;
  authorNameUrdu: string;
  categoryId: string;
  categoryName: string;
  categoryNameUrdu: string;
  coverImage: string;
  accentColor: string; // for book spine and fallback styling
  language: string;
  publishedYear: number;
  pages: number;
  fileSize: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNewRelease?: boolean;
  rating?: number;
  description: string;
  synopsis: string;
  archiveId?: string;
  pdfUrl?: string;
  pdfObjectKey?: string;
  isPaid?: boolean;
  price?: number;
  isComplete?: boolean;
  isPublicDomain?: boolean;
  samplePages: {
    pageNumber: number;
    chapterTitle?: string;
    chapterTitleUrdu?: string;
    contentUrdu: string[];
    footnote?: string;
  }[];
}

export interface Author {
  id: string;
  name: string;
  nameUrdu: string;
  avatar: string;
  bio: string;
  era: string;
  booksCount: number;
  genres: string[];
}

export interface Category {
  id: string;
  name: string;
  nameUrdu: string;
  description: string;
  iconName: string;
  booksCount: number;
  coverAccent: string;
}

export type ViewMode = 'home' | 'library' | 'categories' | 'category-detail' | 'authors' | 'author-detail' | 'book-detail' | 'pdf-reader' | 'search-results' | 'contact' | 'admin';

export interface NavigationState {
  currentView: ViewMode;
  selectedBookId?: string;
  selectedCategoryId?: string;
  selectedAuthorId?: string;
  searchQuery?: string;
  initialFilter?: {
    category?: string;
    sortBy?: 'newest' | 'popular' | 'title';
  };
}
