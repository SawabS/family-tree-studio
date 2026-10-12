import {marked} from '../vendor/marked.js';
export function markdown(source){
  const doc=new DOMParser().parseFromString(marked.parse(source,{async:false}), 'text/html');
  const allowed=new Set(['P','BR','STRONG','EM','DEL','H1','H2','H3','H4','H5','H6','UL','OL','LI','BLOCKQUOTE','PRE','CODE','A','HR','TABLE','THEAD','TBODY','TR','TH','TD']);
  for(const el of [...doc.body.querySelectorAll('*')]){
    if(!allowed.has(el.tagName)){el.replaceWith(doc.createTextNode(el.textContent||''));continue}
    const href=el.tagName==='A'?el.getAttribute('href'):null;
    for(const a of [...el.attributes])el.removeAttribute(a.name);
    if(href&&/^https?:\/\//i.test(href)){el.setAttribute('href',href);el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer')}
  }
  return doc.body.innerHTML;
}
