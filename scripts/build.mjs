import {mkdir,cp,rm,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['index.html','src','vendor'])await cp(file,'dist/'+file,{recursive:true});
await writeFile('dist/.nojekyll','');
console.log('Built allowlisted application shell. No personal dataset included.');
