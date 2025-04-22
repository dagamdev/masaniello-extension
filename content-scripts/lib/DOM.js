function getProfitPercent () {
  if (host === 'pocketoption.com') return parseInt(document.querySelector('.block.block--payout .value__val-start').textContent) || 0
  if (pickHosts.some(ph => ph === host)) return parseInt(document.getElementById('win_chance').value) || 0
  return 0
}

function getInput () {
  if (host === 'pocketoption.com') return document.querySelector('.block.block--bet-amount input')
  if (pickHosts.some(ph => ph === host)) return document.getElementById('bet_amount')
  return null
}

function setInputValue (value, input) {
  input ??= getInput()
  
  if (!input) {
    setTimeout(() => {
      setInputValue(value, input)
    }, 1000)
    return
  }
  
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
  descriptor.set.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

function getBalance () {
  if (host === 'pocketoption.com') return +document.querySelector('.balance-info-block__data span').textContent
  if (pickHosts.some(ph => ph === host)) return +document.querySelector('.user_balance').textContent
  return 0
}

/**
 * 
 * @param {string | {message: string, type: 'success' | 'error' | 'info'}} arg1
 */
function createNotification (arg1) {
  const notification = document.createElement('div')
  notification.classList.add('masaniello-notification', 'active')
  const paragraph = document.createElement('p')

  if (typeof arg1 === 'string') {
    paragraph.textContent = arg1
    notification.classList.add('info')
  } else {
    paragraph.textContent = arg1.message
    notification.classList.add(arg1.type)
  }

  notification.appendChild(paragraph)
  const clearButton = document.createElement('button')
  clearButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
  notification.appendChild(clearButton)

  document.body.appendChild(notification)

  let showNotification = true
  let timeout

  clearButton.addEventListener('click', () => {
    showNotification = false
    notification.classList.remove('active')
    clearTimeout(timeout)
  })

  notification.addEventListener('animationend', () => {
    if (!showNotification) {
      notification.remove()
      return
    }

    timeout = setTimeout(() => {
      showNotification = false
      notification.classList.remove('active')
    }, 20_000)
  })

}