import User from "../models/User.js";
import uploadFile from "../utils/fileUploader.js";

const createUser = async (data) => {
  return await User.create(data);
};

const getUsers = async () => {
  return await User.find();
};

const updateProfileImage = async (restaurantId, userId, file) => {
  const uploadedFile = await uploadFile([file], '/rest-id-' +restaurantId + '/users');
  return await User.findByIdAndUpdate(
    userId,
    {
      profileImageUrl: uploadedFile[0].url,
    },
    { new: true }
  );
};

export default { createUser, getUsers, updateProfileImage };
