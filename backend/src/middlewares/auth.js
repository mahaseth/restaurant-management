import { verifyJWT } from "../utils/jwt.js";

const auth = async (req, res, next) => {
  let token = null;

  // 1. Prefer the Authorization header (Bearer <token>)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Fallback: try the cookie
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc, c) => {
      const [key, ...val] = c.trim().split("=");
      acc[key] = val.join("=");
      return acc;
    }, {});
    token = cookies.authToken || null;
  }

  if (!token) return res.status(401).send("User not authenticated.");

  try {
    const data = await verifyJWT(token);
    req.user = data.user;
    req.restaurant = data.restaurant;
    next();
  } catch (error) {
    res.status(401).send("Invalid token.");
  }
};

export default auth;