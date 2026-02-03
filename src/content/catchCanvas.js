console.log("Canvas detected, sending message.");
chrome.runtime.sendMessage({
  type: "ON_TARGET_PAGE",
  url: location.href
});