import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminBook, AdminAuditLog } from '../types/admin';
import { BOOKS } from '../data/mockData';
import { storageService } from './storageService';

const STORAGE_KEY = 'urdupdfbooks_admin_books';
const LOGS_STORAGE_KEY = 'urdupdfbooks_admin_audit_logs';

// Initial seed: convert existing mock books to AdminBook format
const INITIAL_ADMIN_BOOKS: AdminBook[] = BOOKS.map((b, index) => ({
  id: b.id,
  title: b.title,
  titleUrdu: b.titleUrdu,
  slug: b.id,
  subtitle: b.categoryName,
  authorId: b.authorId,
  authorName: b.authorName,
  categoryId: b.categoryId,
  categoryName: b.categoryName,
  language: b.language || 'Urdu',
  publicationYear: b.publishedYear || 2026,
  publisher: 'Urdu Classical Archive',
  isbn: `978-969-${1000 + index}-${(index % 9) + 1}`,
  pages: b.pages || 150,
  shortDescription: b.description,
  description: b.synopsis,
  keywords: [b.categoryName, b.authorName, 'Urdu Book'],
  coverUrl: b.coverImage || '',
  accentColor: b.accentColor || '#1A3E2F',
  pdfObjectKey: b.archiveId ? `books/archive/${b.archiveId}.pdf` : `books/sample/${b.id}.pdf`,
  pdfUrl: b.pdfUrl || (b.archiveId ? `https://archive.org/download/${b.archiveId}/${b.archiveId}.pdf` : ''),
  pdfFilename: `${b.id}.pdf`,
  pdfSize: parseFloat(b.fileSize || '10') * 1024 * 1024,
  isFeatured: Boolean(b.isFeatured),
  status: 'published',
  rating: b.rating || 5.0,
  createdAt: new Date(Date.now() - index * 86400000 * 3).toISOString(),
  updatedAt: new Date().toISOString(),
}));

export interface BookQueryOptions {
  search?: string;
  categoryId?: string;
  authorId?: string;
  status?: 'all' | 'published' | 'draft';
  isFeatured?: boolean | 'all';
  language?: string;
  sortBy?: 'newest' | 'oldest' | 'title-asc' | 'title-desc';
  page?: number;
  limit?: number;
}

export interface BookQueryResult {
  books: AdminBook[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const bookService = {
  /**
   * Helper to load all stored books (from Supabase or local sandbox)
   */
  async getAllStoredBooks(): Promise<AdminBook[]> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            title: item.title,
            titleUrdu: item.title_urdu || '',
            slug: item.slug,
            subtitle: item.subtitle || '',
            authorId: item.author_id || '',
            authorName: item.author_name,
            categoryId: item.category_id || '',
            categoryName: item.category_name,
            language: item.language || 'Urdu',
            publicationYear: item.publication_year || 2026,
            publisher: item.publisher || '',
            isbn: item.isbn || '',
            pages: item.pages || 0,
            shortDescription: item.short_description || '',
            description: item.description || '',
            keywords: item.keywords || [],
            coverUrl: item.cover_url || '',
            accentColor: item.accent_color || '#1A3E2F',
            pdfObjectKey: item.pdf_object_key || '',
            pdfUrl: item.pdf_url || '',
            pdfFilename: item.pdf_filename || '',
            pdfSize: Number(item.pdf_size || 0),
            isFeatured: Boolean(item.is_featured),
            status: item.status as 'draft' | 'published',
            rating: item.rating ? Number(item.rating) : 5.0,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch books error, falling back to local:', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_BOOKS));
    return INITIAL_ADMIN_BOOKS;
  },

  /**
   * Query books with search, filters, sorting, and pagination
   */
  async getBooks(options: BookQueryOptions = {}): Promise<BookQueryResult> {
    const {
      search = '',
      categoryId = '',
      authorId = '',
      status = 'all',
      isFeatured = 'all',
      language = '',
      sortBy = 'newest',
      page = 1,
      limit = 25,
    } = options;

    const allBooks = await this.getAllStoredBooks();

    // 1. Filter
    let filtered = allBooks.filter((book) => {
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = book.title.toLowerCase().includes(q);
        const matchTitleUrdu = book.titleUrdu?.includes(q);
        const matchAuthor = book.authorName.toLowerCase().includes(q);
        const matchIsbn = book.isbn?.toLowerCase().includes(q);
        if (!matchTitle && !matchTitleUrdu && !matchAuthor && !matchIsbn) {
          return false;
        }
      }

      // Category
      if (categoryId && categoryId !== 'all' && book.categoryId !== categoryId) {
        return false;
      }

      // Author
      if (authorId && authorId !== 'all' && book.authorId !== authorId) {
        return false;
      }

      // Status
      if (status !== 'all' && book.status !== status) {
        return false;
      }

      // Featured
      if (isFeatured !== 'all' && book.isFeatured !== isFeatured) {
        return false;
      }

      // Language
      if (language && language !== 'all' && book.language !== language) {
        return false;
      }

      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const validPage = Math.max(1, Math.min(page, totalPages));
    const start = (validPage - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      books: paginated,
      total,
      page: validPage,
      limit,
      totalPages,
    };
  },

  /**
   * Get single book by ID or Slug
   */
  async getBookById(idOrSlug: string): Promise<AdminBook | null> {
    const books = await this.getAllStoredBooks();
    return books.find((b) => b.id === idOrSlug || b.slug === idOrSlug) || null;
  },

  /**
   * Create a new book
   */
  async createBook(bookData: Omit<AdminBook, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminBook> {
    const client = getSupabase();
    const books = await this.getAllStoredBooks();

    // Ensure unique slug
    let baseSlug = (bookData.slug || bookData.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = `book-${Date.now()}`;

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (books.some((b) => b.slug === uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = new Date().toISOString();

    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('books')
          .insert({
            title: bookData.title.trim(),
            title_urdu: bookData.titleUrdu || '',
            slug: uniqueSlug,
            subtitle: bookData.subtitle || '',
            author_id: bookData.authorId || null,
            author_name: bookData.authorName,
            category_id: bookData.categoryId || null,
            category_name: bookData.categoryName,
            language: bookData.language || 'Urdu',
            publication_year: bookData.publicationYear,
            publisher: bookData.publisher || '',
            isbn: bookData.isbn || '',
            pages: bookData.pages || 0,
            short_description: bookData.shortDescription || '',
            description: bookData.description || '',
            keywords: bookData.keywords || [],
            cover_url: bookData.coverUrl || '',
            accent_color: bookData.accentColor || '#1A3E2F',
            pdf_object_key: bookData.pdfObjectKey || '',
            pdf_url: bookData.pdfUrl || '',
            pdf_filename: bookData.pdfFilename || '',
            pdf_size: bookData.pdfSize || 0,
            is_featured: bookData.isFeatured,
            is_paid: bookData.isPaid || false,
            price: bookData.price || 0,
            status: bookData.status,
            rating: 5.0,
          })
          .select()
          .single();

        if (!error && data) {
          await this.logActivity(
            'Created Book',
            'book',
            data.title,
            `Added book with slug: ${data.slug}`
          );
          return {
            id: data.id,
            title: data.title,
            titleUrdu: data.title_urdu,
            slug: data.slug,
            subtitle: data.subtitle,
            authorId: data.author_id,
            authorName: data.author_name,
            categoryId: data.category_id,
            categoryName: data.category_name,
            language: data.language,
            publicationYear: data.publication_year,
            publisher: data.publisher,
            isbn: data.isbn,
            pages: data.pages,
            shortDescription: data.short_description,
            description: data.description,
            keywords: data.keywords,
            coverUrl: data.cover_url,
            accentColor: data.accent_color,
            pdfObjectKey: data.pdf_object_key,
            pdfUrl: data.pdf_url,
            pdfFilename: data.pdf_filename,
            pdfSize: Number(data.pdf_size),
            isFeatured: data.is_featured,
            isPaid: data.is_paid,
            price: Number(data.price || 0),
            status: data.status,
            rating: Number(data.rating || 5.0),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase create book failed, writing to local storage:', err);
      }
    }

    const newBook: AdminBook = {
      ...bookData,
      id: `book-${Date.now()}`,
      slug: uniqueSlug,
      createdAt: now,
      updatedAt: now,
    };

    const updatedBooks = [newBook, ...books];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
    await this.logActivity('Created Book', 'book', newBook.title, `Added book with slug: ${newBook.slug}`);
    return newBook;
  },

  /**
   * Update existing book
   */
  async updateBook(id: string, updates: Partial<AdminBook>): Promise<AdminBook> {
    const client = getSupabase();
    const books = await this.getAllStoredBooks();
    const existing = books.find((b) => b.id === id);
    if (!existing) throw new Error('Book not found');

    const now = new Date().toISOString();

    if (client && isSupabaseConfigured()) {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.titleUrdu !== undefined) payload.title_urdu = updates.titleUrdu;
        if (updates.slug !== undefined) payload.slug = updates.slug;
        if (updates.subtitle !== undefined) payload.subtitle = updates.subtitle;
        if (updates.authorId !== undefined) payload.author_id = updates.authorId;
        if (updates.authorName !== undefined) payload.author_name = updates.authorName;
        if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
        if (updates.categoryName !== undefined) payload.category_name = updates.categoryName;
        if (updates.language !== undefined) payload.language = updates.language;
        if (updates.publicationYear !== undefined) payload.publication_year = updates.publicationYear;
        if (updates.publisher !== undefined) payload.publisher = updates.publisher;
        if (updates.isbn !== undefined) payload.isbn = updates.isbn;
        if (updates.pages !== undefined) payload.pages = updates.pages;
        if (updates.shortDescription !== undefined) payload.short_description = updates.shortDescription;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.keywords !== undefined) payload.keywords = updates.keywords;
        if (updates.coverUrl !== undefined) payload.cover_url = updates.coverUrl;
        if (updates.accentColor !== undefined) payload.accent_color = updates.accentColor;
        if (updates.pdfObjectKey !== undefined) payload.pdf_object_key = updates.pdfObjectKey;
        if (updates.pdfUrl !== undefined) payload.pdf_url = updates.pdfUrl;
        if (updates.pdfFilename !== undefined) payload.pdf_filename = updates.pdfFilename;
        if (updates.pdfSize !== undefined) payload.pdf_size = updates.pdfSize;
        if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
        if (updates.isPaid !== undefined) payload.is_paid = updates.isPaid;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.status !== undefined) payload.status = updates.status;

        const { data, error } = await client
          .from('books')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          await this.logActivity('Updated Book', 'book', data.title, `Updated book details`);
          return {
            id: data.id,
            title: data.title,
            titleUrdu: data.title_urdu,
            slug: data.slug,
            subtitle: data.subtitle,
            authorId: data.author_id,
            authorName: data.author_name,
            categoryId: data.category_id,
            categoryName: data.category_name,
            language: data.language,
            publicationYear: data.publication_year,
            publisher: data.publisher,
            isbn: data.isbn,
            pages: data.pages,
            shortDescription: data.short_description,
            description: data.description,
            keywords: data.keywords,
            coverUrl: data.cover_url,
            accentColor: data.accent_color,
            pdfObjectKey: data.pdf_object_key,
            pdfUrl: data.pdf_url,
            pdfFilename: data.pdf_filename,
            pdfSize: Number(data.pdf_size),
            isFeatured: data.is_featured,
            isPaid: data.is_paid,
            price: Number(data.price || 0),
            status: data.status,
            rating: Number(data.rating || 5.0),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase update failed:', err);
      }
    }

    const updatedBook: AdminBook = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    const updatedBooks = books.map((b) => (b.id === id ? updatedBook : b));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
    await this.logActivity('Updated Book', 'book', updatedBook.title, 'Updated book details');
    return updatedBook;
  },

  /**
   * Delete book and remove PDF from Backblaze B2
   */
  async deleteBook(id: string): Promise<boolean> {
    const books = await this.getAllStoredBooks();
    const target = books.find((b) => b.id === id);
    if (!target) return false;

    // Delete PDF object from Backblaze B2
    if (target.pdfObjectKey) {
      await storageService.deletePdf(target.pdfObjectKey);
    }

    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('books').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete book error:', err);
      }
    }

    const updated = books.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    await this.logActivity('Deleted Book', 'book', target.title, `Removed book and cleaned storage`);
    return true;
  },

  /**
   * Toggle publish status (Draft <-> Published)
   */
  async togglePublish(id: string, status: 'draft' | 'published'): Promise<AdminBook> {
    return this.updateBook(id, { status });
  },

  /**
   * Toggle featured status
   */
  async toggleFeatured(id: string, isFeatured: boolean): Promise<AdminBook> {
    return this.updateBook(id, { isFeatured });
  },

  /**
   * Bulk publish or draft
   */
  async bulkUpdateStatus(ids: string[], status: 'draft' | 'published'): Promise<void> {
    for (const id of ids) {
      await this.updateBook(id, { status });
    }
    await this.logActivity(
      'Bulk Status Change',
      'book',
      `${ids.length} books`,
      `Changed status to ${status}`
    );
  },

  /**
   * Bulk toggle featured
   */
  async bulkToggleFeatured(ids: string[], isFeatured: boolean): Promise<void> {
    for (const id of ids) {
      await this.updateBook(id, { isFeatured });
    }
    await this.logActivity(
      'Bulk Featured Update',
      'book',
      `${ids.length} books`,
      `Set featured to ${isFeatured}`
    );
  },

  /**
   * Bulk delete books
   */
  async bulkDeleteBooks(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.deleteBook(id);
    }
    await this.logActivity(
      'Bulk Deleted Books',
      'book',
      `${ids.length} books`,
      `Deleted ${ids.length} books and their storage objects`
    );
  },

  /**
   * Admin audit logging
   */
  async logActivity(
    action: string,
    targetType: AdminAuditLog['targetType'],
    targetTitle: string,
    details?: string
  ): Promise<void> {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      targetType,
      targetTitle,
      details: details || '',
      createdAt: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('admin_logs').insert({
          action,
          target_type: targetType,
          target_title: targetTitle,
          details: details || '',
        });
      } catch {
        // ignore
      }
    }

    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    let logs: AdminAuditLog[] = [];
    if (saved) {
      try {
        logs = JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    logs = [newLog, ...logs].slice(0, 50); // keep last 50
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  },

  async getActivityLogs(): Promise<AdminAuditLog[]> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            action: d.action,
            targetType: d.target_type as AdminAuditLog['targetType'],
            targetTitle: d.target_title,
            details: d.details,
            createdAt: d.created_at,
          }));
        }
      } catch {
        // fallback
      }
    }

    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }

    const initialLogs: AdminAuditLog[] = [
      {
        id: 'log-1',
        action: 'System Initialized',
        targetType: 'auth',
        targetTitle: 'UrduPDFBooks Admin Panel',
        details: 'Admin architecture initialized and ready for Supabase & R2 sync',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(initialLogs));
    return initialLogs;
  },
};
