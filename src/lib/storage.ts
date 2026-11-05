import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET)
  );
};

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const UPLOAD_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates file buffer magic bytes to ensure real image integrity
 */
export function validateImageMagicBytes(buffer: Buffer): { isValid: boolean; mimeType: string } {
  if (buffer.length < 4) {
    return { isValid: false, mimeType: '' };
  }

  // JPEG / JPG magic bytes: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: 'image/jpeg' };
  }

  // PNG magic bytes: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { isValid: true, mimeType: 'image/png' };
  }

  return { isValid: false, mimeType: '' };
}

/**
 * Stores a candidate photograph in Cloudinary (or private local storage as fallback)
 * Returns unique storage key / secure URL
 */
export async function saveCandidatePhotograph(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<{ storageKey: string; mimeType: string; size: number }> {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error('Photograph file size exceeds 5MB limit.');
  }

  const { isValid, mimeType } = validateImageMagicBytes(fileBuffer);
  if (!isValid) {
    throw new Error('Invalid file content. Only real JPEG and PNG images are permitted.');
  }

  // 1. If Cloudinary is configured, upload directly to Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'resumeflow/candidate_photos',
            resource_type: 'image',
            format: mimeType === 'image/png' ? 'png' : 'jpg',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });

      return {
        storageKey: uploadResult.secure_url || uploadResult.url,
        mimeType,
        size: fileBuffer.length,
      };
    } catch (uploadError) {
      console.error('Cloudinary upload error, falling back to local disk storage:', uploadError);
      // Fallback to local storage if Cloudinary upload fails
    }
  }

  // 2. Fallback / default: local disk storage
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = mimeType === 'image/png' ? '.png' : '.jpg';
  const randomHex = crypto.randomBytes(16).toString('hex');
  const filename = `candidate_${Date.now()}_${randomHex}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(fullPath, fileBuffer);

  return {
    storageKey: filename,
    mimeType,
    size: fileBuffer.length,
  };
}

/**
 * Retrieves a candidate photograph file buffer from Cloudinary or local private storage
 */
export async function getCandidatePhotograph(storageKey: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!storageKey) return null;

  // 1. If storageKey is a remote Cloudinary URL
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    try {
      const response = await fetch(storageKey);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { mimeType } = validateImageMagicBytes(buffer);
      return { buffer, mimeType: mimeType || 'image/jpeg' };
    } catch (err) {
      console.error('Failed to fetch image from Cloudinary URL:', err);
      return null;
    }
  }

  // 2. If storageKey is a local filename in UPLOAD_DIR
  const safeFilename = path.basename(storageKey);
  const fullPath = path.join(UPLOAD_DIR, safeFilename);

  try {
    const buffer = await fs.readFile(fullPath);
    const { mimeType } = validateImageMagicBytes(buffer);
    return { buffer, mimeType: mimeType || 'image/jpeg' };
  } catch (err) {
    return null;
  }
}
