'use strict'

let lastResultTime = ''
const {host} = location
/**
 * @type {Record<'profit' | 'initialAmount' | 'sessionCounter', number>}
 */
let stats = {
  profit: 0,
  initialAmount: 0,
  sessionCounter: 0
}
let amount = 0

createNotification('Extencion de gestion Masaniello cargada')

window.addEventListener("load", () => {
  console.log('Masaniello extension')

  chrome.runtime.sendMessage({ action: "getData", host }, (response) => {
    const operationsKey = `operations-${host}`
    const settingsKey = `masanielloSettings-${host}`
    const featuresKey = `features-${host}`
    const statsKey = `stats-${host}`

    if (response[operationsKey]) operations = response[operationsKey]
    if (response[settingsKey]) settings = response[settingsKey]
    if (response[featuresKey]) features = response[featuresKey]
    if (response[statsKey]) stats = response[statsKey]
    else stats.initialAmount = settings.amountToRisk

    if (features.autoStake) {
      calculateMatris()
      getAndSetAmount()
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

          handleResult(profit > 0, profit)
        }

        return
      }

      mutation.addedNodes.forEach((node) => {
        if(!node instanceof HTMLElement) return
        
        if (features.autoStake && node instanceof HTMLElement && node.matches(".deals-noty.deals-noty--close-success.deals-noty--many")) {        
          const childrens = node.querySelectorAll('.deals-noty__value')

          const payout = +childrens.item(0).textContent?.slice(1)
          const profit = +childrens.item(1).textContent?.slice(1)

          handleResult(payout && profit, profit)
        }
      })
    })
  })

  // Observa el `body` para detectar cualquier cambio en el DOM
  observer.observe(document.body, { childList: true, subtree: true })
})

/**
 * 
 * @param {{
 * settings?: MsanielloSettings,
 * operations?: 0 | 1[],
 * features?: typeof features,
 * stats?: typeof stats
 * }} data
 */
function updateMasanielloData (data) {
  if (data.settings) {
    settings = data.settings
    calculateMatris()
  }
  if (data.features) {
    if (data.features.autoStake) {
      if (!data.settings) calculateMatris()
      getAndSetAmount()
    }
    features = data.features
  } else if (features.autoStake) {
    getAndSetAmount()
  }
  if (data.operations) {
    operations = data.operations
    if (features.autoStake) {
      getAndSetAmount()
    }
  }
  if (data.stats) stats = data.stats
}

/**
 * 
 * @param {boolean} isWinner 
 * @param {number} profit 
 */
function handleResult (isWinner, profit) {
  if (isWinner) operations.push(1)
  else operations.push(0)

  let nexAmount = getMasanielloAmount()

  if (isWinner && !nexAmount) {
    stats.sessionCounter++
    createNotification({message: 'Has ganado la sesión Masaniello', type: 'success'})

    if (features.autoCycle) {
      const amountToRisk = +settings.amountToRisk
      if (features.compoundEarnings) {
        settings.amountToRisk = +(amountToRisk + amountToRisk * (matris[0][0] - 1)).toFixed(settings.decimalsLimit)
      }
      operations = []
      nexAmount = getMasanielloAmount()
    }
  } else if (!nexAmount) {
    stats.sessionCounter++
    createNotification({message: 'Has perdido la sesión Masaniello', type: 'error'})
  }

  stats.profit += isWinner ? profit : -amount

  chrome.runtime.sendMessage({ action: "updateData", data: {operations, masanielloSettings: settings, stats}, host })
  if (nexAmount) {
    amount = nexAmount
    setInputValue(amount)
  }
}

function getAndSetAmount () {
  amount = getMasanielloAmount()
  setInputValue(amount)
}
