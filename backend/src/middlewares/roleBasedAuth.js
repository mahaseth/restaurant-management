//backend/src/middlewares/roleBasedAuth.js
// roleBasedAuth(role) -> returns middleware that allows access
// only if `req.user.roles` includes the required role.
const roleBasedAuth = (requiredRoles) => {
  return (req, res, next) => {
    // User not authenticated
    if (!req.user || !req.user.roles) {
      return res.status(401).send("User not authenticated.");
    }

    // Normalize both sides to arrays
    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.roles];

    const allowedRoles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    // Check intersection
    const hasAccess = allowedRoles.some(role =>
      userRoles.includes(role)
    );

    if (hasAccess) {
      return next();
    }

    return res.status(403).send("Forbidden: insufficient role.");
  };
};


export default roleBasedAuth;
