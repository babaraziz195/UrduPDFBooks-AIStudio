-- ==============================================================================
-- UrduPDFBooks - Hardened Production Supabase Database Schema
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- It sets up all tables, relationships, indexes, triggers, and strict Role-Based
-- Access Control (RBAC) Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. USER PROFILES & RBAC ROLE SYSTEM
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Helper function to check if the current requester is an administrator
-- Uses SECURITY DEFINER to bypass recursion when reading public.profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger to automatically create a public.profile whenever a user signs up
-- Enforces role = 'user' unconditionally to prevent client role-escalation injection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to prevent non-admins from escalating their own role to admin or superadmin
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Security restriction: Only administrators can modify user roles.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_role_escalation ON public.profiles;
CREATE TRIGGER tr_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ==============================================================================
-- 3. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_urdu TEXT DEFAULT '',
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    icon_name TEXT DEFAULT 'Book',
    cover_accent TEXT DEFAULT '#173E2D',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- ==============================================================================
-- 4. AUTHORS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_urdu TEXT DEFAULT '',
    slug TEXT NOT NULL UNIQUE,
    bio TEXT DEFAULT '',
    era TEXT DEFAULT '',
    photo_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_authors_slug ON public.authors (slug);

-- ==============================================================================
-- 5. BOOKS TABLE (With Backblaze B2 Storage Fields & Tier Pricing)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_urdu TEXT DEFAULT '',
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT DEFAULT '',
    author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    category_name TEXT NOT NULL,
    language TEXT DEFAULT 'Urdu',
    publication_year INTEGER DEFAULT 2026,
    publisher TEXT DEFAULT '',
    isbn TEXT DEFAULT '',
    pages INTEGER DEFAULT 0,
    short_description TEXT DEFAULT '',
    description TEXT DEFAULT '',
    keywords TEXT[] DEFAULT '{}',
    cover_url TEXT DEFAULT '',
    accent_color TEXT DEFAULT '#1A3E2F',
    
    -- Backblaze B2 Storage Fields for PDF
    pdf_object_key TEXT DEFAULT '',
    pdf_url TEXT DEFAULT '',
    pdf_filename TEXT DEFAULT '',
    pdf_size BIGINT DEFAULT 0,
    
    -- Status, Access Tier and Flags
    is_featured BOOLEAN DEFAULT false,
    is_paid BOOLEAN DEFAULT false,
    price NUMERIC(10,2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    rating NUMERIC(2,1) DEFAULT 5.0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration safety: ensure columns exist on existing databases
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pdf_object_key TEXT DEFAULT '';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pdf_filename TEXT DEFAULT '';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pdf_size BIGINT DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books (status);
CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books (slug);
CREATE INDEX IF NOT EXISTS idx_books_is_featured ON public.books (is_featured);
CREATE INDEX IF NOT EXISTS idx_books_is_paid ON public.books (is_paid);
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books (category_id);
CREATE INDEX IF NOT EXISTS idx_books_author_id ON public.books (author_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books (created_at DESC);

-- ==============================================================================
-- 6. ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT DEFAULT '',
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'PKR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    payment_method TEXT DEFAULT 'direct_checkout',
    payment_id TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- ==============================================================================
-- 7. PURCHASES TABLE (Enforces Private Paid Book Access)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'PKR',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_book ON public.purchases (user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases (user_id);

-- ==============================================================================
-- 8. ADMIN AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT DEFAULT '',
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT DEFAULT '',
    target_title TEXT DEFAULT '',
    details TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at DESC);

-- ==============================================================================
-- 9. AUTOMATIC updated_at TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_authors_updated_at ON public.authors;
CREATE TRIGGER set_authors_updated_at
    BEFORE UPDATE ON public.authors
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own profile; admins can view all profiles
CREATE POLICY "Users can view own profile or admins view all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

-- Users can update their own details (name, etc.); admins can update any profile
-- tr_prevent_role_escalation prevents non-admins from altering the role field
CREATE POLICY "Users can update own profile or admins update any"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- Only admins can manually insert profiles (standard signup uses SECURITY DEFINER trigger)
CREATE POLICY "Only admins can manually insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin());

-- Only admins can delete profiles
CREATE POLICY "Only admins can delete profiles"
    ON public.profiles FOR DELETE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- B. CATEGORIES POLICIES
-- ------------------------------------------------------------------------------
-- Public visitors and regular users can view categories
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

-- STRICT: Only admins can insert categories
CREATE POLICY "Only admins can insert categories"
    ON public.categories FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can update categories
CREATE POLICY "Only admins can update categories"
    ON public.categories FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can delete categories
CREATE POLICY "Only admins can delete categories"
    ON public.categories FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- C. AUTHORS POLICIES
-- ------------------------------------------------------------------------------
-- Public visitors and regular users can view authors
CREATE POLICY "Anyone can view authors"
    ON public.authors FOR SELECT
    USING (true);

-- STRICT: Only admins can insert authors
CREATE POLICY "Only admins can insert authors"
    ON public.authors FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can update authors
CREATE POLICY "Only admins can update authors"
    ON public.authors FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can delete authors
CREATE POLICY "Only admins can delete authors"
    ON public.authors FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- D. BOOKS POLICIES
-- ------------------------------------------------------------------------------
-- Public visitors and normal users can only view published books
-- Admins can view all books (drafts and published)
CREATE POLICY "Public and users can view published books; admins view all"
    ON public.books FOR SELECT
    USING (status = 'published' OR public.is_admin());

-- STRICT: Only admins can insert books
CREATE POLICY "Only admins can insert books"
    ON public.books FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can update books
CREATE POLICY "Only admins can update books"
    ON public.books FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can delete books
CREATE POLICY "Only admins can delete books"
    ON public.books FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- E. ORDERS POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own orders; admins can view all orders
CREATE POLICY "Users can view own orders or admins view all"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

-- Anyone can initiate an order checkout
CREATE POLICY "Anyone can create orders during checkout"
    ON public.orders FOR INSERT
    WITH CHECK (true);

-- STRICT: Only admins can update orders (e.g. mark status completed / cancelled)
CREATE POLICY "Only admins can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can delete orders
CREATE POLICY "Only admins can delete orders"
    ON public.orders FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- F. PURCHASES POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own purchased book records; admins can view all
CREATE POLICY "Users can view own purchases or admins view all"
    ON public.purchases FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

-- STRICT: Only admins (or backend service role) can create purchase grants
CREATE POLICY "Only admins can insert purchases"
    ON public.purchases FOR INSERT
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can update purchases
CREATE POLICY "Only admins can update purchases"
    ON public.purchases FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- STRICT: Only admins can delete purchases
CREATE POLICY "Only admins can delete purchases"
    ON public.purchases FOR DELETE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- G. ADMIN LOGS POLICIES
-- ------------------------------------------------------------------------------
-- STRICT: Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
    ON public.admin_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- STRICT: Only admins can insert audit logs
CREATE POLICY "Only admins can insert audit logs"
    ON public.admin_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Audit logs are append-only; no updates allowed
-- Only admins can purge audit logs
CREATE POLICY "Only admins can delete audit logs"
    ON public.admin_logs FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 11. INITIAL SEED DATA (Categories)
-- ==============================================================================
INSERT INTO public.categories (name, name_urdu, slug, description, icon_name, cover_accent)
VALUES
    ('Classical Urdu Poetry', 'کلاسیکی اردو شاعری', 'classical-urdu-poetry', 'Immortal diwans and masnavis from legendary masters including Ghalib and Mir.', 'Sparkles', '#1B2E24'),
    ('Urdu Novels', 'اردو ناول', 'urdu-novels', 'Classic and modern romantic, social, and spiritual novels from celebrated writers.', 'Book', '#173E2D'),
    ('Poetry', 'شاعری و دیوان', 'poetry', 'Immortal ghazals, nazms, and collected diwans of the subcontinent’s greatest poets.', 'Feather', '#2A3439'),
    ('Islamic Books', 'اسلامی کتب', 'islamic-books', 'Authentic biographies of prophets, tafseer, hadeeth commentaries, and spiritual guidance.', 'Compass', '#1B382B'),
    ('History', 'تاریخ و تمدن', 'history', 'Comprehensive historical chronicles of South Asia, the Islamic world, and civilization.', 'Landmark', '#3D2F24'),
    ('Urdu Literature', 'اردو ادب و افسانے', 'urdu-literature', 'Celebrated essays, humorous sketches, short stories, and classical literary prose.', 'Library', '#2E2D3A'),
    ('Biography', 'سوانح و آپ بیتی', 'biography', 'Inspiring autobiographies and memoirs of epoch-defining personalities.', 'Users', '#332729'),
    ('Philosophy', 'فلسفہ و فکر', 'philosophy', 'Profound philosophical treatises and existential reflections.', 'GraduationCap', '#233036'),
    ('Humor & Satire', 'طنز و مزاح', 'humor-and-satire', 'Classic witty masterpieces from Patras Bokhari, Ibn-e-Insha, and Mushtaq Ahmad Yusufi.', 'Smile', '#34261D')
ON CONFLICT (slug) DO NOTHING;
