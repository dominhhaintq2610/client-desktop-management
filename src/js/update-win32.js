const fs = require('fs')
const request = require('request')
const { exec } = require('child_process')
const api = require('../common/api')
const config = require('../common/config')

const PARENT_FOLDER_PATH = ipcRenderer.sendSync('get-parent-root-path')

const CLIENT_FOLDER_NAME = 'Client-Desktop-win32-x64'
const MANAGE_FOLDER_NAME = 'Client-Desktop-Management-win32-x64'
const CLIENT_FOLDER_PATH = `${PARENT_FOLDER_PATH}/${CLIENT_FOLDER_NAME}`
const MANAGE_FOLDER_PATH = `${PARENT_FOLDER_PATH}/${MANAGE_FOLDER_NAME}`

const CLIENT_ZIP_TMP_NAME = 'Client-Desktop-win32-x64.zip'

const INFO_FILE_PATH = `${CLIENT_FOLDER_PATH}/resources/app/info.ini`
const INFO_FILE_TMP_PATH = `${MANAGE_FOLDER_PATH}/info.ini`

const PACKAGE_JSON_PATH = `${CLIENT_FOLDER_PATH}/resources/app/package.json`
const CHECK_UPDATE_TIME_PATH = `${MANAGE_FOLDER_PATH}/env.json`

let updateStep = 1
let downloadUrl = ''
let runWhenStartApp = true

window.onload = function() {
  printSchedule()
  checkUpdate()
}

function checkUpdate() {
  console.log('check update')
  if (runWhenStartApp || onSchedule()) {
    updateStep = 1
    runWhenStartApp = false
    updateVersion(updateStep)
  }

  setTimeout(checkUpdate, 60000)
}

function getAutoUpdateTime() {
  let autoUpdateTime = config.autoUpdateTime

  if (fs.existsSync(CHECK_UPDATE_TIME_PATH)) {
    let rawData = fs.readFileSync(CHECK_UPDATE_TIME_PATH)
    let data = JSON.parse(rawData)
  
    if (data.check_update_time) {
      autoUpdateTime = data.check_update_time
    }
  }

  return autoUpdateTime
}

function onSchedule() {
  const currentTime = new Date();
  const currentHour = currentTime.getHours().toString().padStart(2, '0');
  const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
  
  return getAutoUpdateTime() === [currentHour, currentMinute].join(':')
}

function printSchedule() {
  let time = getAutoUpdateTime()
  document.getElementsByClassName('daily-schedule')[0].textContent = `Daily schedule: ${time}`

  setTimeout(printSchedule, 1000)
}

function updateVersion(step) {
  console.log(`updateVersion step: ${step}`)
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
      updateVersion(++updateStep)
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
  console.log(version)
  api.call().get(`/version?app_version=${version}&os=${process.platform}`)
    .then(response => {
      if (response.status == 204) {
        setContent("The current version is latest!")
      } else {
        downloadUrl = response.data.url
        console.log(downloadUrl)
        updateVersion(++updateStep)
      }
    })
    .catch(error => {
      console.log(error)
      setContent("Cannot get new version")
    })

  return
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
    updateVersion(++updateStep)
  })
}

function unzip() {
  setContent('Unzip files...')

  exec(`powershell Expand-Archive '${MANAGE_FOLDER_PATH}/${CLIENT_ZIP_TMP_NAME}' -DestinationPath '${PARENT_FOLDER_PATH}' -Force`, {'maxBuffer': 1024 * 300000}, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    setContent("Unzip successfully!")
    updateVersion(++updateStep)
  })
}

function showProgress(receivedBytes, totalBytes) {
  let percent = Math.round((receivedBytes * 100) / totalBytes)
  setContent(`Download: ${percent}%`)
}

function killClientDesktop() {
  setContent("Kill client desktop...")

  exec(`powershell taskkill /IM Client-Desktop.exe /F`)

  updateVersion(++updateStep)
}

function openClientDesktop() {
  setContent('Start Client Desktop...')

  exec(`powershell start '${CLIENT_FOLDER_PATH}/Client-Desktop.exe'`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    setContent("Update successfully!")
  });
}

function copyIniFile() {
  setContent("Copy ini file...")

  exec(`powershell copy '${INFO_FILE_PATH}' '${INFO_FILE_TMP_PATH}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }

    updateVersion(++updateStep)
  })
}

function revertIniFile() {
  setContent("Revert ini file...")

  exec(`powershell copy '${INFO_FILE_TMP_PATH}' '${INFO_FILE_PATH}'`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }

    updateVersion(++updateStep)
  })
}

function removeFiles() {
  setContent('Remove unused files...')

  exec(`powershell del '${MANAGE_FOLDER_PATH}/${CLIENT_ZIP_TMP_NAME}' && powershell del '${INFO_FILE_TMP_PATH}'`, (error) => {
    if (error) {
      console.error(`exec error: ${error}`)
    }

    updateVersion(++updateStep)
  })
}

function setContent(text) {
  document.getElementsByClassName('content')[0].textContent = text
}
