const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../auth');

const router = express.Router();

// GET /api/users (search and discover friends)
router.get('/', authMiddleware, (req, res) => {
  try {
    const { q } = req.query;
    let users;

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      users = db.prepare(`
        SELECT id, username, display_name, avatar, bio, status, last_seen, created_at
        FROM users
        WHERE id != ? AND (username LIKE ? OR display_name LIKE ?)
        ORDER BY status = 'online' DESC, display_name ASC
        LIMIT 50
      `).all(req.user.id, searchTerm, searchTerm);
    } else {
      users = db.prepare(`
        SELECT id, username, display_name, avatar, bio, status, last_seen, created_at
        FROM users
        WHERE id != ?
        ORDER BY status = 'online' DESC, last_seen DESC
        LIMIT 50
      `).all(req.user.id);
    }

    res.json({ users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// GET /api/users/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, display_name, avatar, bio, status, last_seen, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

module.exports = router;
