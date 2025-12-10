import authService from "../services/auth.service.js";

const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);

    res.json(data);
  } catch (error) {
    res.status(error.status || 400).send(error.message);
  }
};

const register = async (req, res) => {
  try {
    const data = await authService.register(req.body);

    res.json(data);
  } catch (error) {
    res.status(error.status || 400).send(error.message);
  }
};

export default { login, register };