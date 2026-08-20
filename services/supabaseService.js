const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

let supabase = null
let isConfigured = false

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  isConfigured = true
}

async function withErrorHandling(promise) {
  try {
    const result = await promise
    return { success: true, data: result }
  } catch (error) {
    console.error('Supabase query error:', error.message)
    return { success: false, data: [] }
  }
}

async function getCategories() {
  if (!isConfigured) return []
  const { data, error } = await supabase.from('categories').select('*')
  if (error) return []
  return data || []
}

async function getProducts(filters = {}) {
  if (!isConfigured) return []
  let query = supabase.from('products').select(`
    *,
    categories (*)
  `)

  if (filters.category) {
    query = query.eq('category_id', filters.category)
  }

  if (filters.featured !== undefined) {
    query = query.eq('featured', filters.featured)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

async function getProductBySlug(slug) {
  if (!isConfigured) return null
  const { data, error } = await supabase.from('products').select(`
    *,
    categories (*)
  `).eq('slug', slug).single()
  if (error) return null
  return data || null
}

async function getProductsByCategory(categoryId) {
  if (!isConfigured) return []
  const { data, error } = await supabase.from('products').select(`
    *,
    categories (*)
  `).eq('category_id', categoryId).order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

module.exports = {
  getCategories,
  getProducts,
  getProductBySlug,
  getProductsByCategory,
  isConfigured
}