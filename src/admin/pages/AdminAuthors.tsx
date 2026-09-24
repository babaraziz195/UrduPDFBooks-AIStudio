import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  X,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminAuthor } from '../../types/admin';
import { authorService } from '../../services/authorService';
import { bookService } from '../../services/bookService';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastMessage } from '../components/Toast';

interface AdminAuthorsProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminAuthors: React.FC<AdminAuthorsProps> = ({ onShowToast }) => {
  const [authors, setAuthors] = useState<AdminAuthor[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<AdminAuthor | null>(null);
  const [formName, setFormName] = useState('');
  const [formNameUrdu, setFormNameUrdu] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formEra, setFormEra] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [authorToDelete, setAuthorToDelete] = useState<AdminAuthor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [auths, allBooks] = await Promise.all([
        authorService.getAuthors(),
        bookService.getAllStoredBooks(),
      ]);

      // Count books per author
      const counts: Record<string, number> = {};
      allBooks.forEach((b) => {
        if (b.authorId) {
          counts[b.authorId] = (counts[b.authorId] || 0) + 1;
        }
        if (b.authorName) {
          counts[b.authorName] = (counts[b.authorName] || 0) + 1;
        }
      });

      const enriched = auths.map((a) => ({
        ...a,
        booksCount: counts[a.id] || counts[a.name] || 0,
      }));

      setAuthors(enriched);
    } catch (err) {
      console.error('Error loading authors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingAuthor(null);
    setFormName('');
    setFormNameUrdu('');
    setFormSlug('');
    setFormEra('');
    setFormBio('');
    setFormPhotoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (author: AdminAuthor) => {
    setEditingAuthor(author);
    setFormName(author.name);
    setFormNameUrdu(author.nameUrdu || '');
    setFormSlug(author.slug);
    setFormEra(author.era || '');
    setFormBio(author.bio || '');
    setFormPhotoUrl(author.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const slugVal = formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      if (editingAuthor) {
        await authorService.updateAuthor(editingAuthor.id, {
          name: formName.trim(),
          nameUrdu: formNameUrdu.trim(),
          slug: slugVal,
          era: formEra.trim(),
          bio: formBio.trim(),
          photoUrl: formPhotoUrl.trim(),
        });
        onShowToast({
          type: 'success',
          title: 'Author Updated',
          message: `"${formName}" details have been updated.`,
        });
      } else {
        await authorService.createAuthor({
          name: formName.trim(),
          nameUrdu: formNameUrdu.trim(),
          slug: slugVal,
          era: formEra.trim(),
          bio: formBio.trim(),
          photoUrl: formPhotoUrl.trim(),
        });
        onShowToast({
          type: 'success',
          title: 'Author Created',
          message: `"${formName}" added to library authors.`,
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch {
      onShowToast({
        type: 'error',
        title: 'Error Saving Author',
        message: 'Could not save author.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!authorToDelete) return;
    try {
      await authorService.deleteAuthor(authorToDelete.id);
      onShowToast({
        type: 'success',
        title: 'Author Removed',
        message: `"${authorToDelete.name}" was removed from authors list.`,
      });
      setAuthorToDelete(null);
      loadData();
    } catch {
      onShowToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete author.',
      });
    }
  };

  const filteredAuthors = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.nameUrdu?.includes(search) ||
      a.era?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif">Authors Directory</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage classical poets, novelists, historians, and literary figures.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-[#1A3E2F] hover:bg-[#133224] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-[#C5A869]" />
          <span>Add New Author</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs max-w-md relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search authors by name, era, or bio..."
          className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200/80 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-3">Urdu Name</th>
                <th className="py-3 px-3">Era / Dates</th>
                <th className="py-3 px-3">Books in Library</th>
                <th className="py-3 px-3">Biography</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1A3E2F]" />
                    <span>Loading authors...</span>
                  </td>
                </tr>
              ) : filteredAuthors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No authors found matching your search.
                  </td>
                </tr>
              ) : (
                filteredAuthors.map((author) => (
                  <tr key={author.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-3">
                      {author.photoUrl ? (
                        <img
                          src={author.photoUrl}
                          alt={author.name}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#1A3E2F] text-[#C5A869] font-bold text-xs flex items-center justify-center shadow-2xs">
                          {author.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="leading-tight">{author.name}</p>
                        <span className="text-[10px] text-gray-400 font-mono">
                          /author/{author.slug}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-urdu text-xs text-gray-600">
                      {author.nameUrdu || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">
                      {author.era || 'Classical'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        <BookOpen className="w-3 h-3" />
                        <span>{author.booksCount || 0} books</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-500 max-w-xs truncate">
                      {author.bio || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(author)}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                          title="Edit Author"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthorToDelete(author)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Author"
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

      {/* Add / Edit Author Modal */}
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
              {editingAuthor ? 'Edit Author' : 'Add New Author'}
            </h3>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Author Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingAuthor) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Mirza Asadullah Khan Ghalib"
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
                  placeholder="مرزا اسد اللہ خاں غالب"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-urdu focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="mirza-ghalib"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Era / Dates
                  </label>
                  <input
                    type="text"
                    value={formEra}
                    onChange={(e) => setFormEra(e.target.value)}
                    placeholder="1797 – 1869"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Author Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={formPhotoUrl}
                  onChange={(e) => setFormPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Biography / Literary Profile
                </label>
                <textarea
                  rows={3}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Concise overview of the author's legacy, works, and contributions..."
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
                  <span>{editingAuthor ? 'Save Changes' : 'Create Author'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(authorToDelete)}
        title="Delete Author?"
        message={`Are you sure you want to delete "${authorToDelete?.name}"? Books associated with this author will remain in the library.`}
        confirmLabel="Delete Author"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setAuthorToDelete(null)}
      />
    </div>
  );
};
