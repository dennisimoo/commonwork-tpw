export function numeric(value,integer=false){
  if(value==null||String(value).trim()===''||/^(tbd|unknown|n\/a|#value!)$/i.test(String(value).trim()))return null;
  const n=Number(String(value).replaceAll(',',''));
  if(!Number.isFinite(n)||n<0||(integer&&!Number.isInteger(n)))throw Error('Counts must be whole nonnegative numbers; hours must be nonnegative numbers.');
  return n;
}
const key=value=>value.toLowerCase().replace(/[^a-z0-9]/g,'');
export function normalizeActivity(row,index=0){
  const values=Object.fromEntries(Object.entries(row).map(([k,v])=>[key(k),v]));
  const pick=(...keys)=>keys.map(k=>values[key(k)]).find(v=>v!=null&&String(v).trim()!=='')??'';
  const date=(...keys)=>{const value=String(pick(...keys)).trim().slice(0,10);if(!value||/^(tbd|unknown)$/i.test(value))return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(+new Date(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error(`Row ${index+1}: use YYYY-MM-DD dates.`);return value;};
  const record={...row,organization:String(pick('organization','Organization Name')).trim(),program:String(pick('program','Program Name')).trim(),facility:String(pick('facility','CDCR Facility','CDCR Facilities')).trim(),yard:String(pick('yard')).trim(),status:String(pick('status','Schedule Status (Planned, In Progress, Completed)')).trim(),start_date:date('start_date','Start Date','activity_date','reporting_date'),end_date:date('end_date','End Date'),program_hours:numeric(pick('program_hours','Total Programming hours','total_program_hours','Course Hours (per Participant)')),participants:numeric(pick('participants','Number of Participants'),true),completions:numeric(pick('completions','Number of Participants Completed'),true),notes:String(pick('notes')).trim()};
  if(!record.organization||!record.program||!record.facility)throw Error(`Row ${index+1}: organization, program and facility are required.`);
  if(record.participants!==null&&record.completions!==null&&record.completions>record.participants)throw Error(`Row ${index+1}: completions exceed participants.`);
  if(record.start_date&&record.end_date&&record.end_date<record.start_date)throw Error(`Row ${index+1}: end date precedes start date.`);
  return record;
}
export function summarizeActivity(rows){
  const sum=field=>rows.reduce((total,row)=>total+(row[field]??0),0),known=field=>rows.filter(row=>row[field]!==null&&row[field]!==undefined).length;
  const comparable=rows.filter(row=>row.participants!=null&&row.completions!=null);
  const denominator=comparable.reduce((n,row)=>n+row.participants,0),numerator=comparable.reduce((n,row)=>n+row.completions,0);
  const groups=new Map();for(const row of rows){const k=JSON.stringify([row.organization,row.program,row.facility,row.yard,row.start_date,row.end_date]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(row);}
  return {records:rows.length,participants:sum('participants'),completions:sum('completions'),hours:sum('program_hours'),knownParticipants:known('participants'),knownCompletions:known('completions'),knownHours:known('program_hours'),rate:denominator?numerator/denominator:null,rateNumerator:numerator,rateDenominator:denominator,comparable:comparable.length,organizations:new Set(rows.map(r=>r.organization)).size,facilities:new Set(rows.map(r=>r.facility)).size,programs:new Set(rows.map(r=>r.program)).size,overlapGroups:[...groups.values()].filter(group=>group.length>1)};
}
export function modelImpact({released,baseline,scenario,years,annualCost,programCost}){
  if(![released,baseline,scenario,years,annualCost].every(Number.isFinite)||released<0||!Number.isInteger(released)||baseline<0||baseline>100||scenario<0||scenario>100||years<0||annualCost<0||programCost!==null&&(!Number.isFinite(programCost)||programCost<0))throw Error('Enter valid nonnegative assumptions; rates must be 0–100%.');
  const returns=released*(baseline-scenario)/100,avoidedYears=returns*years,costs=avoidedYears*annualCost;
  return {returns,years:avoidedYears,costs,ratio:programCost>0?costs/programCost:null,roi:programCost>0?(costs-programCost)/programCost:null};
}
