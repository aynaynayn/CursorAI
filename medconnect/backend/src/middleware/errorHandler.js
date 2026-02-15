/**
 * Global error handling middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
    });
  }

  // Database errors
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists (duplicate entry).' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Invalid reference - linked resource does not exist.' });
  }

  // Default to 500
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred.' 
    : (err.message || 'Internal server error');

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
