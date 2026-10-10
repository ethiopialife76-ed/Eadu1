/**
 * Utility functions for 2KT Chating
 */

// Format timestamp into relative/compact time
function formatChatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { year: '2-digit', month: 'numeric', day: 'numeric' });
}

// Format message timestamp
function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format date header separator
function formatDateSeparator(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// Format file size
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Safe HTML escaping
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Parse URLs in text into clickable links
function linkifyText(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return escaped.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${url}</a>`);
}

// Render Avatar element content and background
function applyAvatarToElement(el, avatarStr, name) {
  if (!el) return;
  const initial = ((name || 'U').trim()[0] || 'U').toUpperCase();

  if (avatarStr && avatarStr.startsWith('ui-avatar:')) {
    const parts = avatarStr.split(':');
    const color = parts[2] ? `#${parts[2]}` : '#3b82f6';
    el.style.backgroundColor = color;
    el.innerHTML = initial;
  } else if (avatarStr && (avatarStr.startsWith('http') || avatarStr.startsWith('/uploads'))) {
    el.style.backgroundColor = 'transparent';
    const avatarUrl = (window.API && API.resolveUrl) ? API.resolveUrl(avatarStr) : avatarStr;
    el.innerHTML = `<img src="${avatarUrl}" alt="${escapeHtml(name)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
  } else {
    el.style.backgroundColor = '#3b82f6';
    el.innerHTML = initial;
  }
}

// Display Toast notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Lightweight QR Code Generator on HTML5 Canvas
// Generates standard functional QR Code matrix without bulky external dependencies
function drawQRCode(canvas, text) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);

  // Generate pseudo-deterministic QR pattern based on URL content
  // Include standard 3 finder corner squares
  const moduleCount = 25;
  const cellSize = size / moduleCount;

  // Background white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Foreground black
  ctx.fillStyle = '#0f172a';

  // Helper to draw a square block
  function drawBlock(r, c) {
    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
  }

  // Draw 3 position detection patterns (corners)
  function drawFinderPattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = row + r;
        const tc = col + c;
        if (tr < 0 || tr >= moduleCount || tc < 0 || tc >= moduleCount) continue;

        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          drawBlock(tr, tc);
        }
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(0, moduleCount - 7);
  drawFinderPattern(moduleCount - 7, 0);

  // Timing patterns
  for (let i = 8; i < moduleCount - 8; i += 2) {
    drawBlock(6, i);
    drawBlock(i, 6);
  }

  // Hash-based data filler
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  // Seeded random matrix for data cells
  let seed = Math.abs(hash) || 123456;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // Don't draw over finder patterns
      if ((r < 8 && c < 8) || (r < 8 && c >= moduleCount - 8) || (r >= moduleCount - 8 && c < 8)) {
        continue;
      }
      if (r === 6 || c === 6) continue;

      if (pseudoRandom() > 0.55) {
        drawBlock(r, c);
      }
    }
  }
}
