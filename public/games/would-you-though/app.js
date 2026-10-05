(()=>{
 'use strict';
 const $=id=>document.getElementById(id),source=window.QUESTIONS;
 const category=$('category');
 for(const name of new Set(source.map(q=>q.category))){
   const option=document.createElement('option');option.value=name;
   option.textContent=name+' · '+source.filter(q=>q.category===name).length;category.append(option);
 }
 let deck=[],position=0;
 function shuffle(){
   const last=deck[position]?.id;
   deck=source.filter(q=>!category.value||q.category===category.value);
   for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
   // Starting a fresh round should not immediately repeat the last card.
   if(deck.length>1&&deck[0].id===last)[deck[0],deck[1]]=[deck[1],deck[0]];
   position=0;
 }
 function draw(focus=false){
   const q=deck[position];
   $('question').textContent=q.text;$('number').textContent=q.id.toUpperCase();$('topic').textContent=q.category;
   $('progress').textContent=String(position+1).padStart(2,'0')+' / '+deck.length;
   $('previous').disabled=position===0;
   $('next').innerHTML=position===deck.length-1?'Start again <span>↻</span>':'Next question <span>→</span>';
   $('followup').textContent=q.followup;$('followup').hidden=true;
   $('followupToggle').textContent='+ Follow-up';$('followupToggle').setAttribute('aria-expanded','false');
   const area=document.querySelector('.question-main');area.classList.remove('arrive');void area.offsetWidth;area.classList.add('arrive');
   if(focus)$('question').focus({preventScroll:true});
 }
 function next(){if(position===deck.length-1)shuffle();else position++;draw(true);}
 function previous(){if(position>0){position--;draw(true);}}
 $('next').onclick=next;$('previous').onclick=previous;
 category.onchange=()=>{shuffle();draw();};
 $('followupToggle').onclick=()=>{const open=$('followup').hidden;$('followup').hidden=!open;$('followupToggle').textContent=open?'− Close follow-up':'+ Follow-up';$('followupToggle').setAttribute('aria-expanded',String(open));};
 document.addEventListener('keydown',event=>{
   if(event.altKey||event.ctrlKey||event.metaKey||event.repeat||event.target.closest('button,a,input,select,textarea,[contenteditable]'))return;
   if(event.key===' '||event.key==='ArrowRight'){event.preventDefault();next();}
   if(event.key==='ArrowLeft'){event.preventDefault();previous();}
 });
 shuffle();draw();
})();
