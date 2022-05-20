var body = document.getElementsByTagName('body')[0]
var script = document.createElement('script')

script.type = 'text/javascript';

if (process.platform === 'darwin') {
  script.src = "../js/update-darwin.js"
} else {
  script.src = "js/mobile_version.js"
}

body.appendChild(script)