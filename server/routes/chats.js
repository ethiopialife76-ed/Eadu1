const express = require('express');
const crypto = require('crypto');
const db = require('../database');
const { authMiddleware } = require('../auth');

const router = express.Router();

// Helper: Format a chat object with recipient info for direct chats or group info for groups
function formatChat(chat, currentUserId) {
  if (chat.type === 'direct') {
    // Find the other participant
    const otherUser = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar, u.bio, u.status, u.last_seen
      FROM chat_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = ? AND cp.user_id != ?
    `).get(chat.id, currentUserId);

    return {
      ...chat,
      name: otherUser ? otherUser.display_name : 'Deleted Account',
      username: otherUser ? otherUser.username : '',
      avatar: otherUser ? otherUser.avatar : null,
      recipient: otherUser || null,
      is_online: otherUser ? otherUser.status === 'online' : false,
      last_seen: otherUser ? otherUser.last_seen : null
    };
  } else {
    // Group chat
    const membersCount = db.prepare(`
      SELECT COUNT(*) as count FROM chat_participants WHERE chat_id = ?
    `).get(chat.id).count;

    return {
      ...chat,
      members_count: membersCount
    };
  }
}

// GET /api/chats - Get all user's chats
router.get('/', authMiddleware, (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all chats user is part of
    const chats = db.prepare(`
      SELECT c.*
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ?
      ORDER BY c.updated_at DESC
    `).all(currentUserId);

    const formattedChats = chats.map(chat => {
      const base = formatChat(chat, currentUserId);

      // Get last message
      const lastMessage = db.prepare(`
        SELECT m.id, m.chat_id, m.sender_id, m.content, m.type, m.file_name, m.created_at, m.is_deleted,
               u.display_name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ?
        ORDER BY m.created_at DESC
        LIMIT 1
      `).get(chat.id);

      // Get participant's last_read_message_id
      const participant = db.prepare(`
        SELECT last_read_message_id FROM chat_participants
        WHERE chat_id = ? AND user_id = ?
      `).get(chat.id, currentUserId);

      // Count unread messages
      let unreadCount = 0;
      if (participant && participant.last_read_message_id) {
        const lastReadMsg = db.prepare('SELECT created_at FROM messages WHERE id = ?').get(participant.last_read_message_id);
        if (lastReadMsg) {
          unreadCount = db.prepare(`
            SELECT COUNT(*) as count FROM messages
            WHERE chat_id = ? AND sender_id != ? AND created_at > ?
          `).get(chat.id, currentUserId, lastReadMsg.created_at).count;
        } else {
          unreadCount = db.prepare(`
            SELECT COUNT(*) as count FROM messages
            WHERE chat_id = ? AND sender_id != ?
          `).get(chat.id, currentUserId).count;
        }
      } else {
        unreadCount = db.prepare(`
          SELECT COUNT(*) as count FROM messages
          WHERE chat_id = ? AND sender_id != ?
        `).get(chat.id, currentUserId).count;
      }

      return {
        ...base,
        last_message: lastMessage || null,
        unread_count: unreadCount
      };
    });

    res.json({ chats: formattedChats });
  } catch (err) {
    console.error('Fetch chats error:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// POST /api/chats/direct - Start or retrieve a 1-on-1 chat
router.post('/direct', authMiddleware, (req, res) => {
  try {
    const { recipient_id } = req.body;
    const currentUserId = req.user.id;

    if (!recipient_id) {
      return res.status(400).json({ error: 'recipient_id is required' });
    }

    if (recipient_id === currentUserId) {
      return res.status(400).json({ error: 'Cannot create a direct chat with yourself' });
    }

    // Verify recipient exists
    const recipient = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(recipient_id);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user does not exist' });
    }

    // Check if direct chat already exists between these two users
    const existing = db.prepare(`
      SELECT c.id, c.type, c.created_at, c.updated_at
      FROM chats c
      JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
      JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
      WHERE c.type = 'direct'
      LIMIT 1
    `).get(currentUserId, recipient_id);

    if (existing) {
      const fullChat = formatChat(existing, currentUserId);
      return res.json({ chat: fullChat });
    }

    // Create new direct chat
    const chatId = crypto.randomUUID();
    const now = Date.now();

    db.prepare(`
      INSERT INTO chats (id, type, name, created_by, created_at, updated_at)
      VALUES (?, 'direct', NULL, ?, ?, ?)
    `).run(chatId, currentUserId, now, now);

    db.prepare(`
      INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
      VALUES (?, ?, 'member', ?), (?, ?, 'member', ?)
    `).run(chatId, currentUserId, now, chatId, recipient_id, now);

    const newChat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
    const fullChat = formatChat(newChat, currentUserId);

    res.status(201).json({ chat: fullChat });
  } catch (err) {
    console.error('Create direct chat error:', err);
    res.status(500).json({ error: 'Failed to create direct chat' });
  }
});

// POST /api/chats/group - Create a group chat
router.post('/group', authMiddleware, (req, res) => {
  try {
    const { name, member_ids, avatar } = req.body;
    const currentUserId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const chatId = crypto.randomUUID();
    const now = Date.now();
    const groupName = name.trim();
    const groupAvatar = avatar || `ui-avatar:${(groupName[0] || 'G').toUpperCase()}:10b981`;

    db.prepare(`
      INSERT INTO chats (id, type, name, avatar, created_by, created_at, updated_at)
      VALUES (?, 'group', ?, ?, ?, ?, ?)
    `).run(chatId, groupName, groupAvatar, currentUserId, now, now);

    // Add creator as admin
    db.prepare(`
      INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
      VALUES (?, ?, 'admin', ?)
    `).run(chatId, currentUserId, now);

    // Add selected members
    if (Array.isArray(member_ids)) {
      const insertMember = db.prepare(`
        INSERT OR IGNORE INTO chat_participants (chat_id, user_id, role, joined_at)
        VALUES (?, ?, 'member', ?)
      `);
      for (const memberId of member_ids) {
        if (memberId && memberId !== currentUserId) {
          insertMember.run(chatId, memberId, now);
        }
      }
    }

    // Add system welcome message
    const welcomeMsgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO messages (id, chat_id, sender_id, content, type, created_at)
      VALUES (?, ?, ?, ?, 'text', ?)
    `).run(welcomeMsgId, chatId, currentUserId, `Group "${groupName}" created. Welcome everyone! 🎉`, now);

    const newChat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
    const fullChat = formatChat(newChat, currentUserId);

    res.status(201).json({ chat: fullChat });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// GET /api/chats/:chatId - Get single chat details
router.get('/:chatId', authMiddleware, (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    // Check membership
    const isMember = db.prepare(`
      SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?
    `).get(chatId, currentUserId);

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const participants = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar, u.bio, u.status, u.last_seen, cp.role, cp.joined_at
      FROM chat_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = ?
      ORDER BY cp.role = 'admin' DESC, u.display_name ASC
    `).all(chatId);

    const fullChat = {
      ...formatChat(chat, currentUserId),
      participants
    };

    res.json({ chat: fullChat });
  } catch (err) {
    console.error('Fetch chat details error:', err);
    res.status(500).json({ error: 'Failed to load chat details' });
  }
});

// GET /api/chats/:chatId/messages - Load messages for a chat
router.get('/:chatId/messages', authMiddleware, (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // created_at cursor for scrolling up

    // Verify membership
    const isMember = db.prepare(`
      SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?
    `).get(chatId, currentUserId);

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    let messages;
    if (before) {
      messages = db.prepare(`
        SELECT m.*, u.username as sender_username, u.display_name as sender_name, u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ? AND m.created_at < ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `).all(chatId, parseInt(before), limit);
    } else {
      messages = db.prepare(`
        SELECT m.*, u.username as sender_username, u.display_name as sender_name, u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `).all(chatId, limit);
    }

    // Reverse to chronological order (oldest to newest)
    messages.reverse();

    // Attach reply details and reactions
    const enrichedMessages = messages.map(msg => {
      let replyTo = null;
      if (msg.reply_to_id) {
        replyTo = db.prepare(`
          SELECT m.id, m.content, m.type, m.file_name, u.display_name as sender_name
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `).get(msg.reply_to_id);
      }

      const reactions = db.prepare(`
        SELECT r.emoji, r.user_id, u.display_name as user_name
        FROM message_reactions r
        JOIN users u ON r.user_id = u.id
        WHERE r.message_id = ?
      `).all(msg.id);

      return {
        ...msg,
        reply_to: replyTo || null,
        reactions: reactions || []
      };
    });

    res.json({ messages: enrichedMessages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// POST /api/chats/:chatId/read - Mark messages as read
router.post('/:chatId/read', authMiddleware, (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    const latestMessage = db.prepare(`
      SELECT id FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(chatId);

    if (latestMessage) {
      db.prepare(`
        UPDATE chat_participants
        SET last_read_message_id = ?
        WHERE chat_id = ? AND user_id = ?
      `).run(latestMessage.id, chatId, currentUserId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update read status' });
  }
});

// GET /api/chats/:chatId/media - Get all shared media in chat
router.get('/:chatId/media', authMiddleware, (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    // Verify membership
    const isMember = db.prepare(`
      SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?
    `).get(chatId, currentUserId);

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const media = db.prepare(`
      SELECT m.id, m.chat_id, m.sender_id, m.content, m.type, m.file_url, m.file_name, m.file_size, m.file_mime, m.created_at,
             u.display_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ? AND m.type IN ('image', 'document', 'audio', 'video') AND m.is_deleted = 0
      ORDER BY m.created_at DESC
    `).all(chatId);

    res.json({ media });
  } catch (err) {
    console.error('Fetch media error:', err);
    res.status(500).json({ error: 'Failed to load shared media' });
  }
});

module.exports = router;
module.exports.formatChat = formatChat;
