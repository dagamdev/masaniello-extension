'use strict'

window.addEventListener("load", () => {
  console.log('Load dom')

  chrome.runtime.sendMessage({ action: "getFreatures" }, (response) => {
    if ('autoStake' in response) autoStake = response.autoStake
    if ('autoCycle' in response) autoCycle = response.autoCycle
  })

  chrome.runtime.sendMessage({ action: "getMasanielloData" }, (response) => {
    if (response.operations) operations = response.operations
    if (response.masanielloSettings) settings = response.masanielloSettings

    if (autoStake) {
      calculateMatris()
      setInputValue(getMasanielloAmount())
    }
  })

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (autoStake && node instanceof HTMLElement && node.matches(".deals-noty.deals-noty--close-success.deals-noty--many")) {        
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

          let nexAmount = getMasanielloAmount()

          if (payout && !nexAmount) {
            console.log('Has ganado')
            alert('Has ganado con tu gestion Masaniello')

            if (autoCycle) {
              console.log("auto cycle")
              const amountToRisk = +settings.amountToRisk
              settings.amountToRisk = (amountToRisk + amountToRisk * (matris[0][0] - 1)).toFixed(2)
              operations = []
              console.log(settings)
              nexAmount = getMasanielloAmount()
            }
          } else if (!nexAmount) {
            alert('Has perdido con tu gestion Masaniello')
            return
          }

          chrome.runtime.sendMessage({ action: "updateData", operations, masanielloSettings: settings })
          setInputValue(nexAmount)
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
    autoStake = true
    settings = newSettings
    operations = newOperations
    calculateMatris()
    setInputValue(getMasanielloAmount(2))
  } else {
    autoCycle = true
  }
}

/**
 * 
 * @param {'autoStake' | 'autoCycle'} featureType 
 */
function disableFeature (featureType) {
  console.log('Disable: ', featureType)

  if (featureType === 'autoStake') {
    autoStake = false
  } else autoCycle = false  
}
