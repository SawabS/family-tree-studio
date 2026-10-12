export const VERSION = 2;
export const kinds = ['parent-unknown','biological','adoptive','guardian','other-parent','partner','spouse'];
export const isParent = r => !['partner','spouse'].includes(r.type);
export const profileDefaults = () => ({preferredName:'',birthDate:'',deathDate:'',birthPlace:'',residence:'',occupation:'',email:'',phone:'',biographyMarkdown:'',notesMarkdown:'',customFields:{},photoDataUrl:'',attachments:[],references:[]});
export function emptyTree() { return {schemaVersion:1,treeId:crypto.randomUUID(),title:'My family tree',people:[],relationships:[],settings:{cardWidth:194,cardHeight:86}}; }
const bad = message => {throw new Error(message)};
const validDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value};
const text = v => typeof v === 'string';
const safeID = v => text(v) && v.length > 0 && v.length <= 160 && !['__proto__','prototype','constructor'].includes(v);
export function validate(doc) {
  if (!doc || doc.schemaVersion !== VERSION || !safeID(doc.treeId) || !text(doc.title)) bad('Unsupported or incomplete tree');
  if (!doc.people || Array.isArray(doc.people) || !doc.relationships || Array.isArray(doc.relationships)) bad('Expected normalized record maps');
  if(Object.keys(doc.people).length>20000) bad('A tree may contain at most 20,000 people');
  const parents=new Map(Object.keys(doc.people).map(id=>[id,[]]));
  for(const [id,p] of Object.entries(doc.people)) {
    if(!safeID(id)||p.id!==id||!text(p.name)||!p.name.trim()||p.name.length>500) bad('Invalid person identifier or name');
    if(!['male','female','other','unknown'].includes(p.gender)) bad('Invalid gender');
    if(!p.position||!Number.isFinite(p.position.x)||!Number.isFinite(p.position.y)) bad('Invalid card position');
    if(!p.profile||typeof p.profile!=='object') bad('Invalid profile');
    for(const key of Object.keys(profileDefaults()).filter(k=>!['customFields','attachments','references'].includes(k))) if(!text(p.profile[key])) bad('Invalid profile text: '+key);
    const photo=p.profile.photoDataUrl;
    if(photo&&!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(photo)) bad('Photographs must be raster image data');
    if(!p.profile.customFields||Array.isArray(p.profile.customFields)||typeof p.profile.customFields!=='object'||Object.entries(p.profile.customFields).some(([k,v])=>!safeID(k)||!text(v))) bad('Invalid custom fields');
    if(!Array.isArray(p.profile.references)||p.profile.references.some(r=>!text(r.label)||!text(r.url)||!/^https?:\/\//i.test(r.url))) bad('References require HTTP or HTTPS URLs');
    if(!Array.isArray(p.profile.attachments)) bad('Invalid attachments');
    const assetIDs=new Set();
    for(const a of p.profile.attachments){if(!safeID(a.id)||assetIDs.has(a.id)||!text(a.name)||!text(a.dataUrl)||!/^data:[\w.+/-]+;base64,[A-Za-z0-9+/=]*$/.test(a.dataUrl))bad('Invalid attachment');assetIDs.add(a.id)}
    for(const key of ['birthDate','deathDate']) if(p.profile[key]&&!validDate(p.profile[key]))bad('Use ISO dates (YYYY-MM-DD)');
    if(p.profile.birthDate&&p.profile.deathDate&&p.profile.birthDate>p.profile.deathDate)bad('Death cannot precede birth');
  }
  const seen=new Set();
  for(const [id,r] of Object.entries(doc.relationships)) {
    if(!safeID(id)||r.id!==id||!kinds.includes(r.type)||!parents.has(r.person1)||!parents.has(r.person2)||r.person1===r.person2) bad('Invalid relationship');
    const endpoints=isParent(r)?[r.person1,r.person2]:[r.person1,r.person2].sort();
    const key=(isParent(r)?'parent':r.type)+':'+JSON.stringify(endpoints);
    if(seen.has(key))bad('Duplicate relationship');seen.add(key);
    if(isParent(r))parents.get(r.person2).push(r.person1);
  }
  // Kahn traversal avoids call-stack overflow for deep imported trees.
  const children=new Map([...parents.keys()].map(id=>[id,[]])),degrees=new Map();
  for(const [id,list] of parents){degrees.set(id,list.length);for(const parent of list)children.get(parent).push(id)}
  const queue=[...degrees].filter(([,n])=>!n).map(([id])=>id);let visited=0;
  for(let head=0;head<queue.length;head++){const id=queue[head];visited++;for(const child of children.get(id)){degrees.set(child,degrees.get(child)-1);if(!degrees.get(child))queue.push(child)}}
  if(visited!==parents.size)bad('Ancestry cycle detected');
  return doc;
}
export function normalize(view) {
  const people=Object.fromEntries(view.people.map(p=>[p.id,{id:p.id,name:p.name,gender:p.gender||'unknown',profile:{...profileDefaults(),...p.profile},position:{...p.position}}]));
  const ids=new Set();for(const p of view.people){if(ids.has(p.id))bad('Duplicate person');ids.add(p.id);if(!Array.isArray(p.parents)||new Set(p.parents).size!==p.parents.length)bad('Duplicate or malformed parent links')}
  const relations=[...(view.relationships||[])];
  const relationIDs=new Set();for(const r of relations){if(relationIDs.has(r.id))bad('Duplicate relationship identifier');relationIDs.add(r.id)}
  for(const p of view.people)for(const parent of p.parents||[])if(!relations.some(r=>isParent(r)&&r.person1===parent&&r.person2===p.id))relations.push({id:crypto.randomUUID(),type:'parent-unknown',person1:parent,person2:p.id});
  return validate({schemaVersion:VERSION,treeId:view.treeId,title:view.title,people,relationships:Object.fromEntries(relations.map(r=>[r.id,r])),settings:{...view.settings}});
}
export function project(doc) {
  validate(doc);const relations=Object.values(doc.relationships),parents=new Map(Object.keys(doc.people).map(id=>[id,[]]));
  for(const r of relations)if(isParent(r))parents.get(r.person2).push(r.person1);
  return {schemaVersion:1,treeId:doc.treeId,title:doc.title,people:Object.values(doc.people).map(p=>({...structuredClone(p),parents:parents.get(p.id)})),relationships:structuredClone(relations),settings:{...doc.settings}};
}
export function migrate(input) {
  if(input?.schemaVersion===VERSION)return validate(structuredClone(input));
  if(input?.schemaVersion!==1||!Array.isArray(input.people)||!Array.isArray(input.relationships))bad('Unsupported backup schema');
  const ids=new Set();for(const p of input.people){if(!safeID(p.id)||ids.has(p.id)||!Array.isArray(p.parents))bad('Duplicate or malformed person');ids.add(p.id)}
  const rids=new Set();for(const r of input.relationships){if(!safeID(r.id)||rids.has(r.id))bad('Duplicate relationship identifier');rids.add(r.id)}
  return normalize(structuredClone(input));
}
export function arrange(view) {
  normalize(view);
  const byID=new Map(view.people.map(p=>[p.id,p])),children=new Map(view.people.map(p=>[p.id,[]])),remaining=new Map(view.people.map(p=>[p.id,p.parents.length])),depth=new Map(view.people.map(p=>[p.id,0]));
  for(const p of view.people)for(const id of p.parents)children.get(id).push(p.id);
  const q=view.people.filter(p=>!p.parents.length).map(p=>p.id);
  for(let i=0;i<q.length;i++)for(const id of children.get(q[i])){depth.set(id,Math.max(depth.get(id),depth.get(q[i])+1));remaining.set(id,remaining.get(id)-1);if(!remaining.get(id))q.push(id)}
  const rows=new Map();for(const id of q){const d=depth.get(id);if(!rows.has(d))rows.set(d,[]);rows.get(d).push(byID.get(id))}
  const width=Math.max(194,...[...rows.values()].map(row=>row.length*254-60));
  for(const [d,row] of rows){row.sort((a,b)=>{const center=p=>p.parents.length?p.parents.reduce((s,id)=>s+byID.get(id).position.x,0)/p.parents.length:0;return center(a)-center(b)});row.forEach((p,i)=>p.position={x:(width-(row.length*254-60))/2+i*254,y:d*186})}
}
