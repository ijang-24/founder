const router = require('express').Router()
const { getCategories, getProducts, getProductsByCategory } = require('../services/supabaseService')

// Homepage
router.get('/', async (req, res) => {
  try {
    // Get featured/products for homepage
    const products = await getProducts({ limit: 8, featured: true })
    const categories = await getCategories()

    // Category cards data - using first 4 products per category as examples
    const categoryProducts = {}
    categories.forEach(category => {
      const productsInCat = products.filter(p => p.category_id === category.id)
      categoryProducts[category.name] = productsInCat.slice(0, 2)
    })

    const title = 'FOUNDER - Selamat Datang'
    res.render('home', { title, products, categories, categoryProducts })
  } catch (error) {
    console.error('Homepage error:', error)
    res.status(500).render('error', { status: 500, message: 'Gagal memuat homepage' })
  }
})

module.exports = router