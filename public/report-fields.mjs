import {validDate} from './core.mjs';
export const coreLabels={program:'Program name',facility:'CDCR facility',yard:'Yard',status:'Schedule status',start_date:'Start date',end_date:'End date',program_hours:'Course hours per participant',participants:'Participants who began',completions:'Participants who completed',data_basis:'Count accuracy',notes:'Notes'};
export const defaultFields=()=>({version:0,fields:Object.entries(coreLabels).map(([id,label])=>({id,label,type:'core',active:true,required:false}))});
export function validateFields(input,previous){
 if(!Array.isArray(input)||input.length>40)throw Error('Use at most 40 fields.');
 const ids=new Set();const fields=input.map(f=>{
  if(!f||typeof f.id!=='string'||!(/^(?:[a-z][a-z_]*|custom_[a-f0-9-]{36})$/).test(f.id)||ids.has(f.id))throw Error('Field references must be unique.');ids.add(f.id);
  const old=previous.fields.find(p=>p.id===f.id),core=Object.hasOwn(coreLabels,f.id),label=typeof f.label==='string'?f.label.trim():'';
  if(!label||label.length>80)throw Error('Field names need 1–80 characters.');
  if(!core&&!old&&!/^custom_[a-f0-9-]{36}$/.test(f.id))throw Error('Invalid custom field reference.');
  if(!core&&!['text','number','date'].includes(f.type))throw Error('Choose text, number or date.');
  if(old&&old.type!==f.type)throw Error('Create a new field to change its type. Existing values are retained.');
  if(core&&(f.type!=='core'||f.active===false))throw Error('Standard reporting fields can be renamed but cannot be removed.');
  return {id:f.id,label,type:core?'core':f.type,active:f.active!==false,required:!core&&f.required===true};
 });
 for(const f of previous.fields)if(!ids.has(f.id))throw Error('Remove fields by archiving them so saved values are retained.');
 return fields;
}
export function customValues(row,config,submit=false){
 const values=row.custom_fields??{};if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Invalid additional fields.');
 const result={};for(const f of config.fields.filter(f=>f.type!=='core'&&f.active)){
  const value=typeof values[f.id]==='string'?values[f.id].trim():values[f.id];if(value===null||value===undefined||value===''){if(submit&&f.active&&f.required)throw Error(`${f.label} is required.`);continue;}
  if(f.type==='number'){if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error(`${f.label} needs a non-negative number.`);}
  else if(typeof value!=='string'||value.length>2000||(f.type==='date'&&!validDate(value)))throw Error(`${f.label} needs a valid ${f.type==='date'?'date':'text value (up to 2,000 characters)'}.`);
  result[f.id]=value;
 }return result;
}
const normalized=value=>String(value??'').trim().replace(/\s+/g,' ').toLowerCase();
export function duplicateMatches(incoming,existing){
 const key=r=>r.start_date&&r.end_date?[r.program,r.facility,r.yard,r.start_date,r.end_date].map(normalized).map(v=>JSON.stringify(v)).join('|'):null;
 const combined=[...existing.filter(r=>!incoming.includes(r)&&!incoming.some(i=>i.id&&i.id===r.id)),...incoming];
 return incoming.flatMap((r,index)=>{const k=key(r);const matches=k?combined.filter(other=>other!==r&&key(other)===k):[];return matches.length?[{index,program:r.program,facility:r.facility,yard:r.yard||'',start_date:r.start_date,end_date:r.end_date,matches:matches.length}]:[];});
}
export function exportActivityRows(rows,config=defaultFields()){
 const keys=['organization','program','facility','yard','status','start_date','end_date','program_hours','participants','completions','notes','data_basis','program_hours_max','participants_max','completions_max','source_sheet','source_row','duplicate_review'];
 return rows.map(r=>({...Object.fromEntries(keys.map(k=>[k,r[k]??''])),program_year:r.start_date?Number(r.start_date.slice(0,4)):'',total_participant_hours_delivered:r.program_hours!=null&&r.program_hours!==''&&r.completions!=null&&r.completions!==''?Number(r.program_hours)*Number(r.completions):'',...Object.fromEntries(config.fields.filter(f=>f.type!=='core').map(f=>[`${f.label} [${f.id}]`,r.custom_fields?.[f.id]??'']))}));
}
let demoConfig=defaultFields();
export const resetDemoFields=()=>{demoConfig=defaultFields();};
export async function getFields(user){if(user?.role==='demo')return structuredClone(demoConfig);const response=await fetch('/api/fields');if(!response.ok)throw Error('Could not load reporting fields.');return response.json();}
export async function saveFields(user,config){if(user.role==='demo'){demoConfig={version:demoConfig.version+1,fields:validateFields(config.fields,demoConfig)};return structuredClone(demoConfig);}const response=await fetch('/api/fields',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(config)});const result=await response.json();if(!response.ok)throw Error(result.error);return result;}
