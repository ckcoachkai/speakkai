import { languagePairs } from "../src/lib/siteLanguage.mjs";
export const flagshipRoutes = [...new Set([
  "/", "/coaching/", "/schools/", "/companies/", "/contact/", "/resources/",
  "/coaching/young-competition-speakers/",
  ...languagePairs.flat(),
])];
