const router = require('express').Router();
const { getCategories, getProducts, getProductBySlug } = require('../services/supabaseService');

// Shop page – list products with optional filters (category, search)
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  try {
    const categories = await getCategories();
    const products = await getProducts({
      limit: 24,
      categoryId: category && category !== 'all' ? parseInt(category, 10) : undefined,
      search: search || undefined,
    });
    const title = 'FOUNDER – Shop';
    res.render('shop', {
      title,
      products,
      categories,
      selectedCategory: category || 'all',
      search: search || '',
    });
  } catch (error) {
    console.error('Shop error:', error);
    res.render('shop', {
      title: 'FOUNDER – Shop',
      products: [],
      categories: [],
      selectedCategory: 'all',
      search: '',
    });
  }
});

// Product detail page – /product/:slug
router.get('/product/:slug', async (req, res) => {
  try {
    const product = await getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).render('error', { status: 404, message: 'Produk tidak ditemukan' });
    }
    const title = `FOUNDER - ${product.name}`;
    res.render('product', { title, product });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).render('error', { status: 500, message: 'Gagal memuat detail produk' });
  }
});

module.exports = router;