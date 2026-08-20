require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const { supabase } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session (in‑memory – replace with store in prod)
app.use(session({
  secret: process.env.SESSION_SECRET || 'founder-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Make common locals available
app.use((req, res, next) => {
  res.locals.supabase = supabase;
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || [];
  res.locals.cartCount = req.session.cart ? req.session.cart.reduce((c, i) => c + i.qty, 0) : 0;
  res.locals.title = 'FOUNDER';
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/shop', require('./routes/shop'));
app.use('/product', require('./routes/product'));
app.use('/cart', require('./routes/cart'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { status: 404, message: 'Page not found' });
});

app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));