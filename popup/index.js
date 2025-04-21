'use strict'
const featuresIDs = Object.keys(features)
const inputsIds = Object.keys(settings)

console.log({inputsIds, featuresIDs})
let tabHost
let masanielloKey = ``
let operationsKey = ``
let featuresKey = ''
let hasTabAccess = false;
let tab

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  tab = tabs[0]
  console.log(tabs, tab, tab.url)
  const tabUrl = new URL(tab.url)
  tabHost = tabUrl.host
  masanielloKey = `masanielloSettings-${tabHost}`
  operationsKey = `operations-${tabHost}`
  featuresKey = `features-${tabHost}`

  const result = await chrome.permissions.contains({ origins: [tab.url] })
  if (result) {
    console.log("La extensión tiene permiso para esta página.")
    hasTabAccess = true
  }

  if (hasTabAccess) {
    console.log({hasTabAccess})
    chrome.storage.local.get([featuresKey], (result) => {
      console.log(result)
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
    console.log('display none')
  }

  chrome.storage.local.get([masanielloKey, operationsKey], (result) => {
    console.log(result)
    
    if (result[masanielloKey]) settings = result[masanielloKey]
    if (result[operationsKey]) operations = result[operationsKey]

    calculateMatris()
    
    inputsIds.forEach(id => {
      const input = document.querySelector(`input#${id}`)
      if (input) input.value = settings[id]
    })

    updateData()
  })
})


document.addEventListener('DOMContentLoaded', () => {
  
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
    console.log(ev.target.value)
    let value = ''
    if (id === 'profitPercent') {
      value = parseFloat(ev.target.value)
      value += '%'
    } else value = +ev.target.value.replace(',', '.')
    console.log({value})

    ev.target.value = value
    settings[id] = value

    chrome.storage.local.set({ [masanielloKey]: settings })
    calculateMatris()
    updateData()
  }

  if (featuresIDs.some(feature => feature === id)) {
    features[id] = !features[id]
    
    if (!hasTabAccess) return
    chrome.storage.local.set({ [featuresKey]: features }, () => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function(isActive, id, settings, operations) {
          if (isActive) {
            enableFeature(id, settings, operations)
          } else {
            disableFeature(id)
          }
        },
        args: [features[id], id, settings, operations]
      })
    })
  } else if (features.autoStake) {
    if (!hasTabAccess) return
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function(settings, operations) {
        enableFeature('autoStake', settings, operations)
      },
      args: [settings, operations]
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
      chrome.storage.local.set({ [operationsKey]: operations })
      button.remove()
      updateData()
      if (autoStake && !hasTabAccess) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function(settings, operations) {
            enableFeature('autoStake', settings, operations)
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
