let operationInProgress = false
let balanceTimeout
let balance = 0
let openTradesCounter = 0
let closeOperationTime = 0
let closedTrade = false

let updataBalanceCounter = 0

window.addEventListener("load", () => {
  console.log('Without notifications')

  handleOpenOperation('.deal-button_up')
  handleOpenOperation('.deal-button_down')

  const characterObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (!features.autoStake) return
      const {target} = mutation
      if (mutation.type !== 'characterData') return

      if (target.parentNode.matches('[data-test="account-balance-value"]')) {
        const nowTime = Date.now()
        if (updataBalanceCounter === 0 && closedTrade) console.log(nowTime - closeOperationTime)

        if (balanceTimeout) clearTimeout(balanceTimeout)
        updataBalanceCounter++
        
        balanceTimeout = setTimeout(() => {
          console.log('Balance actualizado: ', target.textContent)
          console.log({updataBalanceCounter})
          updataBalanceCounter = 0

          if (closedTrade) {
            console.log('Balance delay: ', Date.now() - closeOperationTime)
            closedTrade = false
            operationInProgress = false
            const actualBalance = getBalance()
            if (balance === actualBalance) {
              console.log('Operacion empate')
            } else if (balance < actualBalance) {
              console.log('Operacion ganada')
              handleResult(true, actualBalance - balance)
            }
          }
        }, 80)
      }

      if (target.parentElement.parentElement.parentElement.matches('.sidebar-menu-vertical__counter')) {
        const trades = +target.textContent

        if (openTradesCounter > trades) {
          handleClosedTrade()
        }
        openTradesCounter = trades
      }
    })
  })

  // Observa el `body` para detectar cualquier cambio en el DOM
  characterObserver.observe(document.body, { subtree: true, characterData: true })

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (!features.autoStake) return
      const {target} = mutation
      
      if (target instanceof HTMLElement && target.matches('.sidebar-menu-vertical__counter')) {
        const child = target.querySelector('[data-test="Text"]')
        const trades = child ? +child.textContent : 0

        if (openTradesCounter > trades) {
          handleClosedTrade()
        } 
        openTradesCounter = trades
      }
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
})

/**
 * 
 * @param {string} query 
 */
function handleOpenOperation (query) {
  const button = document.querySelector(query)

  if (!button) {
    setTimeout(() => {
      handleOpenOperation(query)
    }, 500)
    return
  }

  button.addEventListener('click', () => {
    if (!features.autoStake) return
    console.log('Is buy or sell')

    balance = getBalance()
    operationInProgress = true
  })
}

function handleClosedTrade () {
  closeOperationTime = Date.now()
  closedTrade = true

  setTimeout(() => {
    if (operationInProgress) {
      console.log('Se perdio la operacion')
      closedTrade = false
      handleResult(false, 0)
    }
  }, 2000)
}