import userService from "../services/user.service.js";

const createUser = async (req, res) => {
  try {
    const userData = {
      ...req.body,
      restaurantId: req.restaurant._id,
    };
    const data = await userService.createUser(userData);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const getUsers = async (req, res) => {
  try {
    const data = await userService.getUsers(req.restaurant._id);

    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const data = await userService.updateUser(req.params.id, req.restaurant._id, req.body);
    if (!data) return res.status(404).send("User not found in your restaurant.");
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const data = await userService.deleteUser(req.params.id, req.restaurant._id);
    if (!data) return res.status(404).send("User not found in your restaurant.");
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).send("Both old and new passwords are required.");
    }
    await userService.changePassword(req.user._id, oldPassword, newPassword);
    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const data = await userService.updateProfileImage(req.restaurant._id, req.user._id, req.file);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

export default { createUser, getUsers, updateProfileImage, updateUser, deleteUser, changePassword };
