import {validateCharacter,type Character} from './character';
const url=import.meta.env.PUBLIC_DND_SUPABASE_URL || '';
const key=import.meta.env.PUBLIC_DND_SUPABASE_KEY || '';
export const cloudConfigured=Boolean(url&&key);
export type CloudSession={token:string;expires:number;userId:string};
async function request(path:string,options:RequestInit={}) {
  const response=await fetch(`${url}${path}`,{...options,headers:{apikey:key,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});
  if(!response.ok) {
    if(response.status===401||response.status===403) throw new Error('Your sign-in expired or this account cannot edit Bob. Sign in again.');
    throw new Error('Cloud request failed. Your current edits are still on screen; please try again.');
  }
  return response.status===204?null:response.json();
}
export async function readCloud() {
  const rows=await request('/rest/v1/dnd_characters?id=eq.bob&select=data,version');
  if(rows.length!==1) throw new Error('Bob’s cloud sheet is not set up yet.');
  return {character:validateCharacter(rows[0].data),version:Number(rows[0].version)};
}
export async function signIn(email:string,password:string):Promise<CloudSession> {
  const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw new Error('Could not sign in. Check your email and password, then try again.');
  const auth=await response.json();
  const rows=await request('/rest/v1/dnd_characters?id=eq.bob&select=owner_id',{headers:{Authorization:`Bearer ${auth.access_token}`}});
  if(rows[0]?.owner_id!==auth.user?.id) throw new Error('This account is not Bob’s editor.');
  return {token:auth.access_token,expires:Date.now()+auth.expires_in*1000,userId:auth.user.id};
}
export async function saveCloud(c:Character,version:number,session:CloudSession) {
  if(Date.now()>=session.expires) throw new Error('Your sign-in expired. Keep your draft open and sign in again.');
  const rows=await request(`/rest/v1/dnd_characters?id=eq.bob&version=eq.${version}&select=data,version`,{method:'PATCH',headers:{Authorization:`Bearer ${session.token}`,Prefer:'return=representation'},body:JSON.stringify({data:validateCharacter(c)})});
  if(rows.length!==1) throw new Error('Another device changed Bob. Export your draft, then reload before saving to avoid overwriting it.');
  return {character:validateCharacter(rows[0].data),version:Number(rows[0].version)};
}
export async function signOut(session:CloudSession) {
  await request('/auth/v1/logout',{method:'POST',headers:{Authorization:`Bearer ${session.token}`}});
}
