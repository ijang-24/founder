-- Founder Store Database Migration for Supabase
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    featured BOOLEAN DEFAULT FALSE,
    stock_quantity INTEGER DEFAULT 0,
    sku TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    notes TEXT,
    subtotal INTEGER NOT NULL DEFAULT 0,
    shipping_cost INTEGER NOT NULL DEFAULT 15000,
    total INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'QRIS',
    payment_status TEXT DEFAULT 'Pending Verification',
    order_status TEXT DEFAULT 'Pending',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories: Public read, admin write
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (TRUE);

CREATE POLICY "Categories can be managed by admins" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Products: Public read, admin write
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (TRUE);

CREATE POLICY "Products can be managed by admins" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Orders: Users can see their own orders, admins see all
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Orders can be managed by admins" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Order Items: Same as orders
CREATE POLICY "Users can view their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE public.orders.id = order_items.order_id
            AND (public.orders.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                ))
        )
    );

CREATE POLICY "Order items can be created with orders" ON public.order_items
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Order items can be managed by admins" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert categories
INSERT INTO public.categories (name, slug, description, display_order) VALUES
    ('T-Shirt', 't-shirt', 'Kaos santai sehari-hari', 1),
    ('Hoodie', 'hoodie', 'Hoodie hangat dan stylish', 2),
    ('Pants', 'pants', 'Celana nyaman untuk aktivitas', 3),
    ('Outer', 'outer', 'Jaket dan outerwear', 4),
    ('Accessories', 'accessories', 'Aksesoris pelengkap', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, slug, description, price, image_url, category_id, featured, stock_quantity, sku) 
SELECT 
    p.name, p.slug, p.description, p.price, p.image_url, c.id, p.featured, p.stock_quantity, p.sku
FROM (VALUES
    ('Classic White Tee', 'classic-white-tee', 'Kaos putih klasik 100% cotton, nyaman dipakai sehari-hari', 150000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', 't-shirt', TRUE, 50, 'FND-TS-001'),
    ('Black Essential Tee', 'black-essential-tee', 'Kaos hitam essential, bahan premium anti kusut', 150000, 'https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=600&q=80', 't-shirt', TRUE, 45, 'FND-TS-002'),
    ('Oversized Hoodie Gray', 'oversized-hoodie-gray', 'Hoodie oversized warna abu-abu, fleece tebal hangat', 350000, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80', 'hoodie', TRUE, 30, 'FND-HD-001'),
    ('Forest Green Hoodie', 'forest-green-hoodie', 'Hoodie warna hijau hutan, cocok untuk gaya kasual', 350000, 'https://images.unsplash.com/photo-1578587018452-892b5b9b8b6b?w=600&q=80', 'hoodie', FALSE, 25, 'FND-HD-002'),
    ('Slim Fit Chino Pants', 'slim-fit-chino-pants', 'Celana chino slim fit, bahan stretch nyaman', 250000, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80', 'pants', TRUE, 40, 'FND-PT-001'),
    ('Cargo Pants Khaki', 'cargo-pants-khaki', 'Celana cargo khaki dengan kantung banyak, fungsional', 280000, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80', 'pants', FALSE, 35, 'FND-PT-002'),
    ('Denim Jacket Classic', 'denim-jacket-classic', 'Jaket denim klasik, bahan jeans premium', 450000, 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80', 'outer', TRUE, 20, 'FND-OU-001'),
    ('Bomber Jacket Black', 'bomber-jacket-black', 'Jaket bomber hitam, cocok untuk style urban', 420000, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', 'outer', FALSE, 15, 'FND-OU-002'),
    ('Canvas Tote Bag', 'canvas-tote-bag', 'Tas tote bag canvas kuat, cocok belanja atau kuliah', 120000, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', 'accessories', FALSE, 60, 'FND-AC-001'),
    ('Minimalist Cap', 'minimalist-cap', 'Topi minimalis bordir logo FOUNDER', 90000, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', 'accessories', TRUE, 80, 'FND-AC-002')
) AS p(name, slug, description, price, image_url, category_slug, featured, stock_quantity, sku)
JOIN public.categories c ON c.slug = p.category_slug
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;