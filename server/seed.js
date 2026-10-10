const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./database');

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function seedInitialData() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount > 0) {
      return; // Already initialized
    }

    console.log('Seeding initial demo contacts and friendly group...');
    const now = Date.now();
    const defaultPasswordHash = hashPassword('1234');

    const demoUsers = [
      {
        id: crypto.randomUUID(),
        username: 'sarah',
        display_name: 'Sarah Connor',
        avatar: 'ui-avatar:S:ec4899',
        bio: 'Photographer & Designer 📸 Feel free to share high-res photos & designs!',
        status: 'online',
        last_seen: now,
        created_at: now - 3600000 * 24
      },
      {
        id: crypto.randomUUID(),
        username: 'david',
        display_name: 'David Miller',
        avatar: 'ui-avatar:D:3b82f6',
        bio: 'Software engineer 💻 Share PDF docs, spreadsheets, or code anytime.',
        status: 'online',
        last_seen: now,
        created_at: now - 3600000 * 20
      },
      {
        id: crypto.randomUUID(),
        username: 'elena',
        display_name: 'Elena Rostova',
        avatar: 'ui-avatar:E:10b981',
        bio: 'Music & podcast enthusiast 🎧 Try sending a voice note!',
        status: 'online',
        last_seen: now,
        created_at: now - 3600000 * 15
      }
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, display_name, password_hash, avatar, bio, status, last_seen, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of demoUsers) {
      insertUser.run(u.id, u.username, u.display_name, defaultPasswordHash, u.avatar, u.bio, u.status, u.last_seen, u.created_at);
    }

    // Create a demo group chat "Friends & Crew 🚀"
    const groupId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO chats (id, type, name, avatar, created_by, created_at, updated_at)
      VALUES (?, 'group', 'Friends & Crew 🚀', 'ui-avatar:F:8b5cf6', ?, ?, ?)
    `).run(groupId, demoUsers[0].id, now - 3600000 * 10, now - 3600000 * 2);

    // Add demo participants to the group
    const insertMember = db.prepare(`
      INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?)
    `);

    insertMember.run(groupId, demoUsers[0].id, 'admin', now - 3600000 * 10);
    insertMember.run(groupId, demoUsers[1].id, 'member', now - 3600000 * 10);
    insertMember.run(groupId, demoUsers[2].id, 'member', now - 3600000 * 10);

    // Add initial messages in the group
    const insertMsg = db.prepare(`
      INSERT INTO messages (id, chat_id, sender_id, content, type, created_at)
      VALUES (?, ?, ?, ?, 'text', ?)
    `);

    insertMsg.run(crypto.randomUUID(), groupId, demoUsers[0].id, 'Hey guys! Welcome to our Messenger space! 🎉', now - 3600000 * 8);
    insertMsg.run(crypto.randomUUID(), groupId, demoUsers[1].id, 'Awesome! We can share documents, spreadsheets, images, and voice notes here anytime.', now - 3600000 * 6);
    insertMsg.run(crypto.randomUUID(), groupId, demoUsers[2].id, 'Love this! Looking forward to sharing our projects and catching up! 💬', now - 3600000 * 3);

    console.log('Sample demo friends seeded successfully! Demo accounts available: sarah, david, elena (password: 1234)');
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

module.exports = { seedInitialData };
