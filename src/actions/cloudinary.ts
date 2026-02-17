"use server";

import { uploadProfilePicture, uploadProgressPhoto } from "@/lib/cloudinary/upload";
import { getSignedImageUrl } from "@/lib/cloudinary/url";

/**
 * Server action to upload a profile picture
 */
export async function uploadProfilePictureAction(
  formData: FormData,
  userId: string
) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const result = await uploadProfilePicture(file, userId);
    return result;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Server action to upload a progress photo
 */
export async function uploadProgressPhotoAction(
  formData: FormData,
  userId: string
) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const result = await uploadProgressPhoto(file, userId);
    return result;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Server action to get a signed image URL
 */
export async function getSignedImageUrlAction(publicId: string) {
  try {
    const url = await getSignedImageUrl(publicId);
    return { success: true, url };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return { success: false, url: "" };
  }
}
