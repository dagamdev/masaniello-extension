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
    chrome.storage.local.get(['autoStake', 'autoCycle'], (result) => {
      sendResponse(result)
    })

    return true
  }
})

let ports = {
  content: null,
  extensionTab: null,
};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "content") {
    ports.content = port;
    console.log("Conectado: content.js");

    port.onMessage.addListener((msg) => {
      ports.extensionTab?.postMessage(msg);
    });
  } else if (port.name === "extensionTab") {
    ports.extensionTab = port;
    console.log("Conectado: pestaña de extensión");

    port.onMessage.addListener((msg) => {
      ports.content?.postMessage(msg);
    });
  }

  port.onDisconnect.addListener(() => {
    if (port.name === "content") ports.content = null;
    if (port.name === "extensionTab") ports.extensionTab = null;
  });
});

