import bcrypt from "bcryptjs";
import User from "../models/User.js";
import uploadFile, { deleteCloudinaryFileByUrl } from "../utils/fileUploader.js";
import { ROLE_CUSTOMER } from "../constants/roles.js";

const stripPassword = (userDoc) => {
  if (!userDoc) return userDoc;
  // Works for both mongoose docs and plain objects
  const obj = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  return obj;
};

const createUser = async (data) => {
  if (data.password) {
    const salt = bcrypt.genSaltSync(10);
    data.password = bcrypt.hashSync(data.password, salt);
  }
  const created = await User.create(data);
  return stripPassword(created);
};

const getUsers = async (restaurantId) => {
  // Never expose password hashes to the client
  // Only return staff accounts (exclude customers)
  return await User.find({ restaurantId, roles: { $nin: [ROLE_CUSTOMER] } })
    .select("-password")
    .lean();
};

// Get a user within a restaurant (used for authorization checks)
const getUserById = async (userId, restaurantId) => {
  return await User.findOne({ _id: userId, restaurantId }).select("-password");
};

// Current user profile (safe for client use)
const getMe = async (restaurantId, userId) => {
  return await User.findOne({ _id: userId, restaurantId }).select("-password").lean();
};

// Attendance toggle for the current user.
const updateMyActiveStatus = async (restaurantId, userId, isActive) => {
  const updated = await User.findOneAndUpdate(
    { _id: userId, restaurantId },
    { isActive: !!isActive },
    { new: true }
  ).select("-password");
  return updated;
};

const updateUser = async (userId, restaurantId, data) => {
  if (data.password) {
    const salt = bcrypt.genSaltSync(10);
    data.password = bcrypt.hashSync(data.password, salt);
  }
  const updated = await User.findOneAndUpdate(
    { _id: userId, restaurantId },
    data,
    { new: true }
  ).select("-password");
  return updated;
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
  // Best-effort: delete previous profile image from Cloudinary to avoid orphan files.
  const existing = await User.findOne({ _id: userId, restaurantId }).select("profileImageUrl");
  if (existing?.profileImageUrl) {
    try {
      await deleteCloudinaryFileByUrl(existing.profileImageUrl);
    } catch {
      // Do not block upload if deletion fails.
    }
  }

  const uploadedFile = await uploadFile([file], '/rest-id-' +restaurantId + '/users');
  const updated = await User.findOneAndUpdate(
    { _id: userId, restaurantId },
    {
      profileImageUrl: uploadedFile[0].url,
    },
    { new: true }
  ).select("-password");
  return updated;
};

// Clear the current user's profile image URL
const removeProfileImage = async (restaurantId, userId) => {
  // Best-effort: delete current image from Cloudinary before clearing DB value.
  const existing = await User.findOne({ _id: userId, restaurantId }).select("profileImageUrl");
  if (existing?.profileImageUrl) {
    try {
      await deleteCloudinaryFileByUrl(existing.profileImageUrl);
    } catch {
      // Ignore deletion failures; clearing DB value still makes UI consistent.
    }
  }

  const updated = await User.findOneAndUpdate(
    { _id: userId, restaurantId },
    { $unset: { profileImageUrl: "" } },
    { new: true }
  ).select("-password");
  return updated;
};

export default {
  createUser,
  getUsers,
  getUserById,
  getMe,
  updateMyActiveStatus,
  updateProfileImage,
  removeProfileImage,
  updateUser,
  deleteUser,
  changePassword,
};
