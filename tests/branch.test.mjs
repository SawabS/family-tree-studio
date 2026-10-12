import test from 'node:test';import assert from 'node:assert/strict';
import {GENERATION_PALETTE,paletteFor,generations,branchOf,childMap,flowPlan,edgeDelay,arrivalDelay,flowCSS,FLOW,lineStyle,parentCurve,mixHex,cardBorder,avatarBorder,hexToRgb01} from '../src/branch.js';
const person=(id,parents=[],x=0,y=0)=>({id,name:id,parents,position:{x,y}});
const family=()=>({people:[person('a'),person('b'),person('c',['a','b']),person('d',['a']),person('e',['c','d']),person('f',['e']),person('x'),person('y',['x'])]});
const luminance=hex=>{const [r,g,b]=hexToRgb01(hex).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b};
const contrast=(a,b)=>{const [x,y]=[luminance(a),luminance(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};

test('generation depth is the longest chain of parents and shared children sit below every parent',()=>{
  const depth=generations(family());
  assert.deepEqual(['a','b','c','d','e','f','x','y'].map(id=>depth.get(id)),[0,0,1,1,2,3,0,1]);
});
test('selecting a parent selects every descendant once, whatever the parent link type',()=>{
  const view=family(),branch=branchOf(view,'a');
  assert.deepEqual([...branch.ids].sort(),['a','c','d','e','f']);
  assert.equal(branch.levels.get('a'),0);assert.equal(branch.levels.get('c'),1);assert.equal(branch.levels.get('e'),2);assert.equal(branch.levels.get('f'),3);
  assert.equal(branch.depth,3);
  assert.equal(branch.edges,5,'a>c a>d c>e d>e e>f');
  assert.ok(!branch.ids.has('b'),'the other parent of a shared child is not part of the branch');
  assert.deepEqual([...branchOf(view,'f').ids],['f']);
  assert.equal(branchOf(view,'f').depth,0);
  assert.equal(branchOf(view,'missing').ids.size,0);
});
test('branch and generation helpers survive a 5,000 generation chain without recursion',()=>{
  const people=[];for(let i=0;i<5000;i++)people.push(person('p'+i,i?['p'+(i-1)]:[]));
  const view={people};assert.equal(generations(view).get('p4999'),4999);
  const branch=branchOf(view,'p0');assert.equal(branch.ids.size,5000);assert.equal(branch.depth,4999);
});
test('the palette gets lighter with every generation and keeps readable text on every card',()=>{
  const lum=GENERATION_PALETTE.map(c=>luminance(c.bg));
  for(let i=1;i<lum.length;i++)assert.ok(lum[i]>lum[i-1],'generation '+i+' must be lighter than '+(i-1));
  for(const [i,c] of GENERATION_PALETTE.entries()){
    assert.ok(contrast(c.ink,c.bg)>=4.5,`name text on generation ${i}`);
    assert.ok(contrast(c.muted,c.bg)>=4.5,`caption text on generation ${i}`);
    assert.ok(contrast(c.ink,c.avatar)>=4.5,`initial on generation ${i}`);
    const [r,g,b]=hexToRgb01(c.bg);assert.ok(g>r&&g>b,'every card is a shade of green');
  }
  assert.equal(paletteFor(0),GENERATION_PALETTE[0]);
  assert.equal(paletteFor(10_000),GENERATION_PALETTE.at(-1),'deeper generations keep the lightest tone');
  assert.equal(paletteFor(-3),GENERATION_PALETTE[0]);assert.equal(paletteFor(undefined),GENERATION_PALETTE[0]);
});
test('colour helpers mix predictably',()=>{
  assert.equal(mixHex('#000000','#ffffff',0),'#000000');assert.equal(mixHex('#000000','#ffffff',1),'#ffffff');assert.equal(mixHex('#000000','#ffffff',.5),'#808080');
  const c=GENERATION_PALETTE[2];assert.match(cardBorder(c),/^#[0-9a-f]{6}$/);assert.match(avatarBorder(c),/^#[0-9a-f]{6}$/);
});
test('energy flow moves one generation per slot and rests before repeating',()=>{
  const plan=flowPlan(3);
  assert.equal(plan.steps,3);assert.ok(Math.abs(plan.cycle-(3+FLOW.rest)*FLOW.slot)<1e-9);
  // A negative delay puts an edge part-way through its animation. The pulse on an edge of level L begins L slots into the shared cycle.
  for(const level of [0,1,2])assert.equal(edgeDelay(plan,level,level*FLOW.slot),0,'level '+level+' starts on its own slot');
  assert.ok(edgeDelay(plan,1,0)<0&&edgeDelay(plan,1,0)>-plan.cycle);
  // Redrawing the lines later (for example while dragging a card) continues the same rhythm instead of restarting it.
  assert.ok(Math.abs(edgeDelay(plan,1,.7)-edgeDelay(plan,1,.7+plan.cycle))<1e-9);
  // A card lights up when the pulse on its incoming edge arrives, one slot after that edge started.
  for(const level of [1,2,3])assert.equal(arrivalDelay(plan,level,level*FLOW.slot),0,'level '+level+' arrives on its own slot');
  assert.ok(flowPlan(500).steps===FLOW.cap&&flowPlan(0).steps===1,'deep branches wrap their wave and empty branches stay valid');
  assert.match(flowCSS(plan),/@keyframes kin-flow[\s\S]*@keyframes kin-arrive[\s\S]*--flow-cycle:\d/);
});
test('relationship lines keep their styling and the curve is one cubic from parent to child',()=>{
  assert.equal(lineStyle('biological').dash,null);assert.ok(lineStyle('adoptive').dash);assert.ok(lineStyle('parent-unknown').dash);assert.notEqual(lineStyle('guardian').color,lineStyle('adoptive').color);
  const curve=parentCurve(person('p',[],0,0),person('c',['p'],200,186));
  assert.equal(curve.d,'M97 86 C97 136 297 136 297 186');
});
