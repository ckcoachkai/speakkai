import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://speakkai.com",
  integrations: [tailwind()],
  output: "static"
});
