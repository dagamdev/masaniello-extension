chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  if (message.action === "updateData") {
    const {data, host} = message
    const updatedData = {}

    for (const dataKey in data) {
      updatedData[`${dataKey}-${host}`] = data[dataKey]
    }

    chrome.storage.local.set(updatedData, () => {
      console.log("Dato guardado:", props);
    })
  }

  if (message.action === 'getData') {
    chrome.storage.local.get([`masanielloSettings-${message.host}`, `operations-${message.host}`, `features-${message.host}`], (result) => {
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

