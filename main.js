const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('path');

let win = null;

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

app.whenReady().then(() => {
  createWindow()
  createSystemTray()
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
