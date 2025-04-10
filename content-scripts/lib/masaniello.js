function calculateMatris () {
  const total = +settings.totalOperations
  const winners = +settings.ITMs
  const newMatris = [[]]
  const profit = +settings.profitPercent.slice(0, -1) / 100 + 1

  for (let col=0; col<winners; col++) {
    const cellValue = getCellValue(winners, total, col, 0)
    newMatris[0][col] = cellValue
  }

  matris = newMatris

  /**
   * 
   * @param {number} winners 
   * @param {number} total 
   * @param {number} x 
   * @param {number} y 
   */
  function getCellValue (winners, total, x, y) {
    if (x === winners) return 1
    const value = newMatris[y]?.[x]
    if (value) {
      return value
    }

    if (winners - x === total - y) {
      return profit**(total-y)
    } else {
      const nextRow = getCellValue(winners, total, x, y+1)
      const nextRowTwo = getCellValue(winners, total, x+1, y+1)

      if (newMatris[y+1]) {
        newMatris[y+1][x] = nextRow
      } else {
        newMatris[y+1] = []
        newMatris[y+1][x] = nextRow
      }
      
      if (newMatris[y+1].length < winners && winners-1 >= x+1) {
        newMatris[y+1][x+1] = nextRowTwo
      }

      return profit * (nextRow || 1) * nextRowTwo / (nextRow + (profit - 1) * nextRowTwo)
    }
  }
}

/**
 * 
 * @param {number} fixed
 */
function getMasanielloAmount (fixed = 2) {
  const wins = +settings.ITMs
  const total = +settings.totalOperations
  const amountToRisk = +settings.amountToRisk
  const profit = +settings.profitPercent.slice(0, -1) / 100 + 1

  let value = 0, balance = amountToRisk

  let lastAmount = calculateAmount(0, 0)
  value = lastAmount
  
  for (let op=0; op<operations.length; op++) {
    const winnins = operations.filter((o, i) => i <= op && o).length
    const losses = operations.filter((o, i) => i <= op && !o).length

    const operation = operations[op]
    if (operation) balance += lastAmount * (profit - 1)
    else balance -= lastAmount
    
    // Ganado
    if (winnins === wins) {
      return 0
    }

    // Perdido
    if (losses >= total - wins + 1) {
      balance -= lastAmount
      return 0
    }
    if (op + 1 === total) {
      return balance.toFixed(fixed)
    }

    value = calculateAmount(winnins, losses, op + 2 === total)
    lastAmount = value
  }

  
  return value.toFixed(fixed)

  /**
   * 
   * @param {number} winnins
   * @param {number} losses
   * @param {boolean} isLast
   */
  function calculateAmount (winnins, losses, isLast = false) {
    if (isLast) return balance

    const valor1 = winnins + 1 >= wins ? 1 : matris[losses + winnins + 1][winnins + 1]
    const valor2 = matris[losses + winnins + 1]?.[winnins] || 1

    return (1 - profit * valor1 / (valor2 + (profit - 1) * valor1)) * balance
  }
}