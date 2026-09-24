import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Cloud,
  Database,
  Download,
  Copy,
  CheckCircle2,
  FileCode,
  ExternalLink,
  Info,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { bookService } from '../../services/bookService';
import { ToastMessage } from '../components/Toast';

interface AdminSettingsProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onShowToast }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    storageService.getStorageStatus().then((s) => setStatus(s));
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    onShowToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Snippet copied successfully.',
    });
  };

  const handleExportBackup = async () => {
    try {
      const books = await bookService.getAllStoredBooks();
      const blob = new Blob([JSON.stringify(books, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urdupdfbooks-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast({
        type: 'success',
        title: 'Catalog Exported',
        message: 'JSON backup file has been generated.',
      });
    } catch {
      onShowToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not export backup.',
      });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-serif">System Settings & Integrations</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Configuration reference for Supabase PostgreSQL and Cloudflare R2 bucket connectivity.
        </p>
      </div>

      {/* Integration Verification Checklist */}
      <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1A3E2F]" />
          <span>Production Infrastructure Checklist</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Database Schema SQL Created</h4>
              <p className="text-gray-500 mt-0.5">
                The ready-to-run <code>supabase-schema.sql</code> script contains all tables, indexes, updated_at triggers, and Row Level Security policies.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Private Backblaze B2 Backend & Presigned URLs</h4>
              <p className="text-gray-500 mt-0.5">
                S3-compatible B2 private bucket integration. Presigned upload & download URLs generated securely on the server. Your Backblaze Application Key is never exposed to browser clients.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Safe Client / Secret Server Separation</h4>
              <p className="text-gray-500 mt-0.5">
                Client credentials use <code>VITE_</code> prefixes; Backblaze B2 secrets remain server-side only.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables Reference */}
      <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#1A3E2F]" />
            <span>Required Environment Variables (.env)</span>
          </h3>
          <button
            type="button"
            onClick={() =>
              handleCopy(
                `VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJ...\nB2_KEY_ID=your_b2_key_id\nB2_APPLICATION_KEY=your_b2_application_key\nB2_BUCKET_NAME=book-library-pdfs-727\nB2_ENDPOINT=https://s3.us-east-005.backblazeb2.com\nB2_REGION=us-east-005`,
                'env'
              )
            }
            className="text-xs text-[#1A3E2F] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            {copied === 'env' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Template</span>
          </button>
        </div>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
          <span className="text-gray-500"># Safe Client-Side (Prefixed with VITE_)</span><br />
          <span className="text-emerald-400">VITE_SUPABASE_URL</span>="https://xyzcompany.supabase.co"<br />
          <span className="text-emerald-400">VITE_SUPABASE_ANON_KEY</span>="eyJh..."<br /><br />
          <span className="text-gray-500"># Secret Server-Side (Never exposed to browser)</span><br />
          <span className="text-amber-400">B2_KEY_ID</span>="your_b2_key_id_here"<br />
          <span className="text-amber-400">B2_APPLICATION_KEY</span>="your_b2_application_key_here"<br />
          <span className="text-amber-400">B2_BUCKET_NAME</span>="book-library-pdfs-727"<br />
          <span className="text-amber-400">B2_ENDPOINT</span>="https://s3.us-east-005.backblazeb2.com"<br />
          <span className="text-amber-400">B2_REGION</span>="us-east-005"<br />
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          See <strong className="text-gray-800">SETUP.md</strong> in your project root for a beginner-friendly click-by-click manual guide.
        </p>
      </div>

      {/* Catalog Backup & Recovery */}
      <div className="bg-white rounded-2xl p-6 shadow-2xs border border-gray-200/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Backup Library Catalog</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Download a full JSON archive of all books, metadata, and storage object keys.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportBackup}
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Catalog JSON</span>
        </button>
      </div>
    </div>
  );
};
