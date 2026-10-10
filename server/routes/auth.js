const express = require('express');
const crypto = require('crypto');
const db = require('../database');
const { hashPassword, comparePassword, generateToken, authMiddleware } = require('../auth');

const router = express.Router();

// Generate a colorful default avatar URL/initial if none provided
function getDefaultAvatar(name) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#10b981', '#06b6d4', '#3b82f6'];
  const colorIndex = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
  const initial = (name[0] || 'U').toUpperCase();
  return `ui-avatar:${initial}:${colors[colorIndex].replace('#', '')}`;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    let { username, password, display_name, avatar, bio } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    username = username.trim().toLowerCase();
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    if (!/^[a-z0-9_.-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken. Please choose another.' });
    }

    const id = crypto.randomUUID();
    const displayName = (display_name || username).trim();
    const finalAvatar = avatar || getDefaultAvatar(displayName);
    const finalBio = bio || 'Hey there! I am using 2KT Chating.';
    const passwordHash = hashPassword(password);
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, username, display_name, password_hash, avatar, bio, status, last_seen, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'online', ?, ?)
    `).run(id, username, displayName, passwordHash, finalAvatar, finalBio, now, now);

    // Auto-join new user to the default community group if it exists
    const defaultGroup = db.prepare("SELECT id FROM chats WHERE type = 'group' LIMIT 1").get();
    if (defaultGroup) {
      db.prepare(`
        INSERT OR IGNORE INTO chat_participants (chat_id, user_id, role, joined_at)
        VALUES (?, ?, 'member', ?)
      `).run(defaultGroup.id, id, now);
    }

    const user = {
      id,
      username,
      display_name: displayName,
      avatar: finalAvatar,
      bio: finalBio,
      status: 'online',
      last_seen: now,
      created_at: now
    };

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    username = username.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      last_seen: user.last_seen,
      created_at: user.created_at
    };

    const token = generateToken(safeUser);
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { display_name, bio, avatar } = req.body;
    const updates = [];
    const params = [];

    if (display_name !== undefined && display_name.trim().length > 0) {
      updates.push('display_name = ?');
      params.push(display_name.trim());
    }

    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio.trim());
    }

    if (avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (updates.length > 0) {
      params.push(req.user.id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedUser = db.prepare('SELECT id, username, display_name, avatar, bio, status, last_seen, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json({ user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
module.exports.getDefaultAvatar = getDefaultAvatar;
