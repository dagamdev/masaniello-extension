'use strict'

console.log(window.location)
console.log(window.location.host)

let lastResultTime = ''

console.log({isPoketOption})

createNotification('Hola que tal')

window.addEventListener("load", () => {
  console.log('Load dom')

  chrome.runtime.sendMessage({ action: "getFreatures" }, (response) => {
    if ('autoStake' in response) features.autoStake = response.autoStake
    if ('autoCycle' in response) features.autoCycle = response.autoCycle
  })

  chrome.runtime.sendMessage({ action: "getMasanielloData" }, (response) => {
    if (response.operations) operations = response.operations
    if (response.masanielloSettings) settings = response.masanielloSettings

    if (features.autoStake) {
      calculateMatris()
      setInputValue(getMasanielloAmount(isPoketOption ? 2 : undefined))
    }
  })

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (pickHosts.some(ph => ph === window.location.host)) {
        const target = mutation.target

        if (features.autoStake && target instanceof HTMLElement && target.parentElement.matches('.table.table-striped.bets_table')) {
          const resultTime = target.querySelector('tr').firstChild.textContent
          if (lastResultTime === resultTime) return
          lastResultTime = resultTime

          const profit = +target.querySelector('tr').lastChild.textContent

          if (profit > 0) {
            operations.push(1)
          } else {
            operations.push(0)
          }

          let nexAmount = getMasanielloAmount()

          if (profit > 0 && !nexAmount) {
            createNotification({message: 'Has ganado con tu gestion Masaniello', type: 'success'})

            if (features.autoCycle) {
              const amountToRisk = +settings.amountToRisk
              settings.amountToRisk = autoFixNumber(amountToRisk + amountToRisk * (matris[0][0] - 1))
              operations = []
              nexAmount = getMasanielloAmount()
            }
          } else if (!nexAmount) {
            createNotification({message: 'Has perdido con tu gestion Masaniello', type: 'error'})
          }

          chrome.runtime.sendMessage({ action: "updateData", operations, masanielloSettings: settings })
          setInputValue(nexAmount || 1)
        }

        return
      }

      mutation.addedNodes.forEach((node) => {
        if(!node instanceof HTMLElement) return
        
        if (features.autoStake && node instanceof HTMLElement && node.matches(".deals-noty.deals-noty--close-success.deals-noty--many")) {        
          const childrens = node.querySelectorAll('.deals-noty__value')

          const payout = +childrens.item(0).textContent?.slice(1)
          const profit = +childrens.item(1).textContent?.slice(1)
          
          if (payout) {
            if (profit) {
              operations.push(1)
            }
          } else {
            operations.push(0)
          }

          let nexAmount = getMasanielloAmount(isPoketOption ? 2 : undefined)

          if (payout && !nexAmount) {
            console.log('Has ganado')
            createNotification({message: 'Has ganado con tu gestion Masaniello', type: 'success'})

            if (features.autoCycle) {
              console.log("auto cycle")
              const amountToRisk = +settings.amountToRisk
              settings.amountToRisk = autoFixNumber(amountToRisk + amountToRisk * (matris[0][0] - 1))
              operations = []
              console.log(settings)
              nexAmount = getMasanielloAmount(isPoketOption ? 2 : undefined)
            }
          } else if (!nexAmount) {
            createNotification({message: 'Has perdido con tu gestion Masaniello', type: 'error'})
          }

          chrome.runtime.sendMessage({ action: "updateData", operations, masanielloSettings: settings })
          setInputValue(nexAmount || 1)
        }
      })
    })
  })

  // Observa el `body` para detectar cualquier cambio en el DOM
  observer.observe(document.body, { childList: true, subtree: true })
})

/**
 * 
 * @param {'autoStake' | 'autoCycle'} featureType 
 * @param {MsanielloSettings} newSettings 
 * @param {0 | 1[]} newOperations 
 */
function enableFeature (featureType, newSettings, newOperations) {
  console.log('Enable: ', featureType)

  if (featureType === 'autoStake') {
    features.autoStake = true
    settings = newSettings
    operations = newOperations
    calculateMatris()
    setInputValue(getMasanielloAmount(isPoketOption ? 2 : undefined))
  } else {
    features.autoCycle = true
  }
}

/**
 * 
 * @param {'autoStake' | 'autoCycle'} featureType 
 */
function disableFeature (featureType) {
  console.log('Disable: ', featureType)

  if (featureType === 'autoStake') {
    features.autoStake = false
    setInputValue(1)
  } else features.autoCycle = false  
}


const port = chrome.runtime.connect({ name: "content" });

port.onMessage.addListener((msg) => {
  if (msg.action === 'connection') {
    port.postMessage({ action: 'connection', data: {isPoketOption} });
  }
  console.log("Mensaje recibido desde la pestaña de la extensión:", msg);
});

// Enviar mensaje
port.postMessage({ action: "desde_content", data: "Hola desde content.js" });
