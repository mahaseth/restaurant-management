import { v2 as cloudinary } from "cloudinary";

const CLOUDINARY_FOLDER = "restaurant-management";

// Extract Cloudinary public_id from a typical secure_url.
// Example URL path:
//   /<cloud_name>/image/upload/v123/restaurant-management/rest-id-XXX/users/abc123.jpg
// Result:
//   restaurant-management/rest-id-XXX/users/abc123
const extractPublicIdFromUrl = (fileUrl) => {
  if (!fileUrl) return null;
  try {
    const { pathname } = new URL(fileUrl);
    const parts = pathname.split("/").filter(Boolean);
    const uploadIdx = parts.findIndex((p) => p === "upload");
    if (uploadIdx === -1) return null;

    // Take everything after "upload"
    let after = parts.slice(uploadIdx + 1);

    // Drop version segment like "v1700000000" if present
    if (after[0] && /^v\d+$/.test(after[0])) after = after.slice(1);

    // If Cloudinary ever adds transformation segments, public_id begins after them.
    // Our uploads don't use transformations, so we keep this simple.
    const joined = decodeURIComponent(after.join("/"));
    return joined.replace(/\.[^/.]+$/, ""); // strip extension
  } catch {
    return null;
  }
};

export const deleteCloudinaryFileByUrl = async (fileUrl) => {
  const publicId = extractPublicIdFromUrl(fileUrl);
  if (!publicId) return { result: "skipped" };
  return await cloudinary.uploader.destroy(publicId, { invalidate: true });
};

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