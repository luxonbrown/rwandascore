import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

export const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

const ALLOWED_EXTENSIONS = new Map([
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

export function ensureUploadDir() {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = ALLOWED_EXTENSIONS.get(file.mimetype) ?? path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    cb(null, filename);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_EXTENSIONS.has(file.mimetype)) {
      return cb(
        new ApiError(
          400,
          'INVALID_FILE_TYPE',
          'Only JPEG, PNG and WebP images are allowed',
        ),
      );
    }
    return cb(null, true);
  },
});

export function uploadedFileUrl(filename) {
  return `${env.PUBLIC_BASE_URL.replace(/\/+$/, '')}/uploads/${filename}`;
}

export function isSafeUploadFilename(filename) {
  if (!filename || filename !== path.basename(filename)) return false;
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(filename).toLowerCase());
}
