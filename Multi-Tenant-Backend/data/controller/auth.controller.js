const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Organization = require('../models/organization.model');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

// POST /api/auth/super-admin/login
exports.superAdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Static credentials per spec — checked against .env, not the DB
  if (
    email !== process.env.SUPER_ADMIN_EMAIL ||
    password !== process.env.SUPER_ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken({ id: 'super-admin', role: 'super_admin', orgId: null });
  res.status(200).json({ token, role: 'super_admin' });
});

// POST /api/auth/org-admin/signup
exports.orgAdminSignup = asyncHandler(async (req, res) => {
  const { email, password, orgId } = req.body;

  if (!email || !password || !orgId) {
    return res.status(400).json({ message: 'Email, password and orgId are required' });
  }

  const org = await Organization.findById(orgId);
  if (!org) {
    return res.status(400).json({ message: 'Organization not found' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const passwordHash = await argon2.hash(password, 10);
  res.status(201).json("SignUp Successfully,Go to Login");
});

// POST /api/auth/org-admin/login
exports.orgAdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email, role: 'org_admin' });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await argon2.verify(user.passwordHash, password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken({ id: user._id, role: user.role, orgId: user.orgId });
  res.status(200).json({ token, role: user.role, orgId: user.orgId });
});