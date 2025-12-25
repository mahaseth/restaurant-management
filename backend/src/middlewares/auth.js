// middlewares/auth.js
const auth = async (req, res, next) => {
  const token =
    req.headers.authorization?.split(" ")[1] ||
    req.headers.cookie?.split("=")[1];

  if (!token) return res.status(401).json({ message: "User not authenticated" });

  try {
    const data = await verifyJWT(token);
    req.user = data.user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;
