const express = require('express');
const router = express.Router();
const {
  superAdminLogin,
  orgAdminSignup,
  orgAdminLogin,
} = require('../controller/auth.controller');

router.post('/super-admin/login', superAdminLogin);
router.post('/org-admin/signup', orgAdminSignup);
router.post('/org-admin/login', orgAdminLogin);

module.exports = router;