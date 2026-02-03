const NOTIF_ID = "open-popup-on-target";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
});

chrome.runtime.onMessage.addListener((msg) => {
  console.log("catchCanvas.js message received.");
  if (msg?.type !== "ON_TARGET_PAGE") return;

  chrome.notifications.create(NOTIF_ID, {
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: "Canvas QoL",
    message: "You’re on UFL Canvas. Open the extension popup?",
    buttons: [{ title: "Open" }, { title: "Dismiss" }]
  });
});

// Button clicks
chrome.notifications.onButtonClicked.addListener(async (id, buttonIndex) => {
  if (id !== NOTIF_ID) return;

  // Dismiss
  if (buttonIndex === 1) {
    chrome.notifications.clear(id);
    return;
  }

  // Open
  chrome.notifications.clear(id);

  // Preferred: open the toolbar popup if supported
  if (chrome.action?.openPopup) {
    try {
      await chrome.action.openPopup(); // may require that the extension has an action and can be shown
      return;
    } catch (e) {
      // fall through to fallback
    }
  }

  // Fallback: open a dedicated extension page in a tab
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});