const formats=new Set(['image/png','image/jpeg','image/webp','image/gif']);
export const MAX_PHOTO_BYTES=15*1024*1024;
export function photoDimensions(width,height){if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('This image has invalid dimensions');const ratio=Math.min(1,512/Math.max(width,height));return{width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))}}
export async function preparePhoto(file,options={}){
  if(!formats.has(file.type))throw Error('Choose a PNG, JPEG, WebP, or GIF image');
  if(!file.size||file.size>MAX_PHOTO_BYTES)throw Error('Choose a photograph smaller than 15 MB');
  const decode=options.decode||decodeImage,createCanvas=options.createCanvas||(()=>document.createElement('canvas'));
  const image=await decode(file);
  try{const size=photoDimensions(image.width,image.height),canvas=createCanvas();canvas.width=size.width;canvas.height=size.height;const context=canvas.getContext('2d');if(!context)throw Error('Image processing is unavailable in this browser');context.fillStyle='#ffffff';context.fillRect(0,0,size.width,size.height);context.drawImage(image,0,0,size.width,size.height);const data=canvas.toDataURL('image/jpeg',.88);if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data))throw Error('Could not prepare this photograph');return data}finally{image.close?.()}
}
async function decodeImage(file){
  if(typeof createImageBitmap==='function'){try{return await createImageBitmap(file)}catch{/* Fall back to the browser image decoder. */}}
  const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();return image}catch{throw Error('This file could not be read as an image')}finally{URL.revokeObjectURL(url)}
}
