const { app, BrowserWindow, ipcMain, Tray } = require('electron')
const path = require('path');

let win = null;

//TODO
app.commandLine.appendSwitch('ignore-certificate-errors')
const createWindow = () => {
  win = new BrowserWindow({
    width: 500,
    height: 320,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false //TODO
    }
  })

  win.loadFile('./src/pages/index.html')
  win.hide()
  
  if (process.env.NODE_ENV == 'development') {
    win.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  createWindow()
})

app.on('activate', () => {
  win.show()
})

ipcMain.on('get-app-path', (event, args) => {
  event.returnValue = app.getAppPath()
})

ipcMain.on('get-parent-root-path', (event, args) => {
  if (process.env.NODE_ENV == 'development') {
    event.returnValue = path.join(app.getAppPath(), '/..')
  } else {
    event.returnValue = process.platform === 'win32' ?
      path.join(app.getAppPath(), '/../../..') :
      path.join(app.getAppPath(), '/../../../../..')
  }
})

ipcMain.on('close-app', (evt, arg) => {
  win.hide();
})
