chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  if (message.action === "updateData") {
    const {action, ...props} = message
    chrome.storage.local.set({ ...props }, () => {
      console.log("Dato guardadol:", props);
    })
  }

  if (message.action === 'getMasanielloData') {
    chrome.storage.local.get(['masanielloSettings', 'operations'], (result) => {
      sendResponse(result)
    })

    return true
  }

  if (message.action === 'getFreatures') {
    chrome.storage.session.get(['autoStake', 'autoCycle'], (result) => {
      sendResponse(result)
    })

    return true
  }
})
