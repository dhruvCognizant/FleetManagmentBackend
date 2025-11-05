const passport = require('passport');

// Authenticate middleware using passport-jwt
exports.authenticate = passport.authenticate('jwt', { session: false });

// Authorize single role (admins bypass)
exports.authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (req.user.role === 'admin') return next();
    if (req.user.role !== role) return res.status(403).json({ error: `Access denied: ${role} only` });
    next();
  };
};

// Authorize multiple roles (admins bypass)
exports.authorizeRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (req.user.role === 'admin') return next();
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    next();
  };
};
