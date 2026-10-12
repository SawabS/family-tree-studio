import {mkdir,cp,rm,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['index.html','src','vendor','assets'])await cp(file,'dist/'+file,{recursive:true});
await mkdir('dist/tests');for(const file of ['responsive.html','responsive.js'])await cp('tests/'+file,'dist/tests/'+file);
await writeFile('dist/.nojekyll','');
console.log('Built allowlisted application shell. No personal dataset included.');
