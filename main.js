const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 850,
    title: "GameVault PRO - Shifanth Jasim",
    backgroundColor: '#f1f5f9', // Matches your UI background
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // OFFLINE LOGIC:
  // If we are in dev mode, use localhost. 
  // If we are packaged/offline, load the local index.html file.
  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});