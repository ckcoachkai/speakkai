import fs from 'node:fs';
const source = fs.readFileSync('tools/problem-solving-sprint/game.html', 'utf8');
const fragment = source.replace(/<style>[\s\S]*?<\/style>/, '').replace('</header>', '<button id="fullscreen" type="button" aria-pressed="false">Full screen</button></header>');
const css = fs.readFileSync('tools/problem-solving-sprint/screen.css', 'utf8');
const shell = fs.readFileSync('tools/problem-solving-sprint/screen.js', 'utf8');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Problem-solving Sprint</title><style>${css}</style></head>
<body><script>
window.openai={widgetState:null,setWidgetState:async function(state){this.widgetState=state;try{localStorage.setItem('speakkai-sprint-v2',JSON.stringify(state));}catch{}}};
try{window.openai.widgetState=JSON.parse(localStorage.getItem('speakkai-sprint-v2'));}catch{}
</script>${fragment}<script>${shell}</script></body></html>`;
fs.writeFileSync('public/games/problem-solving-sprint.html',html);
console.log('Built classroom screen from the 500-prompt source.');
