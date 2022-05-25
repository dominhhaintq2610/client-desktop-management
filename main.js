const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('path');

let win = null
let isQuiting = false
const gotTheLock = app.requestSingleInstanceLock()

//TODO
app.commandLine.appendSwitch('ignore-certificate-errors')
const createWindow = () => {
  win = new BrowserWindow({
    width: 500,
    height: 320,
    frame: false,
    icon: path.join(__dirname, './src/images/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false //TODO
    }
  })

  win.loadFile('./src/pages/index.html')
  
  if (process.env.NODE_ENV == 'development') {
    win.webContents.openDevTools()
  }

  win.on('close', function (event) {
    if (!isQuiting) {
       event.preventDefault()
       win.hide()
    }
 })
}

const createSystemTray = () => {
  const iconPath = path.join(__dirname, './src/images/icon.png');
  appIcon = new Tray(iconPath);

  let contextMenu = Menu.buildFromTemplate([
     {
        label: 'Open',
        click:() => {
           win.show();
        }
     },
     {
        label: 'Quit',
        click:() => {
           isQuiting = true;
           app.quit();
        }
     },
  ]);

  appIcon.on('click', () => {
     win.show();
  })
  appIcon.setToolTip('Client-desktop-management');
  appIcon.setContextMenu(contextMenu);
}

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized())  {
         win.restore()
      }
      win.show()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()
    createSystemTray()
  })
}

app.on('activate', () => {
  win.show()
})

app.on('before-quit', function () {
  isQuiting = true
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
