import test from 'node:test';import assert from 'node:assert/strict';import {readFile,mkdir,writeFile} from 'node:fs/promises';import vm from 'node:vm';import {emptyTree,profileDefaults} from '../src/model.js';import {makePDF,papers} from '../src/poster.js';
test('vector PDFs embed Unicode font and correct page dimensions in all eight formats',async()=>{for(const name of ['pdf-lib','fontkit'])vm.runInThisContext(await readFile(new URL('../vendor/'+name+'.js',import.meta.url),'utf8'));const sandbox={PDFLib:globalThis.PDFLib};globalThis.fetch=async url=>({ok:true,arrayBuffer:async()=>{const bytes=await readFile(url);return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}});const view=emptyTree();view.people=[{id:'example',name:'Example Ā — ئە',gender:'unknown',parents:[],profile:profileDefaults(),position:{x:0,y:0}}];for(const paper of Object.keys(papers))for(const orientation of ['portrait','landscape']){const bytes=await makePDF(view,{paper,orientation,title:'Example poster',margin:15,font:'sans-serif',fontSize:15,scaling:'fit'});const pdf=await sandbox.PDFLib.PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),1);const size=pdf.getPage(0).getSize();let [w,h]=papers[paper];if(orientation==='landscape')[w,h]=[h,w];assert.ok(Math.abs(size.width-w*72/25.4)<.01);assert.ok(Math.abs(size.height-h*72/25.4)<.01);assert.ok(bytes.length>1000);if(process.env.PDF_QA_DIR){await mkdir(process.env.PDF_QA_DIR,{recursive:true});await writeFile(`${process.env.PDF_QA_DIR}/${paper}-${orientation}.pdf`,bytes)}}});

const jpegUrl='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const family=(extra={})=>{const t=emptyTree();const mk=(id,name,parents,y,more={})=>({id,name,gender:'female',parents,profile:{...profileDefaults(),...more},position:{x:0,y}});t.people=[mk('r','Root',[],0),mk('c','کوردستان ئەحمەد',['r'],186,extra),mk('g','Grandchild',['c'],372)];return t};
const pdfOptions={paper:'A4',orientation:'portrait',title:'Family',margin:15,font:'sans-serif',fontSize:15,scaling:'fit'};
const prepare=async()=>{for(const name of ['pdf-lib','fontkit'])if(!globalThis.PDFLib||name==='fontkit')vm.runInThisContext(await readFile(new URL('../vendor/'+name+'.js',import.meta.url),'utf8'));globalThis.fetch=async url=>({ok:true,arrayBuffer:async()=>{const bytes=await readFile(url);return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}})};
test('PDF with generations, curves and Arabic-script names builds on one page',async()=>{
  await prepare();const bytes=await makePDF(family(),pdfOptions);const pdf=await globalThis.PDFLib.PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),1);assert.ok(bytes.length>5000);
});
test('photographs enter the PDF only when requested',async()=>{
  await prepare();const tree=family({photoDataUrl:jpegUrl});
  const count=async o=>{const bytes=await makePDF(tree,{...pdfOptions,...o});const text=Buffer.from(bytes).toString('latin1');return (text.match(/\/Subtype\s*\/Image/g)||[]).length};
  assert.equal(await count({}),0);assert.ok(await count({photos:'on'})>=1);
});
test('a character that no bundled font can draw fails clearly before any page is written',async()=>{
  await prepare();const tree=family();tree.people[0].name='Root \u6F22';
  await assert.rejects(()=>makePDF(tree,pdfOptions),/cannot render/i);
});
