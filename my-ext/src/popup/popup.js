import { getSetting, setSetting } from "../shared/storage.js";

document.getElementById("btn").addEventListener("click", async () => {
  const key = "clickCount";
  const current = (await getSetting(key)) ?? 0;
  const next = current + 1;
  await setSetting(key, next);
  document.getElementById("out").textContent = `clickCount = ${next}`;
});

document.getElementById("openChat").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("chat.html")
  });
});
