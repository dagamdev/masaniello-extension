function getProfitPercent () {
  return parseInt(document.querySelector('.block.block--payout .value__val-start').textContent) || 0
}

function getInput () {
  return document.querySelector('.block.block--bet-amount input')
}

function setInputValue (value, input) {
  const Input = input || getInput()
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
  descriptor.set.call(Input, value)
  Input.dispatchEvent(new Event("input", { bubbles: true }))
}

function getBalance () {
  return +document.querySelector('.balance-info-block__data span')?.textContent
}