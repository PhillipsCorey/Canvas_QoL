import { getSettings, setSettings } from "../shared/storage.js";

const input = document.getElementById("setting");
const save = document.getElementById("save");

(async () => {
  const settings = await getSettings();
  input.value = (settings.exampleSetting) ?? "";
})();

save.addEventListener("click", async () => {
  await setSettings({exampleSetting: input.value});
  alert("Saved");
});
