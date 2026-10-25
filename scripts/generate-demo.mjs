// Generates public/data/demo-programs.json: synthetic courses for the demo workspace.
// Organizations and programs are fictional; facility names come from TPW's reference list.
// Deterministic (fixed seed), so re-running produces the same file.
import {readFile,writeFile} from 'node:fs/promises';
import {applyRanges} from '../public/impact-core.mjs';
const seed=JSON.parse(await readFile(new URL('../public/data/collective-impact.json',import.meta.url)));
let state=20261025;const rand=()=>(state=(state*1664525+1013904223)%2**32)/2**32;
const pick=list=>list[Math.floor(rand()*list.length)],between=(lo,hi)=>lo+Math.floor(rand()*(hi-lo+1));
const today='2026-10-25',iso=date=>date.toISOString().slice(0,10);
const organizations=[
 {name:'Larkspur Arts Project',programs:[['Theater Workshop',36,10],['Creative Writing Circle',24,8]],facilities:6},
 {name:'Kestrel Reentry Learning',programs:[['Financial Foundations',40,10],['Job Readiness Lab',60,14]],facilities:7},
 {name:'Willowbank Mentoring Circle',programs:[['Restorative Conversations',48,12],['Peer Mentor Training',80,20]],facilities:5}
];
const yards=['A Yard','B Yard','C Yard','D Yard','North','South','Facility C',''];
const estimateNotes=['Sessions were led by inside facilitators; participant count is estimated from the enrollment list.','Sign-in sheets were not available from the facility; counts are our best estimate.'];
const records=[];
for(const org of organizations){
 const sites=[...seed.facilities].sort(()=>rand()-.5).slice(0,org.facilities);
 for(const [program,hours,weeks] of org.programs)for(let cohort=0;cohort<8;cohort++){
  const start=new Date(Date.UTC(2024,between(0,34),between(1,25))),end=new Date(start);end.setUTCDate(end.getUTCDate()+weeks*7);
  const status=iso(start)>today?'Planned':iso(end)>today?'In Progress':'Completed';
  const participants=status==='Planned'?null:between(12,45),completions=status==='Completed'?Math.round(participants*(.5+rand()*.4)):null;
  const record={facility:pick(sites),yard:pick(yards),organization:org.name,program,status,start_date:iso(start),end_date:iso(end),program_hours:hours,participants,completions,notes:'',data_basis:'reported',program_hours_range:null,participants_range:null,completions_range:null};
  const roll=rand();
  if(status==='Completed'&&roll<.08){record.completions=null;record.notes='Completion count not yet received from the facility.';}
  else if(status==='Completed'&&roll<.16){record.data_basis='estimated';record.notes=pick(estimateNotes);}
  else if(status==='Completed'&&roll<.22)Object.assign(record,applyRanges({...record,participants_range:'26-50'}));
  records.push(record);
 }
}
records.sort((a,b)=>a.start_date.localeCompare(b.start_date)||a.organization.localeCompare(b.organization));
const source={title:'Synthetic demo data',synthetic:true,generated_by:'scripts/generate-demo.mjs',verification:'Synthetic sample data. Organizations, programs and counts are fictional; facility names come from TPW’s reference list.',excluded:[],hours_definition:'Course hours per participant: hours one person would accumulate by attending every session.',period_definition:'Whole-course totals grouped by start year; no allocation across quarters or calendar years.'};
await writeFile(new URL('../public/data/demo-programs.json',import.meta.url),JSON.stringify({source,facilities:seed.facilities,records},null,1)+'\n');
console.log(`Wrote ${records.length} synthetic courses for ${organizations.length} fictional organizations.`);
