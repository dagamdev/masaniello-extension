'use strict'
const featuresIDs = ['autoStake', 'autoCycle', 'compoundEarnings']
const inputsIds = ['amountToRisk', 'totalOperations', 'ITMs', 'profitPercent']
let tabId

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  console.log(tabs, tabs[0], tabs[0].url)
})

const port = chrome.runtime.connect({ name: "extensionTab" });

port.onMessage.addListener((msg) => {
  console.log("Mensaje recibido desde content.js:", msg);
  if (msg.action === 'connection') {
    isPoketOption = msg.data.isPoketOption
    updateData()
  }
})
port.postMessage({ action: 'connection' });

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['autoStake', 'autoCycle', 'compoundEarnings'], (result) => {
    console.log(result)
    
    for (const featureID of featuresIDs) {
      if (result[featureID]) {
        const state = result[featureID]
        document.getElementById(featureID).checked = state
        features[featureID] = state
      }
    }
  })

  chrome.storage.local.get(['masanielloSettings', 'operations'], (result) => {
    console.log(result)
    
    if (result.masanielloSettings) settings = result.masanielloSettings
    if (result.operations) operations = result.operations

    calculateMatris()
    
    inputsIds.forEach(id => {
      const input = document.querySelector(`input#${id}`)
      if (input) input.value = settings[id]
    })

    updateData()
  })
})

document.addEventListener('click', ev => {
  const target = ev.target

  if (target instanceof HTMLButtonElement) {
    if (target.id === 'openInTab') {
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") })
    }
  }
})

document.addEventListener('input', ev => {
  if (ev.target instanceof HTMLInputElement && inputsIds.some(id => id === ev.target.id)) {
    const {value, id} = ev.target

    const isPercent = id === 'profitPercent'
    const decimalPaatern = inputsIds.slice(1, 3).some(inputId => id === inputId) ? "\\d*?" : "$|^\\d+(?:[.,]\\d*)?"
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
    console.log(ev.target.value)
    let value = ''
    if (id === 'profitPercent') {
      value = parseFloat(ev.target.value)
      value += '%'
    } else value = +ev.target.value.replace(',', '.')
    console.log({value})

    ev.target.value = value
    settings[id] = value

    chrome.storage.local.set({ ['masanielloSettings']: settings })
    calculateMatris()
    updateData()
  }

  if (featuresIDs.some(feature => feature === id)) {
    chrome.storage.local.get([id], (result) => {
      const newState = !result[id]
      
      // Guardar el nuevo estado
      chrome.storage.local.set({ [id]: newState }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function(isActive, id, settings, operations) {
                if (isActive) {
                  enableFeature(id, settings, operations)
                } else {
                  disableFeature(id)
                }
              },
              args: [newState, id, settings, operations]
            })
          }
        })
      })
    })
  } else if (features.autoStake) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function(settings, operations) {
            enableFeature('autoStake', settings, operations)
          },
          args: [settings, operations]
        })
      }
    })
  }
})

function updateData () {
  const profitPercent = matris[0][0] - 1
  const amountToRisk = +settings.amountToRisk
  const netProfit = amountToRisk * profitPercent
  // console.log({profitPercent, amountToRisk, netProfit})
  console.log({isPoketOption})
  
  document.querySelector('.target #profitPercent b').textContent = (profitPercent * 100).toFixed(2) + '%'
  document.querySelector('.target #finalBalance b').textContent = isPoketOption ? (amountToRisk + netProfit).toFixed(2) : autoFixNumber(amountToRisk + netProfit)
  document.querySelector('.target #netProfit b').textContent = isPoketOption ? netProfit.toFixed(2) : autoFixNumber(netProfit)

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
      chrome.storage.local.set({ operations })
      button.remove()
      updateData()
      if (autoStake) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function(settings, operations) {
                enableFeature('autoStake', settings, operations)
              },
              args: [settings, operations]
            })
          }
        })
      }

      button.removeEventListener('click', () => {
        console.log('Remove event clear operations')
      })
    })
  }
}
