/**
 * Chat Rendering & Message DOM Management for 2KT Chating
 */

const ChatRenderer = {
  currentMessages: [],
  lastRenderedDate: null,

  // Render full list of messages into the container
  renderMessages(messages, currentUser) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    container.innerHTML = '';
    this.currentMessages = messages || [];
    this.lastRenderedDate = null;

    if (this.currentMessages.length === 0) {
      container.innerHTML = `
        <div class="empty-placeholder">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <p style="font-size: 15px; font-weight: 500;">No messages yet</p>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Say hello or send a photo/document to begin!</p>
        </div>
      `;
      return;
    }

    this.currentMessages.forEach(msg => {
      this.appendMessage(msg, currentUser, false);
    });

    this.scrollToBottom();
  },

  // Append a single message (for incoming real-time or new sent messages)
  appendMessage(msg, currentUser, shouldScroll = true) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    // Check if empty placeholder exists
    const placeholder = container.querySelector('.empty-placeholder');
    if (placeholder) placeholder.remove();

    // Check date separator
    const msgDateStr = new Date(msg.created_at).toDateString();
    if (this.lastRenderedDate !== msgDateStr) {
      this.lastRenderedDate = msgDateStr;
      const separator = document.createElement('div');
      separator.className = 'date-separator';
      separator.textContent = formatDateSeparator(msg.created_at);
      container.appendChild(separator);
    }

    const isOutgoing = (msg.sender_id === currentUser.id);
    const row = document.createElement('div');
    row.className = `message-row ${isOutgoing ? 'outgoing' : 'incoming'}`;
    row.id = `msg-${msg.id}`;
    row.dataset.msgId = msg.id;

    let innerContent = '';

    // Sender Name in group chats if incoming
    if (!isOutgoing && window.activeChatType === 'group') {
      innerContent += `<div class="message-sender">${escapeHtml(msg.sender_name || 'Friend')}</div>`;
    }

    // Replying-to Quote Block
    if (msg.reply_to) {
      const repSender = escapeHtml(msg.reply_to.sender_name || 'Message');
      let repText = escapeHtml(msg.reply_to.content || '');
      if (msg.reply_to.type === 'image') repText = '📷 Photo';
      if (msg.reply_to.type === 'document') repText = `📄 ${escapeHtml(msg.reply_to.file_name || 'Document')}`;
      if (msg.reply_to.type === 'audio') repText = '🎙️ Voice note';
      if (msg.reply_to.type === 'video') repText = '🎥 Video';

      innerContent += `
        <div class="reply-quote" onclick="ChatRenderer.scrollToMessage('${msg.reply_to.id}')">
          <div class="reply-quote-sender">${repSender}</div>
          <div class="reply-quote-text">${repText}</div>
        </div>
      `;
    }

    // Handle Deleted Messages
    if (msg.is_deleted) {
      innerContent += `
        <div style="font-style: italic; opacity: 0.7; font-size: 13.5px; display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          <span>This message was deleted</span>
        </div>
      `;
    } else {
      // Media Renderers
      const resolvedFileUrl = (window.API && API.resolveUrl) ? API.resolveUrl(msg.file_url) : msg.file_url;

      if (msg.type === 'image' && msg.file_url) {
        innerContent += `
          <div class="message-image-wrap" onclick="MediaManager.openLightbox('${resolvedFileUrl}', '${escapeHtml(msg.file_name || 'photo.png')}')">
            <img class="message-image" src="${resolvedFileUrl}" alt="${escapeHtml(msg.file_name || 'Shared Image')}" loading="lazy">
          </div>
        `;
      } else if (msg.type === 'video' && msg.file_url) {
        innerContent += `
          <div class="message-video-wrap">
            <video class="message-video" controls src="${resolvedFileUrl}" preload="metadata"></video>
          </div>
        `;
      } else if (msg.type === 'audio' && msg.file_url) {
        const audioId = `audio-${msg.id}`;
        innerContent += `
          <div class="message-audio-wrap" id="${audioId}">
            <button class="audio-play-btn" onclick="ChatRenderer.handlePlayAudio('${resolvedFileUrl}', this)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
            <div class="audio-track-info">
              <div class="audio-progress-bar">
                <div class="audio-progress-fill" style="width: 0%;"></div>
              </div>
              <div class="audio-time-row">
                <span class="audio-time-text">00:00</span>
                <span>${formatBytes(msg.file_size)}</span>
              </div>
            </div>
          </div>
        `;
      } else if (msg.type === 'document' && msg.file_url) {
        innerContent += `
          <div class="message-doc-card">
            <div class="doc-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </div>
            <div class="doc-info">
              <div class="doc-name" title="${escapeHtml(msg.file_name)}">${escapeHtml(msg.file_name || 'Document')}</div>
              <div class="doc-size">${formatBytes(msg.file_size)}</div>
            </div>
            <a class="doc-download-btn" href="${resolvedFileUrl}" download="${escapeHtml(msg.file_name)}" title="Download file" target="_blank">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </a>
          </div>
        `;
      }

      // Text Content
      if (msg.content) {
        innerContent += `<div class="message-text">${linkifyText(msg.content)}</div>`;
      }
    }

    // Timestamp & Delivery status ticks
    const timeFormatted = formatMessageTime(msg.created_at);
    let ticksSvg = '';
    if (isOutgoing) {
      ticksSvg = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    }

    innerContent += `
      <div class="bubble-meta">
        <span>${timeFormatted}</span>
        ${ticksSvg}
      </div>
    `;

    // Action bar on hover (Reply, React, Delete)
    let deleteBtnHtml = '';
    if (isOutgoing && !msg.is_deleted) {
      deleteBtnHtml = `
        <button class="action-bar-btn" title="Delete message" onclick="ChatRenderer.deleteMessage('${msg.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;
    }

    const actionsBar = `
      <div class="message-actions-bar">
        <button class="action-bar-btn" title="React" onclick="ChatRenderer.toggleReactionPopover('${msg.id}', this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
        </button>
        <button class="action-bar-btn" title="Reply" onclick="ChatRenderer.initiateReply('${msg.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
        </button>
        ${deleteBtnHtml}
      </div>
    `;

    // Reactions container
    const reactionsHtml = `<div class="reactions-container" id="reactions-${msg.id}"></div>`;

    row.innerHTML = `
      ${actionsBar}
      <div class="message-bubble">${innerContent}</div>
      ${reactionsHtml}
    `;

    container.appendChild(row);

    // Render reactions if any
    this.renderReactions(msg.id, msg.reactions || [], currentUser.id);

    if (shouldScroll) {
      this.scrollToBottom();
    }
  },

  // Render reaction chips on a message
  renderReactions(msgId, reactions, currentUserId) {
    const container = document.getElementById(`reactions-${msgId}`);
    if (!container) return;

    container.innerHTML = '';
    if (!reactions || reactions.length === 0) return;

    // Group by emoji
    const grouped = {};
    reactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { count: 0, hasMe: false, users: [] };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user_name || 'Friend');
      if (r.user_id === currentUserId) {
        grouped[r.emoji].hasMe = true;
      }
    });

    Object.entries(grouped).forEach(([emoji, data]) => {
      const pill = document.createElement('div');
      pill.className = `reaction-pill ${data.hasMe ? 'reacted' : ''}`;
      pill.title = data.users.join(', ');
      pill.innerHTML = `<span>${emoji}</span><span>${data.count}</span>`;
      pill.onclick = () => {
        SocketClient.toggleReaction(msgId, window.activeChatId, emoji);
      };
      container.appendChild(pill);
    });
  },

  // Reaction picker popover
  toggleReactionPopover(msgId, triggerBtn) {
    // Remove existing popovers
    document.querySelectorAll('.reaction-picker-popover').forEach(p => p.remove());

    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];
    const popover = document.createElement('div');
    popover.className = 'reaction-picker-popover';

    emojis.forEach(e => {
      const btn = document.createElement('button');
      btn.className = 'reaction-picker-btn';
      btn.textContent = e;
      btn.onclick = (event) => {
        event.stopPropagation();
        SocketClient.toggleReaction(msgId, window.activeChatId, e);
        popover.remove();
      };
      popover.appendChild(btn);
    });

    triggerBtn.parentElement.parentElement.appendChild(popover);

    // Auto close on outside click
    const closeHandler = (e) => {
      if (!popover.contains(e.target)) {
        popover.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  },

  // Initiate Reply to a message
  initiateReply(msgId) {
    const msg = this.currentMessages.find(m => m.id === msgId);
    if (!msg) return;

    window.currentReplyTo = msg;
    const banner = document.getElementById('replyBanner');
    const sender = document.getElementById('replySenderName');
    const snippet = document.getElementById('replySnippet');

    sender.textContent = `Replying to ${msg.sender_name || 'Friend'}`;
    let text = msg.content || '';
    if (msg.type === 'image') text = '📷 Photo';
    if (msg.type === 'document') text = `📄 ${msg.file_name || 'Document'}`;
    if (msg.type === 'audio') text = '🎙️ Voice note';
    if (msg.type === 'video') text = '🎥 Video';
    snippet.textContent = text;

    banner.classList.remove('hidden');
    document.getElementById('messageInput').focus();
  },

  // Delete message
  deleteMessage(msgId) {
    if (confirm('Delete this message for everyone?')) {
      SocketClient.deleteMessage(msgId, window.activeChatId);
    }
  },

  // Play audio in message
  handlePlayAudio(url, btn) {
    const wrap = btn.closest('.message-audio-wrap');
    const fill = wrap.querySelector('.audio-progress-fill');
    const timeText = wrap.querySelector('.audio-time-text');
    MediaManager.playAudio(url, btn, fill, timeText);
  },

  // Scroll to a referenced message and flash it
  scrollToMessage(msgId) {
    const target = document.getElementById(`msg-${msgId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.style.transition = 'background-color 0.4s';
      target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
      setTimeout(() => {
        target.style.backgroundColor = 'transparent';
      }, 1200);
    }
  },

  // Scroll messages container to bottom
  scrollToBottom(smooth = true) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
};
