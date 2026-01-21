import { build } from "esbuild";
import fs from "fs-extra";

async function run() {
  await fs.remove("dist");
  await fs.copy("public", "dist");

  const common = {
    bundle: true,
    format: "esm",
    platform: "browser",
    sourcemap: true
  };

  await build({
    ...common,
    entryPoints: ["src/background/serviceWorker.js"],
    outfile: "dist/background.js"
  });

  await build({
    ...common,
    entryPoints: ["src/content/contentScript.js"],
    outfile: "dist/content.js"
  });

  await build({
    ...common,
    entryPoints: ["src/popup/popup.js"],
    outfile: "dist/popup.js"
  });

  await build({
    ...common,
    entryPoints: ["src/options/options.js"],
    outfile: "dist/options.js"
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
