import chinese from './zh.json';

const translations: Record<string, string> = chinese;
const storageKey = 'speakkai-history-language';
type Language = 'en' | 'zh-CN';

// Preserve the original DOM nodes so links, emphasis and event listeners survive
// a language switch. The English source remains readable without JavaScript.
export function initializeLanguage() {
  const chooser = document.querySelector<HTMLDialogElement>('#language-dialog')!;
  const switcher = document.querySelector<HTMLButtonElement>('#language-switch')!;
  const textNodes: { node: Text; original: string }[] = [];
  const attributes: { element: Element; name: string; original: string }[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.textContent?.trim() && !node.parentElement?.closest('script, style, svg, [data-no-translate], #viewer-caption, #timeline-count')) {
      textNodes.push({ node, original: node.textContent });
    }
  }
  document.querySelectorAll('[alt], [aria-label], [data-caption]').forEach(element => {
    if (element.closest('[data-no-translate]')) return;
    for (const name of ['alt', 'aria-label', 'data-caption']) {
      const original = element.getAttribute(name);
      if (original) attributes.push({ element, name, original });
    }
  });
  const translate = (text: string): string => {
    if (translations[text] !== undefined) return translations[text];
    if (text.startsWith('Enlarge: ')) return '放大：' + translate(text.slice(9));
    // Gallery lightbox captions combine a caption and a source credit.
    const caption = Object.keys(translations).find(key => text.startsWith(key + ' '));
    if (caption) return translations[caption] + ' ' + translate(text.slice(caption.length + 1).replace(/\.$/, ''));
    return text;
  };
  const englishTitle = document.title;
  const syncScrollLock = () => document.body.classList.toggle('viewing', Boolean(document.querySelector('dialog[open]')));
  function applyLanguage(language: Language) {
    document.documentElement.lang = language;
    for (const { node, original } of textNodes) {
      node.textContent = language === 'en' ? original : original.replace(original.trim(), translate(original.trim()));
    }
    for (const { element, name, original } of attributes) {
      element.setAttribute(name, language === 'en' ? original : translate(original));
    }
    const names: Record<string, string> = { gong: '龚雄麒', man: '满铁男', liu: '刘铁虎', all: '我们的历史' };
    document.title = language === 'en' ? englishTitle : `${names[document.body.dataset.profile || 'all']} — 家族档案 | SpeakKai`;
    const count = document.querySelectorAll('.moment:not([hidden])').length;
    document.querySelector('#timeline-count')!.textContent = language === 'en' ? `${count} moments shown` : `显示 ${count} 个时刻`;
    switcher.setAttribute('aria-label', language === 'en' ? 'Choose language' : '选择语言');
    try { sessionStorage.setItem(storageKey, language); } catch { /* Language selection also works when storage is disabled. */ }
  }
  switcher.hidden = false;
  switcher.addEventListener('click', () => { chooser.showModal(); syncScrollLock(); });
  chooser.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(button => {
    button.addEventListener('click', () => {
      applyLanguage(button.dataset.language as Language);
      chooser.close();
      switcher.focus({ preventScroll: true });
    });
  });
  chooser.addEventListener('close', syncScrollLock);
  chooser.addEventListener('cancel', () => {
    applyLanguage(document.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en');
  });
  let saved: string | null = null;
  try { saved = sessionStorage.getItem(storageKey); } catch { /* Show the chooser without storage. */ }
  if (saved === 'en' || saved === 'zh-CN') applyLanguage(saved);
  else {
    chooser.showModal();
    syncScrollLock();
  }
}
