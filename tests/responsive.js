const selector=document.querySelector('#size'),frame=document.querySelector('iframe');selector.onchange=()=>{const [width,height]=selector.value.split(',');frame.width=width;frame.height=height};
