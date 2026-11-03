import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

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
 * Stores a candidate photograph in private local storage
 * Returns unique storage key
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

  // Ensure target upload directory exists
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
 * Retrieves a candidate photograph file buffer from private storage
 */
export async function getCandidatePhotograph(storageKey: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  // Prevent path traversal attacks
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

