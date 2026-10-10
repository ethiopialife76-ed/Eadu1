const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function checkServerReady(url, callback) {
  const req = http.get(url, (res) => {
    if (res.statusCode === 200 || res.statusCode === 304) {
      callback();
    } else {
      setTimeout(() => checkServerReady(url, callback), 300);
    }
  });
  req.on('error', () => {
    setTimeout(() => checkServerReady(url, callback), 300);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    title: '2KT Chating',
    icon: path.join(__dirname, 'public', 'icons', 'icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0f172a',
    autoHideMenuBar: true
  });

  const serverUrl = 'http://localhost:3000';

  // Wait for local server to be ready before loading
  checkServerReady(serverUrl, () => {
    mainWindow.loadURL(serverUrl);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start backend server first
require('./server/index.js');

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
