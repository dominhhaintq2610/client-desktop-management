const { app, BrowserWindow, dialog } = require('electron')
const { exec } = require('child_process')
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('index.html')
}

const updateClientDesktop = () => {
  const updateBatchPath = path.join(__dirname, './update.sh');

  exec(`sh ${updateBatchPath} http://example.com`,
    (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);

        if (error !== null) {
          console.log(`exec error: ${error}`);
          dialog.showMessageBox({
              title: 'Title',
              type: 'warning',
              message: 'Error occured.\r\n' + error
          });
        }
    })
}

app.whenReady().then(() => {
  createWindow()
  updateClientDesktop()
})