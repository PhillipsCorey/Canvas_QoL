export async function getSetting(key) {
  const result = await chrome.storage.sync.get(key);
  return result[key];
}

export async function setSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
}
