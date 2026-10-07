import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError.js';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'image/png',
      'image/jpeg',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError('Invalid file type. Use PDF, DOCX, ZIP, PNG, or JPG.', 400));
    }
    cb(null, true);
  },
});

const cloudinaryReady = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export const storeFile = async (file) => {
  if (!file) return null;
  if (cloudinaryReady()) {
    const b64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(b64, {
      folder: 'projectmarket-dbu',
      resource_type: 'auto',
    });
    return result.secure_url;
  }

  const ext = path.extname(file.originalname) || '.bin';
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const dest = path.join(uploadDir, name);
  fs.writeFileSync(dest, file.buffer);
  return `/uploads/${name}`;
};
