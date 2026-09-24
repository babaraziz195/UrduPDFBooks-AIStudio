import React, { useState } from 'react';
import { ViewMode } from '../types';
import { BookOpen, Search, Menu, X, ArrowRight } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from '../constants/whatsapp';

interface HeaderProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onOpenSearch: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { label: string; view: ViewMode }[] = [
    { label: 'Home', view: 'home' },
    { label: 'Library', view: 'library' },
    { label: 'Categories', view: 'categories' },
    { label: 'Authors', view: 'authors' },
    { label: 'New Releases', view: 'library' },
    { label: 'Popular Books', view: 'library' },
  ];

  const handleNavClick = (view: ViewMode) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#1A3E2F]/12 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Zone (Single element lockup) */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3E2F] rounded"
          >
            <div className="w-9 h-9 rounded-md bg-[#1A3E2F] text-[#FAF8F5] flex items-center justify-center shadow-sm group-hover:bg-[#133224] transition-colors border border-[#C5A869]/30">
              <BookOpen className="w-5 h-5 text-[#C5A869]" />
            </div>
            <div>
              <span className="font-literary text-2xl font-bold tracking-tight text-[#1F2421] block leading-none">
                Urdu<span className="text-[#1A3E2F]">PDF</span>Books
              </span>
              <span className="font-urdu text-[11px] text-[#647067] block leading-none mt-1">
                آن لائن اردو ڈیجیٹل کتب خانہ
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#4A554E]">
            {navItems.map((item) => {
              const isActive =
                item.view === currentView &&
                item.label !== 'New Releases' &&
                item.label !== 'Popular Books';

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  className={`relative py-1 text-sm tracking-wide transition-colors cursor-pointer hover:text-[#1A3E2F] ${
                    isActive
                      ? 'text-[#1A3E2F] font-semibold'
                      : 'text-[#4A554E]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A3E2F] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions (Search & Browse Library) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search books and authors"
              className="flex items-center gap-2 py-2 px-3 sm:px-3.5 rounded-lg bg-white border border-[#1A3E2F]/12 text-[#647067] hover:text-[#1A3E2F] hover:border-[#1A3E2F]/30 hover:bg-[#F8F6F1] transition-all text-xs cursor-pointer shadow-2xs"
            >
              <Search className="w-4 h-4 text-[#1A3E2F]" />
              <span className="hidden sm:inline font-normal">Search library...</span>
              <kbd className="hidden md:inline-block text-[10px] bg-[#FAF8F5] border border-[#1A3E2F]/15 px-1.5 py-0.5 rounded text-[#7A8A7F]">
                ⌘K
              </kbd>
            </button>

            {/* Browse Library Primary CTA */}
            <button
              type="button"
              onClick={() => handleNavClick('library')}
              className="hidden sm:inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap border border-[#C5A869]/30"
            >
              <span>Browse Library</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A869]" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden p-2 rounded-lg text-[#1A3E2F] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-5/6 max-w-sm bg-[#FAF8F5] shadow-2xl p-6 flex flex-col justify-between border-l border-[#1A3E2F]/15">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1A3E2F]/12">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#1A3E2F] text-[#FAF8F5] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#C5A869]" />
                  </div>
                  <span className="font-literary text-xl font-bold text-[#1F2421]">
                    UrduPDFBooks
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md text-[#647067] hover:text-[#1A3E2F] hover:bg-[#EFECE5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSearch();
                  }}
                  className="w-full flex items-center gap-2.5 py-2.5 px-3.5 rounded-lg bg-white border border-[#1A3E2F]/15 text-sm text-[#647067] shadow-2xs"
                >
                  <Search className="w-4 h-4 text-[#1A3E2F]" />
                  <span>Search books, authors, categories...</span>
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="mt-6 flex flex-col space-y-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item.view)}
                    className="flex items-center justify-between w-full py-2.5 px-3 rounded-md text-sm font-medium text-[#1F2421] hover:bg-[#EFECE5] transition-colors text-left"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A869]" />
                  </button>
                ))}

                {/* WhatsApp Support in mobile drawer */}
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full py-2.5 px-3 rounded-md text-sm font-medium text-[#1F2421] hover:bg-[#EFECE5] transition-colors mt-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                      <WhatsAppIcon className="w-3 h-3" />
                    </span>
                    <span className="font-semibold text-[#1A3E2F]">WhatsApp Support</span>
                  </div>
                  <span className="font-mono text-xs text-[#647067]">{WHATSAPP_NUMBER}</span>
                </a>
              </nav>
            </div>

            {/* Bottom Mobile Action */}
            <div className="pt-6 border-t border-[#1A3E2F]/12">
              <button
                type="button"
                onClick={() => handleNavClick('library')}
                className="w-full py-3 px-4 rounded-lg bg-[#1A3E2F] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Browse Full Library</span>
                <ArrowRight className="w-4 h-4 text-[#C5A869]" />
              </button>
              <p className="text-center font-urdu text-xs text-[#7A8A7F] mt-3">
                مطالعہ اردو کتب — بلا معاوضہ آن لائن
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
