/**
 * 2KT Chating - Progressive Web App (PWA) & Cross-Platform Native Feature Controller
 * Handles cross-device installation (Android, iOS, Windows, Mac, Linux),
 * Offline/Online network indicators, Native Push Notifications, Haptic Feedback & Native Sharing
 */

const PWA = {
  deferredPrompt: null,
  isInstalled: false,
  isIOS: false,
  isStandalone: false,

  init() {
    this.detectEnvironment();
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupNetworkMonitor();
    this.setupNativeShare();
    this.setupNotifications();
  },

  // Detect device platform & standalone display mode
  detectEnvironment() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    this.isIOS = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true ||
                        document.referrer.includes('android-app://');

    if (this.isStandalone) {
      document.body.classList.add('is-standalone-app');
    }
    if (this.isIOS) {
      document.body.classList.add('is-ios-device');
    }
  },

  // Register Service Worker for offline support and background capabilities
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('✅ 2KT Chating: Service Worker registered successfully', registration.scope);

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (window.Utils && Utils.showToast) {
                Utils.showToast('App update available! Refresh for the latest features.', 'info');
              }
            }
          });
        });
      } catch (err) {
        console.warn('⚠️ Service Worker registration skipped or failed:', err);
      }
    }
  },

  // Setup Cross-Platform Install Prompts (Android, Windows, macOS, Linux, iOS)
  setupInstallPrompt() {
    const installBtns = document.querySelectorAll('.btn-install-app');
    const modalInstallGuide = document.getElementById('modalInstallGuide');
    const iosInstructions = document.getElementById('iosInstallInstructions');
    const desktopAndroidInstructions = document.getElementById('desktopAndroidInstallInstructions');

    // Capture the PWA install event for Android/Chrome/Edge/Desktop
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      installBtns.forEach(btn => btn.classList.remove('hidden'));
    });

    // Detect if already installed or opened in standalone mode
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      installBtns.forEach(btn => btn.classList.add('hidden'));
      if (window.Utils && Utils.showToast) {
        Utils.showToast('🎉 2KT Chating installed to your device home screen!', 'success');
      }
    });

    // Bind click events on any install button
    installBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          const { outcome } = await this.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            console.log('User accepted the 2KT Chating install prompt');
          }
          this.deferredPrompt = null;
        } else {
          // Open guidance modal (especially helpful for iOS and browsers without automatic banner)
          this.showInstallGuide();
        }
      });
    });

    // Modal controls for Install Guide
    const btnCloseInstallGuide = document.getElementById('btnCloseInstallGuide');
    if (btnCloseInstallGuide && modalInstallGuide) {
      btnCloseInstallGuide.addEventListener('click', () => {
        modalInstallGuide.classList.add('hidden');
      });
      modalInstallGuide.addEventListener('click', (e) => {
        if (e.target === modalInstallGuide) {
          modalInstallGuide.classList.add('hidden');
        }
      });
    }

    // Always show install button in header or auth if not standalone
    if (!this.isStandalone) {
      installBtns.forEach(btn => btn.classList.remove('hidden'));
    }
  },

  showInstallGuide() {
    const modalInstallGuide = document.getElementById('modalInstallGuide');
    const iosInstructions = document.getElementById('iosInstallInstructions');
    const desktopAndroidInstructions = document.getElementById('desktopAndroidInstallInstructions');

    if (!modalInstallGuide) return;

    if (this.isIOS) {
      if (iosInstructions) iosInstructions.classList.remove('hidden');
      if (desktopAndroidInstructions) desktopAndroidInstructions.classList.add('hidden');
    } else {
      if (iosInstructions) iosInstructions.classList.add('hidden');
      if (desktopAndroidInstructions) desktopAndroidInstructions.classList.remove('hidden');
    }

    modalInstallGuide.classList.remove('hidden');
  },

  // Real-time network monitor for mobile / multi-device connectivity
  setupNetworkMonitor() {
    const banner = document.getElementById('networkBanner');

    const updateStatus = () => {
      const isOnline = navigator.onLine;
      if (!banner) return;

      if (!isOnline) {
        banner.textContent = '⚡ No internet / network connection. Working offline...';
        banner.className = 'network-status-banner offline';
        banner.classList.remove('hidden');
        this.vibrate([100, 50, 100]);
      } else {
        if (banner.classList.contains('offline')) {
          banner.textContent = '🟢 Back online! Syncing messages...';
          banner.className = 'network-status-banner online';
          setTimeout(() => {
            banner.classList.add('hidden');
          }, 3000);
        } else {
          banner.classList.add('hidden');
        }
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  },

  // Native Web Share API integration (Android & iOS Share Sheet)
  setupNativeShare() {
    const btnShareApp = document.getElementById('btnShareApp');
    if (btnShareApp) {
      btnShareApp.addEventListener('click', async () => {
        const shareData = {
          title: 'Join me on 2KT Chating!',
          text: 'Chat anytime, exchange high-res photos, voice notes, and materials with me on 2KT Chating!',
          url: window.location.origin
        };

        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.warn('Share error:', err);
            }
          }
        } else {
          // Fallback: copy link to clipboard
          navigator.clipboard.writeText(shareData.url).then(() => {
            if (window.Utils && Utils.showToast) {
              Utils.showToast('📋 App link copied to clipboard!', 'info');
            }
          });
        }
      });
    }
  },

  // Setup System / Push Notifications
  async setupNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      // We will prompt when user clicks chat or receives message
    }
  },

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
  },

  sendSystemNotification(title, body, icon = '/icons/icon-192.png', url = '/') {
    if (document.visibilityState === 'visible') return; // Don't notify if tab is in focus

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [100, 50, 100]
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (e) {
        // Fallback to service worker notification if available
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, { body, icon, vibrate: [100, 50, 100] });
          });
        }
      }
    }
  },

  // Mobile Haptic Feedback (Vibration API)
  vibrate(pattern = [40]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignored on unsupported devices
      }
    }
  }
};

// Initialize PWA features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PWA.init();
});
