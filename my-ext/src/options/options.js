import { getSetting, setSetting } from "../shared/storage.js";

const input = document.getElementById("setting");
const save = document.getElementById("save");

(async () => {
  input.value = (await getSetting("exampleSetting")) ?? "";
})();

save.addEventListener("click", async () => {
  await setSetting("exampleSetting", input.value);
  alert("Saved");
});
