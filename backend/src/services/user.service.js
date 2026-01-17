import bcrypt from "bcryptjs";
import User from "../models/User.js";
import uploadFile from "../utils/fileUploader.js";

const createUser = async (data) => {
  if (data.password) {
    const salt = bcrypt.genSaltSync(10);
    data.password = bcrypt.hashSync(data.password, salt);
  }
  return await User.create(data);
};

const getUsers = async (restaurantId) => {
  return await User.find({ restaurantId });
};

const updateUser = async (userId, restaurantId, data) => {
  if (data.password) {
    const salt = bcrypt.genSaltSync(10);
    data.password = bcrypt.hashSync(data.password, salt);
  }
  return await User.findOneAndUpdate(
    { _id: userId, restaurantId },
    data,
    { new: true }
  );
};

const deleteUser = async (userId, restaurantId) => {
  return await User.findOneAndDelete({ _id: userId, restaurantId });
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  const isPasswordMatch = bcrypt.compareSync(oldPassword, user.password);
  if (!isPasswordMatch) throw new Error("Incorrect old password.");

  const salt = bcrypt.genSaltSync(10);
  user.password = bcrypt.hashSync(newPassword, salt);
  return await user.save();
};

const updateProfileImage = async (restaurantId, userId, file) => {
  const uploadedFile = await uploadFile([file], '/rest-id-' +restaurantId + '/users');
  return await User.findOneAndUpdate(
    { _id: userId, restaurantId },
    {
      profileImageUrl: uploadedFile[0].url,
    },
    { new: true }
  );
};

export default { createUser, getUsers, updateProfileImage, updateUser, deleteUser, changePassword };
