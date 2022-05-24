const {ipcRenderer} = require('electron')

// Close app
document.getElementById("close-btn").addEventListener("click", (e) => {
  ipcRenderer.send('close-app')
})

var body = document.getElementsByTagName('body')[0]
var script = document.createElement('script')

script.type = 'text/javascript'

if (process.platform === 'darwin') {
  script.src = "../js/update-darwin.js"
} else {
  script.src = "../js/update-win32.js"
}

body.appendChild(script)
