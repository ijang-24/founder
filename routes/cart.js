const router = require('express').Router()
const supabase = require('../config/supabase').supabase
const { getProfileByUserId } = require('../services/supabaseService')

// View cart - using session cart
router.get('/', (req, res) => {
  const cart = req.session.cart || []
  const title = 'FOUNDER - Keranjang Saya'
  res.render('cart', { title, cartItems: cart })
})

// Add to cart
router.post('/add', (req, res) => {
  const { productId, name, price, size, image } = req.body

  let cart = req.session.cart || []

  // Check if item already in cart
  const existingItem = cart.find(item => item.productId === productId && item.size === size)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({
      productId,
      name,
      price,
      size,
      image,
      quantity: 1
    })
  }

  req.session.cart = cart
  req.session.cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  res.json({ success: true, cartCount: req.session.cartCount })
})

// Remove from cart
router.post('/remove/:productId', (req, res) => {
  const { productId } = req.params

  let cart = req.session.cart || []
  cart = cart.filter(item => item.productId !== productId)

  req.session.cart = cart
  req.session.cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  res.json({ success: true, cartCount: req.session.cartCount })
})

// Update quantity
router.post('/update/:productId', (req, res) => {
  const { productId } = req.params
  const { quantity } = req.body

  let cart = req.session.cart || []

  const item = cart.find(item => item.productId === productId)
  if (item) {
    item.quantity = Math.max(1, quantity)
    req.session.cart = cart
    req.session.cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  res.json({ success: true, cartCount: req.session.cartCount })
})

// Checkout route
router.post('/checkout', async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      city,
      postalCode,
      notes,
      paymentMethod
    } = req.body

    const cart = req.session.cart || []

    if (cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang kosong' })
    }

    // Validate required fields
    if (!name || !phone || !address || !city || !postalCode) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' })
    }

    // Calculate subtotal from cart
    let subtotal = 0
    const orderItems = []

    cart.forEach(item => {
      subtotal += item.price * item.quantity
      orderItems.push({
        product_id: item.productId,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || 'S',
        subtotal: item.price * item.quantity
      })
    })

    const shippingCost = 15000 // Fixed shipping
    const total = subtotal + shippingCost

    // Create order
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      customer_name: name,
      phone,
      address,
      city,
      postal_code: postalCode,
      notes,
      subtotal,
      shipping_cost: shippingCost,
      total,
      payment_method: paymentMethod || 'QRIS',
      payment_status: 'Pending Verification',
      order_status: 'Pending'
    }).select().single()

    if (orderError) throw orderError

    // Create order items
    for (const item of orderItems) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        subtotal: item.subtotal
      })
    }

    // Clear cart
    req.session.cart = []
    req.session.cartCount = 0

    res.json({ success: true, orderId: order.id, orderNumber: order.order_number })
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ success: false, message: 'Gagal membuat pesanan' })
  }
})

module.exports = router