"use server";

import { cloudinary, CLOUDINARY_FOLDERS } from "./config";

export type CloudinaryUploadResult = {
  success: boolean;
  publicId?: string;
  secureUrl?: string;
  error?: string;
};

/**
 * Upload an image to Cloudinary (server-side)
 * Images are uploaded as private (type: "private") to ensure only authenticated users can access them
 *
 * @param file - File object or base64 string
 * @param userId - User ID for organizing files
 * @param folder - Cloudinary folder (profile-pictures or progress-photos)
 * @returns Upload result with public_id and secure_url
 */
export async function uploadToCloudinary(
  file: File | string,
  userId: string,
  folder: typeof CLOUDINARY_FOLDERS[keyof typeof CLOUDINARY_FOLDERS]
): Promise<CloudinaryUploadResult> {
  try {
    // Convert File to base64 if needed
    let fileData: string;

    if (typeof file === "string") {
      fileData = file;
    } else {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileData = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    // Upload to Cloudinary with private access
    const result = await cloudinary.uploader.upload(fileData, {
      folder: `${folder}/${userId}`,
      type: "private", // Private images - requires signed URLs to access
      resource_type: "image",
      transformation: [
        { quality: "auto:good" }, // Automatic quality optimization
        { fetch_format: "auto" }, // Automatic format selection (WebP when supported)
      ],
    });

    return {
      success: true,
      publicId: result.public_id,
      secureUrl: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload a profile picture to Cloudinary
 *
 * @param file - File object or base64 string
 * @param userId - User ID
 * @returns Upload result
 */
export async function uploadProfilePicture(
  file: File | string,
  userId: string
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, userId, CLOUDINARY_FOLDERS.PROFILE_PICTURES);
}

/**
 * Upload a progress photo to Cloudinary
 *
 * @param file - File object or base64 string
 * @param userId - User ID
 * @returns Upload result
 */
export async function uploadProgressPhoto(
  file: File | string,
  userId: string
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, userId, CLOUDINARY_FOLDERS.PROGRESS_PHOTOS);
}

/**
 * Delete an image from Cloudinary
 *
 * @param publicId - Cloudinary public_id of the image
 * @returns Deletion result
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudinary.uploader.destroy(publicId, { type: "private" });
    return { success: true };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}
