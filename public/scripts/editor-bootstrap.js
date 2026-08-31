const version = document.body.dataset.editorVersion;
const canvas = document.querySelector("[data-editor-canvas]");
const key = `speakkai-visual-editor-v1-${version}`;

function words(value = "") {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function annotateOriginalCanvas() {
  const root = canvas?.querySelector('[data-qa="experiment-root"]');
  if (!root || root.hasAttribute("data-editor-section")) return;

  root.dataset.editorSection = "composition";
  root.dataset.sectionLabel = `Version ${document.body.dataset.originalVersion || ""} composition`.trim();

  const used = new Map();
  const nextId = (base) => {
    const count = (used.get(base) || 0) + 1;
    used.set(base, count);
    return `${base}-${count}`;
  };
  const label = (element, fallback) => {
    const className = [...element.classList].find((name) => !name.startsWith("is-"));
    const text = element.textContent?.trim().replace(/\s+/g, " ").slice(0, 42);
    return text || (className ? words(className) : fallback);
  };

  [...root.children].forEach((element) => {
    if (element.matches('[aria-hidden="true"]')) return;
    const id = nextId("block");
    element.dataset.editId = id;
    element.dataset.editType = element.matches("figure") ? "image" : "container";
    element.dataset.editLabel = label(element, words(id));
  });

  const candidates = root.querySelectorAll("figure[data-qa='portrait'], h1, h2, h3, p, a, button, figcaption, footer, small, strong, span");
  candidates.forEach((element) => {
    if (element.hasAttribute("data-edit-id")) return;
    if (element.matches('[aria-hidden="true"]') || element.closest('[aria-hidden="true"]')) return;
    if (!["FIGURE"].includes(element.tagName) && element.children.length > 0) return;

    let type = "text";
    let base = element.tagName.toLowerCase();
    if (element.matches("figure")) { type = "image"; base = "portrait"; }
    if (element.matches("a, button")) { type = "button"; base = "action"; }
    const id = nextId(base);
    element.dataset.editId = id;
    element.dataset.editType = type;
    element.dataset.editLabel = label(element, words(id));
  });
}

annotateOriginalCanvas();

function safeParse(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function applyState(state) {
  if (!state || state.schema !== 1 || !canvas) return;

  for (const duplicate of state.duplicates || []) {
    if (document.querySelector(`[data-edit-id="${CSS.escape(duplicate.id)}"]`)) continue;
    const parent = document.querySelector(`[data-edit-id="${CSS.escape(duplicate.parentId)}"]`);
    if (!parent || !duplicate.html) continue;
    const template = document.createElement("template");
    template.innerHTML = duplicate.html;
    const element = template.content.firstElementChild;
    if (element) parent.append(element);
  }

  for (const [id, record] of Object.entries(state.nodes || {})) {
    const element = document.querySelector(`[data-edit-id="${CSS.escape(id)}"]`);
    if (!element) continue;
    for (const name of [
      "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign", "color",
      "backgroundColor", "padding", "margin", "gap", "borderRadius", "opacity", "width", "height",
      "maxWidth", "boxShadow", "borderColor", "borderWidth", "borderStyle", "aspectRatio", "translate",
    ]) element.style[name] = "";
    if (typeof record.html === "string" && ["text", "button"].includes(element.dataset.editType)) element.innerHTML = record.html;
    if (record.styles) Object.assign(element.style, record.styles);
    if (typeof record.hidden === "boolean") element.hidden = record.hidden;
    const image = element.matches("img") ? element : element.querySelector("img");
    if (image && record.image) {
      if (record.image.src) image.src = record.image.src;
      image.style.objectPosition = record.image.objectPosition || "";
      image.style.objectFit = record.image.objectFit || "";
    }
  }

  const sections = new Map([...canvas.querySelectorAll(":scope > [data-editor-section]")].map((section) => [section.dataset.editorSection, section]));
  for (const id of state.sectionOrder || []) {
    const section = sections.get(id);
    if (section) canvas.append(section);
  }
}

const stored = safeParse(localStorage.getItem(key));
if (stored) applyState(stored);

document.querySelector("[data-editor-launch]")?.addEventListener("click", async () => {
  const button = document.querySelector("[data-editor-launch]");
  button?.setAttribute("aria-busy", "true");
  try {
    const editor = await import("/scripts/visual-editor.js");
    editor.launchEditor({ version, canvas, storageKey: key, applyState });
  } finally {
    button?.removeAttribute("aria-busy");
  }
});

window.__SPEAKKAI_EDITOR__ = { version, storageKey: key, applyState, hasSavedState: Boolean(stored) };
