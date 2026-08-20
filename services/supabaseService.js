const { supabase } = require('../config/supabase');

// Helper to fetch categories
async function getCategories() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw error;
  return data;
}

// Helper to fetch products with optional filters
async function getProducts({ limit = 12, offset = 0, categoryId, search, featured } = {}) {
  if (!supabase) return [];
  let query = supabase.from('products').select('*');
  if (categoryId) query = query.eq('category_id', categoryId);
  if (search) query = query.ilike('name', `%${search}%`);
  if (featured) query = query.eq('featured', true);
  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
}

// Helper to fetch single product by slug
async function getProductBySlug(slug) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data;
}

module.exports = { getCategories, getProducts, getProductBySlug };