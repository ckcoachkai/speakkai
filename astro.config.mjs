import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";

// The pinned integration injects its routes in this hook only. Never run it in a build.
function localEditor() {
  const editor = keystatic();
  return {
    name: "speakkai-local-editor",
    hooks: { "astro:config:setup": (context) => {
      if (context.command === "dev") {
        // astro check/build may run alongside the editor. Do not let their
        // production JSX optimizer cache replace the development JSX runtime.
        context.updateConfig({ vite: { cacheDir: "node_modules/.vite-cms" } });
        return editor.hooks["astro:config:setup"](context);
      }
    } },
  };
}

export default defineConfig({
  site: "https://speakkai.com",
  integrations: [tailwind(), react(), ...(process.env.KEYSTATIC_LOCAL === "1" ? [localEditor()] : [])],
  // Keystatic's generated scan entry imports its server API. Keep that API in
  // Astro SSR, where astro:env/server is resolved, out of browser prebundling.
  vite: { optimizeDeps: { exclude: ["@keystatic/astro/api"] } },
  output: "static"
});
