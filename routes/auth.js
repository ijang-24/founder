const router = require('express').Router();
const { supabase } = require('../config/supabase');

// GET login page
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login – FOUNDER' });
});

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error);
    return res.render('auth/login', { title: 'Login – FOUNDER', error: error.message });
  }
  // Save user info in session
  req.session.user = { id: data.user.id, email: data.user.email, role: data.user.role || 'customer' };
  res.redirect('/');
});

// GET register page
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register – FOUNDER' });
});

// POST register
router.post('/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password }, {
    data: { name, phone, role: 'customer' }
  });
  if (error) {
    console.error('Register error:', error);
    return res.render('auth/register', { title: 'Register – FOUNDER', error: error.message });
  }
  // Auto‑login after sign‑up
  req.session.user = { id: data.user.id, email: data.user.email, role: 'customer' };
  res.redirect('/');
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
