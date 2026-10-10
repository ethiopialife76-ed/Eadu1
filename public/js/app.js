/**
 * Main Application Orchestrator for 2KT Chating
 */

window.currentUser = null;
window.activeChatId = null;
window.activeChatType = null;
window.currentReplyTo = null;
window.activeChatSubtitleDefault = '';
window.activeChatSubtitleClass = '';

const App = {
  chats: [],
  currentFilter: 'all',
  typingTimer: null,
  selectedAvatarColor: '3b82f6',

  async init() {
    this.initTheme();
    this.bindAuthEvents();
    this.bindNavigationEvents();
    this.bindChatEvents();
    this.bindModalEvents();
    this.initEmojiPicker();
    MediaManager.init();

    // Check existing session
    const token = localStorage.getItem('messenger_token');
    if (token) {
      try {
        const { user } = await API.getMe();
        this.loginSuccess(user, token);
      } catch (err) {
        console.warn('Session expired:', err.message);
        API.setToken(null);
        this.showAuth();
      }
    } else {
      this.showAuth();
    }
  },

  // Dark / Light Theme
  initTheme() {
    const savedTheme = localStorage.getItem('messenger_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    const toggleBtn = document.getElementById('btnThemeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('messenger_theme', next);
        this.updateThemeIcon(next);
      });
    }
  },

  updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (theme === 'light') {
      // Moon icon
      icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    } else {
      // Sun icon
      icon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    }
  },

  showAuth() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
  },

  // Auth Tabs & Form Handlers
  bindAuthEvents() {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authError = document.getElementById('authError');

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      authError.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      authError.classList.add('hidden');
    });

    // Avatar color choices
    const colorChoices = document.querySelectorAll('#avatarColorPicker .avatar-choice');
    colorChoices.forEach(choice => {
      choice.addEventListener('click', () => {
        colorChoices.forEach(c => c.classList.remove('selected'));
        choice.classList.add('selected');
        this.selectedAvatarColor = choice.dataset.color;
      });
    });

    // Submit Login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      authError.classList.add('hidden');
      const u = document.getElementById('loginUsername').value.trim();
      const p = document.getElementById('loginPassword').value;

      try {
        const { user, token } = await API.login(u, p);
        this.loginSuccess(user, token);
      } catch (err) {
        authError.textContent = err.message || 'Login failed';
        authError.classList.remove('hidden');
      }
    });

    // Submit Register
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      authError.classList.add('hidden');
      const displayName = document.getElementById('regDisplayName').value.trim();
      const username = document.getElementById('regUsername').value.trim();
      const password = document.getElementById('regPassword').value;
      const bio = document.getElementById('regBio').value.trim();
      const initial = (displayName[0] || username[0] || 'U').toUpperCase();
      const avatar = `ui-avatar:${initial}:${this.selectedAvatarColor}`;

      try {
        const { user, token } = await API.register({
          display_name: displayName,
          username,
          password,
          bio,
          avatar
        });
        this.loginSuccess(user, token);
      } catch (err) {
        authError.textContent = err.message || 'Registration failed';
        authError.classList.remove('hidden');
      }
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
      if (confirm('Log out from 2KT Chating?')) {
        API.setToken(null);
        window.location.reload();
      }
    });
  },

  // Called after successful login/registration
  loginSuccess(user, token) {
    window.currentUser = user;
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');

    // Populate user profile info in sidebar
    document.getElementById('myDisplayName').textContent = user.display_name;
    document.getElementById('myUsername').textContent = `@${user.username}`;
    applyAvatarToElement(document.getElementById('myAvatar'), user.avatar, user.display_name);

    // Initialize real-time socket connection
    SocketClient.init(token);

    // Load initial chats
    this.loadChats();

    // Request native notifications permission if supported
    if (window.PWA && PWA.requestNotificationPermission) {
      PWA.requestNotificationPermission();
    }
  },

  // Navigation & UI Events
  bindNavigationEvents() {
    // Search input in sidebar
    const searchInput = document.getElementById('chatSearchInput');
    searchInput.addEventListener('input', (e) => {
      this.filterChatsList(e.target.value.trim().toLowerCase());
    });

    // Filter tabs (All, Direct, Groups)
    const tabs = document.querySelectorAll('.sidebar-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.filter;
        this.renderChatList();
      });
    });

    // Mobile back button
    document.getElementById('btnBackToSidebar').addEventListener('click', () => {
      document.getElementById('appContainer').classList.remove('chat-open');
      window.activeChatId = null;
    });

    // Welcome screen buttons
    document.getElementById('welcomeStartChatBtn').addEventListener('click', () => {
      this.openNewChatModal();
    });
    document.getElementById('welcomeInviteBtn').addEventListener('click', () => {
      this.openInviteModal();
    });
  },

  // Fetch and display conversations
  async loadChats() {
    try {
      const { chats } = await API.getChats();
      this.chats = chats || [];
      this.renderChatList();
    } catch (err) {
      console.error('Failed to load chats:', err);
      showToast('Could not load conversations', 'error');
    }
  },

  // Render conversations in sidebar
  renderChatList() {
    const listEl = document.getElementById('chatList');
    if (!listEl) return;

    let filtered = this.chats;
    if (this.currentFilter === 'direct') {
      filtered = filtered.filter(c => c.type === 'direct');
    } else if (this.currentFilter === 'group') {
      filtered = filtered.filter(c => c.type === 'group');
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-placeholder">
          <p style="font-size: 14px; color: var(--text-muted);">No conversations yet</p>
          <button class="btn-secondary" style="margin-top: 10px; font-size: 13px;" onclick="App.openNewChatModal()">Find Friends</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach(chat => {
      const item = document.createElement('div');
      item.className = `chat-item ${chat.id === window.activeChatId ? 'active' : ''}`;
      item.id = `sidebar-chat-${chat.id}`;
      item.onclick = () => this.openChat(chat.id);

      const isDirect = (chat.type === 'direct');
      const isOnline = isDirect && chat.is_online;

      let lastMsgText = 'No messages yet';
      if (chat.last_message) {
        if (chat.last_message.is_deleted) {
          lastMsgText = 'Message deleted';
        } else if (chat.last_message.type === 'image') {
          lastMsgText = '📷 Photo';
        } else if (chat.last_message.type === 'document') {
          lastMsgText = `📄 ${escapeHtml(chat.last_message.file_name || 'Document')}`;
        } else if (chat.last_message.type === 'audio') {
          lastMsgText = '🎙️ Voice note';
        } else if (chat.last_message.type === 'video') {
          lastMsgText = '🎥 Video';
        } else if (chat.last_message.content) {
          lastMsgText = escapeHtml(chat.last_message.content);
        }
      }

      const timeStr = chat.last_message ? formatChatTime(chat.last_message.created_at) : '';
      const badgeHtml = chat.unread_count > 0 ? `<span class="chat-item-badge">${chat.unread_count}</span>` : '';

      item.innerHTML = `
        <div class="avatar-wrapper">
          <div class="avatar-img" id="avatar-chat-${chat.id}">C</div>
          ${isDirect ? `<span class="online-indicator ${isOnline ? '' : 'offline'}"></span>` : ''}
        </div>
        <div class="chat-item-content">
          <div class="chat-item-top">
            <span class="chat-item-name">${escapeHtml(chat.name || 'Chat')}</span>
            <span class="chat-item-time">${timeStr}</span>
          </div>
          <div class="chat-item-bottom">
            <span class="chat-item-preview">${lastMsgText}</span>
            ${badgeHtml}
          </div>
        </div>
      `;

      listEl.appendChild(item);
      applyAvatarToElement(item.querySelector(`#avatar-chat-${chat.id}`), chat.avatar, chat.name);
    });
  },

  // Filter chats by search query
  filterChatsList(q) {
    const listEl = document.getElementById('chatList');
    const items = listEl.querySelectorAll('.chat-item');
    items.forEach(item => {
      const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
      const preview = item.querySelector('.chat-item-preview').textContent.toLowerCase();
      if (!q || name.includes(q) || preview.includes(q)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  },

  // Open a conversation
  async openChat(chatId) {
    try {
      window.activeChatId = chatId;
      document.getElementById('appContainer').classList.add('chat-open');

      // Update sidebar active selection
      document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
      const activeItem = document.getElementById(`sidebar-chat-${chatId}`);
      if (activeItem) {
        activeItem.classList.add('active');
        // Clear unread badge
        const badge = activeItem.querySelector('.chat-item-badge');
        if (badge) badge.remove();
      }

      // Fetch Chat Details
      const { chat } = await API.getChat(chatId);
      window.activeChatType = chat.type;

      // Update Header
      document.getElementById('chatWelcome').classList.add('hidden');
      document.getElementById('chatActiveView').classList.remove('hidden');

      const titleEl = document.getElementById('activeChatTitle');
      const subEl = document.getElementById('activeChatSubtitle');
      const avatarEl = document.getElementById('activeChatAvatar');
      const dotEl = document.getElementById('activeChatOnlineDot');

      titleEl.textContent = chat.name;
      applyAvatarToElement(avatarEl, chat.avatar, chat.name);

      if (chat.type === 'direct') {
        const isOnline = chat.is_online;
        dotEl.style.display = 'block';
        dotEl.className = `online-indicator ${isOnline ? '' : 'offline'}`;
        const subText = isOnline ? 'online' : (chat.last_seen ? `last seen ${formatChatTime(chat.last_seen)}` : 'offline');
        subEl.textContent = subText;
        subEl.className = `chat-header-sub ${isOnline ? '' : 'offline'}`;
        window.activeChatSubtitleDefault = subText;
        window.activeChatSubtitleClass = subEl.className;
      } else {
        dotEl.style.display = 'none';
        const subText = `${chat.participants ? chat.participants.length : (chat.members_count || 1)} members`;
        subEl.textContent = subText;
        subEl.className = 'chat-header-sub offline';
        window.activeChatSubtitleDefault = subText;
        window.activeChatSubtitleClass = subEl.className;
      }

      // Join room via socket
      SocketClient.joinChat(chatId);

      // Load Messages
      const { messages } = await API.getMessages(chatId);
      ChatRenderer.renderMessages(messages, window.currentUser);

      // Mark as read
      API.markRead(chatId);

      // Focus message input
      document.getElementById('messageInput').focus();

      // Update right drawer info
      this.updateRightDrawer(chat);

    } catch (err) {
      console.error('Failed to open chat:', err);
      showToast('Could not load chat', 'error');
    }
  },

  // Bind message input & sending events
  bindChatEvents() {
    const textarea = document.getElementById('messageInput');
    const sendBtn = document.getElementById('btnSendMessage');
    const voiceBtn = document.getElementById('btnVoiceRecord');
    const attachBtn = document.getElementById('btnToggleAttachment');
    const attachMenu = document.getElementById('attachmentMenu');
    const emojiBtn = document.getElementById('btnToggleEmoji');
    const emojiPicker = document.getElementById('emojiPicker');
    const replyCloseBtn = document.getElementById('btnCloseReply');

    // Input auto-grow & toggling send vs voice button
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';

      const hasText = textarea.value.trim().length > 0;
      if (hasText) {
        sendBtn.classList.remove('hidden');
        voiceBtn.classList.add('hidden');
      } else {
        sendBtn.classList.add('hidden');
        voiceBtn.classList.remove('hidden');
      }

      // Emit typing
      if (window.activeChatId) {
        SocketClient.sendTypingStart(window.activeChatId);
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
          SocketClient.sendTypingStop(window.activeChatId);
        }, 2000);
      }
    });

    // Enter key sends, Shift+Enter new line
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Click Send
    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    // Cancel Reply
    window.clearReply = () => {
      window.currentReplyTo = null;
      document.getElementById('replyBanner').classList.add('hidden');
    };
    replyCloseBtn.addEventListener('click', window.clearReply);

    // Attachment menu toggle
    attachBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      attachMenu.classList.toggle('hidden');
      emojiPicker.classList.add('hidden');
    });

    // File input triggers
    document.getElementById('btnAttachImage').addEventListener('click', () => {
      attachMenu.classList.add('hidden');
      document.getElementById('fileInputImage').click();
    });
    document.getElementById('btnAttachDoc').addEventListener('click', () => {
      attachMenu.classList.add('hidden');
      document.getElementById('fileInputDoc').click();
    });
    document.getElementById('btnAttachAudio').addEventListener('click', () => {
      attachMenu.classList.add('hidden');
      document.getElementById('fileInputAudio').click();
    });

    // File input change handlers
    ['fileInputImage', 'fileInputDoc', 'fileInputAudio'].forEach(id => {
      const input = document.getElementById(id);
      input.addEventListener('change', async () => {
        if (input.files && input.files[0]) {
          await MediaManager.uploadAndSendFile(input.files[0]);
          input.value = '';
        }
      });
    });

    // Emoji picker toggle
    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiPicker.classList.toggle('hidden');
      attachMenu.classList.add('hidden');
    });

    // Hide popovers on outside click
    document.addEventListener('click', (e) => {
      if (!attachMenu.contains(e.target) && e.target !== attachBtn) {
        attachMenu.classList.add('hidden');
      }
      if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.classList.add('hidden');
      }
    });

    // Toggle Right Drawer
    document.getElementById('btnToggleMediaDrawer').addEventListener('click', () => {
      document.getElementById('rightDrawer').classList.toggle('collapsed');
    });
    document.getElementById('btnCloseDrawer').addEventListener('click', () => {
      document.getElementById('rightDrawer').classList.add('collapsed');
    });
  },

  // Send current text message
  sendMessage() {
    const textarea = document.getElementById('messageInput');
    const content = textarea.value.trim();

    if (!content || !window.activeChatId) return;

    SocketClient.sendMessage({
      chatId: window.activeChatId,
      content,
      type: 'text',
      reply_to_id: window.currentReplyTo ? window.currentReplyTo.id : null
    });

    if (window.PWA) {
      PWA.vibrate([25]);
    }

    textarea.value = '';
    textarea.style.height = 'auto';
    document.getElementById('btnSendMessage').classList.add('hidden');
    document.getElementById('btnVoiceRecord').classList.remove('hidden');

    if (window.clearReply) window.clearReply();
    SocketClient.sendTypingStop(window.activeChatId);
  },

  // Emoji picker setup
  initEmojiPicker() {
    const container = document.getElementById('emojiPicker');
    if (!container) return;

    const emojiList = [
      '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰',
      '😘','😗','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨',
      '😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕',
      '🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁',
      '😮','😯','😲','😳','🥺','😦','😧','📁','📄','📊','📈','📎','❤️','🔥','👍','🎉'
    ];

    emojiList.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'emoji-btn';
      btn.type = 'button';
      btn.textContent = emoji;
      btn.onclick = () => {
        const textarea = document.getElementById('messageInput');
        textarea.value += emoji;
        textarea.focus();
        textarea.dispatchEvent(new Event('input'));
      };
      container.appendChild(btn);
    });
  },

  // Update Right Drawer with Chat Info & Media
  async updateRightDrawer(chat) {
    document.getElementById('drawerName').textContent = chat.name;
    document.getElementById('drawerBio').textContent = chat.bio || (chat.type === 'group' ? 'Group conversation' : '');
    applyAvatarToElement(document.getElementById('drawerAvatar'), chat.avatar, chat.name);

    // Group members section
    const groupSec = document.getElementById('drawerGroupSection');
    const membersList = document.getElementById('drawerMembersList');
    if (chat.type === 'group' && chat.participants) {
      groupSec.classList.remove('hidden');
      membersList.innerHTML = '';
      chat.participants.forEach(m => {
        const item = document.createElement('div');
        item.className = 'user-select-item';
        item.innerHTML = `
          <div class="user-select-left">
            <div class="avatar-wrapper" style="width:34px; height:34px;">
              <div class="avatar-img" id="mem-${m.id}">U</div>
              <span class="online-indicator ${m.status === 'online' ? '' : 'offline'}"></span>
            </div>
            <div>
              <div style="font-weight:600; font-size:13.5px;">${escapeHtml(m.display_name)}</div>
              <div style="font-size:11px; color:var(--text-muted);">${m.role === 'admin' ? '👑 Admin' : 'Member'}</div>
            </div>
          </div>
        `;
        membersList.appendChild(item);
        applyAvatarToElement(item.querySelector(`#mem-${m.id}`), m.avatar, m.display_name);
      });
    } else {
      groupSec.classList.add('hidden');
    }

    // Load shared media
    try {
      const { media } = await API.getChatMedia(chat.id);
      const mediaGrid = document.getElementById('drawerMediaGrid');
      const docsList = document.getElementById('drawerDocsList');

      mediaGrid.innerHTML = '';
      docsList.innerHTML = '';

      const photosAndVideos = (media || []).filter(m => m.type === 'image' || m.type === 'video');
      const docs = (media || []).filter(m => m.type === 'document' || m.type === 'audio');

      if (photosAndVideos.length === 0) {
        mediaGrid.innerHTML = `<span style="font-size:12px; color:var(--text-muted); grid-column:span 3;">No shared photos</span>`;
      } else {
        photosAndVideos.slice(0, 9).forEach(m => {
          const thumb = document.createElement('div');
          thumb.className = 'gallery-thumb';
          const resolvedUrl = (window.API && API.resolveUrl) ? API.resolveUrl(m.file_url) : m.file_url;
          if (m.type === 'image') {
            thumb.innerHTML = `<img src="${resolvedUrl}" alt="${escapeHtml(m.file_name)}">`;
            thumb.onclick = () => MediaManager.openLightbox(resolvedUrl, m.file_name);
          } else {
            thumb.innerHTML = `<video src="${resolvedUrl}" style="width:100%; height:100%; object-fit:cover;"></video>`;
          }
          mediaGrid.appendChild(thumb);
        });
      }

      if (docs.length === 0) {
        docsList.innerHTML = `<span style="font-size:12px; color:var(--text-muted);">No shared documents</span>`;
      } else {
        docs.slice(0, 6).forEach(d => {
          const docResolvedUrl = (window.API && API.resolveUrl) ? API.resolveUrl(d.file_url) : d.file_url;
          const docItem = document.createElement('a');
          docItem.className = 'doc-list-item';
          docItem.href = docResolvedUrl;
          docItem.download = d.file_name;
          docItem.target = '_blank';
          docItem.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(d.file_name)}</div>
              <div style="font-size:11px; opacity:0.75;">${formatBytes(d.file_size)}</div>
            </div>
          `;
          docsList.appendChild(docItem);
        });
      }
    } catch (err) {
      console.warn('Could not load chat media gallery:', err);
    }
  },

  // Modals management
  bindModalEvents() {
    // New Chat Modal
    document.getElementById('btnNewChat').addEventListener('click', () => this.openNewChatModal());
    document.getElementById('btnCloseNewChatModal').addEventListener('click', () => {
      document.getElementById('modalNewChat').classList.add('hidden');
    });

    // New Group Modal
    document.getElementById('btnNewGroup').addEventListener('click', () => this.openNewGroupModal());
    document.getElementById('btnCloseNewGroupModal').addEventListener('click', () => {
      document.getElementById('modalNewGroup').classList.add('hidden');
    });
    document.getElementById('btnCancelNewGroup').addEventListener('click', () => {
      document.getElementById('modalNewGroup').classList.add('hidden');
    });
    document.getElementById('btnSubmitNewGroup').addEventListener('click', () => this.submitNewGroup());

    // Invite Modal
    document.getElementById('btnInviteFriends').addEventListener('click', () => this.openInviteModal());
    document.getElementById('btnCloseInviteModal').addEventListener('click', () => {
      document.getElementById('modalInvite').classList.add('hidden');
    });
    document.getElementById('btnCopyInviteUrl').addEventListener('click', () => {
      const input = document.getElementById('inviteUrlField');
      input.select();
      navigator.clipboard.writeText(input.value);
      showToast('Invite link copied to clipboard!', 'success');
    });

    // Edit Profile Modal
    document.getElementById('currentUserProfileBtn').addEventListener('click', () => this.openProfileModal());
    document.getElementById('btnCloseProfileModal').addEventListener('click', () => {
      document.getElementById('modalProfile').classList.add('hidden');
    });
    document.getElementById('btnCancelProfile').addEventListener('click', () => {
      document.getElementById('modalProfile').classList.add('hidden');
    });
    document.getElementById('btnSaveProfile').addEventListener('click', () => this.saveProfile());

    // Search users in new chat modal
    document.getElementById('userSearchModalInput').addEventListener('input', (e) => {
      this.searchUsersForNewChat(e.target.value.trim());
    });

    // Server Config Modal (Android, iOS, Windows, Mac, Web)
    const openServerModal = () => {
      const input = document.getElementById('inputServerUrl');
      const statusDiv = document.getElementById('serverConnectionStatus');
      input.value = API.getServerUrl() || '';
      statusDiv.style.display = 'none';
      document.getElementById('modalServerConfig').classList.remove('hidden');
    };

    const serverBtns = document.querySelectorAll('.btn-server-config');
    serverBtns.forEach(btn => btn.addEventListener('click', openServerModal));

    document.getElementById('btnCloseServerConfig').addEventListener('click', () => {
      document.getElementById('modalServerConfig').classList.add('hidden');
    });
    document.getElementById('btnCancelServerConfig').addEventListener('click', () => {
      document.getElementById('modalServerConfig').classList.add('hidden');
    });

    document.getElementById('btnServerDetectLocal').addEventListener('click', () => {
      const input = document.getElementById('inputServerUrl');
      if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
        input.value = window.location.origin;
      } else {
        input.value = '';
      }
    });

    document.getElementById('btnTestServerConnection').addEventListener('click', async () => {
      const input = document.getElementById('inputServerUrl');
      const statusDiv = document.getElementById('serverConnectionStatus');
      statusDiv.style.display = 'block';
      statusDiv.style.background = 'rgba(59, 130, 246, 0.15)';
      statusDiv.style.color = '#38bdf8';
      statusDiv.textContent = '⏳ Testing connection to gateway...';

      const targetUrl = (input.value.trim() || (window.location.protocol.startsWith('http') ? window.location.origin : '')).replace(/\/+$/, '');
      const testEndpoint = targetUrl ? `${targetUrl}/api/info` : '/api/info';

      const start = performance.now();
      try {
        const res = await fetch(testEndpoint, { credentials: 'omit', cache: 'no-store' });
        const latency = Math.round(performance.now() - start);
        if (res.ok) {
          statusDiv.style.background = 'rgba(16, 185, 129, 0.15)';
          statusDiv.style.color = '#34d399';
          statusDiv.textContent = `✅ Connected successfully! (${latency}ms latency)`;
        } else {
          statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
          statusDiv.style.color = '#f87171';
          statusDiv.textContent = `⚠️ Gateway responded with HTTP status ${res.status}`;
        }
      } catch (err) {
        statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
        statusDiv.style.color = '#f87171';
        statusDiv.textContent = `❌ Cannot connect: ${err.message}. Check URL or network.`;
      }
    });

    document.getElementById('btnSaveServerConfig').addEventListener('click', () => {
      const input = document.getElementById('inputServerUrl');
      API.setServerUrl(input.value.trim());
      document.getElementById('modalServerConfig').classList.add('hidden');
      showToast('Server configuration saved! Reconnecting...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  },

  // Open New Chat Modal & list users
  async openNewChatModal() {
    const modal = document.getElementById('modalNewChat');
    const list = document.getElementById('modalUsersList');
    modal.classList.remove('hidden');
    list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">Finding friends...</div>`;

    await this.searchUsersForNewChat('');
  },

  async searchUsersForNewChat(query) {
    const list = document.getElementById('modalUsersList');
    try {
      const { users } = await API.getUsers(query);
      if (!users || users.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No friends found</div>`;
        return;
      }

      list.innerHTML = '';
      users.forEach(u => {
        const item = document.createElement('div');
        item.className = 'user-select-item';
        item.onclick = async () => {
          try {
            const { chat } = await API.createDirectChat(u.id);
            document.getElementById('modalNewChat').classList.add('hidden');
            await this.loadChats();
            this.openChat(chat.id);
          } catch (err) {
            showToast(err.message || 'Could not start chat', 'error');
          }
        };

        item.innerHTML = `
          <div class="user-select-left">
            <div class="avatar-wrapper">
              <div class="avatar-img" id="user-avatar-${u.id}">U</div>
              <span class="online-indicator ${u.status === 'online' ? '' : 'offline'}"></span>
            </div>
            <div>
              <div style="font-weight:600; font-size:14px;">${escapeHtml(u.display_name)}</div>
              <div style="font-size:12px; color:var(--text-muted);">@${escapeHtml(u.username)}</div>
            </div>
          </div>
          <button class="btn-secondary" style="padding: 6px 12px; font-size:12.5px;">Chat</button>
        `;
        list.appendChild(item);
        applyAvatarToElement(item.querySelector(`#user-avatar-${u.id}`), u.avatar, u.display_name);
      });
    } catch (err) {
      list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--danger);">Error loading users</div>`;
    }
  },

  // Open New Group Modal
  async openNewGroupModal() {
    const modal = document.getElementById('modalNewGroup');
    const list = document.getElementById('modalGroupMembersList');
    document.getElementById('groupNameInput').value = '';
    modal.classList.remove('hidden');

    try {
      const { users } = await API.getUsers();
      list.innerHTML = '';

      if (!users || users.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No friends available to add yet. Invite friends first!</div>`;
        return;
      }

      users.forEach(u => {
        const label = document.createElement('label');
        label.className = 'user-select-item';
        label.style.cursor = 'pointer';
        label.innerHTML = `
          <div class="user-select-left">
            <div class="avatar-wrapper" style="width:34px; height:34px;">
              <div class="avatar-img" id="grp-u-${u.id}">U</div>
            </div>
            <div style="font-size:13.5px; font-weight:600;">${escapeHtml(u.display_name)}</div>
          </div>
          <input type="checkbox" value="${u.id}" class="group-member-checkbox" style="width:18px; height:18px; accent-color:var(--accent);">
        `;
        list.appendChild(label);
        applyAvatarToElement(label.querySelector(`#grp-u-${u.id}`), u.avatar, u.display_name);
      });
    } catch (err) {
      showToast('Could not load user list for group', 'error');
    }
  },

  // Submit Group Creation
  async submitNewGroup() {
    const nameInput = document.getElementById('groupNameInput');
    const groupName = nameInput.value.trim();

    if (!groupName) {
      showToast('Please enter a group name', 'error');
      return;
    }

    const checkboxes = document.querySelectorAll('.group-member-checkbox:checked');
    const memberIds = Array.from(checkboxes).map(cb => cb.value);

    try {
      const { chat } = await API.createGroupChat(groupName, memberIds);
      document.getElementById('modalNewGroup').classList.add('hidden');
      await this.loadChats();
      this.openChat(chat.id);
      showToast(`Group "${groupName}" created!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create group', 'error');
    }
  },

  // Open Invite / Connect Modal
  async openInviteModal() {
    const modal = document.getElementById('modalInvite');
    const urlField = document.getElementById('inviteUrlField');
    const qrCanvas = document.getElementById('qrCanvas');
    modal.classList.remove('hidden');

    try {
      const info = await API.getInfo();
      let bestUrl = window.location.origin;
      if (info && info.networkUrls && info.networkUrls.length > 0) {
        bestUrl = info.networkUrls[0];
      }

      urlField.value = bestUrl;
      drawQRCode(qrCanvas, bestUrl);
    } catch (err) {
      urlField.value = window.location.origin;
      drawQRCode(qrCanvas, window.location.origin);
    }
  },

  // Profile Modal
  openProfileModal() {
    if (!window.currentUser) return;
    const modal = document.getElementById('modalProfile');
    document.getElementById('editDisplayName').value = window.currentUser.display_name;
    document.getElementById('editBio').value = window.currentUser.bio || '';
    modal.classList.remove('hidden');

    const colorChoices = document.querySelectorAll('#editAvatarColorPicker .avatar-choice');
    colorChoices.forEach(choice => {
      choice.onclick = () => {
        colorChoices.forEach(c => c.classList.remove('selected'));
        choice.classList.add('selected');
        this.selectedAvatarColor = choice.dataset.color;
      };
    });
  },

  async saveProfile() {
    const displayName = document.getElementById('editDisplayName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const initial = (displayName[0] || 'U').toUpperCase();
    const avatar = `ui-avatar:${initial}:${this.selectedAvatarColor}`;

    try {
      const { user } = await API.updateProfile({
        display_name: displayName,
        bio,
        avatar
      });

      window.currentUser = user;
      document.getElementById('myDisplayName').textContent = user.display_name;
      applyAvatarToElement(document.getElementById('myAvatar'), user.avatar, user.display_name);
      document.getElementById('modalProfile').classList.add('hidden');
      showToast('Profile updated successfully!', 'success');
      this.loadChats();
    } catch (err) {
      showToast('Failed to update profile', 'error');
    }
  },

  // Handle incoming message updating sidebar
  handleIncomingMessageSidebar(msg) {
    let chat = this.chats.find(c => c.id === msg.chat_id);
    if (chat) {
      chat.last_message = msg;
      if (msg.chat_id !== window.activeChatId) {
        chat.unread_count = (chat.unread_count || 0) + 1;
      }
      this.chats.sort((a, b) => {
        const timeA = a.last_message ? a.last_message.created_at : 0;
        const timeB = b.last_message ? b.last_message.created_at : 0;
        return timeB - timeA;
      });
      this.renderChatList();
    } else {
      this.loadChats();
    }
  },

  // Real-time chat preview update from socket
  updateChatPreview({ chatId, last_message }) {
    let chat = this.chats.find(c => c.id === chatId);
    if (chat) {
      chat.last_message = last_message;
      this.chats.sort((a, b) => {
        const timeA = a.last_message ? a.last_message.created_at : 0;
        const timeB = b.last_message ? b.last_message.created_at : 0;
        return timeB - timeA;
      });
      this.renderChatList();
    }
  },

  // Real-time user status changed
  handleUserStatusChanged(userId, status, lastSeen) {
    this.chats.forEach(chat => {
      if (chat.type === 'direct' && chat.recipient && chat.recipient.id === userId) {
        chat.is_online = (status === 'online');
        chat.last_seen = lastSeen;

        // If active chat, update subtitle and indicator
        if (window.activeChatId === chat.id) {
          const dotEl = document.getElementById('activeChatOnlineDot');
          const subEl = document.getElementById('activeChatSubtitle');
          if (dotEl && subEl) {
            dotEl.className = `online-indicator ${chat.is_online ? '' : 'offline'}`;
            const subText = chat.is_online ? 'online' : `last seen ${formatChatTime(lastSeen)}`;
            subEl.textContent = subText;
            subEl.className = `chat-header-sub ${chat.is_online ? '' : 'offline'}`;
            window.activeChatSubtitleDefault = subText;
            window.activeChatSubtitleClass = subEl.className;
          }
        }
      }
    });

    this.renderChatList();
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
