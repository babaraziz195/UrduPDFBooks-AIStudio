export interface AdminBook {
  id: string;
  title: string;
  titleUrdu?: string;
  slug: string;
  subtitle?: string;
  authorId?: string;
  authorName: string;
  categoryId?: string;
  categoryName: string;
  language: string;
  publicationYear: number;
  publisher?: string;
  isbn?: string;
  pages: number;
  shortDescription?: string;
  description?: string;
  keywords?: string[];
  coverUrl?: string;
  accentColor?: string;
  pdfObjectKey?: string;
  pdfUrl?: string;
  pdfFilename?: string;
  pdfSize?: number; // bytes
  isPaid?: boolean;
  price?: number;
  isFeatured: boolean;
  status: 'draft' | 'published';
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  nameUrdu?: string;
  slug: string;
  description?: string;
  iconName?: string;
  coverAccent?: string;
  booksCount?: number;
  createdAt?: string;
}

export interface AdminAuthor {
  id: string;
  name: string;
  nameUrdu?: string;
  slug: string;
  bio?: string;
  era?: string;
  photoUrl?: string;
  booksCount?: number;
  createdAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role?: string;
}

export interface StorageStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  featuredBooks: number;
  booksWithPdf: number;
  booksMissingPdf: number;
  totalPdfBytes: number;
  avgPdfBytes: number;
  b2Configured: boolean;
  b2Status: string;
  b2BucketName: string;
  b2Endpoint?: string;
  b2Region?: string;
  supabaseConfigured: boolean;
  supabaseStatus: string;
}

export interface AdminAuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  targetType: 'book' | 'category' | 'author' | 'pdf' | 'auth';
  targetId?: string;
  targetTitle: string;
  details?: string;
  createdAt: string;
}

export type AdminView =
  | 'dashboard'
  | 'books'
  | 'add-book'
  | 'edit-book'
  | 'categories'
  | 'authors'
  | 'storage'
  | 'settings';
