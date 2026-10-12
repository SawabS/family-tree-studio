// Keep the actual input, caret and IME session intact while committing valid values.
export function bindProfileField(el,{getValue,setValue,validate,checkpoint,onCommit,onInvalid}){
  let checkpointed=false,composing=false,lastError=null;
  const message=document.createElement('span');message.className='field-error';message.hidden=true;message.setAttribute('aria-live','polite');el.after(message);
  function clearError(){lastError=null;el.removeAttribute('aria-invalid');message.hidden=true;message.textContent=''}
  function update(){
    const value=el.value,previous=getValue();
    if(value===previous){clearError();return}
    setValue(value);
    try{validate()}catch(error){setValue(previous);lastError=error;el.setAttribute('aria-invalid','true');message.textContent=error.message;message.hidden=false;return}
    setValue(previous);
    if(!checkpointed){checkpoint();checkpointed=true}
    setValue(value);clearError();onCommit();
  }
  el.addEventListener('focus',()=>{checkpointed=false});
  el.addEventListener('compositionstart',()=>{composing=true});
  el.addEventListener('compositionend',()=>{composing=false;update()});
  el.addEventListener('input',e=>{if(!composing&&!e.isComposing)update()});
  el.addEventListener('blur',()=>{if(composing){composing=false;update()}if(lastError){el.value=getValue();onInvalid(lastError);clearError()}});
}
