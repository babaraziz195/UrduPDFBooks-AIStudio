import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminAuthor } from '../types/admin';
import { AUTHORS } from '../data/mockData';

const STORAGE_KEY = 'urdupdfbooks_admin_authors';

const INITIAL_AUTHORS: AdminAuthor[] = AUTHORS.map((a) => ({
  id: a.id,
  name: a.name,
  nameUrdu: a.nameUrdu,
  slug: a.id,
  bio: a.bio,
  era: a.era,
  photoUrl: a.avatar,
  booksCount: a.booksCount,
  createdAt: new Date('2026-01-01').toISOString(),
}));

export const authorService = {
  async getAuthors(): Promise<AdminAuthor[]> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('authors')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            name: item.name,
            nameUrdu: item.name_urdu || '',
            slug: item.slug,
            bio: item.bio || '',
            era: item.era || '',
            photoUrl: item.photo_url || '',
            booksCount: 0,
            createdAt: item.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch authors fallback to local:', err);
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AUTHORS));
    return INITIAL_AUTHORS;
  },

  async createAuthor(author: Omit<AdminAuthor, 'id' | 'createdAt'>): Promise<AdminAuthor> {
    const client = getSupabase();
    const slug = author.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('authors')
          .insert({
            name: author.name.trim(),
            name_urdu: author.nameUrdu || '',
            slug,
            bio: author.bio || '',
            era: author.era || '',
            photo_url: author.photoUrl || '',
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            nameUrdu: data.name_urdu,
            slug: data.slug,
            bio: data.bio,
            era: data.era,
            photoUrl: data.photo_url,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Supabase create author error:', err);
      }
    }

    const authors = await this.getAuthors();
    const newAuthor: AdminAuthor = {
      id: `auth-${Date.now()}`,
      name: author.name,
      nameUrdu: author.nameUrdu,
      slug,
      bio: author.bio,
      era: author.era,
      photoUrl: author.photoUrl,
      booksCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [...authors, newAuthor];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newAuthor;
  },

  async updateAuthor(id: string, updates: Partial<AdminAuthor>): Promise<AdminAuthor> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, unknown> = {};
        if (updates.name) updatePayload.name = updates.name;
        if (updates.nameUrdu !== undefined) updatePayload.name_urdu = updates.nameUrdu;
        if (updates.slug) updatePayload.slug = updates.slug;
        if (updates.bio !== undefined) updatePayload.bio = updates.bio;
        if (updates.era !== undefined) updatePayload.era = updates.era;
        if (updates.photoUrl !== undefined) updatePayload.photo_url = updates.photoUrl;

        const { data, error } = await client
          .from('authors')
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
            bio: data.bio,
            era: data.era,
            photoUrl: data.photo_url,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Supabase update author error:', err);
      }
    }

    const authors = await this.getAuthors();
    const updated = authors.map((a) => (a.id === id ? { ...a, ...updates } : a));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const found = updated.find((a) => a.id === id);
    if (!found) throw new Error('Author not found');
    return found;
  },

  async deleteAuthor(id: string): Promise<boolean> {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const { error } = await client.from('authors').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete author error:', err);
      }
    }

    const authors = await this.getAuthors();
    const updated = authors.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  },
};
