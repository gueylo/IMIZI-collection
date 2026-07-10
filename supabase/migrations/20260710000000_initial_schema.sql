-- supabase/migrations/20260710000000_initial_schema.sql

-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Create the `products` table
-- ==========================================
CREATE TABLE public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || (extract(epoch from now()) * 1000)::bigint || '_' || floor(random() * 9999)::text),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    "mainCategory" TEXT NOT NULL,
    "subCategory" TEXT,
    gender TEXT,
    sizes JSONB,
    images JSONB,
    featured BOOLEAN DEFAULT false,
    "dateAdded" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS) for `products`
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users (public) to read products
CREATE POLICY "Allow public read access on products" 
ON public.products FOR SELECT 
USING (true);

-- Allow authenticated service_role/admin to insert/update/delete products
-- Note: In a real app, you might use authenticated users or a specific role.
-- Since the Netlify function uses the SERVICE_ROLE key, it bypasses RLS by default.


-- ==========================================
-- 2. Create the `settings` table
-- ==========================================
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS) for `settings`
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users (public) to read settings
CREATE POLICY "Allow public read access on settings" 
ON public.settings FOR SELECT 
USING (true);

-- ==========================================
-- 3. Insert Initial Data
-- ==========================================
INSERT INTO public.settings (key, value) 
VALUES ('whatsapp_number', '250794476826') 
ON CONFLICT (key) DO NOTHING;
