// Add a pair only after both complete pages exist. Visible fallbacks are not SEO alternates.
export const languagePairs = [
  ["/", "/zh/"],
  ["/coaching/", "/zh/coaching/"],
  ["/schools/", "/zh/schools/"],
  ["/companies/", "/zh/companies/"],
  ["/coaching/young-competition-speakers/", "/zh/coaching/young-competition-speakers/"],
  ["/resources/one-object-story/", "/zh/resources/one-object-story/"],
];
export function pageAlternates(path) {
  const pair = languagePairs.find(routes => routes.includes(path));
  return pair ? [{ lang: "en", href: pair[0] }, { lang: "zh-CN", href: pair[1] }] : [];
}
export function localizedPath(path, language) {
  const url = new URL(path, "https://speakkai.com");
  const pair = languagePairs.find(routes => routes.includes(url.pathname));
  return (pair ? pair[language === "zh-CN" ? 1 : 0] : url.pathname) + url.search + url.hash;
}
export function destinationLabel(label, path, language) {
  return language === "zh-CN" && !localizedPath(path, language).startsWith("/zh/") ? `${label}（英文）` : label;
}
export function languageChoices(path, language) {
  const pair = pageAlternates(path);
  if (pair.length) return pair.map(item => ({ ...item, label: item.lang === "en" ? "English" : "中文", current: item.lang === language }));
  return language === "zh-CN"
    ? [{ lang: "en", href: "/", label: "English home", current: false }, { lang: "zh-CN", href: path, label: "中文", current: true }]
    : [{ lang: "en", href: path, label: "English", current: true }, { lang: "zh-CN", href: "/zh/", label: "中文首页", current: false }];
}
