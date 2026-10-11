// Keep modifier chords (Ctrl+S, Ctrl+W, Alt+arrows, etc.) in the flight
// controls. Never consume text editing or Escape/Tab navigation.
export function isEditing(target){
 return Boolean(target?.closest?.('input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'));
}

export function captureFlightShortcut(event,active){
 if(!active||isEditing(event.target))return false;
 const key=event.key.toLowerCase();
 if(key==='escape'||key==='tab')return false;
 const capture=event.ctrlKey||event.metaKey||event.altKey||[' ','arrowup','arrowdown','alt','home'].includes(key);
 if(capture)event.preventDefault();
 return capture;
}

// Browser-reserved chords can require Keyboard Lock in fullscreen. Escape
// stays available to leave fullscreen; an unsupported API is harmless.
const flightCodes=['KeyW','KeyS','KeyQ','KeyE','KeyA','KeyD','KeyC','KeyR','KeyV','KeyP','KeyH','KeyF','KeyM','KeyZ','KeyG','KeyJ','KeyL','KeyB','KeyX','Space','ArrowUp','ArrowDown','Home','AltLeft','AltRight','ControlLeft','ControlRight','ShiftLeft','ShiftRight'];
export async function lockFlightKeyboard(){
 if(document.fullscreenElement&&navigator.keyboard?.lock){
  try{await navigator.keyboard.lock(flightCodes);}catch{/* Keydown capture still covers ordinary browser chords. */}
 }
}
export function unlockFlightKeyboard(){navigator.keyboard?.unlock?.();}
