import homeService from "../services/home.service.js";

const homeController = (req, res) => {
  const data = homeService.getApplicationInfo();
  res.json(data);
};

export { homeController };
