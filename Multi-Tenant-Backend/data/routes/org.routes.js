const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
  getPublicOrganizations,
  createOrganization,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization
} = require('../controller/org.controller');

router.get('/public', getPublicOrganizations); // no auth

router.post('/', verifyToken, requireRole('super_admin'), createOrganization);
router.get('/', verifyToken, requireRole('super_admin'), getAllOrganizations);
router.put('/:id', verifyToken, requireRole('super_admin'), updateOrganization);
router.delete('/:id',verifyToken, requireRole('super_admin'), deleteOrganization);

module.exports = router;