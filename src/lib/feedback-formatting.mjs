// Keep source reports unchanged; share label detection between the page and clipboard.
export function feedbackLabelParts(text) {
  const pattern = /^([\t ]*(?:[✓✅→➜◆🔎💬•]\uFE0F?[\t ]*)?)([\p{L}\p{M}][\p{L}\p{M}\p{N}\t /&’'()–-]{0,69})([:：])(?!\/\/)/gmu;
  const parts = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index + match[1].length;
    if (start > offset) parts.push({text: text.slice(offset, start), label: false});
    parts.push({text: match[2] + match[3], label: true});
    offset = match.index + match[0].length;
  }
  if (offset < text.length) parts.push({text: text.slice(offset), label: false});
  return parts;
}

export function unicodeFeedbackLabel(text) {
  // Mathematical bold italic Latin letters survive plain-text clipboard transfer.
  const styled = text.replace(/[A-Za-z]/g, letter => String.fromCodePoint(
    letter >= 'a' ? 0x1d482 + letter.charCodeAt(0) - 97 : 0x1d468 + letter.charCodeAt(0) - 65
  ));
  // Unicode has no bold/italic CJK alphabet. Brackets preserve emphasis in plain text.
  return /[\u3400-\u9fff]/u.test(styled)
    ? styled.replace(/^(.*?)([:：]?)$/u, '【$1】$2') : styled;
}

export function feedbackCopyContent(text) {
  return feedbackLabelParts(text).map(part => part.label ? unicodeFeedbackLabel(part.text) : part.text).join('');
}
