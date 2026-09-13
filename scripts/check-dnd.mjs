import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Run the same TypeScript modules used by the app, without a second implementation.
const transpile=path=>ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const asUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const characterUrl=asUrl(transpile('../src/lib/dnd/character.ts'));
const model=await import(characterUrl);
const vault=await import(asUrl(transpile('../src/lib/dnd/vault.ts').replace("'./character'",JSON.stringify(characterUrl))));
const cloud=await import(asUrl(transpile('../src/lib/dnd/cloud.ts').replace("'./character'",JSON.stringify(characterUrl)).replaceAll('import.meta.env.PUBLIC_DND_SUPABASE_URL',"'https://example.supabase.co'").replaceAll('import.meta.env.PUBLIC_DND_SUPABASE_KEY',"'sb_publishable_TEST'")));

test('original Bob data and 2014 Paladin calculations',()=>{
  const c=model.validateCharacter(model.seed);
  assert.equal(c.hp,6);assert.equal(c.maxHp,11);assert.equal(model.modifier(c.scores.STR),3);
  assert.equal(model.skillBonus(c,'Athletics'),5);assert.equal(model.skillBonus(c,'History'),1);
  assert.equal(model.preparedLimit(c),0);assert.deepEqual(model.slots(1),[0,0,0,0,0]);
  c.level=2;assert.equal(model.preparedLimit(c),3);assert.deepEqual(model.slots(2),[2,0,0,0,0]);
  assert.equal(model.proficiency(5),3);assert.equal(model.breathDice(6),3);
  assert.deepEqual(model.slots(20),[4,3,3,3,2]);
});
test('malformed, oversized, and inconsistent imports are rejected',()=>{
  for(const mutate of [c=>c.hp=12,c=>c.scores.STR=0,c=>c.level=21,c=>c.level=1.5,c=>c.equipment[0].quantity=-1,c=>c.proficientSkills=['invented'],c=>c.slotsUsed=[1,0,0,0,0],c=>c.notes='x'.repeat(12001),c=>c.resources[0].remaining=3,c=>c.equipment.push(c.equipment[0])]){
    const c=model.clone(model.seed);mutate(c);assert.throws(()=>model.validateCharacter(c));
  }
  assert.throws(()=>model.validateCharacter(null));assert.throws(()=>vault.parseEnvelope('{}'));
});
test('encrypted notebook survives export, reload and password unlock; wrong passwords and tampering fail',async()=>{
  const password='local-test-only-not-a-user-password';const created=await vault.createVault(model.seed,password);
  const envelope=vault.parseEnvelope(JSON.stringify(created.envelope));
  assert.ok(!JSON.stringify(envelope).includes('Dragonborn'));
  assert.deepEqual((await vault.openVault(envelope,password)).character,model.seed);
  await assert.rejects(vault.openVault(envelope,'wrong-password'),/Incorrect password/);
  const tampered={...envelope,ciphertext:(envelope.ciphertext[0]==='A'?'B':'A')+envelope.ciphertext.slice(1)};
  await assert.rejects(vault.openVault(tampered,password),/Incorrect password/);
  const changed=model.clone(model.seed);changed.hp=9;changed.notes='x'.repeat(12000);
  const updated=await vault.encrypt(changed,created.key,created.salt);
  assert.notEqual(updated.iv,envelope.iv);assert.equal((await vault.openVault(updated,password)).character.hp,9);
  await assert.rejects(vault.createVault(model.seed,'short'),/12 characters/);
});
test('cloud saves use version matching, reject conflicts and never send owner changes',async()=>{
  const original=globalThis.fetch;let request;
  try{
    globalThis.fetch=async(url,options)=>{request={url,options};return new Response(JSON.stringify([{data:model.seed,version:8}]),{status:200});};
    const session={token:'test-token',expires:Date.now()+100000,userId:'test-owner'};
    assert.equal((await cloud.saveCloud(model.seed,7,session)).version,8);
    assert.match(request.url,/version=eq.7/);assert.equal(request.options.headers.Authorization,'Bearer test-token');
    assert.deepEqual(Object.keys(JSON.parse(request.options.body)),['data']);
    globalThis.fetch=async()=>new Response('[]',{status:200});
    await assert.rejects(cloud.saveCloud(model.seed,7,session),/Another device/);
    await assert.rejects(cloud.saveCloud(model.seed,7,{...session,expires:0}),/expired/);
  }finally{globalThis.fetch=original;}
});
test('cloud login rejects an account other than the configured owner',async()=>{
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async(url)=>new Response(JSON.stringify(String(url).includes('/token')?{access_token:'test-token',expires_in:3600,user:{id:'intruder'}}:[{owner_id:'owner'}]),{status:200});
    await assert.rejects(cloud.signIn('test@example.com','test'),/not Bob’s editor/);
  }finally{globalThis.fetch=original;}
});
