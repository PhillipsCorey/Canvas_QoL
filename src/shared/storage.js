export const DEFAULTS = 
{ 
  darkMode: false,
  fontSize: "16pt",
  font: "Monserrat",
  exampleSetting: "",
  todo: []
};

export async function getSettings() {
  return chrome.storage.sync.get(DEFAULTS);
}

export async function setSettings(patch) {
  return chrome.storage.sync.set(patch);
}