module.exports = (err, req, res, next) => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (res.headersSent) return next(err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: isDevelopment ? err.message : undefined });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.code === 'P2002') { // Prisma unique constraint
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === 'P2025') { // Prisma record not found
    return res.status(404).json({ error: 'Resource not found' });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
};
