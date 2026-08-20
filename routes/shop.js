const router = require('express').Router()
const { getCategories, getProducts, getProductsByCategory } = require('../services/supabaseService')

// Shop page - semua produk dengan filter
router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.category || ''
    const search = req.query.search || ''

    let products
    let selectedCategory = ''

    if (categoryId) {
      selectedCategory = categoryId
      products = await getProductsByCategory(categoryId)
    } else {
      products = await getProducts({ limit: 12 })
      selectedCategory = 'all'
    }

    const categories = await getCategories()

    const title = 'FOUNDER - Shop'
    res.render('shop', { title, products, categories, selectedCategory, search })
  } catch (error) {
    console.error('Shop error:', error)
    // Even if DB fails, render the page with empty data
    const categories = []
    res.render('shop', {
      title: 'FOUNDER - Shop',
      products: [],
      categories,
      selectedCategory: 'all',
      search: ''
    })
  }
})

// Product detail page
router.get('/product/:slug', async (req, res) => {
  try {
    const product = await getProductBySlug(req.params.slug)

    if (!product) {
      return res.status(404).render('error', { status: 404, message: 'Produk tidak ditemukan' })
    }

    const title = `FOUNDER - ${product.name}`
    res.render('product-detail', { title, product })
  } catch (error) {
    console.error('Product detail error:', error)
    res.status(500).render('error', { status: 500, message: 'Gagal memuat detail produk' })
  }
})

module.exports = router