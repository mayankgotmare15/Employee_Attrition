/**
 * Central Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]:', err);

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    const target = err.meta && err.meta.target ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`,
    });
  }

  // Prisma record not found error
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Requested record was not found.',
    });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
