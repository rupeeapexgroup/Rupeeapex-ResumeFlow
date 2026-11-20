import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
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

  // WebP magic bytes: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, mimeType: 'image/webp' };
  }

  return { isValid: false, mimeType: '' };
}

/**
 * Normalizes image orientation using EXIF metadata and Sharp.
 * Automatically rotates portrait and landscape images upright based on EXIF tag (1-8),
 * clears/resets the EXIF orientation tag so downstream renderers (browsers, PDF generators)
 * do not double-rotate, and ensures optimal JPEG/PNG quality.
 */
export async function normalizeImageOrientation(
  buffer: Buffer
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const { isValid, mimeType } = validateImageMagicBytes(buffer);
    if (!isValid) {
      throw new Error('Invalid image file content. Only genuine JPEG, PNG, and WEBP images are permitted.');
    }

    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Calling .rotate() without arguments auto-orients according to EXIF orientation
    // and clears/resets the EXIF orientation tag to avoid double-rotation downstream.
    let pipeline = image.rotate();

    if (metadata.format === 'png' || mimeType === 'image/png') {
      pipeline = pipeline.png({ quality: 92, compressionLevel: 7 });
    } else {
      // High-quality JPEG (also normalizes WebP to JPEG for downstream PDF generator compatibility)
      pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
    }

    const normalizedBuffer = await pipeline.toBuffer();
    const finalMime = (metadata.format === 'png' || mimeType === 'image/png') ? 'image/png' : 'image/jpeg';

    return {
      buffer: normalizedBuffer,
      mimeType: finalMime,
    };
  } catch (err: any) {
    console.warn('Image orientation normalization fallback:', err?.message || err);
    const { mimeType } = validateImageMagicBytes(buffer);
    return {
      buffer,
      mimeType: mimeType || 'image/jpeg',
    };
  }
}

/**
 * Stores a candidate photograph in Cloudinary (or private local storage as fallback)
 * Automatically normalizes EXIF orientation before persisting.
 * Returns unique storage key / secure URL
 */
export async function saveCandidatePhotograph(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<{ storageKey: string; mimeType: string; size: number }> {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error('Photo size exceeds the maximum allowed limit of 5 MB. Please select an image smaller than or equal to 5 MB.');
  }

  const { isValid } = validateImageMagicBytes(fileBuffer);
  if (!isValid) {
    throw new Error('Invalid file content. Only real JPEG and PNG images are permitted.');
  }

  // Normalize image orientation before storing so that all downstream consumers
  // (web preview, candidate profile, dashboard list, downloaded image, and PDF generator)
  // receive an already normalized, upright image.
  const { buffer: normalizedBuffer, mimeType } = await normalizeImageOrientation(fileBuffer);

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
        uploadStream.end(normalizedBuffer);
      });

      return {
        storageKey: uploadResult.secure_url || uploadResult.url,
        mimeType,
        size: normalizedBuffer.length,
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

  await fs.writeFile(fullPath, normalizedBuffer);

  return {
    storageKey: filename,
    mimeType,
    size: normalizedBuffer.length,
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

/**
 * Permanently deletes candidate photograph from storage (local disk or Cloudinary)
 */
export async function deleteCandidatePhotograph(storageKey: string): Promise<boolean> {
  if (!storageKey) return false;

  try {
    // 1. If remote Cloudinary URL
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
      if (isCloudinaryConfigured()) {
        try {
          const urlParts = storageKey.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          if (uploadIndex !== -1) {
            const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
            const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
              return true;
            }
          }
        } catch (cErr) {
          console.warn('Cloudinary photo delete warning:', cErr);
        }
      }
      return false;
    }

    // 2. Local storage
    const safeFilename = path.basename(storageKey);
    const fullPath = path.join(UPLOAD_DIR, safeFilename);

    try {
      await fs.unlink(fullPath);
      return true;
    } catch (fsErr: any) {
      if (fsErr.code === 'ENOENT') {
        return true; // File already gone
      }
      console.warn('Error unlinking photo file:', fsErr);
      return false;
    }
  } catch (err) {
    console.warn('Failed to delete photograph:', err);
    return false;
  }
}

/**
 * Validates resume file buffer and extension to strictly permit only genuine PDF, DOC, and DOCX documents
 */
export function validateResumeMagicBytes(
  buffer: Buffer,
  originalFilename: string = ''
): { isValid: boolean; mimeType: string; format: 'pdf' | 'doc' | 'docx' | '' } {
  if (!buffer || buffer.length < 4) {
    return { isValid: false, mimeType: '', format: '' };
  }

  const ext = path.extname(originalFilename || '').toLowerCase();

  // 1. PDF format: starts with '%PDF' (0x25, 0x50, 0x44, 0x46) or within first 1024 bytes
  const isPdfMagic =
    (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) ||
    buffer.slice(0, 1024).includes(Buffer.from('%PDF-'));

  if (isPdfMagic && (ext === '.pdf' || !ext)) {
    return { isValid: true, mimeType: 'application/pdf', format: 'pdf' };
  }

  // 2. DOC format (OLE2 Compound Document): D0 CF 11 E0 A1 B1 1A E1
  const isDocMagic =
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1;

  if (isDocMagic && (ext === '.doc' || !ext)) {
    return { isValid: true, mimeType: 'application/msword', format: 'doc' };
  }

  // 3. DOCX format (ZIP archive format containing Word documents): PK 03 04 / PK 05 06 / PK 07 08
  const isZipMagic =
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

  if (isZipMagic && (ext === '.docx' || !ext)) {
    return {
      isValid: true,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      format: 'docx',
    };
  }

  return { isValid: false, mimeType: '', format: '' };
}

/**
 * Stores a candidate resume in Cloudinary (or local private storage as fallback)
 * Validates maximum 5 MB file size and strict PDF/DOC/DOCX content
 */
export async function saveCandidateResume(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<{ storageKey: string; fileName: string; mimeType: string; size: number }> {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error('Resume size exceeds the maximum allowed limit of 5 MB. Please select a file smaller than or equal to 5 MB.');
  }

  const { isValid, mimeType, format } = validateResumeMagicBytes(fileBuffer, originalFilename);
  if (!isValid) {
    throw new Error('Invalid resume format. Only genuine PDF, DOC, and DOCX documents are permitted.');
  }

  const safeOriginalName = path.basename(originalFilename || `resume.${format || 'pdf'}`);

  // 1. If Cloudinary is configured, upload raw file directly to Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'resumeflow/candidate_resumes',
            resource_type: 'raw',
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
        fileName: safeOriginalName,
        mimeType,
        size: fileBuffer.length,
      };
    } catch (uploadError) {
      console.error('Cloudinary resume upload error, falling back to local disk storage:', uploadError);
    }
  }

  // 2. Fallback / default: local disk storage
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(safeOriginalName).toLowerCase() || `.${format || 'pdf'}`;
  const randomHex = crypto.randomBytes(16).toString('hex');
  const filename = `resume_${Date.now()}_${randomHex}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(fullPath, fileBuffer);

  return {
    storageKey: filename,
    fileName: safeOriginalName,
    mimeType,
    size: fileBuffer.length,
  };
}

/**
 * Retrieves a candidate resume file buffer from Cloudinary or local private storage
 */
export async function getCandidateResume(
  storageKey: string,
  fallbackMimeType?: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!storageKey) return null;

  // 1. If remote Cloudinary URL
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    try {
      const response = await fetch(storageKey);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mime = fallbackMimeType || response.headers.get('content-type') || 'application/pdf';
      return { buffer, mimeType: mime };
    } catch (err) {
      console.error('Failed to fetch resume from Cloudinary URL:', err);
      return null;
    }
  }

  // 2. Local storage
  const safeFilename = path.basename(storageKey);
  const fullPath = path.join(UPLOAD_DIR, safeFilename);

  try {
    const buffer = await fs.readFile(fullPath);
    let mime = fallbackMimeType;
    if (!mime) {
      if (safeFilename.endsWith('.pdf')) mime = 'application/pdf';
      else if (safeFilename.endsWith('.docx')) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (safeFilename.endsWith('.doc')) mime = 'application/msword';
      else mime = 'application/octet-stream';
    }
    return { buffer, mimeType: mime };
  } catch (err) {
    return null;
  }
}

/**
 * Permanently deletes candidate resume from storage (local disk or Cloudinary)
 */
export async function deleteCandidateResume(storageKey: string): Promise<boolean> {
  if (!storageKey) return false;

  try {
    // 1. If remote Cloudinary URL
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
      if (isCloudinaryConfigured()) {
        try {
          const urlParts = storageKey.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          if (uploadIndex !== -1) {
            const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
            if (publicIdWithExt) {
              await cloudinary.uploader.destroy(publicIdWithExt, { resource_type: 'raw' });
              return true;
            }
          }
        } catch (cErr) {
          console.warn('Cloudinary resume delete warning:', cErr);
        }
      }
      return false;
    }

    // 2. Local storage
    const safeFilename = path.basename(storageKey);
    const fullPath = path.join(UPLOAD_DIR, safeFilename);

    try {
      await fs.unlink(fullPath);
      return true;
    } catch (fsErr: any) {
      if (fsErr.code === 'ENOENT') {
        return true; // File already gone
      }
      console.warn('Error unlinking resume file:', fsErr);
      return false;
    }
  } catch (err) {
    console.warn('Failed to delete resume:', err);
    return false;
  }
}


