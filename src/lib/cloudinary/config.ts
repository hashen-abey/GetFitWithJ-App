import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (server-side only)
if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };

// Client-side configuration
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
};

// Folder structure for organized storage
export const CLOUDINARY_FOLDERS = {
  PROFILE_PICTURES: "getfitwithj/profile-pictures",
  PROGRESS_PHOTOS: "getfitwithj/progress-photos",
} as const;
