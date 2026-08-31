const version = document.body.dataset.editorVersion;
const canvas = document.querySelector("[data-editor-canvas]");
const key = `speakkai-visual-editor-v1-${version}`;

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
    element.removeAttribute("style");
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
