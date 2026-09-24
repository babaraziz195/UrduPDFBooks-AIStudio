import { bookService } from './bookService';
import { Book } from '../types';
import { AdminBook } from '../types/admin';

export const publicBookService = {
  /**
   * Convert AdminBook format to public Book interface
   */
  adaptAdminBook(b: AdminBook): Book {
    return {
      id: b.id,
      title: b.title,
      titleUrdu: b.titleUrdu || b.title,
      authorId: b.authorId || 'author-unknown',
      authorName: b.authorName,
      authorNameUrdu: b.authorName,
      categoryId: b.categoryId || 'uncategorized',
      categoryName: b.categoryName,
      categoryNameUrdu: b.categoryName,
      coverImage: b.coverUrl || '',
      accentColor: b.accentColor || '#1A3E2F',
      language: b.language || 'Urdu',
      publishedYear: b.publicationYear,
      pages: b.pages,
      fileSize: b.pdfSize ? `${(b.pdfSize / (1024 * 1024)).toFixed(1)} MB` : '12 MB',
      isFeatured: b.isFeatured,
      isPopular: true,
      isNewRelease: true,
      rating: b.rating || 5.0,
      description: b.shortDescription || b.description || '',
      synopsis: b.description || b.shortDescription || '',
      pdfUrl: b.pdfUrl,
      pdfObjectKey: b.pdfObjectKey,
      isPaid: b.isPaid,
      price: b.price,
      isComplete: Boolean(b.pdfObjectKey || b.pdfUrl),
      isPublicDomain: !b.isPaid,
      samplePages: [
        {
          pageNumber: 1,
          chapterTitle: b.title,
          chapterTitleUrdu: b.titleUrdu || b.title,
          contentUrdu: [
            b.shortDescription || 'کتاب کا مطالعہ آن لائن پی ڈی ایف ریڈر میں مکمل دستیاب ہے۔',
            'UrduPDFBooks ڈیجیٹل لائبریری کے ذریعے آپ مکمل کتاب کا بآسانی مطالعہ کر سکتے ہیں۔',
          ],
          footnote: `${b.title} — ${b.authorName}`,
        },
      ],
    };
  },

  /**
   * Fetch all PUBLISHED books for public readers.
   * Draft books are strictly excluded.
   */
  async getPublishedBooks(): Promise<Book[]> {
    const allStored = await bookService.getAllStoredBooks();
    const published = allStored.filter((b) => b.status === 'published');
    return published.map((b) => this.adaptAdminBook(b));
  },

  /**
   * Fetch single book by ID or slug
   */
  async getBookById(idOrSlug: string): Promise<Book | null> {
    const book = await bookService.getBookById(idOrSlug);
    if (!book || book.status !== 'published') {
      return null;
    }
    return this.adaptAdminBook(book);
  },

  /**
   * Fetch featured books
   */
  async getFeaturedBooks(): Promise<Book[]> {
    const books = await this.getPublishedBooks();
    return books.filter((b) => b.isFeatured);
  },

  /**
   * Fetch books by category
   */
  async getBooksByCategory(categoryId: string): Promise<Book[]> {
    const books = await this.getPublishedBooks();
    return books.filter((b) => b.categoryId === categoryId);
  },

  /**
   * Fetch books by author
   */
  async getBooksByAuthor(authorId: string): Promise<Book[]> {
    const books = await this.getPublishedBooks();
    return books.filter((b) => b.authorId === authorId);
  },
};
