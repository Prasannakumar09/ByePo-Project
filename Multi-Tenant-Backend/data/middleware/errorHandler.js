// Catches requests to routes that don't exist
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// Catches everything thrown/passed via next(err) anywhere in the app
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose bad ObjectId (e.g. malformed :id in a route param)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  // Mongoose duplicate key error (e.g. duplicate org+key on feature flags)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value', field: Object.keys(err.keyValue)[0] });
  }

  // Mongoose validation errors (missing required fields, enum mismatch, etc.)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Fallback
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = { notFound, errorHandler };