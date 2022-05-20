const fs = require('fs')
const request = require('request')
const { exec } = require('child_process')
const { ipcRenderer } = require('electron')
const api = require('../common/api')
const config = require('../common/config')

const PARENT_FOLDER_PATH = ipcRenderer.sendSync('get-parent-root-path')

const CLIENT_FOLDER_NAME = 'Client-Desktop-darwin-x64'
const MANAGE_FOLDER_NAME = 'Client-Desktop-Management-darwin-x64'
const CLIENT_FOLDER_PATH = `${PARENT_FOLDER_PATH}/${CLIENT_FOLDER_NAME}`
const MANAGE_FOLDER_PATH = `${PARENT_FOLDER_PATH}/${MANAGE_FOLDER_NAME}`

const CLIENT_ZIP_TMP_NAME = 'Client-Desktop-darwin-x64.zip'
const CLIENT_FOLDER_TMP_NAME = 'Client-Desktop-darwin-x64'
const BACKUP_FILE_NAME = 'Client-Desktop-darwin-x64-bak.zip'

const INFO_FILE_PATH = `${CLIENT_FOLDER_PATH}/Client-Desktop.app/Contents/Resources/app/info.ini`
const INFO_FILE_TMP_PATH = `${MANAGE_FOLDER_PATH}/info.ini`

const PACKAGE_JSON_PATH = `${CLIENT_FOLDER_PATH}/Client-Desktop.app/Contents/Resources/app/package.json`
const CHECK_UPDATE_TIME_PATH = `${MANAGE_FOLDER_PATH}/env.json`

let macStep = 1
let downloadUrl = ''
let runWhenStartApp = true

window.onload = function() {
  checkUpdate()
}

function checkUpdate() {
  console.log('check update')
  if (runWhenStartApp || onSchedule()) {
    macStep = 1
    runWhenStartApp = false
    updateVersion(macStep)
  }

  setTimeout(checkUpdate, 60000)
}

function onSchedule() {
  let autoUpdateTime = config.autoUpdateTime

  if (fs.existsSync(CHECK_UPDATE_TIME_PATH)) {
    let rawData = fs.readFileSync(CHECK_UPDATE_TIME_PATH)
    let data = JSON.parse(rawData)
  
    if (data.check_update_time) {
      autoUpdateTime = data.check_update_time
    }
  }

  const currentTime = new Date();
  const currentHour = currentTime.getHours().toString().padStart(2, '0');
  const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
  
  console.log([currentHour, currentMinute].join(':'))
  return [currentHour, currentMinute].join(':') === autoUpdateTime
}

function updateVersion(step) {
  console.log('updateVersion')
  switch (step) {
    case 1:
      checkVersion()
      return
    case 2:
      download()
      return
    case 3:
      killClientDesktop()
      return
    case 4:
      copyIniFile()
      return
    case 5:
      // backup()
      updateVersion(++macStep)
      return
    case 6:
      unzip()
      return
    case 7:
      revertIniFile()
      return
    case 8:
      removeFiles()
      return
    case 9:
      openClientDesktop()
      return
  }
}

function checkVersion() {
  setContent("Checking...")

  let rawData = fs.readFileSync(PACKAGE_JSON_PATH)
  let data = JSON.parse(rawData)
  let version = data.version
  
  api.call().get(`/version?app_version=${version}&os=${process.platform}`)
    .then(response => {
      if (response.status == 204) {
        setContent("The current version is latest!")
      } else {
        downloadUrl = response.data.url
        console.log(downloadUrl)
        updateVersion(++macStep)
      }
    })
    .catch(error => {
      console.log(error)
      setContent("Cannot get new version")
    })

  return
}

function killClientDesktop() {
  setContent("Kill client desktop...")

  exec(`pkill -x Client-Desktop`)

  updateVersion(++macStep)
}

function download() {
  setContent("Download...")

  let receivedBytes = 0
  let totalBytes = 0

  let req = request({
    method: 'GET',
    uri: downloadUrl
  })

  let targetPath = `${MANAGE_FOLDER_PATH}/${CLIENT_ZIP_TMP_NAME}`
  let out = fs.createWriteStream(targetPath)
  req.pipe(out)

  req.on('response', function(data) {
    totalBytes = parseInt(data.headers['content-length'])
    console.log(`total: ${totalBytes}`)
  })

  req.on('error', function(err) {
    console.log(err)
  })

  req.on('data', function(chunk) {
    receivedBytes += chunk.length
    showProgress(receivedBytes, totalBytes)
  })

  req.on('end', function() {
    setContent("Download successfully!")
    updateVersion(++macStep)
  })
}

function showProgress(receivedBytes, totalBytes) {
  let percent = Math.round((receivedBytes * 100) / totalBytes)
  setContent(`Download: ${percent}%`)
}

function unzip() {
  setContent('Unzip files...')

  exec(`unzip -o ${MANAGE_FOLDER_PATH}/${CLIENT_ZIP_TMP_NAME} -d ${PARENT_FOLDER_PATH}`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    setContent("Unzip successfully!")
    updateVersion(++macStep)
  });
}

function openClientDesktop() {
  setContent('Start Client Desktop...')

  exec(`open ${CLIENT_FOLDER_PATH}/Client-Desktop.app`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    setContent("Start successfully!")
  });
}

function removeFiles() {
  setContent('Remove unused files...')

  exec(`rm -rf ${MANAGE_FOLDER_PATH}/${CLIENT_ZIP_TMP_NAME} && rm -rf ${MANAGE_FOLDER_PATH}/__MACOSX && rm ${INFO_FILE_TMP_PATH}`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
    }

    updateVersion(++macStep)
  });
}

function copyIniFile() {
  setContent("Copy ini file...")

  exec(`cp ${INFO_FILE_PATH} ${INFO_FILE_TMP_PATH}`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    updateVersion(++macStep)
  });
}

function revertIniFile() {
  setContent("Revert ini file...")

  exec(`cp ${INFO_FILE_TMP_PATH} ${INFO_FILE_PATH}`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return
    }

    updateVersion(++macStep)
  })
}

function backup() {
  setContent("Backup data...")

  exec(`cd ${CLIENT_FOLDER_PATH} && zip -r ${MANAGE_FOLDER_PATH}/${BACKUP_FILE_NAME} . && rm -rf *`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return
    }

    updateVersion(++macStep)
  })
}

function setContent(text) {
  document.getElementsByClassName('content')[0].textContent = text
}