import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const createJWT = ({ userId, restaurantId }) => {
  return jwt.sign(
    { userId, restaurantId },
    config.jwtSecret,
    { expiresIn: "30d" }
  );
};

export const verifyJWT = (token) => {
  return jwt.verify(token, config.jwtSecret);
};
