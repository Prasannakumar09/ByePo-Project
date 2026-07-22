const FeatureFlag = require('../models/featureFlag.model');
const Organization = require('../models/organization.model');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/flags — org admin only, scoped to req.user.orgId (never trust a client-supplied orgId)
exports.getFlags = asyncHandler(async (req, res) => {
  const flags = await FeatureFlag.find({ orgId: req.user.orgId }).sort({ createdAt: -1 });
  res.status(200).json(flags);
});

// POST /api/flags — org admin only
exports.createFlag = asyncHandler(async (req, res) => {
  const { key } = req.body;

  if (!key || !key.trim()) {
    return res.status(400).json({ message: 'Feature key is required' });
  }

  const flag = await FeatureFlag.create({ orgId: req.user.orgId, key: key.trim() });
  res.status(201).json(flag);
});

// PATCH /api/flags/:id — org admin only, must own the flag
exports.updateFlag = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { enabled, key } = req.body;

  const flag = await FeatureFlag.findOne({ _id: id, orgId: req.user.orgId });
  if (!flag) {
    return res.status(404).json({ message: 'Feature flag not found' });
  }

  if (typeof enabled === 'boolean') flag.enabled = enabled;
  if (key && key.trim()) flag.key = key.trim();

  await flag.save();
  res.status(200).json(flag);
});

// DELETE /api/flags/:id — org admin only, must own the flag
exports.deleteFlag = asyncHandler(async (req, res) => {
  const flag = await FeatureFlag.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });

  if (!flag) {
    return res.status(404).json({ message: 'Feature flag not found' });
  }

  res.status(200).json({ message: 'Feature flag deleted' });
});

// POST /api/check — public, no auth (end user lookup)
exports.checkFlag = asyncHandler(async (req, res) => {
  const { orgId, key } = req.body;

  if (!orgId || !key) {
    return res.status(400).json({ message: 'orgId and key are required' });
  }

  const org = await Organization.findById(orgId);
  if (!org) {
    return res.status(404).json({ message: 'Organization not found' });
  }

  const flag = await FeatureFlag.findOne({ orgId, key: key.trim() });
  if (!flag) {
    return res.status(404).json({ message: 'Feature flag not found for this organization' });
  }

  res.status(200).json({ key: flag.key, enabled: flag.enabled });
});