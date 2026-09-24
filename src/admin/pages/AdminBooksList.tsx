import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  FileEdit,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import { AdminBook, AdminCategory, AdminAuthor } from '../../types/admin';
import { bookService, BookQueryOptions } from '../../services/bookService';
import { categoryService } from '../../services/categoryService';
import { authorService } from '../../services/authorService';
import { storageService } from '../../services/storageService';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastMessage } from '../components/Toast';

interface AdminBooksListProps {
  initialFilter?: string; // e.g. 'published', 'draft', 'featured'
  onAddNewBook: () => void;
  onEditBook: (bookId: string) => void;
  onViewPublicBook: (bookId: string) => void;
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminBooksList: React.FC<AdminBooksListProps> = ({
  initialFilter,
  onAddNewBook,
  onEditBook,
  onViewPublicBook,
  onShowToast,
}) => {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [authors, setAuthors] = useState<AdminAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Query State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>(
    initialFilter === 'published' || initialFilter === 'draft' ? initialFilter : 'all'
  );
  const [selectedFeatured, setSelectedFeatured] = useState<boolean | 'all'>(
    initialFilter === 'featured' ? true : 'all'
  );
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [bookToDelete, setBookToDelete] = useState<AdminBook | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [previewBook, setPreviewBook] = useState<AdminBook | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load books based on query parameters
  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const options: BookQueryOptions = {
        search,
        categoryId: selectedCategory,
        authorId: selectedAuthor,
        status: selectedStatus,
        isFeatured: selectedFeatured,
        language: selectedLanguage,
        sortBy,
        page,
        limit,
      };

      const result = await bookService.getBooks(options);
      setBooks(result.books);
      setTotalBooks(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error fetching books:', err);
      onShowToast({
        type: 'error',
        title: 'Error loading books',
        message: 'Could not fetch books from storage.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([categoryService.getCategories(), authorService.getAuthors()]).then(
      ([cats, auths]) => {
        setCategories(cats);
        setAuthors(auths);
      }
    );
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory, selectedAuthor, selectedStatus, selectedFeatured, selectedLanguage, sortBy, page, limit]);

  // Handle single delete
  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    setIsActionLoading(true);
    try {
      await bookService.deleteBook(bookToDelete.id);
      onShowToast({
        type: 'success',
        title: 'Book Deleted',
        message: `"${bookToDelete.title}" and its R2 storage files have been removed.`,
      });
      setBookToDelete(null);
      setSelectedIds((prev) => prev.filter((id) => id !== bookToDelete.id));
      fetchBooks();
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Could not delete book. Please try again.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle single publish toggle
  const handleTogglePublish = async (book: AdminBook) => {
    const nextStatus = book.status === 'published' ? 'draft' : 'published';
    try {
      await bookService.togglePublish(book.id, nextStatus);
      onShowToast({
        type: 'success',
        title: nextStatus === 'published' ? 'Book Published' : 'Moved to Draft',
        message: `"${book.title}" is now ${nextStatus}.`,
      });
      fetchBooks();
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'Update failed',
        message: 'Could not update publication status.',
      });
    }
  };

  // Handle single feature toggle
  const handleToggleFeatured = async (book: AdminBook) => {
    const nextFeatured = !book.isFeatured;
    try {
      await bookService.toggleFeatured(book.id, nextFeatured);
      onShowToast({
        type: 'success',
        title: nextFeatured ? 'Marked as Featured' : 'Removed from Featured',
        message: `"${book.title}" featured status updated.`,
      });
      fetchBooks();
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'Update failed',
        message: 'Could not update featured flag.',
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'publish' | 'draft' | 'feature' | 'unfeature') => {
    if (selectedIds.length === 0) return;
    setIsActionLoading(true);
    try {
      if (action === 'publish') {
        await bookService.bulkUpdateStatus(selectedIds, 'published');
        onShowToast({
          type: 'success',
          title: 'Bulk Published',
          message: `${selectedIds.length} books are now published on the website.`,
        });
      } else if (action === 'draft') {
        await bookService.bulkUpdateStatus(selectedIds, 'draft');
        onShowToast({
          type: 'success',
          title: 'Moved to Drafts',
          message: `${selectedIds.length} books moved to draft status.`,
        });
      } else if (action === 'feature') {
        await bookService.bulkToggleFeatured(selectedIds, true);
        onShowToast({
          type: 'success',
          title: 'Marked Featured',
          message: `${selectedIds.length} books marked as featured.`,
        });
      } else if (action === 'unfeature') {
        await bookService.bulkToggleFeatured(selectedIds, false);
        onShowToast({
          type: 'success',
          title: 'Removed from Featured',
          message: `${selectedIds.length} books removed from featured.`,
        });
      }
      setSelectedIds([]);
      fetchBooks();
    } catch {
      onShowToast({
        type: 'error',
        title: 'Bulk Action Failed',
        message: 'An error occurred during the bulk operation.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle bulk delete confirm
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsActionLoading(true);
    try {
      await bookService.bulkDeleteBooks(selectedIds);
      onShowToast({
        type: 'success',
        title: 'Bulk Deletion Complete',
        message: `Successfully deleted ${selectedIds.length} books and their R2 files.`,
      });
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      fetchBooks();
    } catch {
      onShowToast({
        type: 'error',
        title: 'Bulk Deletion Failed',
        message: 'Could not complete bulk deletion.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Checkbox helpers
  const allCurrentPageSelected = books.length > 0 && books.every((b) => selectedIds.includes(b.id));

  const handleToggleSelectAll = () => {
    if (allCurrentPageSelected) {
      const pageIds = new Set(books.map((b) => b.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = books.map((b) => b.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif">Books Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage library catalog, verify Cloudflare R2 PDFs, and publish books to the live site.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBooks}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onAddNewBook}
            className="px-4 py-2 rounded-xl bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#C5A869]" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Title, Author, or ISBN..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedAuthor}
              onChange={(e) => {
                setSelectedAuthor(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
            >
              <option value="all">All Authors</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as 'all' | 'published' | 'draft');
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
            >
              <option value="all">Status: All</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="title-asc">Title: A-Z</option>
              <option value="title-desc">Title: Z-A</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Quick:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFeatured(selectedFeatured === true ? 'all' : true);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedFeatured === true
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Featured Only</span>
            </button>

            {(selectedCategory !== 'all' ||
              selectedAuthor !== 'all' ||
              selectedStatus !== 'all' ||
              selectedFeatured !== 'all' ||
              search) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedAuthor('all');
                  setSelectedStatus('all');
                  setSelectedFeatured('all');
                  setPage(1);
                }}
                className="text-xs text-rose-600 hover:underline font-semibold ml-2 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="text-gray-500 text-xs">
            Showing <strong className="text-gray-900">{books.length}</strong> of{' '}
            <strong className="text-gray-900">{totalBooks}</strong> books
          </div>
        </div>
      </div>

      {/* Bulk Actions Floating Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-[#12281E] text-white p-3.5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-[#C5A869]">
              {selectedIds.length} book{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-white/70 hover:text-white underline cursor-pointer"
            >
              Deselect all
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Publish Selected
            </button>

            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => handleBulkAction('draft')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
            >
              Move to Draft
            </button>

            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => handleBulkAction('feature')}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer"
            >
              Mark Featured
            </button>

            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Books Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200/80 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-10">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {allCurrentPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#1A3E2F]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Cover</th>
                <th className="py-3 px-3">Book Title & Details</th>
                <th className="py-3 px-3">Author</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">PDF Status</th>
                <th className="py-3 px-3">Featured</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#1A3E2F]" />
                      <span className="text-xs">Loading books repository...</span>
                    </div>
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-500">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700">No books found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try adjusting your search query or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                books.map((book) => {
                  const isSelected = selectedIds.includes(book.id);
                  const hasPdf = Boolean(book.pdfObjectKey || book.pdfUrl);

                  return (
                    <tr
                      key={book.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(book.id)}
                          className="text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#1A3E2F]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Cover Thumbnail */}
                      <td className="py-3 px-3">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-9 h-12 rounded object-cover shadow-2xs border border-gray-200"
                          />
                        ) : (
                          <div
                            className="w-9 h-12 rounded flex items-center justify-center text-white text-[10px] font-bold shadow-2xs"
                            style={{ backgroundColor: book.accentColor || '#1A3E2F' }}
                          >
                            {book.titleUrdu ? book.titleUrdu.slice(0, 1) : 'ک'}
                          </div>
                        )}
                      </td>

                      {/* Title & Info */}
                      <td className="py-3 px-3">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 leading-tight truncate max-w-[200px] sm:max-w-[260px]">
                            {book.title}
                          </p>
                          {book.titleUrdu && (
                            <p className="text-gray-500 font-urdu text-[11px] leading-snug">
                              {book.titleUrdu}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono">
                            <span>{book.pages} pgs</span>
                            <span>•</span>
                            <span>{book.publicationYear}</span>
                            {book.isbn && (
                              <>
                                <span>•</span>
                                <span>{book.isbn}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-3 px-3 text-gray-700 truncate max-w-[130px]">
                        {book.authorName}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-gray-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                          {book.categoryName}
                        </span>
                      </td>

                      {/* PDF Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {hasPdf ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>B2 Attached</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>No PDF</span>
                          </span>
                        )}
                      </td>

                      {/* Featured */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(book)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            book.isFeatured
                              ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                              : 'text-gray-300 hover:text-gray-500'
                          }`}
                          title={book.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          <Sparkles className="w-4 h-4 fill-current" />
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(book)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                            book.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {book.status === 'published' ? '● Published' : '○ Draft'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview View Modal */}
                          <button
                            type="button"
                            onClick={() => setPreviewBook(book)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                            title="Preview Book Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEditBook(book.id)}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                            title="Edit Book"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setBookToDelete(book)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                            title="Delete Book"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Books per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1A3E2F]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-400">| Total: {totalBooks} books</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="Are you sure you want to delete this book?"
        message={`Deleting "${bookToDelete?.title}" will permanently remove it from Supabase and delete its PDF file from Cloudflare R2.`}
        confirmLabel="Yes, Delete Book"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isActionLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBookToDelete(null)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title={`Delete ${selectedIds.length} selected books?`}
        message={`This will permanently remove ${selectedIds.length} books and their associated PDF files from Cloudflare R2.`}
        confirmLabel={`Delete ${selectedIds.length} Books`}
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isActionLoading}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      {/* Preview Modal */}
      {previewBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setPreviewBook(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4">
              {previewBook.coverUrl ? (
                <img
                  src={previewBook.coverUrl}
                  alt={previewBook.title}
                  className="w-20 h-28 object-cover rounded-lg shadow-sm border border-gray-200 shrink-0"
                />
              ) : (
                <div
                  className="w-20 h-28 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: previewBook.accentColor || '#1A3E2F' }}
                >
                  {previewBook.titleUrdu ? previewBook.titleUrdu.slice(0, 1) : 'ک'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-[#C5A869] tracking-wider block">
                  {previewBook.categoryName}
                </span>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {previewBook.title}
                </h3>
                {previewBook.titleUrdu && (
                  <p className="text-xs text-gray-600 font-urdu mt-0.5">{previewBook.titleUrdu}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">Author: {previewBook.authorName}</p>

                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      previewBook.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {previewBook.status.toUpperCase()}
                  </span>
                  {previewBook.isFeatured && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      FEATURED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <p className="line-clamp-3 leading-relaxed">
                {previewBook.shortDescription || previewBook.description || 'No description provided.'}
              </p>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-[11px] font-mono">
                <div>
                  <span className="text-gray-400">Pages:</span> {previewBook.pages}
                </div>
                <div>
                  <span className="text-gray-400">B2 Object Key:</span>{' '}
                  <span className="truncate inline-block max-w-[300px] align-bottom">
                    {previewBook.pdfObjectKey || 'None'}
                  </span>
                </div>
                {previewBook.pdfSize && (
                  <div>
                    <span className="text-gray-400">File Size:</span>{' '}
                    {storageService.formatBytes(previewBook.pdfSize)}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPreviewBook(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = previewBook.id;
                  setPreviewBook(null);
                  onEditBook(id);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1A3E2F] hover:bg-[#133224] rounded-lg cursor-pointer"
              >
                Edit Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
