/**
 * Media handler for 2KT Chating:
 * Lightbox, Voice Note Recorder, Audio Player, and Drag-and-Drop
 */

const MediaManager = {
  activeAudio: null,
  activePlayBtn: null,
  mediaRecorder: null,
  audioChunks: [],
  recordInterval: null,
  recordStartTime: 0,

  // Initialize event listeners
  init() {
    this.initLightbox();
    this.initDragAndDrop();
    this.initVoiceRecorder();
  },

  // Lightbox Viewer
  initLightbox() {
    const modal = document.getElementById('lightboxModal');
    const closeBtn = document.getElementById('btnCloseLightbox');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
      }
    });
  },

  openLightbox(imgSrc, fileName = 'image.png') {
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImg');
    const downloadBtn = document.getElementById('lightboxDownloadBtn');

    if (modal && img) {
      img.src = imgSrc;
      if (downloadBtn) {
        downloadBtn.href = imgSrc;
        downloadBtn.download = fileName;
      }
      modal.classList.remove('hidden');
    }
  },

  // Voice Note Recorder
  initVoiceRecorder() {
    const voiceRecordBtn = document.getElementById('btnVoiceRecord');
    const cancelBtn = document.getElementById('btnCancelVoiceRecord');
    const sendBtn = document.getElementById('btnSendVoiceRecord');
    const bar = document.getElementById('voiceRecorderBar');
    const timer = document.getElementById('recordingTimer');

    if (!voiceRecordBtn) return;

    voiceRecordBtn.addEventListener('click', async () => {
      if (!window.activeChatId) {
        showToast('Please select a conversation first', 'error');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
        };

        this.mediaRecorder.start();
        this.recordStartTime = Date.now();
        bar.classList.remove('hidden');

        this.recordInterval = setInterval(() => {
          const elapsedSec = Math.floor((Date.now() - this.recordStartTime) / 1000);
          const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
          const secs = String(elapsedSec % 60).padStart(2, '0');
          timer.textContent = `${mins}:${secs}`;
        }, 500);

      } catch (err) {
        console.error('Microphone access denied:', err);
        showToast('Microphone access denied or not available', 'error');
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.stopVoiceRecording(false);
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.stopVoiceRecording(true);
      });
    }
  },

  stopVoiceRecording(shouldSend) {
    const bar = document.getElementById('voiceRecorderBar');
    if (bar) bar.classList.add('hidden');
    clearInterval(this.recordInterval);

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = async () => {
        if (shouldSend && this.audioChunks.length > 0) {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
          
          showToast('Uploading voice note...', 'info');
          try {
            const uploadResult = await API.uploadFile(audioFile);
            SocketClient.sendMessage({
              chatId: window.activeChatId,
              content: '',
              type: 'audio',
              file_url: uploadResult.file_url,
              file_name: uploadResult.file_name,
              file_size: uploadResult.file_size,
              file_mime: uploadResult.file_mime
            });
          } catch (err) {
            showToast('Failed to send voice note', 'error');
          }
        }
      };
      this.mediaRecorder.stop();
    }
  },

  // Audio Play/Pause helper
  playAudio(url, playBtn, fillBar, timeText) {
    if (this.activeAudio) {
      this.activeAudio.pause();
      if (this.activePlayBtn) {
        this.activePlayBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      }
      if (this.activeAudio.src.endsWith(url)) {
        this.activeAudio = null;
        this.activePlayBtn = null;
        return;
      }
    }

    const audio = new Audio(url);
    this.activeAudio = audio;
    this.activePlayBtn = playBtn;

    playBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        fillBar.style.width = `${pct}%`;

        const curMins = String(Math.floor(audio.currentTime / 60)).padStart(2, '0');
        const curSecs = String(Math.floor(audio.currentTime % 60)).padStart(2, '0');
        const durMins = String(Math.floor(audio.duration / 60)).padStart(2, '0');
        const durSecs = String(Math.floor(audio.duration % 60)).padStart(2, '0');
        timeText.textContent = `${curMins}:${curSecs} / ${durMins}:${durSecs}`;
      }
    };

    audio.onended = () => {
      playBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      fillBar.style.width = '0%';
      this.activeAudio = null;
      this.activePlayBtn = null;
    };

    audio.play();
  },

  // Drag and Drop files into chat area
  initDragAndDrop() {
    const mainArea = document.getElementById('chatMain');
    const dragOverlay = document.getElementById('dragOverlay');

    if (!mainArea || !dragOverlay) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      mainArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.activeChatId) {
          dragOverlay.classList.add('active');
        }
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      mainArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragOverlay.classList.remove('active');
      });
    });

    mainArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (!window.activeChatId) {
        showToast('Please select a conversation to send files to', 'error');
        return;
      }

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          await this.uploadAndSendFile(files[i]);
        }
      }
    });
  },

  // Upload and dispatch file
  async uploadAndSendFile(file) {
    if (!window.activeChatId) return;

    showToast(`Uploading "${file.name}"...`, 'info');
    try {
      const uploadRes = await API.uploadFile(file);
      SocketClient.sendMessage({
        chatId: window.activeChatId,
        content: '',
        type: uploadRes.type,
        file_url: uploadRes.file_url,
        file_name: uploadRes.file_name,
        file_size: uploadRes.file_size,
        file_mime: uploadRes.file_mime,
        reply_to_id: window.currentReplyTo ? window.currentReplyTo.id : null
      });

      if (window.clearReply) window.clearReply();
      showToast(`Sent "${file.name}" successfully!`, 'success');
    } catch (err) {
      console.error('File send error:', err);
      showToast(err.message || 'Failed to upload material', 'error');
    }
  }
};
