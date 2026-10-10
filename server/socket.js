const crypto = require('crypto');
const db = require('./database');
const { socketAuthMiddleware } = require('./auth');

// Map to track active connections per user: userId -> Set of socket IDs
const userSockets = new Map();

function initSocket(io) {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const user = socket.user;
    const userId = user.id;

    // Track socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join personal user room
    socket.join(`user:${userId}`);

    // Update user status to online in database
    const now = Date.now();
    db.prepare('UPDATE users SET status = ?, last_seen = ? WHERE id = ?').run('online', now, userId);

    // Broadcast online status to all users
    io.emit('user_status_changed', {
      userId: userId,
      status: 'online',
      last_seen: now
    });

    // Auto-join all chats the user is part of
    const userChats = db.prepare('SELECT chat_id FROM chat_participants WHERE user_id = ?').all(userId);
    userChats.forEach(row => {
      socket.join(`chat:${row.chat_id}`);
    });

    // Join chat room explicitly
    socket.on('join_chat', (chatId) => {
      // Verify user is in chat
      const member = db.prepare('SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?').get(chatId, userId);
      if (member) {
        socket.join(`chat:${chatId}`);
      }
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // Handle incoming chat message
    socket.on('send_message', (data, callback) => {
      try {
        const { chatId, content, type = 'text', file_url, file_name, file_size, file_mime, reply_to_id } = data;

        // Verify membership
        const member = db.prepare('SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?').get(chatId, userId);
        if (!member) {
          if (callback) callback({ error: 'Not a member of this chat' });
          return;
        }

        const msgId = crypto.randomUUID();
        const msgTime = Date.now();

        // Insert message
        db.prepare(`
          INSERT INTO messages (id, chat_id, sender_id, content, type, file_url, file_name, file_size, file_mime, reply_to_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          msgId,
          chatId,
          userId,
          content || null,
          type,
          file_url || null,
          file_name || null,
          file_size || null,
          file_mime || null,
          reply_to_id || null,
          msgTime
        );

        // Update chat's updated_at
        db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(msgTime, chatId);

        // Update sender's last read message
        db.prepare(`
          UPDATE chat_participants
          SET last_read_message_id = ?
          WHERE chat_id = ? AND user_id = ?
        `).run(msgId, chatId, userId);

        // Fetch reply details if any
        let replyTo = null;
        if (reply_to_id) {
          replyTo = db.prepare(`
            SELECT m.id, m.content, m.type, m.file_name, u.display_name as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
          `).get(reply_to_id);
        }

        const fullMessage = {
          id: msgId,
          chat_id: chatId,
          sender_id: userId,
          sender_username: user.username,
          sender_name: user.display_name,
          sender_avatar: user.avatar,
          content: content || null,
          type,
          file_url: file_url || null,
          file_name: file_name || null,
          file_size: file_size || null,
          file_mime: file_mime || null,
          reply_to_id: reply_to_id || null,
          reply_to: replyTo,
          is_deleted: 0,
          created_at: msgTime,
          reactions: []
        };

        // Broadcast to chat room
        io.to(`chat:${chatId}`).emit('new_message', fullMessage);

        // Notify participants to refresh their conversation preview
        const participants = db.prepare('SELECT user_id FROM chat_participants WHERE chat_id = ?').all(chatId);
        participants.forEach(p => {
          io.to(`user:${p.user_id}`).emit('conversation_updated', {
            chatId,
            last_message: {
              id: msgId,
              chat_id: chatId,
              sender_id: userId,
              sender_name: user.display_name,
              content: content || null,
              type,
              file_name: file_name || null,
              created_at: msgTime
            },
            updated_at: msgTime
          });
        });

        if (callback) callback({ success: true, message: fullMessage });
      } catch (err) {
        console.error('Error sending message:', err);
        if (callback) callback({ error: 'Failed to send message' });
      }
    });

    // Typing start
    socket.on('typing_start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        chatId,
        userId,
        userName: user.display_name
      });
    });

    // Typing stop
    socket.on('typing_stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_stopped_typing', {
        chatId,
        userId
      });
    });

    // Message reactions
    socket.on('toggle_reaction', ({ messageId, chatId, emoji }, callback) => {
      try {
        const existing = db.prepare(`
          SELECT * FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?
        `).get(messageId, userId, emoji);

        if (existing) {
          // Remove reaction
          db.prepare('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').run(messageId, userId, emoji);
        } else {
          // Insert reaction
          db.prepare(`
            INSERT INTO message_reactions (message_id, user_id, emoji, created_at)
            VALUES (?, ?, ?, ?)
          `).run(messageId, userId, emoji, Date.now());
        }

        // Fetch updated reactions for this message
        const reactions = db.prepare(`
          SELECT r.emoji, r.user_id, u.display_name as user_name
          FROM message_reactions r
          JOIN users u ON r.user_id = u.id
          WHERE r.message_id = ?
        `).all(messageId);

        io.to(`chat:${chatId}`).emit('reactions_updated', {
          messageId,
          chatId,
          reactions
        });

        if (callback) callback({ success: true, reactions });
      } catch (err) {
        console.error('Error toggling reaction:', err);
        if (callback) callback({ error: 'Failed to toggle reaction' });
      }
    });

    // Delete message (soft delete)
    socket.on('delete_message', ({ messageId, chatId }, callback) => {
      try {
        const msg = db.prepare('SELECT sender_id FROM messages WHERE id = ?').get(messageId);
        if (!msg || msg.sender_id !== userId) {
          if (callback) callback({ error: 'Unauthorized to delete this message' });
          return;
        }

        db.prepare(`
          UPDATE messages
          SET is_deleted = 1, content = 'This message was deleted', file_url = NULL, file_name = NULL
          WHERE id = ?
        `).run(messageId);

        io.to(`chat:${chatId}`).emit('message_deleted', {
          messageId,
          chatId
        });

        if (callback) callback({ success: true });
      } catch (err) {
        console.error('Error deleting message:', err);
        if (callback) callback({ error: 'Failed to delete message' });
      }
    });

    // Mark messages read
    socket.on('mark_read', ({ chatId, messageId }) => {
      try {
        db.prepare(`
          UPDATE chat_participants
          SET last_read_message_id = ?
          WHERE chat_id = ? AND user_id = ?
        `).run(messageId, chatId, userId);

        socket.to(`chat:${chatId}`).emit('chat_read_receipt', {
          chatId,
          userId,
          messageId
        });
      } catch (err) {
        console.error('Error marking read:', err);
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          const offlineTime = Date.now();
          db.prepare('UPDATE users SET status = ?, last_seen = ? WHERE id = ?').run('offline', offlineTime, userId);

          io.emit('user_status_changed', {
            userId: userId,
            status: 'offline',
            last_seen: offlineTime
          });
        }
      }
    });
  });
}

module.exports = { initSocket };
