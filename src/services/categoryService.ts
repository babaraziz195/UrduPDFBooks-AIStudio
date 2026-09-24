import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminCategory } from '../types/admin';
import { CATEGORIES } from '../data/mockData';

const STORAGE_KEY = 'urdupdfbooks_admin_categories';

// Initial seed from existing mock categories
const INITIAL_CATEGORIES: AdminCategory[] = CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  nameUrdu: c.nameUrdu,
  slug: c.id,
  description: c.description,
  iconName: c.iconName,
  coverAccent: c.coverAccent,
  booksCount: c.booksCount,
  createdAt: new Date('2026-01-01').toISOString(),
}));

export const categoryService = {
  async getCategories(): Promise<AdminCategory[]> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            name: item.name,
            nameUrdu: item.name_urdu || '',
            slug: item.slug,
            description: item.description || '',
            iconName: item.icon_name || 'Book',
            coverAccent: item.cover_accent || '#173E2D',
            booksCount: 0,
            createdAt: item.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch categories fallback to local:', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  },

  async createCategory(cat: Omit<AdminCategory, 'id' | 'createdAt'>): Promise<AdminCategory> {
    const client = getSupabase();
    const slug = cat.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('categories')
          .insert({
            name: cat.name.trim(),
            name_urdu: cat.nameUrdu || '',
            slug,
            description: cat.description || '',
            icon_name: cat.iconName || 'Book',
            cover_accent: cat.coverAccent || '#173E2D',
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            nameUrdu: data.name_urdu,
            slug: data.slug,
            description: data.description,
            iconName: data.icon_name,
            coverAccent: data.cover_accent,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Supabase create category error:', err);
      }
    }

    // Local fallback
    const categories = await this.getCategories();
    const newCategory: AdminCategory = {
      id: `cat-${Date.now()}`,
      name: cat.name,
      nameUrdu: cat.nameUrdu,
      slug,
      description: cat.description,
      iconName: cat.iconName || 'Book',
      coverAccent: cat.coverAccent || '#173E2D',
      booksCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [...categories, newCategory];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newCategory;
  },

  async updateCategory(id: string, updates: Partial<AdminCategory>): Promise<AdminCategory> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, unknown> = {};
        if (updates.name) updatePayload.name = updates.name;
        if (updates.nameUrdu !== undefined) updatePayload.name_urdu = updates.nameUrdu;
        if (updates.slug) updatePayload.slug = updates.slug;
        if (updates.description !== undefined) updatePayload.description = updates.description;
        if (updates.iconName) updatePayload.icon_name = updates.iconName;

        const { data, error } = await client
          .from('categories')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            nameUrdu: data.name_urdu,
            slug: data.slug,
            description: data.description,
            iconName: data.icon_name,
            coverAccent: data.cover_accent,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Supabase update category error:', err);
      }
    }

    const categories = await this.getCategories();
    const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const found = updated.find((c) => c.id === id);
    if (!found) throw new Error('Category not found');
    return found;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const { error } = await client.from('categories').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete category error:', err);
      }
    }

    const categories = await this.getCategories();
    const updated = categories.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  },
};
