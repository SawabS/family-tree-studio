import test from 'node:test';import assert from 'node:assert/strict';import {plan,preview,estimateWidth} from '../src/poster.js';import {emptyTree,profileDefaults} from '../src/model.js';import {GENERATION_PALETTE} from '../src/branch.js';
const v=emptyTree();v.people=[{id:'x',name:'Example <record>',gender:'unknown',parents:[],profile:profileDefaults(),position:{x:-300,y:-200}}];
const options={paper:'A4',orientation:'portrait',margin:15,fontSize:15,scaling:'fit',scale:100,font:'sans-serif',title:'Private <title>'};
test('all eight formats fit a single page with correct ISO geometry',()=>{for(const paper of ['A1','A2','A3','A4'])for(const orientation of ['portrait','landscape']){const p=plan(v,{...options,paper,orientation});assert.equal(p.count,1);assert.ok(orientation==='portrait'?p.h>p.w:p.w>p.h)}});
test('tiled scaling creates multiple pages',()=>{const tree=structuredClone(v);tree.people[0].position.x=0;tree.people.push({...tree.people[0],id:'y',position:{x:3000,y:2000}});assert.ok(plan(tree,{...options,scaling:'tiles'}).count>1)});
test('preview escapes private text and clips all page content',()=>{const r=preview(v,options);assert.ok(r.pages[0].includes('Private &lt;title&gt;'));assert.ok(r.pages[0].includes('clipPath'));assert.ok(!r.pages[0].includes('Example <record>'))});
test('invalid margins and excessive pagination are rejected',()=>{assert.throws(()=>plan(v,{...options,margin:NaN}));const tree=structuredClone(v);tree.people.push({...tree.people[0],id:'y',position:{x:100000,y:100000}});assert.throws(()=>plan(tree,{...options,scaling:'tiles'}),/100 pages/)});

const jpeg='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const lineage=()=>{const t=emptyTree();const mk=(id,name,parents,x,y,extra={})=>({id,name,gender:'female',parents,profile:{...profileDefaults(),...extra},position:{x,y}});t.people=[mk('r','Root Person',[],0,0),mk('c','Child Person',['r'],0,186,{photoDataUrl:jpeg,birthDate:'1980-01-01',deathDate:'2040-12-31'}),mk('g','Grandchild',['c'],0,372)];t.relationships=[{id:'k1',type:'adoptive',person1:'r',person2:'c'}];return t};
test('poster cards use the same generation colours, rounded shape, avatar and caption as the editor',()=>{
  const page=preview(lineage(),options).pages[0];
  for(const colour of [GENERATION_PALETTE[0].bg,GENERATION_PALETTE[1].bg,GENERATION_PALETTE[2].bg])assert.ok(page.includes(`fill="${colour}"`),'missing '+colour);
  assert.ok(page.includes('rx="16"')&&page.includes('rx="13"'),'rounded cards and avatars');
  assert.ok(page.includes('>R</text>'),'initial inside the avatar');
  assert.ok(page.includes('female · 1 children'),'caption text identical to the card on screen');
  assert.ok(/<path d="M97 86 C97 \d+ 97 \d+ 97 186"[^>]*stroke-dasharray="6 4"/.test(page),'adoptive link is a dashed curve');
  assert.ok(!page.includes('<polyline'),'no straight elbow lines remain');
});
test('long date ranges fall back to years so they fit the card',()=>{
  const page=preview(lineage(),options).pages[0];assert.ok(page.includes('1980 – 2040')&&!page.includes('1980-01-01 – 2040-12-31'));
});
test('photographs are left out of posters unless the owner opts in, and only JPEG avatars are used',()=>{
  const tree=lineage();
  assert.ok(!preview(tree,options).pages[0].includes('<image'));
  const withPhoto=preview(tree,{...options,photos:'on'}).pages[0];assert.ok(withPhoto.includes('<image')&&withPhoto.includes('clip-path="url(#avatar'));
  tree.people[1].profile.photoDataUrl='data:image/png;base64,AAAA';assert.ok(!preview(tree,{...options,photos:'on'}).pages[0].includes('<image'));
});
test('tiled pages only contain the cards and lines that can appear on them',()=>{
  const tree=structuredClone(v);tree.people[0].position.x=0;tree.people.push({...tree.people[0],id:'far',name:'Far card',position:{x:3000,y:0}});
  const pages=preview(tree,{...options,scaling:'tiles'}).pages;assert.ok(pages.length>1);
  assert.ok(pages[0].includes('Example')&&!pages[0].includes('Far'));assert.ok(pages.at(-1).includes('Far')&&!pages.at(-1).includes('Example'));assert.ok(pages.slice(1,-1).every(page=>!page.includes('Example')&&!page.includes('Far')),'empty middle pages carry no cards');
});
test('long names wrap and are shortened instead of overflowing the card',()=>{
  const tree=lineage();tree.people[0].name='Supercalifragilisticexpialidocious Wolfeschlegelsteinhausenbergerdorff Extraordinarily Long Name';
  const page=preview(tree,options).pages[0];assert.ok(page.includes('…'));
  assert.ok(estimateWidth('Child Person',13,true)>0);
});
