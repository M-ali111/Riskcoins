// backend/src/middleware/authJwt.js
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing token' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Invalid token format' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // standardized payload: { sub: user.id, role: user.role }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verify error', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// middleware factory to require a role
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Export: the default function is authenticateJWT (so requiring the module returns a function)
// and also attach named properties for destructuring usage.
module.exports = authenticateJWT;
module.exports.authenticateJWT = authenticateJWT;
module.exports.requireRole = requireRole;
