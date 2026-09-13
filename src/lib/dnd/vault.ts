import { validateCharacter, type Character } from './character';
export const VAULT_KEY='speakkai.bob.vault.v1';
export type Envelope={format:'bob-encrypted-v1';salt:string;iv:string;ciphertext:string};
const b64=(bytes:Uint8Array)=>{let result='';for(let i=0;i<bytes.length;i+=8192)result+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(result);};
const bytes=(value:string)=>Uint8Array.from(atob(value),x=>x.charCodeAt(0));
export async function deriveKey(password:string,salt:Uint8Array<ArrayBuffer>) {
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encrypt(c:Character,key:CryptoKey,salt:string):Promise<Envelope> {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(validateCharacter(c))));
  return {format:'bob-encrypted-v1',salt,iv:b64(iv),ciphertext:b64(new Uint8Array(cipher))};
}
export function parseEnvelope(raw:string):Envelope {
  if(raw.length>1500000) throw new Error('Backup is too large.');
  const e=JSON.parse(raw);
  if(e?.format!=='bob-encrypted-v1'||typeof e.salt!=='string'||typeof e.iv!=='string'||typeof e.ciphertext!=='string'||bytes(e.salt).length!==16||bytes(e.iv).length!==12) throw new Error('Choose an encrypted Bob backup.');
  return e;
}
export async function openVault(e:Envelope,password:string) {
  const key=await deriveKey(password,bytes(e.salt));
  let raw:ArrayBuffer;
  try { raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(e.iv)},key,bytes(e.ciphertext)); }
  catch {throw new Error('Incorrect password, or the backup is damaged.');}
  return {character:validateCharacter(JSON.parse(new TextDecoder().decode(raw))),key,salt:e.salt};
}
export async function createVault(c:Character,password:string) {
  if(password.length<12) throw new Error('Use at least 12 characters for your notebook password.');
  const salt=b64(crypto.getRandomValues(new Uint8Array(16)));
  const key=await deriveKey(password,bytes(salt));
  return {envelope:await encrypt(c,key,salt),key,salt};
}
