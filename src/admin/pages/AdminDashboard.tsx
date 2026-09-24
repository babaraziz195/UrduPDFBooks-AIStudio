import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileEdit,
  Sparkles,
  FolderTree,
  Users,
  HardDrive,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Cloud,
  Database,
  Eye,
} from 'lucide-react';
import { AdminBook, AdminAuditLog, AdminView } from '../../types/admin';
import { bookService } from '../../services/bookService';
import { categoryService } from '../../services/categoryService';
import { authorService } from '../../services/authorService';
import { storageService } from '../../services/storageService';

interface AdminDashboardProps {
  onNavigate: (view: AdminView, subFilter?: string) => void;
  onEditBook: (bookId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onEditBook }) => {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [authorsCount, setAuthorsCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [storageStatus, setStorageStatus] = useState<{
    b2: { configured: boolean; status: string; bucketName: string; message: string };
    supabase: { configured: boolean; status: string; url: string | null; message: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [allBooks, allCategories, allAuthors, logs, storage] = await Promise.all([
          bookService.getAllStoredBooks(),
          categoryService.getCategories(),
          authorService.getAuthors(),
          bookService.getActivityLogs(),
          storageService.getStorageStatus(),
        ]);

        setBooks(allBooks);
        setCategoriesCount(allCategories.length);
        setAuthorsCount(allAuthors.length);
        setRecentLogs(logs);
        setStorageStatus(storage);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalBooks = books.length;
  const publishedBooks = books.filter((b) => b.status === 'published').length;
  const draftBooks = books.filter((b) => b.status === 'draft').length;
  const featuredBooks = books.filter((b) => b.isFeatured).length;
  const booksWithPdf = books.filter((b) => Boolean(b.pdfObjectKey || b.pdfUrl)).length;
  const totalPdfBytes = books.reduce((acc, b) => acc + (b.pdfSize || 0), 0);
  const avgPdfBytes = booksWithPdf > 0 ? Math.round(totalPdfBytes / booksWithPdf) : 0;
  const recentBooks = books.slice(0, 5);

  const kpiCards = [
    {
      label: 'Total Catalog Books',
      value: totalBooks,
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: () => onNavigate('books'),
    },
    {
      label: 'Published Books',
      value: publishedBooks,
      icon: CheckCircle2,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      action: () => onNavigate('books', 'published'),
    },
    {
      label: 'Draft Books',
      value: draftBooks,
      icon: FileEdit,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      action: () => onNavigate('books', 'draft'),
    },
    {
      label: 'Featured Books',
      value: featuredBooks,
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      action: () => onNavigate('books', 'featured'),
    },
    {
      label: 'Active Categories',
      value: categoriesCount,
      icon: FolderTree,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      action: () => onNavigate('categories'),
    },
    {
      label: 'Classical Authors',
      value: authorsCount,
      icon: Users,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      action: () => onNavigate('authors'),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl shadow-xs border border-gray-200/80" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200/80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Hero */}
      <div className="bg-gradient-to-r from-[#1A3E2F] via-[#12281E] to-[#1A3E2F] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-[#C5A869]/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-[#C5A869] font-medium mb-3 border border-white/10">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Library Catalog Health: Excellent</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif">
              UrduPDFBooks Overview
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl leading-relaxed">
              Manage complete classical diwans, upload high-resolution PDFs directly to Backblaze B2, and sync reader metadata with Supabase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('add-book')}
              className="px-5 py-2.5 rounded-xl bg-[#C5A869] hover:bg-[#b89a5b] text-[#12281E] text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Book</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('storage')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-white/15"
            >
              <HardDrive className="w-4 h-4 text-[#C5A869]" />
              <span>Storage Monitor</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-gray-200/80 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 block leading-tight">
                  {card.value}
                </span>
                <span className="text-[11px] font-medium text-gray-500 mt-1 block">
                  {card.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Storage Info + System Connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1A3E2F]/10 text-[#1A3E2F] flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Backblaze B2 Storage Metrics</h3>
                <p className="text-xs text-gray-500">Private S3-compatible cloud storage for PDF books</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('storage')}
              className="text-xs text-[#1A3E2F] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Storage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block">Total Storage Used</span>
              <span className="text-lg font-bold text-gray-900 mt-1 block">
                {storageService.formatBytes(totalPdfBytes)}
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block">Books With PDF</span>
              <span className="text-lg font-bold text-emerald-700 mt-1 block">
                {booksWithPdf} <span className="text-xs text-gray-400 font-normal">/ {totalBooks}</span>
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block">Average Book Size</span>
              <span className="text-lg font-bold text-gray-900 mt-1 block">
                {storageService.formatBytes(avgPdfBytes)}
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block">Missing PDFs</span>
              <span className="text-lg font-bold text-amber-700 mt-1 block">
                {totalBooks - booksWithPdf}
              </span>
            </div>
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>Backend & Cloud Connectivity</span>
            </h3>

            <div className="space-y-3.5">
              {/* Backblaze B2 */}
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                <Cloud className="w-5 h-5 text-[#C5A869] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">Backblaze B2 Bucket</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        storageStatus?.b2?.configured
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {storageStatus?.b2?.configured ? 'Active' : 'Sandbox Ready'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {storageStatus?.b2?.bucketName || 'book-library-pdfs-727'}
                  </p>
                </div>
              </div>

              {/* Supabase */}
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                <Database className="w-5 h-5 text-[#1A3E2F] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">Supabase DB & Auth</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        storageStatus?.supabase.configured
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {storageStatus?.supabase.configured ? 'Connected' : 'Sandbox Mode'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {storageStatus?.supabase.url || 'Configure in .env'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="w-full mt-4 py-2 px-3 text-center text-xs font-semibold text-[#1A3E2F] hover:bg-[#1A3E2F]/5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          >
            Review Setup Instructions (SETUP.md)
          </button>
        </div>
      </div>

      {/* Two Columns: Recently Added Books & Recent Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added Books Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900">Recently Added Books</h3>
            <button
              type="button"
              onClick={() => onNavigate('books')}
              className="text-xs text-[#1A3E2F] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Book</th>
                  <th className="pb-3">Author</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Pages</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-10 rounded bg-[#1A3E2F] text-white flex items-center justify-center text-[10px] font-urdu shrink-0 shadow-2xs">
                          {book.titleUrdu ? book.titleUrdu.slice(0, 1) : 'ک'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-[220px]">
                            {book.title}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {book.isbn || book.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600 truncate max-w-[120px]">{book.authorName}</td>
                    <td className="py-3 text-gray-600">{book.categoryName}</td>
                    <td className="py-3 text-gray-600 font-mono">{book.pages}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          book.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onEditBook(book.id)}
                        className="text-xs text-[#1A3E2F] hover:underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Admin Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>Recent Activity</span>
            </h3>
            <span className="text-[11px] text-gray-400">Audit Trail</span>
          </div>

          <div className="space-y-4">
            {recentLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#1A3E2F] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 truncate max-w-[140px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px] truncate">{log.targetTitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
