const express = require('express')
require('dotenv').config()
const session = require('express-session')
const path = require('path')

const supabaseConfig = require('./config/supabase')
const pageRoutes = require('./routes/index')
const shopRoutes = require('./routes/shop')
const cartRoutes = require('./routes/cart')

const app = express()
const PORT = process.env.PORT || 3000

// Set EJS as view engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Serve static files
app.use(express.static(path.join(__dirname, 'public')))
app.use('/css', express.static(path.join(__dirname, 'public/css')))
app.use('/js', express.static(path.join(__dirname, 'public/js')))

// Body parsing
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Session middleware
app.use(session({
  secret: 'FOUNDER-e-commerce-secret',
  resave: false,
  saveUninitialized: false
}))

// Make supabase and session data available to all views
app.use((req, res, next) => {
  res.locals.supabase = supabaseConfig.supabase
  res.locals.isConfigured = !!supabaseConfig.supabase
  res.locals.user = req.session.user || null
  res.locals.cartCount = req.session.cartCount || 0
  res.locals.title = 'FOUNDER'
  next()
})

// Routes
app.use('/', pageRoutes)
app.use('/shop', shopRoutes)
app.use('/cart', cartRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { status: 404, message: 'Halaman tidak ditemukan' })
})

app.listen(PORT, () => {
  console.log(`🏪 FOUNDER Store berjalan di http://localhost:${PORT}`)
  console.log('⚠️  Supabase not fully configured - UI features available, DB features disabled')
})

module.exports = app