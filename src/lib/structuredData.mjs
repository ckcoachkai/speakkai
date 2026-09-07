const origin = "https://speakkai.com";
export function structuredData({
  path,
  title,
  description,
  service,
  breadcrumb,
  pageType = "WebPage",
}) {
  const organization = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "SpeakKai",
    alternateName: "说开",
    url: `${origin}/`,
    logo: `${origin}/images/speakkai-logo-header-source.png`,
  };
  const person = {
    "@type": "Person",
    "@id": `${origin}/#kai`,
    name: "Kai Liu",
    jobTitle: "Communication coach and speaker",
    url: `${origin}/#story`,
    image: `${origin}/images/coach-kai-headshot.webp`,
    worksFor: { "@id": organization["@id"] },
  };
  const page = {
    "@type": pageType,
    "@id": `${origin}${path}#page`,
    url: `${origin}${path}`,
    name: title,
    description,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#website` },
    ...(service ? { mainEntity: { "@id": `${origin}${path}#service` } } : {}),
  };
  const graph = [
    organization,
    person,
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: "SpeakKai",
      publisher: { "@id": organization["@id"] },
    },
    page,
  ];
  if (service)
    graph.push({
      "@type": "Service",
      "@id": `${origin}${path}#service`,
      name: service,
      description,
      url: `${origin}${path}`,
      provider: { "@id": organization["@id"] },
    });
  if (breadcrumb)
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: breadcrumb,
          item: `${origin}${path}`,
        },
      ],
    });
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  }).replace(/</g, "\\u003c");
}
