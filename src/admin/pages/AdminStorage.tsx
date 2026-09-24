import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';
import { AdminBook } from '../../types/admin';
import { bookService } from '../../services/bookService';
import { storageService } from '../../services/storageService';
import { ToastMessage } from '../components/Toast';

interface AdminStorageProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminStorage: React.FC<AdminStorageProps> = ({ onShowToast }) => {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [status, setStatus] = useState<{
    b2: {
      configured: boolean;
      status: string;
      bucketName: string;
      endpoint: string | null;
      region: string;
      message: string;
    };
    supabase: { configured: boolean; status: string; url: string | null; message: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const loadStorageData = async () => {
    setIsLoading(true);
    try {
      const [allBooks, storageStatus] = await Promise.all([
        bookService.getAllStoredBooks(),
        storageService.getStorageStatus(),
      ]);
      setBooks(allBooks);
      setStatus(storageStatus);
    } catch (err) {
      console.error('Error fetching storage stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const refreshed = await storageService.getStorageStatus();
      setStatus(refreshed);
      if (refreshed.b2.configured) {
        onShowToast({
          type: 'success',
          title: 'Backblaze B2 Connected',
          message: `Private bucket "${refreshed.b2.bucketName}" (${refreshed.b2.region}) is ready for PDF uploads.`,
        });
      } else {
        onShowToast({
          type: 'info',
          title: 'B2 Pending Configuration',
          message: 'Add B2_KEY_ID & B2_APPLICATION_KEY in .env to connect your private bucket.',
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const totalBooks = books.length;
  const booksWithPdf = books.filter((b) => Boolean(b.pdfObjectKey || b.pdfUrl));
  const missingPdfBooks = books.filter((b) => !b.pdfObjectKey && !b.pdfUrl);
  const totalBytes = books.reduce((acc, b) => acc + (b.pdfSize || 0), 0);
  const avgBytes = booksWithPdf.length > 0 ? Math.round(totalBytes / booksWithPdf.length) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif">Backblaze B2 & Storage Architecture</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Private S3-compatible cloud storage monitoring for digital book PDFs and Supabase metadata.
          </p>
        </div>

        <button
          type="button"
          disabled={isTesting}
          onClick={handleTestConnection}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-2xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
          <span>Test Storage Connectivity</span>
        </button>
      </div>

      {/* Cloud Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backblaze B2 Card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A869]/20 text-[#C5A869] flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Backblaze B2 (PDF Files)</h3>
                <span className="text-[10px] text-gray-400 font-mono">Private S3-Compatible Storage</span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                status?.b2.configured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {status?.b2.configured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Configured & Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Sandbox Staging</span>
                </>
              )}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Target Bucket:</span>
              <strong className="text-gray-900 font-mono">{status?.b2.bucketName || 'book-library-pdfs-727'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bucket Access Policy:</span>
              <strong className="text-[#1A3E2F] font-bold">Private (Signed URLs Only)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">B2 Region / Endpoint:</span>
              <span className="text-gray-700 font-mono text-[11px] truncate max-w-[220px]">
                {status?.b2.endpoint || `${status?.b2.region || 'us-east-005'}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status Diagnosis:</span>
              <span className="text-gray-700 truncate max-w-[240px]">{status?.b2.message}</span>
            </div>
          </div>
        </div>

        {/* Supabase Database Card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A3E2F]/10 text-[#1A3E2F] flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Supabase (Metadata & Auth)</h3>
                <span className="text-[10px] text-gray-400 font-mono">PostgreSQL + RLS</span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                status?.supabase.configured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {status?.supabase.configured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Configured & Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Sandbox Staging</span>
                </>
              )}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Project Endpoint:</span>
              <strong className="text-gray-900 font-mono truncate max-w-[200px]">
                {status?.supabase.url || 'Not configured in .env'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Row Level Security (RLS):</span>
              <strong className="text-emerald-700 font-bold">Enabled in schema.sql</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status Diagnosis:</span>
              <span className="text-gray-700">{status?.supabase.message}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Allocation Metrics */}
      <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#1A3E2F]" />
          <span>Storage Usage Diagnostics</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 block">Total Books</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{totalBooks}</span>
            <span className="text-[10px] text-gray-400">catalog entries</span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 block">PDFs Attached</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {booksWithPdf.length}
            </span>
            <span className="text-[10px] text-gray-400">ready to read</span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 block">Missing PDFs</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">
              {missingPdfBooks.length}
            </span>
            <span className="text-[10px] text-gray-400">needs upload</span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 block">Total B2 Storage</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">
              {storageService.formatBytes(totalBytes)}
            </span>
            <span className="text-[10px] text-gray-400">actual file size</span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 block">Average Book Size</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">
              {storageService.formatBytes(avgBytes)}
            </span>
            <span className="text-[10px] text-gray-400">per complete PDF</span>
          </div>
        </div>
      </div>

      {/* File Storage Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">PDF Files in Library Catalog</h3>
          <span className="text-xs text-gray-500">
            {booksWithPdf.length} files attached
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200/80 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-3">B2 Object Key</th>
                <th className="py-3 px-3">File Size</th>
                <th className="py-3 px-3">Pages</th>
                <th className="py-3 px-4 text-right">PDF Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
              {books.slice(0, 15).map((book) => {
                const hasPdf = Boolean(book.pdfObjectKey || book.pdfUrl);
                return (
                  <tr key={book.id} className="hover:bg-gray-50/70">
                    <td className="py-3 px-4 font-sans font-bold text-gray-900 truncate max-w-[200px]">
                      {book.title}
                    </td>
                    <td className="py-3 px-3 text-gray-600 truncate max-w-[280px]">
                      {book.pdfObjectKey || <span className="text-gray-300">None</span>}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {book.pdfSize ? storageService.formatBytes(book.pdfSize) : '—'}
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-sans">{book.pages}</td>
                    <td className="py-3 px-4 text-right">
                      {hasPdf ? (
                        <span className="font-sans px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active in B2
                        </span>
                      ) : (
                        <span className="font-sans px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Missing PDF
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
