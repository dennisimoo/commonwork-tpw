import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync,chmodSync,readdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createWorkspace} from './workspace.mjs';
// Match D1's small prepared-statement API so localhost and Workers run the same handlers.
export function createLocalWorkspace(path,seed,options={}){
 mkdirSync(dirname(path),{recursive:true,mode:0o700});const sqlite=new DatabaseSync(path);chmodSync(path,0o600);
 sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
 const alreadySeeded=sqlite.prepare("SELECT name FROM sqlite_master WHERE name='metadata'").get()&&sqlite.prepare("SELECT value FROM metadata WHERE key='seeded'").get();
 for(const name of readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort()){if(name==='0002_workbook.sql'&&alreadySeeded)continue;sqlite.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));}
 const prepare=sql=>({bind(...args){return {sql,args,first:async()=>sqlite.prepare(sql).get(...args)||null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>sqlite.prepare(sql).run(...args)};}});
 const db={prepare,async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>sqlite.prepare(s.sql).run(...s.args));sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 return {...createWorkspace(db,seed,{...options,databaseKind:'SQLite'}),close:()=>sqlite.close()};
}
