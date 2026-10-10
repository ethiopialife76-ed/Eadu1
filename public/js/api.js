/**
 * REST API Client for 2KT Chating
 */

const API = {
  token: localStorage.getItem('messenger_token') || null,

  // Get active backend server URL (empty string means relative origin)
  getServerUrl() {
    const saved = localStorage.getItem('twokt_server_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
    // Browser check: if running from HTTP/HTTPS, default to window.location.origin
    if (typeof window !== 'undefined' && window.location) {
      const loc = window.location;
      // If we are on web (localhost:3000, or deployed cloud domain)
      if (loc.protocol.startsWith('http')) {
        return loc.origin;
      }
    }
    return '';
  },

  // Set or update backend server URL
  setServerUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem('twokt_server_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('twokt_server_url');
    }
  },

  // Resolve relative path to absolute server URL when needed
  resolveUrl(endpoint) {
    if (!endpoint) return '';
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://') || endpoint.startsWith('data:') || endpoint.startsWith('blob:')) {
      return endpoint;
    }
    const base = this.getServerUrl();
    const cleanPath = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return base ? `${base}${cleanPath}` : cleanPath;
  },

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('messenger_token', token);
    } else {
      localStorage.removeItem('messenger_token');
    }
  },

  async request(endpoint, options = {}) {
    const fullUrl = this.resolveUrl(endpoint);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers
    };

    const response = await fetch(fullUrl, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Server error occurred');
    }

    return data;
  },

  // Auth Endpoints
  async register(userData) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    this.setToken(res.token);
    return res;
  },

  async login(username, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(res.token);
    return res;
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  async updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Users Endpoints
  async getUsers(search = '') {
    const query = search ? `?q=${encodeURIComponent(search)}` : '';
    return this.request(`/api/users${query}`);
  },

  // Chats Endpoints
  async getChats() {
    return this.request('/api/chats');
  },

  async getChat(chatId) {
    return this.request(`/api/chats/${chatId}`);
  },

  async createDirectChat(recipientId) {
    return this.request('/api/chats/direct', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId })
    });
  },

  async createGroupChat(name, memberIds, avatar) {
    return this.request('/api/chats/group', {
      method: 'POST',
      body: JSON.stringify({ name, member_ids: memberIds, avatar })
    });
  },

  async getMessages(chatId, before = null) {
    const query = before ? `?before=${before}` : '';
    return this.request(`/api/chats/${chatId}/messages${query}`);
  },

  async markRead(chatId) {
    return this.request(`/api/chats/${chatId}/read`, {
      method: 'POST'
    });
  },

  async getChatMedia(chatId) {
    return this.request(`/api/chats/${chatId}/media`);
  },

  // File Upload
  async uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const uploadUrl = this.resolveUrl(`/api/upload?type=${type}`);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload material');
    }

    return data;
  },

  // Server Info & Network URLs
  async getInfo() {
    const response = await fetch(this.resolveUrl('/api/info'));
    return response.json();
  }
};
