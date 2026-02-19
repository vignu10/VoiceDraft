import { getInfoAsync, uploadAsync } from "expo-file-system/legacy";
import { apiClient } from "./client";

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  bucket: string;
  region: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload an audio file directly to S3 using presigned URL
 * @param fileUri - Local URI of the audio file
 * @param filename - Name of the file (e.g., 'recording-123456.m4a')
 * @param contentType - MIME type of the audio file
 * @param onProgress - Optional callback for upload progress
 * @param retries - Number of retries on failure (default: 3)
 */
export async function uploadAudioToS3(
  fileUri: string,
  filename: string,
  contentType: string,
  onProgress?: (progress: UploadProgress) => void,
  retries = 3,
): Promise<PresignedUploadResult> {
  // Attempt upload with retries
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Step 1: Get file info
      const fileInfo = await getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      const fileSize = fileInfo.size || 0;

      // Step 2: Get presigned URL from backend
      const presignedResponse = await apiClient.post<PresignedUploadResult>(
        "/api/audio/upload/presigned",
        { filename, contentType },
      );

      if (!presignedResponse.success || !presignedResponse.data) {
        throw new Error(
          presignedResponse.error || "Failed to get presigned URL",
        );
      }

      const {
        uploadUrl,
        key,
        publicUrl,
        bucket,
        region,
      } = presignedResponse.data;

      // Step 3: Upload file directly to S3 using presigned URL
      try {
        await uploadAsync(uploadUrl, fileUri, {
          httpMethod: "PUT",
          headers: {
            "Content-Type": contentType,
          },
          ...(onProgress && {
            progress: (progress: number) => {
              onProgress({
                loaded: progress,
                total: fileSize,
                percentage: Math.round((progress / fileSize) * 100),
              });
            },
          }),
        });
      } catch (uploadError) {
        console.error("[S3 Upload] uploadAsync failed:", uploadError);
        throw uploadError;
      }

      return {
        uploadUrl,
        key,
        publicUrl,
        bucket,
        region,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[S3 Upload] Attempt ${attempt + 1} failed:`, errorMessage);

      // 401 Unauthorized is non-retryable — the auth state won't change between
      // retries. Throw immediately so the caller can handle it gracefully
      // (e.g. show a sign-up prompt for guest users).
      if (errorMessage.includes("HTTP 401")) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === retries - 1) {
        throw new Error(
          `Failed to upload after ${retries} attempts: ${errorMessage}`,
        );
      }

      // Wait before retrying with exponential backoff
      const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  // Should never reach here due to throw in the loop
  throw new Error("Upload failed");
}

/**
 * Get MIME type from file URI
 */
export function getMimeType(uri: string): string {
  const extension =
    uri
      .split(".")
      .pop()
      ?.toLowerCase() || "m4a";

  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    webm: "audio/webm",
    ogg: "audio/ogg",
    aac: "audio/aac",
  };

  return mimeTypes[extension] || "audio/mp4";
}

/**
 * Generate a unique filename for S3 upload
 * @param prefix - Optional prefix for the filename (e.g., 'recording')
 * @returns Generated filename
 */
export function generateS3Filename(prefix = "recording"): string {
  const timestamp = Date.now();
  const random = Math.random()
    .toString(36)
    .substring(2, 8);
  return `${prefix}-${timestamp}-${random}.m4a`;
}
