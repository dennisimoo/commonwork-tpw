export function normalizeSchedule(value){
 if(!value)return null;
 if(typeof value!=='object'||!['once','weekly'].includes(value.frequency))throw Error('Choose a one-time or weekly schedule.');
 const days=[...new Set(Array.isArray(value.days)?value.days:[])];if(days.some(day=>!Number.isInteger(day)||day<0||day>6))throw Error('Choose valid weekdays.');
 if(value.frequency==='weekly'&&!days.length)throw Error('Choose at least one weekday.');
 const time=String(value.time||'');if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Use a valid session time.');
 const hours=value.session_hours===''||value.session_hours==null?null:Number(value.session_hours);if(hours!==null&&(!Number.isFinite(hours)||hours<=0||hours>24))throw Error('Session length must be greater than zero and at most 24 hours.');
 return {frequency:value.frequency,days,time,session_hours:hours};
}
export function occurrences(records,month){
 const first=new Date(month+'-01T12:00:00Z');if(Number.isNaN(+first))return [];
 const end=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,1,12)),events=[];
 for(let date=new Date(first);date<end;date.setUTCDate(date.getUTCDate()+1)){
  const day=date.toISOString().slice(0,10);
  for(const row of records){
   if(!row.start_date)continue;
   if(row.schedule){
    if(day<row.start_date||row.end_date&&day>row.end_date)continue;
    if(row.schedule.frequency==='once'&&day!==row.start_date)continue;
    if(row.schedule.frequency==='weekly'&&!row.schedule.days.includes(date.getUTCDay()))continue;
    events.push({date:day,row,label:row.program,kind:'Scheduled session'});
   }else{
    if(day===row.start_date)events.push({date:day,row,label:row.program,kind:'Course starts'});
    if(day===row.end_date&&day!==row.start_date)events.push({date:day,row,label:row.program,kind:'Course ends'});
   }
  }
 }
 return events;
}
export function plannedHours(row){
 if(!row.schedule||!row.start_date||!row.end_date||!row.schedule.session_hours||row.end_date<row.start_date)return null;
 const first=new Date(row.start_date+'T12:00:00Z'),last=new Date(row.end_date+'T12:00:00Z');if(Number.isNaN(+first)||Number.isNaN(+last)||(+last-first)/86400000>1461)return null;
 let sessions=0;for(let date=new Date(first);date<=last;date.setUTCDate(date.getUTCDate()+1)){if(row.schedule.frequency==='once'){sessions=1;break;}if(row.schedule.days.includes(date.getUTCDay()))sessions++;}
 return {sessions,hours:sessions*row.schedule.session_hours};
}
