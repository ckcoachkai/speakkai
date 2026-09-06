export const DEFAULT_FILLERS = ["um", "uh", "ah", "ugh", "erm", "er"];
export const OPTIONAL_FILLERS = [
  "like",
  "you know",
  "I mean",
  "basically",
  "actually",
  "so",
];
export type Match = { word: string; start: number; end: number };
const sounds: Record<string, RegExp> = {
  um: /^u+m+$/,
  uh: /^u+h+$/,
  ah: /^a+h+$/,
  ugh: /^u+g+h+$/,
  erm: /^e+r+m+$/,
  er: /^e+r+$/,
};
export function findFillers(text: string, selected: string[]): Match[] {
  const tokens = Array.from(
    text.toLowerCase().matchAll(/[a-z]+(?:['’][a-z]+)?/g),
  );
  const choices = selected
    .map((word) => ({ word, tokens: word.toLowerCase().split(/\s+/) }))
    .sort((a, b) => b.tokens.length - a.tokens.length);
  const matches: Match[] = [];
  for (let i = 0; i < tokens.length; i++) {
    for (const choice of choices) {
      if (
        choice.tokens.every(
          (token, j) =>
            tokens[i + j] &&
            (j === 0 && sounds[token] && choice.tokens.length === 1
              ? sounds[token].test(tokens[i + j][0])
              : token === tokens[i + j][0]),
        )
      ) {
        const last = tokens[i + choice.tokens.length - 1];
        matches.push({
          word: choice.word,
          start: tokens[i].index!,
          end: last.index! + last[0].length,
        });
        i += choice.tokens.length - 1;
        break;
      }
    }
  }
  return matches;
}
