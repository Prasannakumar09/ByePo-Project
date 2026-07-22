const Organization = require('../models/organization.model');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/organizations/public — no auth, id + name only (powers signup & end-user dropdowns)
exports.getPublicOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find().select('_id name');
  res.status(200).json(orgs);
});

// POST /api/organizations — super admin only
exports.createOrganization = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Organization name is required' });
  }

  const org = await Organization.create({ name: name.trim() });
  res.status(201).json(org);
});

// GET /api/organizations — super admin only, full list
exports.getAllOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find().sort({ createdAt: -1 });
  res.status(200).json(orgs);
});

// PUT /api/organizations/:id — super admin only
exports.updateOrganization = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Organization name is required' });
  }

  const org = await Organization.findByIdAndUpdate(
    req.params.id,
    { name: name.trim() },
    { new: true, runValidators: true }
  );

  if (!org) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  res.status(200).json(org);
});

// DELETE /api/organizations/:id — super admin only
exports.deleteOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findByIdAndDelete(req.params.id);

  if (!org) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  res.status(200).json({ message: 'Organization deleted successfully' });
});