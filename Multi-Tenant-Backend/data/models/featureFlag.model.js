const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  key: {
    type: String,
    required: true,
    trim: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Enforces "unique key per org" at the DB level — this is what actually stops duplicates
featureFlagSchema.index({ orgId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);