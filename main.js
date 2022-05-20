const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');

//TODO
app.commandLine.appendSwitch('ignore-certificate-errors')
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false //TODO
    }
  })

  win.loadFile('./src/pages/index.html')
  win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
})

ipcMain.on('get-app-path', (event, args) => {
  event.returnValue = app.getAppPath()
})

ipcMain.on('get-parent-root-path', (event, args) => {
  console.log(process.env.NODE_ENV)
  if (process.env.NODE_ENV == 'development') {
    event.returnValue = path.join(app.getAppPath(), '/..')
  } else {
    event.returnValue = process.platform === 'win32' ?
      path.join(app.getAppPath(), '/../../../..') :
      path.join(app.getAppPath(), '/../../../../..')
  }
})
