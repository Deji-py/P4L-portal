/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function updateDisplayTime(timeString: string) {
  const [hours, minutes] = timeString.split(":");
  let displayHours = parseInt(hours, 10);
  const ampm = displayHours >= 12 ? "PM" : "AM";

  // Convert hours to 12-hour format
  displayHours = displayHours % 12;
  displayHours = displayHours ? displayHours : 12; // "0" becomes "12"

  return `${displayHours}:${minutes} ${ampm}`;
}

// @/utils/fileUpload.ts

/**
 * Validates if a file is an image
 */
export const isValidImage = (file: File): boolean => {
  return file.type.startsWith("image/");
};

/**
 * Validates if a file is a video
 */
export const isValidVideo = (file: File): boolean => {
  return file.type.startsWith("video/");
};

/**
 * Checks if file size is within limit
 */
export const isFileSizeValid = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Gets video duration in seconds
 */
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Formats file size to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Generates a unique filename
 */
export const generateFileName = (
  farmerId: number,
  originalName: string
): string => {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop();
  return `${farmerId}-${timestamp}.${extension}`;
};

/**
 * Compresses an image file
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Validates video file
 */
export const validateVideoFile = async (
  file: File,
  maxSizeMB: number = 50,
  maxDurationSeconds: number = 10
): Promise<{ valid: boolean; error?: string }> => {
  // Check if it's a video
  if (!isValidVideo(file)) {
    return { valid: false, error: "File must be a video" };
  }

  // Check file size
  if (!isFileSizeValid(file, maxSizeMB)) {
    return { valid: false, error: `Video must be less than ${maxSizeMB}MB` };
  }

  // Check duration
  try {
    const duration = await getVideoDuration(file);
    if (duration > maxDurationSeconds) {
      return {
        valid: false,
        error: `Video must be ${maxDurationSeconds} seconds or less`,
      };
    }
  } catch (error) {
    return { valid: false, error: "Unable to read video metadata" };
  }

  return { valid: true };
};

/**
 * Validates image file
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } => {
  // Check if it's an image
  if (!isValidImage(file)) {
    return { valid: false, error: "File must be an image" };
  }

  // Check file size
  if (!isFileSizeValid(file, maxSizeMB)) {
    return { valid: false, error: `Image must be less than ${maxSizeMB}MB` };
  }

  return { valid: true };
};

/**
 * Creates a thumbnail from video
 */
export const createVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");

    video.onloadeddata = () => {
      video.currentTime = 1; // Get frame at 1 second
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create thumbnail"));
            return;
          }

          const url = URL.createObjectURL(blob);
          URL.revokeObjectURL(video.src);
          resolve(url);
        },
        "image/jpeg",
        0.8
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video"));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Upload file to Supabase Storage with progress tracking
 */
export const uploadFileWithProgress = async (
  supabaseClient: any,
  bucket: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Note: Supabase client doesn't natively support progress tracking
  // This is a wrapper that simulates progress for better UX

  if (onProgress) {
    onProgress(0);
  }

  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (onProgress) {
    onProgress(100);
  }

  const {
    data: { publicUrl },
  } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
};

/**
 * Delete file from Supabase Storage
 */
export const deleteFile = async (
  supabaseClient: any,
  bucket: string,
  filePath: string
): Promise<void> => {
  const { error } = await supabaseClient.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

/**
 * Get file path from public URL
 */
export const getFilePathFromUrl = (publicUrl: string): string | null => {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split("/");
    // Remove '/storage/v1/object/public/bucket-name/' prefix
    return pathParts.slice(6).join("/");
  } catch {
    return null;
  }
};
