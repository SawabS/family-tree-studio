export function initChrome(){
  const root=document.documentElement;root.dataset.theme='dark';
  const left=document.querySelector('#leftPanel'),right=document.querySelector('#rightPanel'),overlay=document.querySelector('#mobileOverlay'),leftToggle=document.querySelector('#leftToggle'),rightToggle=document.querySelector('#rightToggle');
  let current=null,returnFocus=null;
  const width=()=>window.innerWidth;
  const compact=side=>side==='left'?width()<=760:width()<=1180;
  function sync(){for(const [side,panel,trigger] of [['left',left,leftToggle],['right',right,rightToggle]]){const modal=compact(side),open=current===side&&modal;panel.classList.toggle('open',open);panel.inert=modal&&!open;if(panel.inert)panel.setAttribute('inert','');else panel.removeAttribute('inert');trigger.setAttribute('aria-expanded',String(open));if(open){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true')}else{panel.removeAttribute('role');panel.removeAttribute('aria-modal')}}overlay.classList.toggle('hidden',!current||!compact(current));}
  function close({restoreFocus=true}={}){const side=current;current=null;sync();if(restoreFocus){if(returnFocus?.isConnected&&!returnFocus.closest('[inert]'))returnFocus.focus({preventScroll:true});else if(side)(side==='left'?leftToggle:rightToggle).focus({preventScroll:true})}returnFocus=null;}
  function open(side){if(!compact(side))return;returnFocus=document.activeElement;current=side;sync();document.querySelector(side==='left'?'#closeLeft':'#closeRight').focus({preventScroll:true});}
  function toggle(side){current===side?close():open(side)}
  document.addEventListener('keydown',e=>{if(!current||!compact(current)||document.querySelector('dialog[open]'))return;if(e.key==='Escape'){e.preventDefault();close();return}if(e.key!=='Tab')return;const panel=current==='left'?left:right,items=[...panel.querySelectorAll('button:not([disabled]),input:not([type="file"]),textarea,select,a[href],[tabindex="0"]')].filter(el=>!el.hidden&&el.getClientRects().length);if(!items.length)return;const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
  function viewport(){root.style.setProperty('--app-height',(window.visualViewport?.height||window.innerHeight)+'px');if(current&&!compact(current))current=null;sync()}
  window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);viewport();
  overlay.onclick=()=>close();document.querySelector('#closeLeft').onclick=()=>close();document.querySelector('#closeRight').onclick=()=>close();
  return {open,close,toggle};
}
