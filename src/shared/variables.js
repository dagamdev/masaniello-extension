/**
 * @type {0 | 1[]}
 */
let operations = []
/**
 * @typedef {Record<'ITMs' | 'amountToRisk' | 'profitPercent' | 'totalOperations' | 'decimalsLimit', number | string>} MsanielloSettings
 * @type {MsanielloSettings}
 */
let settings = {
  amountToRisk: 100,
  profitPercent: "92%",
  totalOperations: 10,
  ITMs: 4,
  decimalsLimit: 2
}
/**
 * @type {0 | 1[][]}
 */
let matris = []
let features = {
  autoStake: false,
  autoCycle: false,
  compoundEarnings: false
}
let isPoketOption = window.location.host === 'pocketoption.com'