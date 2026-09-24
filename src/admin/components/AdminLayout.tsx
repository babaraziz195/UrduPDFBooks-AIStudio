import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  FolderTree,
  Users,
  HardDrive,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  FileEdit,
  CheckCircle2,
  Database,
  Cloud,
  ChevronRight,
} from 'lucide-react';
import { AdminView, AdminUser } from '../../types/admin';
import { storageService } from '../../services/storageService';

interface AdminLayoutProps {
  currentView: AdminView;
  subFilter?: string;
  onNavigate: (view: AdminView, subFilter?: string) => void;
  onBackToWebsite: () => void;
  onLogout: () => void;
  user: AdminUser;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentView,
  subFilter,
  onNavigate,
  onBackToWebsite,
  onLogout,
  user,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{
    b2Configured: boolean;
    supabaseConfigured: boolean;
  }>({ b2Configured: false, supabaseConfigured: false });

  useEffect(() => {
    storageService.getStorageStatus().then((res) => {
      setStorageStatus({
        b2Configured: res.b2.configured,
        supabaseConfigured: res.supabase.configured,
      });
    });
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'All Books', icon: BookOpen },
    { id: 'add-book', label: 'Add New Book', icon: PlusCircle, isAction: true },
    { id: 'published-books', label: 'Published Books', icon: CheckCircle2, view: 'books', filter: 'published' },
    { id: 'draft-books', label: 'Draft Books', icon: FileEdit, view: 'books', filter: 'draft' },
    { id: 'featured-books', label: 'Featured Books', icon: Sparkles, view: 'books', filter: 'featured' },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'authors', label: 'Authors', icon: Users },
    { id: 'storage', label: 'Storage & B2', icon: HardDrive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-gray-900 flex flex-col md:flex-row">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 w-64 bg-[#12281E] text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A869]/20 border border-[#C5A869]/40 flex items-center justify-center text-[#C5A869]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block text-sm">
                Urdu<span className="text-[#C5A869]">PDF</span>Books
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/60 block font-semibold">
                Admin Console
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white/70 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const targetView = (item.view || item.id) as AdminView;
            const isActive =
              currentView === targetView &&
              (!item.filter || subFilter === item.filter);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(targetView, item.filter);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C5A869] text-[#12281E] shadow-sm font-bold'
                    : item.isAction
                    ? 'text-[#C5A869] hover:bg-white/5 border border-[#C5A869]/30 my-2'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#12281E]' : 'text-white/70'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </nav>

        {/* Integration Status Indicators */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-white/5 border border-white/10 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-white/80">
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-[#C5A869]" /> Backblaze B2:
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                storageStatus.b2Configured
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {storageStatus.b2Configured ? 'Connected' : 'Sandbox'}
            </span>
          </div>

          <div className="flex items-center justify-between text-white/80">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#C5A869]" /> Supabase:
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                storageStatus.supabaseConfigured
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {storageStatus.supabaseConfigured ? 'Connected' : 'Sandbox'}
            </span>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={onBackToWebsite}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#C5A869]" />
            <span>View Public Website</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 capitalize leading-tight">
                {currentView === 'add-book'
                  ? 'Add New Book'
                  : currentView === 'edit-book'
                  ? 'Edit Book'
                  : currentView === 'books'
                  ? subFilter
                    ? `${subFilter.toUpperCase()} Books`
                    : 'Books Directory'
                  : currentView}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                UrduPDFBooks Digital Library Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentView !== 'add-book' && (
              <button
                type="button"
                onClick={() => onNavigate('add-book')}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#C5A869]" />
                <span>Add Book</span>
              </button>
            )}

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#1A3E2F] text-[#C5A869] font-bold text-xs flex items-center justify-center">
                {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-gray-900 leading-none truncate max-w-[140px]">
                  {user.email || 'Admin'}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">Authorized Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
