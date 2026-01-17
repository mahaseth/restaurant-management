import authService from "../services/auth.service.js";
import { createJWT } from "../utils/jwt.js";

const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    const token = createJWT({
      userId: data.userId,
      restaurantId: data.restaurantId
    });

    res.json({
      token,
      user: data.user,
      restaurant: data.restaurant
    });
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

const register = async (req, res) => {
  try {
    const data = await authService.register(req.body);
    const token = createJWT(data);

    res.json({ token });
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

export default { login, register };
