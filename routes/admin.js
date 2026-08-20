const router = require('express').Router();

// Ensure only admin users can access these routes
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
  next();
});

// Admin dashboard placeholder
router.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

module.exports = router;
