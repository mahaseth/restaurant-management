import { verifyJWT } from "../utils/jwt.js";

const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = verifyJWT(token);

    req.userId = decoded.userId;
    req.restaurantId = decoded.restaurantId;

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;
