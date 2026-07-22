const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
  getFlags,
  createFlag,
  updateFlag,
  deleteFlag,
} = require('../controller/flag.controller');

router.get('/', verifyToken, requireRole('org_admin'), getFlags);
router.post('/', verifyToken, requireRole('org_admin'), createFlag);
router.patch('/:id', verifyToken, requireRole('org_admin'), updateFlag);
router.delete('/:id', verifyToken, requireRole('org_admin'), deleteFlag);

module.exports = router;