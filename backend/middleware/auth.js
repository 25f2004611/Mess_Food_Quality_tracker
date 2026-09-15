const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * Factory that returns an Express middleware which:
 *  1. Verifies the Bearer JWT in Authorization header
 *  2. Checks the user's role is in the `allowedRoles` array
 */
function authMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    const header = req.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token provided.' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied for your role.' });
      }
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
  };
}

module.exports = { authMiddleware };
