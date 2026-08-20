const router = require('express').Router();
const { getProductBySlug } = require('../services/supabaseService');

// Product detail page – /product/:slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) {
      return res.status(404).render('error', { status: 404, message: 'Produk tidak ditemukan' });
    }
    res.render('product', { title: product.name, product });
  } catch (err) {
    console.error('Product error:', err);
    res.status(500).render('error', { status: 500, message: 'Gagal memuat detail produk' });
  }
});

module.exports = router;
