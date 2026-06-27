/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        ink: "#090909",
        paper: "#f7f7f3",
        kai: "#1557ff"
      }
    }
  },
  plugins: []
};
