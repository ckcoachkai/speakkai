import story from '../content/practice/one-object-story.json' with { type: 'json' };
import school from '../content/practice/explain-then-swap.json' with { type: 'json' };
import brief from '../content/practice/one-minute-brief.json' with { type: 'json' };

// Register a translation only when the full reviewed copy exists in practiceChinese.ts.
// This module is used at build/check time, never passed into a client island.
export const practiceSources = { 'one-object-story': story, 'explain-then-swap': school, 'one-minute-brief': brief };
export const translatedPracticeSlugs = ['one-object-story', 'explain-then-swap', 'one-minute-brief'];
export const publishedTranslatedPracticeSlugs = translatedPracticeSlugs.filter(slug => practiceSources[slug].published);
export const practiceLanguagePairs = publishedTranslatedPracticeSlugs.map(slug => [`/resources/${slug}/`, `/zh/resources/${slug}/`]);
