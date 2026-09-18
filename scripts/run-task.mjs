// Run collector/tests on Node 24 using TypeScript from the locked dependencies.
import ts from 'typescript';
import fs from 'node:fs/promises';
import path from 'node:path';
import { registerHooks } from 'node:module';
registerHooks({
 resolve(specifier,context,next){
   if(specifier.startsWith('.') && context.parentURL?.endsWith('.ts') && !path.extname(specifier))specifier+='.ts';
   return next(specifier,context);
 },
 load(url,context,next){
   const result=next(url,context);
   if(url.endsWith('.ts'))return {...result,format:'module',source:ts.transpileModule(String(result.source),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};
   return result;
 }
});
const task=process.argv[2];if(!['fetch','test'].includes(task))throw Error('Expected fetch or test');
await import(new URL(task==='fetch'?'./fetch-menus.ts':'../tests/menus.test.ts',import.meta.url).href);
