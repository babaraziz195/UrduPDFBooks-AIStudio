import React, { useState, useEffect } from 'react';
import { ViewMode, NavigationState } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { InfoModal } from './components/InfoModal';

// Pages
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { AuthorsPage } from './pages/AuthorsPage';
import { AuthorDetailPage } from './pages/AuthorDetailPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { PdfReaderPage } from './pages/PdfReaderPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { ContactPage } from './pages/ContactPage';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AdminApp } from './admin/AdminApp';

export default function App() {
  const [navState, setNavState] = useState<NavigationState>(() => {
    const isInitialAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    return {
      currentView: isInitialAdmin ? 'admin' : 'home',
      selectedBookId: 'peer-e-kamil',
      selectedCategoryId: 'urdu-novels',
      selectedAuthorId: 'allama-iqbal',
      searchQuery: '',
    };
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<'about' | 'contact' | 'privacy' | 'terms' | null>(null);

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navState.currentView, navState.selectedBookId, navState.selectedCategoryId, navState.selectedAuthorId]);

  // Global keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: ViewMode) => {
    if (view === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    } else if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', '/');
    }

    setNavState((prev) => ({
      ...prev,
      currentView: view,
    }));
  };

  const handleSelectBook = (bookId: string) => {
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', '/');
    }
    setNavState((prev) => ({
      ...prev,
      selectedBookId: bookId,
      currentView: 'book-detail',
    }));
  };

  const handleReadBook = (bookId: string) => {
    setNavState((prev) => ({
      ...prev,
      selectedBookId: bookId,
      currentView: 'pdf-reader',
    }));
  };

  const handleSelectCategory = (categoryId: string) => {
    setNavState((prev) => ({
      ...prev,
      selectedCategoryId: categoryId,
      currentView: 'category-detail',
    }));
  };

  const handleSelectAuthor = (authorId: string) => {
    setNavState((prev) => ({
      ...prev,
      selectedAuthorId: authorId,
      currentView: 'author-detail',
    }));
  };

  const handleSearchSubmit = (query: string) => {
    setNavState((prev) => ({
      ...prev,
      searchQuery: query,
      currentView: 'search-results',
    }));
  };

  // Dedicated Admin Portal
  if (navState.currentView === 'admin') {
    return (
      <AdminApp
        onBackToWebsite={() => handleNavigate('home')}
        onViewPublicBook={(bookId) => handleSelectBook(bookId)}
      />
    );
  }

  // If in dedicated PDF reader mode, render reader full-screen with floating WhatsApp
  if (navState.currentView === 'pdf-reader') {
    return (
      <>
        <PdfReaderPage
          bookId={navState.selectedBookId || 'peer-e-kamil'}
          onNavigate={handleNavigate}
          onBackToBook={(bookId) => {
            setNavState((prev) => ({
              ...prev,
              selectedBookId: bookId,
              currentView: 'book-detail',
            }));
          }}
        />
        <FloatingWhatsApp />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1F2421]">
      {/* Sticky Header */}
      <Header
        currentView={navState.currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {navState.currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onReadBook={handleReadBook}
            onSelectCategory={handleSelectCategory}
            onSelectAuthor={handleSelectAuthor}
            onSearchSubmit={handleSearchSubmit}
          />
        )}

        {navState.currentView === 'library' && (
          <LibraryPage
            onSelectBook={handleSelectBook}
            onReadBook={handleReadBook}
          />
        )}

        {navState.currentView === 'categories' && (
          <CategoriesPage
            onSelectCategory={handleSelectCategory}
          />
        )}

        {navState.currentView === 'category-detail' && (
          <CategoryDetailPage
            categoryId={navState.selectedCategoryId || 'urdu-novels'}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onReadBook={handleReadBook}
          />
        )}

        {navState.currentView === 'authors' && (
          <AuthorsPage
            onSelectAuthor={handleSelectAuthor}
          />
        )}

        {navState.currentView === 'author-detail' && (
          <AuthorDetailPage
            authorId={navState.selectedAuthorId || 'allama-iqbal'}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onReadBook={handleReadBook}
          />
        )}

        {navState.currentView === 'book-detail' && (
          <BookDetailPage
            bookId={navState.selectedBookId || 'peer-e-kamil'}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onReadBook={handleReadBook}
            onSelectAuthor={handleSelectAuthor}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {navState.currentView === 'search-results' && (
          <SearchResultsPage
            initialQuery={navState.searchQuery || ''}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onReadBook={handleReadBook}
          />
        )}

        {navState.currentView === 'contact' && (
          <ContactPage
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Floating WhatsApp Button on Every Page */}
      <FloatingWhatsApp />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={handleSelectBook}
        onViewAllResults={handleSearchSubmit}
      />

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenInfo={(type) => setInfoModalType(type)}
      />

      {/* Legal & Informational Modals */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />
    </div>
  );
}
