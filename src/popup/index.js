'use strict'
const featuresIDs = Object.keys(features)
const inputsIds = Object.keys(settings)

let tab, tabHost
let hasTabPermission = false;
let settingsKey = ``
let operationsKey = ``
let featuresKey = ''
let statsKey = ''

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  tab = tabs[0]
  const tabUrl = new URL(tab.url)
  
  tabHost = tabUrl.host
  settingsKey = `masanielloSettings-${tabHost}`
  operationsKey = `operations-${tabHost}`
  featuresKey = `features-${tabHost}`
  statsKey = `stats-${tabHost}`

  hasTabPermission = await chrome.permissions.contains({ origins: [tab.url] })

  if (hasTabPermission) {
    chrome.storage.local.get([featuresKey], (result) => {
      if (!(featuresKey in result)) return
      
      for (const featureID of featuresIDs) {
        const featureValue = result[featuresKey][featureID]
        if (featureValue) {
          document.getElementById(featureID).checked = featureValue
          features[featureID] = featureValue
        }
      }
    })
  } else {
    document.querySelector('section.features').style.display = 'none'
    document.querySelector('section.stats').style.display = 'none'
  }

  chrome.storage.local.get([settingsKey, operationsKey, statsKey], (result) => {    
    if (result[settingsKey]) settings = result[settingsKey]
    if (result[operationsKey]) operations = result[operationsKey]

    calculateMatris()
    
    inputsIds.forEach(id => {
      const input = document.querySelector(`input#${id}`)
      if (input) input.value = settings[id]
    })

    updateData()

    if (hasTabPermission) {
      if (statsKey in result) {
        const stats = result[statsKey]

        for (const stat in stats) {
          document.querySelector(`.stats #${stat}`).textContent = stats[stat]
        }
        document.querySelector(`.stats #profitPercent`).textContent = `${(stats.profit / stats.initialAmount * 100).toFixed(2)}%`
      } else {
        document.querySelector(`.stats #initialAmount`).textContent = settings.amountToRisk
      }
    }
  })
})


document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded')
})

document.addEventListener('click', ev => {
  const target = ev.target

  if (target instanceof HTMLButtonElement) {
    if (target.id === 'openInTab') {
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") })
    }

    if (target.id === 'resetStats' && hasTabPermission) { 
      chrome.storage.local.set({ [statsKey]: {
        profit: 0,
        initialAmount: settings.amountToRisk,
        sessionCounter: 0
      } }, () => {
        document.querySelector(`.stats #profit`).textContent = '0'
        document.querySelector(`.stats #initialAmount`).textContent = settings.amountToRisk
        document.querySelector(`.stats #sessionCounter`).textContent = '0'
        document.querySelector(`.stats #profitPercent`).textContent = '0%'
      })
    }
  }
})

document.addEventListener('input', ev => {
  if (ev.target instanceof HTMLInputElement && inputsIds.some(id => id === ev.target.id)) {
    const {value, id} = ev.target

    const isPercent = id === 'profitPercent'
    const decimalPaatern = inputsIds.slice(2).some(inputId => id === inputId) ? "\\d*?" : "$|^\\d+(?:[.,]\\d*)?"
    const paatern = `^${isPercent ? '%$|^' : ''}${decimalPaatern}${isPercent ? '%?' : ''}$`
    const regex = new RegExp(paatern)

    if (regex.test(value)) {
      settings[id] = value
    } else {
      ev.target.value = settings[id]
    }
  }
})

document.addEventListener('change', ev => {
  if (!ev.target instanceof HTMLInputElement) return
  const {id} = ev.target

  if (inputsIds.some(id => id === id)) {
    let value = ''
    if (id === 'profitPercent') {
      value = parseFloat(ev.target.value)
      value += '%'
    } else value = +ev.target.value.replace(',', '.')

    ev.target.value = value
    settings[id] = value

    if (hasTabPermission) chrome.storage.local.set({ [settingsKey]: settings })
    calculateMatris()
    updateData()
  }

  if (featuresIDs.some(feature => feature === id)) {
    features[id] = !features[id]
    
    if (!hasTabPermission) return
    chrome.storage.local.set({ [featuresKey]: features }, () => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function(features) {
          updateMasanielloData({features})
        },
        args: [features]
      })
    })
  } else if (features.autoStake) {
    if (!hasTabPermission) return
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function(settings) {
        updateMasanielloData({settings})
      },
      args: [settings]
    })
  }
})

function updateData () {
  const profitPercent = matris[0][0] - 1
  const amountToRisk = +settings.amountToRisk
  const netProfit = amountToRisk * profitPercent
  
  document.querySelector('.target #profitPercent b').textContent = (profitPercent * 100).toFixed(2) + '%'
  document.querySelector('.target #finalBalance b').textContent = +(amountToRisk + netProfit).toFixed(settings.decimalsLimit)
  document.querySelector('.target #netProfit b').textContent = +netProfit.toFixed(settings.decimalsLimit)

  const nextAmount = getMasanielloAmount(isPoketOption ? 2 : undefined)

  const wins = operations.filter(o => o).length
  const Losings = operations.filter(o => !o).length
  const totalLosings = +settings.totalOperations - +settings.ITMs
  document.querySelector('.data #winOperations').textContent = `${wins}/${settings.ITMs}`
  document.querySelector('.data #losingOperations').textContent = `${Losings}/${totalLosings}`
  document.querySelector('.data #totalOperations').textContent = `${operations.length}/${settings.totalOperations}`
  document.querySelector('.data #nextAmount').textContent = nextAmount
  const message = document.getElementById('message')


  if (Losings > totalLosings) {
    message.textContent = 'Has perdido'
    message.classList.add('red')
  } else if (wins >= +settings.ITMs) {
    message.textContent = 'Has ganado'
    message.classList.add('green')
  }

  if (operations.length && !document.getElementById('clearOperations')) {
    const sectionGroup = document.querySelector('section.group .data')
    const button = document.createElement('button')
    button.textContent = 'Clear operations'
    button.id = 'clearOperations'
    sectionGroup.appendChild(button)

    button.addEventListener('click', () => {
      operations = []
      if (hasTabPermission) chrome.storage.local.set({ [operationsKey]: operations })
      button.remove()
      updateData()
      if (autoStake && !hasTabPermission) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function(settings, operations) {
            updateMasanielloData({operations})
          },
          args: [settings, operations]
        })
      }

      button.removeEventListener('click', () => {
        console.log('Remove event clear operations')
      })
    })
  }
}
