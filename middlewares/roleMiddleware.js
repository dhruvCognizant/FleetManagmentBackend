function authorize(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Forbidden: You do not have access to this resource',
        userRole,
        requiredRoles: allowedRoles
      });
    }
    next();
  };
}
module.exports = { authorize };