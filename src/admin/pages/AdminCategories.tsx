import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  X,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AdminCategory } from '../../types/admin';
import { categoryService } from '../../services/categoryService';
import { bookService } from '../../services/bookService';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastMessage } from '../components/Toast';

interface AdminCategoriesProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ onShowToast }) => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formNameUrdu, setFormNameUrdu] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, allBooks] = await Promise.all([
        categoryService.getCategories(),
        bookService.getAllStoredBooks(),
      ]);

      // Count books per category
      const counts: Record<string, number> = {};
      allBooks.forEach((b) => {
        if (b.categoryId) {
          counts[b.categoryId] = (counts[b.categoryId] || 0) + 1;
        }
      });

      const enriched = cats.map((c) => ({
        ...c,
        booksCount: counts[c.id] || counts[c.slug] || 0,
      }));

      setCategories(enriched);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormNameUrdu('');
    setFormSlug('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormNameUrdu(cat.nameUrdu || '');
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const slugVal = formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: formName.trim(),
          nameUrdu: formNameUrdu.trim(),
          slug: slugVal,
          description: formDescription.trim(),
        });
        onShowToast({
          type: 'success',
          title: 'Category Updated',
          message: `"${formName}" details have been updated.`,
        });
      } else {
        await categoryService.createCategory({
          name: formName.trim(),
          nameUrdu: formNameUrdu.trim(),
          slug: slugVal,
          description: formDescription.trim(),
          iconName: 'Book',
          coverAccent: '#173E2D',
        });
        onShowToast({
          type: 'success',
          title: 'Category Created',
          message: `"${formName}" added to library categories.`,
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch {
      onShowToast({
        type: 'error',
        title: 'Error Saving Category',
        message: 'Could not save category.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      onShowToast({
        type: 'success',
        title: 'Category Deleted',
        message: `"${categoryToDelete.name}" was removed.`,
      });
      setCategoryToDelete(null);
      loadData();
    } catch {
      onShowToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete category.',
      });
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nameUrdu?.includes(search) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif">Category Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Organize digital books into classical genres, subjects, and literary traditions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-[#C5A869]" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs max-w-md relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories by name or slug..."
          className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200/80 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-3">Urdu Name</th>
                <th className="py-3 px-3">Slug</th>
                <th className="py-3 px-3">Books Count</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1A3E2F]" />
                    <span>Loading categories...</span>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No categories found matching your query.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#1A3E2F]/10 text-[#1A3E2F] flex items-center justify-center shrink-0">
                        <FolderTree className="w-3.5 h-3.5" />
                      </div>
                      <span>{cat.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-urdu text-xs text-gray-600">
                      {cat.nameUrdu || '—'}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-gray-400">
                      /category/{cat.slug}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        <BookOpen className="w-3 h-3" />
                        <span>{cat.booksCount || 0} books</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-500 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(cat)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Category Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCategory) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Classical Urdu Poetry"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Urdu Name
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formNameUrdu}
                  onChange={(e) => setFormNameUrdu(e.target.value)}
                  placeholder="کلاسیکی اردو شاعری"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-urdu focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="classical-urdu-poetry"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="A brief overview of the books belonging to this category..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1A3E2F] hover:bg-[#133224] rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category?"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? Books assigned to this category will not be deleted, but will become uncategorized.`}
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};
