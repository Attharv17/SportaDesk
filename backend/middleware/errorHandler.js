/**
 * Global error-handling middleware.
 * Must be registered LAST in Express (4 arguments).
 */
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  const status  = err.status  || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
};
