chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  if (message.action === "updateData") {
    const {data, host} = message
    const updatedData = {}

    for (const dataKey in data) {
      updatedData[`${dataKey}-${host}`] = data[dataKey]
    }

    chrome.storage.local.set(updatedData, () => {
      console.log("Datos guardados:", data);
    })
  }

  if (message.action === 'getData') {
    chrome.storage.local.get([`masanielloSettings-${message.host}`, `operations-${message.host}`, `features-${message.host}`, `stats-${message.host}`], (result) => {
      sendResponse(result)
    })

    return true
  }
})
