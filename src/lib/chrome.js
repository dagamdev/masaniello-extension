/**
 * 
 * @param {string | string[]} keys 
 * @param {(result: {}) => void | undefined} callback 
 */
async function localStorageGet (keys, callback) {
  return await chrome.storage.local.get(keys, callback)
}

/**
 * 
 * @param {{}} data 
 * @param {() => void | undefined} callback 
 */
async function localStorageSet (data, callback) {
  return await chrome.storage.local.set(data, callback)
}