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
  hasTabPermission = await chrome.permissions.contains({ origins: [tab.url] })

  if (hasTabPermission) {
    settingsKey = `masanielloSettings-${tabHost}`
    operationsKey = `operations-${tabHost}`
    featuresKey = `features-${tabHost}`
    statsKey = `stats-${tabHost}`
  } else {
    settingsKey = `masanielloSettings`
    operationsKey = `operations`
    featuresKey = `features`
    statsKey = `stats`

    document.querySelector('section.features').style.display = 'none'
    document.querySelector('section.stats').style.display = 'none'
  }

  localStorageGet(featuresKey, (result) => {
    if (!(featuresKey in result)) return
    
    for (const featureID of featuresIDs) {
      const featureValue = result[featuresKey][featureID]
      if (featureValue) {
        document.getElementById(featureID).checked = featureValue
        features[featureID] = featureValue
      }
    }
  })

  localStorageGet([settingsKey, operationsKey, statsKey], (result) => {    
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
          document.querySelector(`.stats #${stat}`).textContent = fixNumber(stats[stat])
        }
        document.querySelector(`.stats #profitPercent`).textContent = `${(stats.profit / stats.initialAmount * 100).toFixed(2)}%`
      } else {
        document.querySelector(`.stats #initialAmount`).textContent = settings.amountToRisk
      }
    }
  })

  
  if (pickHosts.some(ph => ph === tabHost)) {
    const autoBetKey = `autoBet-${tabHost}`
    const autoBetButton = document.createElement('button')
    autoBetButton.id = 'autoBet'
    document.body.appendChild(autoBetButton)
    
    autoBetButton.addEventListener('click', () => {
      localStorageGet(autoBetKey, result => {
        const newState = !result[autoBetKey]
        autoBetButton.textContent = newState ? 'Stop auto bet' : 'Start auto bet'

        localStorageSet({[autoBetKey]: newState})
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function(newState) {
            updateAutoBet(newState)
          },
          args: [newState]
        })
      })
    })
    
    localStorageGet(autoBetKey, result => {
      autoBetButton.textContent = result[autoBetKey] ? 'Stop auto bet' : 'Start auto bet'
    })
  }
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
      localStorageSet({ [statsKey]: {
        profit: 0,
        initialAmount: +settings.amountToRisk,
        sessionCounter: 0
      } }, () => {
        document.querySelector(`.stats #profit`).textContent = '0'
        document.querySelector(`.stats #initialAmount`).textContent = settings.amountToRisk
        document.querySelector(`.stats #sessionCounter`).textContent = '0'
        document.querySelector(`.stats #profitPercent`).textContent = '0%'

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function(stats) {
            updateMasanielloData({stats})
          },
          args: [{
            profit: 0,
            initialAmount: +settings.amountToRisk,
            sessionCounter: 0
          }]
        })
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

    if (!regex.test(value)) {
      ev.target.value = settings[id]
      return
    }

    if (id === 'totalOperations' && +value > 100) {
      ev.target.value = settings[id]
      return
    }

    if (id === 'ITMs' && +value > +settings.totalOperations) {
      ev.target.value = settings[id]
      return
    }

    settings[id] = value
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
    } else value = fixNumber(+ev.target.value.replace(',', '.'))

    ev.target.value = value
    settings[id] = value

    localStorageSet({ [settingsKey]: settings })
    calculateMatris()
    updateData()
  }

  if (featuresIDs.some(feature => feature === id)) {
    features[id] = !features[id]
    
    if (!hasTabPermission) return
    localStorageSet({ [featuresKey]: features }, () => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function(features) {
          updateMasanielloData({features})
        },
        args: [features]
      })
    })
  } else {
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
  document.querySelector('.target #finalBalance b').textContent = fixNumber(amountToRisk + netProfit)
  document.querySelector('.target #netProfit b').textContent = fixNumber(netProfit)

  const wins = operations.filter(o => o).length
  const Losings = operations.filter(o => !o).length
  const totalLosings = +settings.totalOperations - +settings.ITMs
  document.querySelector('.data #winOperations').textContent = `${wins}/${settings.ITMs}`
  document.querySelector('.data #losingOperations').textContent = `${Losings}/${totalLosings}`
  document.querySelector('.data #totalOperations').textContent = `${operations.length}/${settings.totalOperations}`
  document.querySelector('.data #nextAmount').textContent = getMasanielloAmount()

  if (operations.length && !document.getElementById('clearOperations')) {
    const sectionGroup = document.querySelector('section.group .data')
    const button = document.createElement('button')
    button.textContent = 'Clear operations'
    button.id = 'clearOperations'
    sectionGroup.appendChild(button)

    button.addEventListener('click', () => {
      operations = []
      localStorageSet({ [operationsKey]: operations })
      button.remove()
      updateData()
      if (hasTabPermission) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function(operations) {
            updateMasanielloData({operations})
          },
          args: [operations]
        })
      }

      button.removeEventListener('click', () => {
        console.log('Remove event clear operations')
      })
    })
  }
}
