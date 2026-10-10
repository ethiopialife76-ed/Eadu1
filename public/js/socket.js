/**
 * Socket.IO Real-Time Client for 2KT Chating
 */

const SocketClient = {
  socket: null,
  typingTimeouts: {},

  init(token) {
    if (this.socket) {
      this.socket.disconnect();
    }

    const serverUrl = (window.API && API.getServerUrl()) ? API.getServerUrl() : undefined;

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to real-time messaging gateway');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Real-time connection error:', err.message);
    });

    // Incoming new message
    this.socket.on('new_message', (message) => {
      const isFromMe = window.currentUser && message.sender_id === window.currentUser.id;

      if (window.activeChatId === message.chat_id) {
        // Render in active chat
        ChatRenderer.appendMessage(message, window.currentUser, true);
        ChatRenderer.currentMessages.push(message);

        // Mark as read
        this.markRead(message.chat_id, message.id);
      }

      // If message is from someone else, trigger native notifications and haptics
      if (!isFromMe && window.PWA) {
        PWA.vibrate([60, 40, 60]);
        const notificationText = message.message_type === 'image' ? '📷 Sent a photo' :
                                 message.message_type === 'audio' ? '🎙️ Sent a voice note' :
                                 message.message_type === 'video' ? '🎥 Sent a video' :
                                 message.message_type === 'document' ? '📄 Sent a document' :
                                 (message.content || 'New message');
        PWA.sendSystemNotification(
          message.sender_name ? `${message.sender_name}` : '2KT Chating',
          notificationText,
          '/icons/icon-192.png'
        );
      }

      // Update sidebar
      if (window.App && window.App.handleIncomingMessageSidebar) {
        window.App.handleIncomingMessageSidebar(message);
      }
    });

    // Conversation preview updated
    this.socket.on('conversation_updated', (data) => {
      if (window.App && window.App.updateChatPreview) {
        window.App.updateChatPreview(data);
      }
    });

    // User typing
    this.socket.on('user_typing', ({ chatId, userName }) => {
      if (window.activeChatId === chatId) {
        const sub = document.getElementById('activeChatSubtitle');
        if (sub) {
          sub.textContent = `${userName} is typing...`;
          sub.className = 'chat-header-sub typing';
        }
      }
    });

    // User stopped typing
    this.socket.on('user_stopped_typing', ({ chatId }) => {
      if (window.activeChatId === chatId) {
        const sub = document.getElementById('activeChatSubtitle');
        if (sub && window.activeChatSubtitleDefault) {
          sub.textContent = window.activeChatSubtitleDefault;
          sub.className = window.activeChatSubtitleClass || 'chat-header-sub';
        }
      }
    });

    // Reactions updated
    this.socket.on('reactions_updated', ({ messageId, chatId, reactions }) => {
      if (window.activeChatId === chatId) {
        const msg = ChatRenderer.currentMessages.find(m => m.id === messageId);
        if (msg) msg.reactions = reactions;
        ChatRenderer.renderReactions(messageId, reactions, window.currentUser.id);
      }
    });

    // Message deleted
    this.socket.on('message_deleted', ({ messageId, chatId }) => {
      if (window.activeChatId === chatId) {
        const row = document.getElementById(`msg-${messageId}`);
        if (row) {
          const bubble = row.querySelector('.message-bubble');
          if (bubble) {
            bubble.innerHTML = `
              <div style="font-style: italic; opacity: 0.7; font-size: 13.5px; display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                <span>This message was deleted</span>
              </div>
            `;
          }
        }
      }
    });

    // Online status changed
    this.socket.on('user_status_changed', ({ userId, status, last_seen }) => {
      if (window.App && window.App.handleUserStatusChanged) {
        window.App.handleUserStatusChanged(userId, status, last_seen);
      }
    });
  },

  joinChat(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_chat', chatId);
    }
  },

  sendMessage(messageData) {
    if (!this.socket || !this.socket.connected) {
      showToast('Connecting to server...', 'error');
      return;
    }
    this.socket.emit('send_message', messageData, (res) => {
      if (res && res.error) {
        showToast(res.error, 'error');
      }
    });
  },

  sendTypingStart(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_start', { chatId });
    }
  },

  sendTypingStop(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_stop', { chatId });
    }
  },

  toggleReaction(messageId, chatId, emoji) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('toggle_reaction', { messageId, chatId, emoji });
    }
  },

  deleteMessage(messageId, chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('delete_message', { messageId, chatId }, (res) => {
        if (res && res.error) {
          showToast(res.error, 'error');
        }
      });
    }
  },

  markRead(chatId, messageId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark_read', { chatId, messageId });
    }
  }
};
