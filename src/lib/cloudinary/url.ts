"use server";

import { cloudinary } from "./config";

/**
 * Generate a signed URL for a private Cloudinary image
 * This ensures only authenticated users can access the image
 *
 * @param publicId - Cloudinary public_id of the image
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL for the image
 */
export async function getSignedImageUrl(
  publicId: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    // Generate signed URL with expiration
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;

    const url = cloudinary.url(publicId, {
      type: "private",
      sign_url: true,
      secure: true,
      expires_at: timestamp,
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });

    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return "";
  }
}

/**
 * Generate a signed URL with custom transformations
 *
 * @param publicId - Cloudinary public_id of the image
 * @param options - Transformation options
 * @returns Signed URL for the image
 */
export async function getSignedImageUrlWithTransform(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    gravity?: string;
    expiresIn?: number;
  } = {}
): Promise<string> {
  try {
    const { expiresIn = 3600, ...transformOptions } = options;
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;

    const url = cloudinary.url(publicId, {
      type: "private",
      sign_url: true,
      secure: true,
      expires_at: timestamp,
      transformation: [
        transformOptions,
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });

    return url;
  } catch (error) {
    console.error("Error generating signed URL with transform:", error);
    return "";
  }
}

/**
 * Generate a thumbnail URL for a private image
 *
 * @param publicId - Cloudinary public_id of the image
 * @param size - Thumbnail size (default: 150)
 * @returns Signed URL for the thumbnail
 */
export async function getThumbnailUrl(
  publicId: string,
  size: number = 150
): Promise<string> {
  return getSignedImageUrlWithTransform(publicId, {
    width: size,
    height: size,
    crop: "fill",
    gravity: "auto",
  });
}
