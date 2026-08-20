const router = require('express').Router();
const { getCategories, getProducts } = require('../services/supabaseService');

// Home page – show hero, carousel, categories, featured products
router.get('/', async (req, res) => {
  try {
    const categories = await getCategories();
    const featured = await getProducts({ limit: 8, featured: true });
    res.render('home', { title: 'FOUNDER – Home', categories, featured });
  } catch (err) {
    console.error('Home error:', err);
    res.status(500).render('error', { status: 500, message: 'Failed to load homepage' });
  }
});

module.exports = router;