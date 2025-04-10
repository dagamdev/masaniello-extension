let autoStake = false, autoCycle = false
/**
 * @type {0 | 1[]}
 */
let operations = []
/**
 * @typedef {Record<'ITMs' | 'amountToRisk' | 'profitPercent' | 'totalOperations', number | string>} MsanielloSettings
 * @type {MsanielloSettings}
 */
let settings = {
  ITMs: 4,
  amountToRisk: 100,
  profitPercent: "92%",
  totalOperations: 10
}
/**
 * @type {0 | 1[][]}
 */
let matris = []