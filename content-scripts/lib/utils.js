/**
 * 
 * @param {number} amount 
 */
function multiplyBy10k (amount) {
  return amount * 10_000
}

/**
 * 
 * @param {number} ms 
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}