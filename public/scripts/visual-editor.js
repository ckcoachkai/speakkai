const EDITABLE_STYLES = [
  "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign", "color",
  "backgroundColor", "padding", "margin", "gap", "borderRadius", "opacity", "width", "height",
  "maxWidth", "boxShadow", "borderColor", "borderWidth", "borderStyle", "aspectRatio", "translate",
];

const esc = (value = "") => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
const selector = (id) => `[data-edit-id="${CSS.escape(id)}"]`;

function injectStyles() {
  if (document.querySelector("[data-editor-styles]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/styles/visual-editor.css";
  link.dataset.editorStyles = "true";
  document.head.append(link);
}

function serialize(canvas) {
  const nodes = {};
  const duplicates = [];
  canvas.querySelectorAll("[data-edit-id]").forEach((element) => {
    const id = element.dataset.editId;
    const styles = {};
    for (const name of EDITABLE_STYLES) if (element.style[name]) styles[name] = element.style[name];
    const record = { hidden: element.hidden, styles };
    if (["text", "button"].includes(element.dataset.editType)) record.html = element.innerHTML;
    const image = element.matches("img") ? element : element.querySelector("img");
    if (image) record.image = { src: image.getAttribute("src"), objectPosition: image.style.objectPosition, objectFit: image.style.objectFit };
    nodes[id] = record;
    if (element.dataset.editorDuplicate === "true") {
      const parent = element.parentElement?.closest("[data-edit-id]");
      if (parent) duplicates.push({ id, parentId: parent.dataset.editId, html: element.outerHTML });
    }
  });
  return {
    schema: 1,
    savedAt: new Date().toISOString(),
    sectionOrder: [...canvas.querySelectorAll(":scope > [data-editor-section]")].map((section) => section.dataset.editorSection),
    nodes,
    duplicates,
  };
}

function labelFor(element) {
  return element?.dataset.editLabel || element?.dataset.sectionLabel || element?.dataset.editId || "Page";
}

function makeControl(label, control) {
  return `<label><span>${label}</span>${control}</label>`;
}

function readTranslate(element) {
  const values = (element?.style.translate || "").match(/-?[\d.]+/g)?.map(Number) || [];
  return { x: values[0] || 0, y: values[1] || 0 };
}

export function launchEditor({ version, canvas, storageKey, applyState }) {
  if (!canvas || document.body.classList.contains("editor-is-open")) return;
  injectStyles();
  document.body.classList.add("editor-is-open");
  document.querySelector("[data-editor-launch]")?.setAttribute("hidden", "");

  const nav = document.querySelector(".evo-nav, .v4-nav");
  if (!nav) return;
  const stage = document.createElement("div");
  const artboard = document.createElement("div");
  stage.className = "editor-stage";
  artboard.className = "editor-artboard";
  nav.before(stage);
  stage.append(artboard);
  artboard.append(nav, canvas);

  const original = serialize(canvas);
  const history = [];
  const future = [];
  let selected = null;
  let dragSection = null;
  let dragElement = null;

  const applyViewport = (mode = "desktop") => {
    const targets = { desktop: 1440, tablet: 768, mobile: 390 };
    const compact = innerWidth <= 820;
    const left = compact ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--editor-left")) || 0;
    const right = compact ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--editor-right")) || 0;
    const available = Math.max(320, innerWidth - left - right);
    const target = targets[mode] || targets.desktop;
    const scale = Math.min(1, available / target);
    stage.style.marginLeft = `${left}px`;
    stage.style.width = `${available}px`;
    artboard.style.width = `${target}px`;
    artboard.style.transform = `scale(${scale})`;
    requestAnimationFrame(() => { stage.style.height = `${Math.max(innerHeight - 64, artboard.scrollHeight * scale)}px`; });
  };
  const artboardObserver = new ResizeObserver(() => applyViewport(document.body.dataset.editorPreview || "desktop"));
  const handleResize = () => applyViewport(document.body.dataset.editorPreview || "desktop");
  artboardObserver.observe(artboard);
  addEventListener("resize", handleResize);

  const shell = document.createElement("div");
  shell.className = "visual-editor";
  shell.setAttribute("role", "dialog");
  shell.setAttribute("aria-label", `Visual editor for Version ${version}`);
  shell.innerHTML = `
    <header class="editor-toolbar">
      <div class="editor-title"><b>SpeakKai Visual Editor</b><span>Version ${version} · saved in this browser</span></div>
      <div class="editor-viewports" role="group" aria-label="Preview width">
        <button type="button" data-preview="desktop" aria-pressed="true">Desktop</button>
        <button type="button" data-preview="tablet" aria-pressed="false">Tablet</button>
        <button type="button" data-preview="mobile" aria-pressed="false">Mobile</button>
      </div>
      <div class="editor-actions">
        <button type="button" data-action="undo" disabled>Undo</button>
        <button type="button" data-action="redo" disabled>Redo</button>
        <button type="button" data-action="export">Export</button>
        <button type="button" data-action="save" class="editor-primary">Save</button>
        <button type="button" data-action="close">Exit</button>
      </div>
    </header>
    <aside class="editor-layers" aria-label="Page layers"><div class="panel-heading"><b>Layers</b><small>Drag sections to reorder</small></div><div data-layers></div></aside>
    <aside class="editor-properties" aria-label="Element properties"><div class="panel-heading"><b>Properties</b><small data-selection-name>Select an element</small></div><div data-properties class="property-empty">Click a highlighted page element or choose a layer.</div></aside>
    <div class="editor-status" role="status" aria-live="polite">Ready</div>
  `;
  document.body.append(shell);

  const status = (message) => {
    const node = shell.querySelector(".editor-status");
    node.textContent = message;
    clearTimeout(status.timer);
    status.timer = setTimeout(() => { node.textContent = "Ready"; }, 2400);
  };
  const capture = () => {
    history.push(serialize(canvas));
    if (history.length > 80) history.shift();
    future.length = 0;
    updateHistory();
  };
  const updateHistory = () => {
    shell.querySelector('[data-action="undo"]').disabled = history.length === 0;
    shell.querySelector('[data-action="redo"]').disabled = future.length === 0;
  };
  const restore = (state) => {
    canvas.querySelectorAll('[data-editor-duplicate="true"]').forEach((node) => node.remove());
    applyState(state);
    refreshLayers();
    if (selected?.dataset.editId) select(canvas.querySelector(selector(selected.dataset.editId)));
  };

  function refreshLayers() {
    const host = shell.querySelector("[data-layers]");
    host.innerHTML = "";
    canvas.querySelectorAll(":scope > [data-editor-section]").forEach((section) => {
      const group = document.createElement("div");
      group.className = "layer-section";
      group.draggable = true;
      group.dataset.section = section.dataset.editorSection;
      group.innerHTML = `<button type="button" class="layer-section-name"><span>⋮⋮</span><b>${esc(section.dataset.sectionLabel)}</b></button><div class="layer-children"></div>`;
      group.querySelector("button").addEventListener("click", () => select(section));
      const childHost = group.querySelector(".layer-children");
      section.querySelectorAll("[data-edit-id]").forEach((element) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = labelFor(element);
        button.dataset.layerId = element.dataset.editId;
        button.addEventListener("click", () => select(element));
        childHost.append(button);
      });
      group.addEventListener("dragstart", () => { dragSection = section; group.classList.add("is-dragging"); });
      group.addEventListener("dragend", () => { dragSection = null; group.classList.remove("is-dragging"); });
      group.addEventListener("dragover", (event) => event.preventDefault());
      group.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!dragSection || dragSection === section) return;
        capture();
        const rect = group.getBoundingClientRect();
        canvas.insertBefore(dragSection, event.clientY > rect.top + rect.height / 2 ? section.nextSibling : section);
        refreshLayers();
        status("Section order updated");
      });
      host.append(group);
    });
  }

  function select(element) {
    selected?.classList.remove("editor-selected");
    selected = element;
    if (!selected) return;
    selected.classList.add("editor-selected");
    shell.querySelector("[data-selection-name]").textContent = labelFor(selected);
    shell.querySelectorAll("[data-layer-id]").forEach((button) => button.classList.toggle("is-selected", button.dataset.layerId === selected.dataset.editId));
    renderProperties();
    status("Selected — drag this element directly on the page");
  }

  function renderProperties() {
    const host = shell.querySelector("[data-properties]");
    const isSection = selected?.hasAttribute("data-editor-section");
    const type = selected?.dataset.editType || (isSection ? "section" : "element");
    const computed = selected ? getComputedStyle(selected) : null;
    if (!selected) { host.className = "property-empty"; host.textContent = "Select an element."; return; }
    host.className = "property-form";
    const textValue = ["text", "button"].includes(type) ? selected.innerText.trim() : "";
    const image = type === "image" ? (selected.matches("img") ? selected : selected.querySelector("img")) : null;
    host.innerHTML = `
      ${textValue ? `<fieldset><legend>Content</legend>${makeControl("Text", `<textarea data-prop="text" rows="5">${esc(textValue)}</textarea>`)}</fieldset>` : ""}
      ${image ? `<fieldset><legend>Image</legend>${makeControl("Source", `<input data-prop="imageSrc" value="${esc(image.getAttribute("src") || "")}">`)}${makeControl("Fit", `<select data-prop="objectFit"><option>cover</option><option>contain</option><option>fill</option></select>`)}${makeControl("Focal point", `<input data-prop="objectPosition" value="${esc(image.style.objectPosition || computed.objectPosition || "50% 50%")}">`)}<label class="editor-file"><span>Replace from device</span><input data-prop="imageFile" type="file" accept="image/*"></label></fieldset>` : ""}
      <fieldset><legend>Typography</legend>
        ${makeControl("Font", `<select data-prop="fontFamily"><option value="">Inherited</option><option value="Manrope, sans-serif">Manrope</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Space Mono', monospace">Space Mono</option><option value="Arial, sans-serif">Arial</option></select>`)}
        <div class="property-grid">${makeControl("Size", `<input data-prop="fontSize" value="${esc(selected.style.fontSize || computed.fontSize)}">`)}${makeControl("Weight", `<input data-prop="fontWeight" value="${esc(selected.style.fontWeight || computed.fontWeight)}">`)}${makeControl("Line height", `<input data-prop="lineHeight" value="${esc(selected.style.lineHeight || computed.lineHeight)}">`)}${makeControl("Spacing", `<input data-prop="letterSpacing" value="${esc(selected.style.letterSpacing || computed.letterSpacing)}">`)}</div>
        ${makeControl("Alignment", `<select data-prop="textAlign"><option>left</option><option>center</option><option>right</option></select>`)}
        <div class="property-grid">${makeControl("Text", `<input data-prop="color" type="color" value="${toHex(computed.color)}">`)}${makeControl("Background", `<input data-prop="backgroundColor" type="color" value="${toHex(computed.backgroundColor, "#ffffff")}">`)}</div>
      </fieldset>
      <fieldset><legend>Layout & style</legend>
        <div class="property-grid">${makeControl("Width", `<input data-prop="width" value="${esc(selected.style.width || "")}" placeholder="auto / 80%">`)}${makeControl("Height", `<input data-prop="height" value="${esc(selected.style.height || "")}" placeholder="auto / 420px">`)}</div>
        <div class="property-grid">${makeControl("Position X", `<input data-prop="translateX" type="number" step="8" value="${readTranslate(selected).x}">`)}${makeControl("Position Y", `<input data-prop="translateY" type="number" step="8" value="${readTranslate(selected).y}">`)}</div>
        <div class="property-grid">${makeControl("Padding", `<input data-prop="padding" value="${esc(selected.style.padding || "")}" placeholder="24px">`)}${makeControl("Margin", `<input data-prop="margin" value="${esc(selected.style.margin || "")}" placeholder="0">`)}</div>
        <div class="property-grid">${makeControl("Gap", `<input data-prop="gap" value="${esc(selected.style.gap || "")}" placeholder="24px">`)}${makeControl("Radius", `<input data-prop="borderRadius" value="${esc(selected.style.borderRadius || computed.borderRadius)}">`)}</div>
        ${makeControl("Opacity", `<input data-prop="opacity" type="range" min="0.1" max="1" step="0.05" value="${esc(selected.style.opacity || computed.opacity)}">`)}
      </fieldset>
      <fieldset><legend>Actions</legend><div class="property-actions">
        <button type="button" data-element-action="move-up">Move up</button><button type="button" data-element-action="move-down">Move down</button>
        <button type="button" data-element-action="reset-position">Reset position</button>
        ${!isSection ? `<button type="button" data-element-action="duplicate">Duplicate</button>` : ""}
        <button type="button" data-element-action="toggle">${selected.hidden ? "Show" : "Hide"}</button>
        ${selected.dataset.editorDuplicate === "true" ? `<button type="button" data-element-action="delete" class="danger">Delete copy</button>` : ""}
      </div></fieldset>
      ${isSection ? `<button type="button" class="editor-reset" data-action="reset">Reset entire page…</button>` : ""}
    `;
    for (const control of host.querySelectorAll("[data-prop]")) {
      const prop = control.dataset.prop;
      if (["fontFamily", "textAlign", "objectFit"].includes(prop) && selected.style[prop]) control.value = selected.style[prop];
      control.addEventListener(prop === "opacity" ? "input" : "change", () => changeProperty(prop, control));
    }
    host.querySelectorAll("[data-element-action]").forEach((button) => button.addEventListener("click", () => elementAction(button.dataset.elementAction)));
  }

  function changeProperty(prop, control) {
    if (prop === "text" && selected.innerText.trim() === control.value.trim()) return;
    capture();
    const image = selected.matches("img") ? selected : selected.querySelector("img");
    if (prop === "text") selected.textContent = control.value;
    else if (prop === "imageSrc" && image) image.src = control.value;
    else if (prop === "objectFit" && image) image.style.objectFit = control.value;
    else if (prop === "objectPosition" && image) image.style.objectPosition = control.value;
    else if (prop === "imageFile" && image && control.files?.[0]) {
      if (control.files[0].size > 1_500_000) { status("Choose an image under 1.5 MB for reliable browser saving"); control.value = ""; return; }
      const reader = new FileReader();
      reader.onload = () => { image.src = reader.result; status("Image replaced locally"); };
      reader.readAsDataURL(control.files[0]);
    } else if (["translateX", "translateY"].includes(prop)) {
      const current = readTranslate(selected);
      const x = prop === "translateX" ? Number(control.value) || 0 : current.x;
      const y = prop === "translateY" ? Number(control.value) || 0 : current.y;
      selected.style.translate = `${x}px ${y}px`;
    } else selected.style[prop] = control.value;
    status("Change applied — Save to keep it");
  }

  function elementAction(action) {
    if (!selected) return;
    capture();
    if (action === "toggle") selected.hidden = !selected.hidden;
    if (action === "move-up" && selected.previousElementSibling) selected.parentElement.insertBefore(selected, selected.previousElementSibling);
    if (action === "move-down" && selected.nextElementSibling) selected.parentElement.insertBefore(selected.nextElementSibling, selected);
    if (action === "reset-position") selected.style.translate = "";
    if (action === "duplicate") {
      const clone = selected.cloneNode(true);
      clone.dataset.editId = `${selected.dataset.editId}-copy-${Date.now()}`;
      clone.dataset.editLabel = `${labelFor(selected)} copy`;
      clone.dataset.editorDuplicate = "true";
      selected.after(clone);
      bindCanvasElement(clone);
      select(clone);
    }
    if (action === "delete" && selected.dataset.editorDuplicate === "true") { const next = selected.parentElement; selected.remove(); select(next); }
    refreshLayers();
    renderProperties();
  }

  function resetPage() {
    if (!confirm("Reset this editable page to its original generated design? This removes the saved browser version.")) return;
    localStorage.removeItem(storageKey);
    location.reload();
  }

  function bindCanvasElement(element) {
    element.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); select(element); });
    element.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || element.isContentEditable) return;
      event.stopPropagation();
      if (selected !== element) { select(element); return; }

      const scale = Math.max(.05, artboard.getBoundingClientRect().width / artboard.offsetWidth);
      const start = { x: event.clientX, y: event.clientY };
      const initial = readTranslate(element);
      const elementRect = element.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      let moved = false;

      const move = (moveEvent) => {
        const rawX = (moveEvent.clientX - start.x) / scale;
        const rawY = (moveEvent.clientY - start.y) / scale;
        if (!moved && Math.hypot(rawX, rawY) < 4) return;
        if (!moved) {
          capture();
          moved = true;
          dragElement = element;
          document.body.classList.add("editor-is-dragging");
          element.setPointerCapture?.(event.pointerId);
        }
        const minimumX = initial.x + (canvasRect.left - elementRect.left) / scale;
        const maximumX = initial.x + (canvasRect.right - elementRect.right) / scale;
        const minimumY = initial.y + (canvasRect.top - elementRect.top) / scale;
        const maximumY = initial.y + (canvasRect.bottom - elementRect.bottom) / scale;
        const x = Math.round(Math.min(maximumX, Math.max(minimumX, initial.x + rawX)) / 8) * 8;
        const y = Math.round(Math.min(maximumY, Math.max(minimumY, initial.y + rawY)) / 8) * 8;
        element.style.translate = `${x}px ${y}px`;
      };
      const finish = () => {
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", finish);
        removeEventListener("pointercancel", finish);
        if (moved) {
          dragElement = null;
          document.body.classList.remove("editor-is-dragging");
          renderProperties();
          status("Position updated — Save to keep it");
        }
      };
      addEventListener("pointermove", move);
      addEventListener("pointerup", finish);
      addEventListener("pointercancel", finish);
    });
    if (["text", "button"].includes(element.dataset.editType)) {
      element.addEventListener("dblclick", (event) => {
        event.preventDefault(); capture(); element.contentEditable = "true"; element.focus();
        const finish = () => { element.contentEditable = "false"; renderProperties(); status("Text updated — Save to keep it"); };
        element.addEventListener("blur", finish, { once: true });
      });
    }
  }

  canvas.querySelectorAll("[data-edit-id]").forEach(bindCanvasElement);
  canvas.querySelectorAll(":scope > [data-editor-section]").forEach((section) => {
    section.addEventListener("click", (event) => { if (event.target === section) select(section); });
  });

  shell.querySelectorAll("[data-preview]").forEach((button) => button.addEventListener("click", () => {
    shell.querySelectorAll("[data-preview]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.body.dataset.editorPreview = button.dataset.preview;
    applyViewport(button.dataset.preview);
    status(`${button.textContent} preview`);
  }));

  shell.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "save") { localStorage.setItem(storageKey, JSON.stringify(serialize(canvas))); status("Saved in this browser"); }
    if (action === "undo" && history.length) { future.push(serialize(canvas)); restore(history.pop()); updateHistory(); status("Undone"); }
    if (action === "redo" && future.length) { history.push(serialize(canvas)); restore(future.pop()); updateHistory(); status("Redone"); }
    if (action === "reset") resetPage();
    if (action === "export") {
      const blob = new Blob([JSON.stringify(serialize(canvas), null, 2)], { type: "application/json" });
      const anchor = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `speakkai-version-${version}-design.json` });
      anchor.click(); setTimeout(() => URL.revokeObjectURL(anchor.href), 500); status("Design JSON exported");
    }
    if (action === "close") {
      selected?.classList.remove("editor-selected");
      document.body.classList.remove("editor-is-open");
      delete document.body.dataset.editorPreview;
      artboardObserver.disconnect();
      removeEventListener("resize", handleResize);
      stage.before(nav, canvas);
      stage.remove();
      shell.remove();
      dragElement = null;
      document.body.classList.remove("editor-is-dragging");
      document.querySelector("[data-editor-launch]")?.removeAttribute("hidden");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("editor-is-open")) return;
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault(); shell.querySelector(event.shiftKey ? '[data-action="redo"]' : '[data-action="undo"]')?.click();
    }
    if (event.key === "Delete" && !typing && selected?.dataset.editorDuplicate === "true") elementAction("delete");
  });

  refreshLayers();
  applyViewport("desktop");
  status("Editor loaded — click an element to begin");
}

function toHex(value, fallback = "#0b1020") {
  if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)") return fallback;
  if (value.startsWith("#")) return value.slice(0, 7);
  const numbers = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return numbers?.length === 3 ? `#${numbers.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("")}` : fallback;
}
