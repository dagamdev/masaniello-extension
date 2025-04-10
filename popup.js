'use strict'

let tabId

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.session.get(['autoStake', 'autoCycle'], (result) => {
    // console.log(result)
    
    if (result.autoStake) {
      getAutoStakeInput().checked = result.autoStake
      autoStake = result.autoStake
    }
    if (result.autoCycle) {
      getAutoCycleInput().checked = result.autoCycle
      autoCycle = result.autoCycle
    }
  })

  chrome.storage.local.get(['masanielloSettings', 'operations'], (result) => {
    // console.log(result)
    
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

// Obtener el estado guardado

document.addEventListener('click', ev => {
  // console.log(ev.target instanceof HTMLElement)
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
    let value = ''
    if (id === 'profitPercent') {
      value = +ev.target.value.replace(',', '.').slice(0, -1)
      value += '%'
    } else value = +ev.target.value.replace(',', '.')

    ev.target.value = value
    settings[id] = value

    chrome.storage.local.set({ ['masanielloSettings']: settings, operations: [] })
    calculateMatris()
    updateData()
  }

  if (id === 'autoStake' || id === 'autoCycle') {
    chrome.storage.session.get([id], (result) => {
      const newState = !result[id]
      if (id === 'autoStake') autoStake = newState
      if (id === 'autoCycle') autoCycle = newState
      
      // Guardar el nuevo estado
      chrome.storage.session.set({ [id]: newState }, () => {
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
  }
})

function updateData () {
  const profitPercent = matris[0][0] - 1
  const amountToRisk = +settings.amountToRisk
  const netProfit = amountToRisk * profitPercent
  // console.log({profitPercent, amountToRisk, netProfit})
  
  document.querySelector('.target #profitPercent b').textContent = (profitPercent * 100).toFixed(2) + '%'
  document.querySelector('.target #finalBalance b').textContent = (amountToRisk + netProfit).toFixed(2)
  document.querySelector('.target #netProfit b').textContent = netProfit.toFixed(2)

  const nextAmount = getMasanielloAmount(2)

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

      button.removeEventListener('click', () => {
        console.log('Remove event clear operations')
      })
    })
  }

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
}