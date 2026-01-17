// backend/src/utils/fileUploader.js
import { v2 as cloudinary } from "cloudinary";

const CLOUDINARY_FOLDER = "restaurant-management";

const uploadFile = async (files, uploadedPath) => {
  const uploadedFiles = [];

  for (const file of files) {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: CLOUDINARY_FOLDER + uploadedPath,
          },
          (error, data) => {
            if (error) return reject(error);

            resolve(data);
          }
        )
        .end(file.buffer);
    });

    uploadedFiles.push(result);
  }

  return uploadedFiles;
};

export default uploadFile;