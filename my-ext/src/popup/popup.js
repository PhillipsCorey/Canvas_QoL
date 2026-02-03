import { getSettings, setSettings } from "../shared/storage.js";

document.getElementById("btn").addEventListener("click", async () => {
  const key = "clickCount";
  const current = (await getSettings().key) ?? 0;
  const next = current + 1;
  await setSettings({key, next});
  document.getElementById("out").textContent = `clickCount = ${next}`;
});

document.getElementById("openChat").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("chat.html")
  });
});
