import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { publicRoutes } from "../data/publicRoutes";

export const GET: APIRoute = async () => {
  const lessons = await getCollection("practice", ({ data }) => data.published);
  const routes = [...publicRoutes, ...lessons.map(lesson => `/resources/${lesson.id}/`)];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((path) => `<url><loc>https://speakkai.com${path}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );

};
