import { build as viteBuild } from "vite";
import { build as esbuild } from "esbuild";
import fs from "fs-extra";

async function run() {
  await fs.remove("dist");

  await fs.copy("public", "dist");

  const common = {
    bundle: true,
    format: "esm",
    platform: "browser",
    sourcemap: true,
  };

  await esbuild({
    ...common,
    entryPoints: ["src/background/serviceWorker.js"],
    outfile: "dist/background.js",
  });

  await esbuild({
    ...common,
    entryPoints: ["src/content/contentScript.js"],
    outfile: "dist/content.js",
  });

  await esbuild({
    ...common,
    entryPoints: ["src/content/catchCanvas.js"],
    outfile: "dist/catchCanvas.js"
  })

  await viteBuild();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
