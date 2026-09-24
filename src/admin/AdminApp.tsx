import React, { useState, useEffect } from 'react';
import { AdminView, AdminUser } from '../types/admin';
import { authService } from '../services/authService';
import { AdminLayout } from './components/AdminLayout';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminBooksList } from './pages/AdminBooksList';
import { AdminBookForm } from './pages/AdminBookForm';
import { AdminCategories } from './pages/AdminCategories';
import { AdminAuthors } from './pages/AdminAuthors';
import { AdminStorage } from './pages/AdminStorage';
import { AdminSettings } from './pages/AdminSettings';
import { ToastContainer, ToastMessage } from './components/Toast';

interface AdminAppProps {
  onBackToWebsite: () => void;
  onViewPublicBook: (bookId: string) => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onBackToWebsite, onViewPublicBook }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [subFilter, setSubFilter] = useState<string | undefined>(undefined);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Check existing session on mount
  useEffect(() => {
    authService.getSession().then((user) => {
      setCurrentUser(user);
      setIsCheckingAuth(false);
    });
  }, []);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (view: AdminView, filter?: string) => {
    setCurrentView(view);
    setSubFilter(filter);
    if (view !== 'edit-book') {
      setEditingBookId(null);
    }
  };

  const handleEditBook = (bookId: string) => {
    setEditingBookId(bookId);
    setCurrentView('edit-book');
  };

  const handleAddNewBook = () => {
    setEditingBookId(null);
    setCurrentView('add-book');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setCurrentView('dashboard');
    showToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been signed out of the admin panel.',
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1A3E2F]/20 border-t-[#1A3E2F] rounded-full animate-spin" />
          <span className="text-xs font-semibold">Verifying Administrator Session...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated: render secure Login view
  if (!currentUser) {
    return (
      <>
        <AdminLogin
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            showToast({
              type: 'success',
              title: 'Welcome Back',
              message: `Signed in as ${user.email}`,
            });
          }}
          onBackToWebsite={onBackToWebsite}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  // Authenticated: Render Admin Layout with selected view
  return (
    <>
      <AdminLayout
        currentView={currentView}
        subFilter={subFilter}
        onNavigate={handleNavigate}
        onBackToWebsite={onBackToWebsite}
        onLogout={handleLogout}
        user={currentUser}
      >
        {currentView === 'dashboard' && (
          <AdminDashboard
            onNavigate={handleNavigate}
            onEditBook={handleEditBook}
          />
        )}

        {currentView === 'books' && (
          <AdminBooksList
            initialFilter={subFilter}
            onAddNewBook={handleAddNewBook}
            onEditBook={handleEditBook}
            onViewPublicBook={onViewPublicBook}
            onShowToast={showToast}
          />
        )}

        {(currentView === 'add-book' || currentView === 'edit-book') && (
          <AdminBookForm
            bookId={editingBookId}
            onBack={() => setCurrentView('books')}
            onSuccess={() => {
              setCurrentView('books');
              setEditingBookId(null);
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'categories' && (
          <AdminCategories onShowToast={showToast} />
        )}

        {currentView === 'authors' && (
          <AdminAuthors onShowToast={showToast} />
        )}

        {currentView === 'storage' && (
          <AdminStorage onShowToast={showToast} />
        )}

        {currentView === 'settings' && (
          <AdminSettings onShowToast={showToast} />
        )}
      </AdminLayout>

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </>
  );
};
