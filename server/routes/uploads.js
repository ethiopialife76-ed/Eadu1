const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { authMiddleware } = require('../auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let subfolder = 'documents';
    const mime = file.mimetype.toLowerCase();

    if (req.query.type === 'avatar') {
      subfolder = 'avatars';
    } else if (mime.startsWith('image/')) {
      subfolder = 'images';
    } else if (mime.startsWith('video/')) {
      subfolder = 'videos';
    } else if (mime.startsWith('audio/')) {
      subfolder = 'audio';
    }

    const dest = path.join(__dirname, '..', '..', 'uploads', subfolder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

// 100MB limit for rich media, videos, high-res photos, and large files/archives
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Determine media category
function getCategory(mime, originalName) {
  mime = (mime || '').toLowerCase();
  const ext = path.extname(originalName || '').toLowerCase();

  if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['.mp4', '.webm', '.mov', '.mkv', '.avi'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.aac'].includes(ext)) {
    return 'audio';
  }
  return 'document';
}

// POST /api/upload - Single file upload
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }

    const mime = req.file.mimetype;
    let subfolder = 'documents';
    if (req.query.type === 'avatar') {
      subfolder = 'avatars';
    } else if (mime.startsWith('image/')) {
      subfolder = 'images';
    } else if (mime.startsWith('video/')) {
      subfolder = 'videos';
    } else if (mime.startsWith('audio/')) {
      subfolder = 'audio';
    }

    const type = getCategory(mime, req.file.originalname);
    const fileUrl = `/uploads/${subfolder}/${req.file.filename}`;

    res.json({
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      file_mime: req.file.mimetype,
      type: type
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
