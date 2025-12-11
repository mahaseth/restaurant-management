// roleBasedAuth(role) -> returns middleware that allows access
// only if `req.user.roles` includes the required role.
const roleBasedAuth = (requiredRole) => {
  return (req, res, next) => {
    // If auth middleware didn't attach user, block access
    if (!req.user || !req.user.roles) {
      return res.status(401).send("User not authenticated.");
    }

    // Ensure roles is an array and check membership
    const roles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.roles];

    if (roles.includes(requiredRole)) {
      return next();
    }

    return res.status(403).send("Forbidden: insufficient role.");
  };
};

export default roleBasedAuth;
