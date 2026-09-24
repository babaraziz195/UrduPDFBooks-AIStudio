import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Cloud,
  HardDrive,
  Plus,
  X,
  ExternalLink,
} from 'lucide-react';
import { AdminBook, AdminCategory, AdminAuthor } from '../../types/admin';
import { bookService } from '../../services/bookService';
import { categoryService } from '../../services/categoryService';
import { authorService } from '../../services/authorService';
import { storageService, B2UploadResult } from '../../services/storageService';
import { ToastMessage } from '../components/Toast';

interface AdminBookFormProps {
  bookId?: string | null; // null for add mode, string for edit mode
  onBack: () => void;
  onSuccess: () => void;
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminBookForm: React.FC<AdminBookFormProps> = ({
  bookId,
  onBack,
  onSuccess,
  onShowToast,
}) => {
  const isEditMode = Boolean(bookId);

  // Form Fields
  const [title, setTitle] = useState('');
  const [titleUrdu, setTitleUrdu] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [language, setLanguage] = useState('Urdu');
  const [publicationYear, setPublicationYear] = useState<number>(2026);
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [pages, setPages] = useState<number>(150);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Cover Image State
  const [coverUrl, setCoverUrl] = useState('');
  const [coverSize, setCoverSize] = useState<number | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);

  // Cloudflare R2 PDF State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfObjectKey, setPdfObjectKey] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfSize, setPdfSize] = useState<number>(0);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  // Lists & Metadata
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [authors, setAuthors] = useState<AdminAuthor[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Inline Modal for Category / Author
  const [quickModal, setQuickModal] = useState<'category' | 'author' | null>(null);
  const [quickName, setQuickName] = useState('');

  // Refs for file pickers
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Load existing book (if edit mode) and categories/authors
  useEffect(() => {
    async function loadData() {
      setIsLoadingInitial(true);
      try {
        const [cats, auths] = await Promise.all([
          categoryService.getCategories(),
          authorService.getAuthors(),
        ]);
        setCategories(cats);
        setAuthors(auths);

        if (isEditMode && bookId) {
          const book = await bookService.getBookById(bookId);
          if (book) {
            setTitle(book.title);
            setTitleUrdu(book.titleUrdu || '');
            setSlug(book.slug);
            setSubtitle(book.subtitle || '');
            setAuthorId(book.authorId || '');
            setAuthorName(book.authorName);
            setCategoryId(book.categoryId || '');
            setCategoryName(book.categoryName);
            setLanguage(book.language);
            setPublicationYear(book.publicationYear);
            setPublisher(book.publisher || '');
            setIsbn(book.isbn || '');
            setPages(book.pages);
            setShortDescription(book.shortDescription || '');
            setDescription(book.description || '');
            setKeywords(book.keywords?.join(', ') || '');
            setCoverUrl(book.coverUrl || '');
            setPdfObjectKey(book.pdfObjectKey || '');
            setPdfUrl(book.pdfUrl || '');
            setPdfFilename(book.pdfFilename || '');
            setPdfSize(book.pdfSize || 0);
            setIsFeatured(book.isFeatured);
            setIsPaid(Boolean(book.isPaid));
            setPrice(book.price || 0);
            setStatus(book.status);
            if (book.pdfObjectKey) {
              setPdfUploadSuccess(true);
            }
          }
        } else {
          // Defaults for new book
          if (cats.length > 0) {
            setCategoryId(cats[0].id);
            setCategoryName(cats[0].name);
          }
          if (auths.length > 0) {
            setAuthorId(auths[0].id);
            setAuthorName(auths[0].name);
          }
        }
      } catch (err) {
        console.error('Error loading book form data:', err);
      } finally {
        setIsLoadingInitial(false);
      }
    }

    loadData();
  }, [bookId, isEditMode]);

  // Auto-generate slug when title changes in Add Mode
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isEditMode || !slug) {
      const generated = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  // Handle Author selection
  const handleAuthorSelect = (id: string) => {
    setAuthorId(id);
    const found = authors.find((a) => a.id === id);
    if (found) setAuthorName(found.name);
  };

  // Handle Category selection
  const handleCategorySelect = (id: string) => {
    setCategoryId(id);
    const found = categories.find((c) => c.id === id);
    if (found) setCategoryName(found.name);
  };

  // Cover Image Selection & Upload
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setCoverProgress(10);
    try {
      const res = await storageService.uploadCover(file, (percent) => {
        setCoverProgress(percent);
      });
      setCoverUrl(res.url);
      setCoverSize(res.size);
      onShowToast({
        type: 'success',
        title: 'Cover Image Attached',
        message: `${file.name} (${storageService.formatBytes(file.size)}) uploaded.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cover upload failed';
      onShowToast({
        type: 'error',
        title: 'Cover Upload Error',
        message: msg,
      });
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // PDF File Selection
  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      onShowToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Only application/pdf documents (.pdf) can be uploaded.',
      });
      return;
    }

    setSelectedPdfFile(file);
    setPdfFilename(file.name);
    setPdfSize(file.size);
    setPdfUploadSuccess(false);
    setPdfUploadError(null);
  };

  // Backblaze B2 Upload Trigger
  const handleUploadPdfToB2 = async () => {
    if (!selectedPdfFile) return;

    setIsUploadingPdf(true);
    setPdfUploadProgress(5);
    setPdfUploadError(null);

    try {
      const result: B2UploadResult = await storageService.uploadPdf(
        selectedPdfFile,
        slug || 'catalog',
        (percent) => {
          setPdfUploadProgress(percent);
        }
      );

      setPdfObjectKey(result.key);
      setPdfUrl(result.url);
      setPdfFilename(result.filename);
      setPdfSize(result.size);
      setPdfUploadSuccess(true);

      onShowToast({
        type: 'success',
        title: 'PDF Uploaded to Backblaze B2',
        message: `Saved as "${result.key}" in private Backblaze B2 bucket.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload to Backblaze B2';
      setPdfUploadError(msg);
      onShowToast({
        type: 'error',
        title: 'B2 Upload Failed',
        message: msg,
      });
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Remove attached PDF
  const handleRemovePdf = async () => {
    if (pdfObjectKey) {
      await storageService.deletePdf(pdfObjectKey);
    }
    setSelectedPdfFile(null);
    setPdfObjectKey('');
    setPdfUrl('');
    setPdfFilename('');
    setPdfSize(0);
    setPdfUploadSuccess(false);
    setPdfUploadError(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    onShowToast({
      type: 'info',
      title: 'PDF Detached',
      message: 'The PDF reference was removed.',
    });
  };

  // Quick Add Category or Author inline
  const handleCreateQuickItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    try {
      if (quickModal === 'category') {
        const newCat = await categoryService.createCategory({
          name: quickName.trim(),
          slug: quickName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: '',
          iconName: 'Book',
          coverAccent: '#173E2D',
        });
        setCategories((prev) => [...prev, newCat]);
        setCategoryId(newCat.id);
        setCategoryName(newCat.name);
        onShowToast({
          type: 'success',
          title: 'Category Created',
          message: `"${newCat.name}" added to categories.`,
        });
      } else if (quickModal === 'author') {
        const newAuth = await authorService.createAuthor({
          name: quickName.trim(),
          slug: quickName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          bio: '',
        });
        setAuthors((prev) => [...prev, newAuth]);
        setAuthorId(newAuth.id);
        setAuthorName(newAuth.name);
        onShowToast({
          type: 'success',
          title: 'Author Created',
          message: `"${newAuth.name}" added to authors.`,
        });
      }
      setQuickModal(null);
      setQuickName('');
    } catch {
      onShowToast({
        type: 'error',
        title: 'Creation Failed',
        message: 'Could not create new item.',
      });
    }
  };

  // Form Submit Handler
  const handleSubmit = async (submitStatus: 'draft' | 'published') => {
    if (!title.trim()) {
      onShowToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Book Title is required.',
      });
      return;
    }

    if (!authorName.trim()) {
      onShowToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select or enter an Author.',
      });
      return;
    }

    if (!categoryName.trim()) {
      onShowToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select or enter a Category.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bookData = {
        title: title.trim(),
        titleUrdu: titleUrdu.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        subtitle: subtitle.trim(),
        authorId: authorId || undefined,
        authorName: authorName.trim(),
        categoryId: categoryId || undefined,
        categoryName: categoryName.trim(),
        language: language.trim() || 'Urdu',
        publicationYear: Number(publicationYear) || 2026,
        publisher: publisher.trim(),
        isbn: isbn.trim(),
        pages: Number(pages) || 0,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        keywords: keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        coverUrl: coverUrl.trim(),
        pdfObjectKey: pdfObjectKey.trim(),
        pdfUrl: pdfUrl.trim(),
        pdfFilename: pdfFilename.trim(),
        pdfSize: Number(pdfSize) || 0,
        isFeatured,
        isPaid,
        price: Number(price) || 0,
        status: submitStatus,
      };

      if (isEditMode && bookId) {
        await bookService.updateBook(bookId, bookData);
        onShowToast({
          type: 'success',
          title: 'Book Updated Successfully',
          message: `"${title}" has been updated in Supabase.`,
        });
      } else {
        await bookService.createBook(bookData);
        onShowToast({
          type: 'success',
          title: submitStatus === 'published' ? 'Book Published Live!' : 'Book Saved as Draft',
          message: `"${title}" was saved to Supabase library.`,
        });
      }

      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save book.';
      onShowToast({
        type: 'error',
        title: 'Save Error',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xs border border-gray-200 animate-pulse space-y-6">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Books</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting || isUploadingPdf}
            onClick={() => handleSubmit('draft')}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting || isUploadingPdf}
            onClick={() => handleSubmit('published')}
            className="px-5 py-2 rounded-xl bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#C5A869]" />
            )}
            <span>{isEditMode ? 'Update & Publish' : 'Publish Book Live'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Core Book Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Metadata Card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              1. Book Identity & Classification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Book Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Diwan-e-Ghalib, Pir-e-Kamil, Raja Gidh"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              {/* Title in Urdu Script */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Title (Urdu Script)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={titleUrdu}
                  onChange={(e) => setTitleUrdu(e.target.value)}
                  placeholder="دیوانِ غالب"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-urdu focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Complete Classical Edition"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              {/* SEO Slug */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    SEO Slug (URL identifier)
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Auto-generated from title
                  </span>
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono">
                  <span className="text-gray-400">/books/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 bg-transparent focus:outline-none text-gray-900 font-medium ml-1"
                  />
                </div>
              </div>

              {/* Author Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Author <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickModal('author')}
                    className="text-[11px] text-[#1A3E2F] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Author
                  </button>
                </div>
                <select
                  value={authorId}
                  onChange={(e) => handleAuthorSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                >
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Category <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickModal('category')}
                    className="text-[11px] text-[#1A3E2F] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Category
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Publishing & Physical Book Specs */}
          <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              2. Publication Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="Urdu"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Publication Year</label>
                <input
                  type="number"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(Number(e.target.value))}
                  placeholder="2026"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Total Pages</label>
                <input
                  type="number"
                  value={pages}
                  onChange={(e) => setPages(Number(e.target.value))}
                  placeholder="150"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ISBN</label>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-969-..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div className="col-span-2 sm:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Publisher</label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g. Ferozsons, Sang-e-Meel Publications, Ilm-o-Irfan"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>
            </div>
          </div>

          {/* 3. Descriptions & Tags */}
          <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              3. Book Description & SEO Tags
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Short Description (Catalog Summary)
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A concise 1-2 sentence overview of the book shown on library cards..."
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Synopsis / Literary Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Complete background, critical reception, themes, and reading context..."
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Keywords & Tags (comma separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="classical poetry, ghalib, diwan, urdu literature"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Cover Image & Backblaze B2 PDF Upload */}
        <div className="space-y-6">
          {/* Backblaze B2 PDF Storage Card (VERY IMPORTANT) */}
          <div className="bg-white rounded-2xl p-6 shadow-2xs border-2 border-[#1A3E2F]/20 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#C5A869]/20 text-[#C5A869] flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Backblaze B2 PDF Storage</h3>
                <span className="text-[10px] text-gray-500 block">
                  Private bucket • S3-compatible
                </span>
              </div>
            </div>

            {/* Hidden PDF Input */}
            <input
              type="file"
              ref={pdfInputRef}
              accept="application/pdf,.pdf"
              onChange={handlePdfFileSelect}
              className="hidden"
            />

            {/* Current Attached PDF Info */}
            {pdfObjectKey || pdfFilename ? (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-emerald-950 truncate max-w-[180px]">
                        {pdfFilename || 'book.pdf'}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {storageService.formatBytes(pdfSize)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    title="Remove PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {pdfObjectKey && (
                  <div className="text-[10px] font-mono text-emerald-800 bg-white/70 p-1.5 rounded border border-emerald-100 truncate">
                    B2 Key: {pdfObjectKey}
                  </div>
                )}
              </div>
            ) : null}

            {/* Upload Action / Selection Area */}
            {!pdfObjectKey && !selectedPdfFile && (
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 hover:border-[#1A3E2F] rounded-xl p-6 text-center transition-all bg-gray-50/50 hover:bg-white cursor-pointer group"
              >
                <Upload className="w-7 h-7 text-gray-400 group-hover:text-[#1A3E2F] mx-auto mb-2 transition-colors" />
                <p className="text-xs font-bold text-gray-700 group-hover:text-gray-900">
                  Select Book PDF
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Accepts only application/pdf</p>
              </button>
            )}

            {/* Pending Upload to R2 State */}
            {selectedPdfFile && !pdfUploadSuccess && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate">{selectedPdfFile.name}</p>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {storageService.formatBytes(selectedPdfFile.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPdfFile(null);
                      if (pdfInputRef.current) pdfInputRef.current.value = '';
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                {isUploadingPdf && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-gray-600">
                      <span>Streaming to Backblaze B2...</span>
                      <span>{pdfUploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1A3E2F] transition-all duration-150"
                        style={{ width: `${pdfUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {pdfUploadError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {pdfUploadError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={isUploadingPdf}
                  onClick={handleUploadPdfToB2}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploadingPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading ({pdfUploadProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 text-[#C5A869]" />
                      <span>Upload to Backblaze B2</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Replace Button if already uploaded */}
            {pdfObjectKey && (
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="w-full mt-2 py-2 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
              >
                Replace PDF File
              </button>
            )}
          </div>

          {/* Book Cover Image Card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Book Cover Art
            </h3>

            <input
              type="file"
              ref={coverInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleCoverFileChange}
              className="hidden"
            />

            {coverUrl ? (
              <div className="space-y-3">
                <div className="relative group mx-auto w-36 h-48 rounded-xl overflow-hidden border border-gray-200 shadow-md">
                  <img
                    src={coverUrl}
                    alt="Book Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white text-xs font-semibold"
                      title="Replace"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverUrl('');
                        setCoverSize(null);
                      }}
                      className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-center text-[11px] text-gray-500">
                  {coverSize && <span>File size: {storageService.formatBytes(coverSize)}</span>}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="w-full border-2 border-dashed border-gray-300 hover:border-[#1A3E2F] rounded-xl p-6 text-center transition-all bg-gray-50/50 hover:bg-white cursor-pointer group"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-[#1A3E2F] mx-auto mb-2 transition-colors" />
                <p className="text-xs font-bold text-gray-700 group-hover:text-gray-900">
                  Upload Book Cover
                </p>
                <p className="text-[11px] text-gray-400 mt-1">JPG, PNG, or WEBP (Max 10 MB)</p>
              </button>
            )}

            {isUploadingCover && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                  <span>Uploading cover...</span>
                  <span>{coverProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1A3E2F]"
                    style={{ width: `${coverProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visibility & Settings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Publishing Options
            </h3>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Featured Book</span>
                <span className="text-[11px] text-gray-500 block">
                  Promote on homepage spotlight
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                  isFeatured ? 'bg-[#1A3E2F]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isFeatured ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Paid / Free Toggle */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Book Access Tier</span>
                  <span className="text-[11px] text-gray-500 block">
                    {isPaid ? 'Premium (Requires Purchase)' : 'Free (Public Domain)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaid(!isPaid)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                    isPaid ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isPaid ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isPaid && (
                <div className="mt-2 p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-amber-900">
                    Book Price (PKR / $)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-800">
                    Paid books require authenticated user session & verified purchase record before generating short-lived B2 download URLs.
                  </p>
                </div>
              )}
            </div>

            {/* Status Selector */}
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-900 mb-2">
                Publishing Status
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                    status === 'draft'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Draft (Private)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                    status === 'published'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Published (Live)
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                {status === 'published'
                  ? '✓ Book will be immediately visible on public library.'
                  : '⚠ Draft books are hidden from public website visitors.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Category/Author Inline Modal */}
      {quickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900">
              Add New {quickModal === 'category' ? 'Category' : 'Author'}
            </h3>
            <form onSubmit={handleCreateQuickItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {quickModal === 'category' ? 'Category Name' : 'Author Name'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder={quickModal === 'category' ? 'e.g. Classical Masnavi' : 'e.g. Mir Taqi Mir'}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setQuickModal(null);
                    setQuickName('');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1A3E2F] hover:bg-[#133224] rounded-lg cursor-pointer"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
