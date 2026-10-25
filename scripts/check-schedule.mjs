import assert from 'node:assert/strict';
import {occurrences,normalizeSchedule,plannedHours} from '../public/schedule.mjs';
const schedule=normalizeSchedule({frequency:'weekly',days:[1],time:'10:00',session_hours:3});
const row={program:'Schedule fixture',start_date:'2026-11-02',end_date:'2026-11-30',schedule};
assert.deepEqual(occurrences([row],'2026-11').map(event=>event.date),['2026-11-02','2026-11-09','2026-11-16','2026-11-23','2026-11-30']);
assert.deepEqual(plannedHours(row),{sessions:5,hours:15});assert.equal(occurrences([row],'2026-12').length,0);
assert.equal(occurrences([{...row,schedule:null}],'2026-11').length,2,'Without a schedule, show only course boundaries.');
assert.throws(()=>normalizeSchedule({frequency:'weekly',days:[],time:''}));assert.throws(()=>normalizeSchedule({frequency:'weekly',days:[8],time:''}));assert.throws(()=>normalizeSchedule({frequency:'once',days:[],time:'25:00'}));
console.log('PASS: weekly recurrence, month boundaries, course-only events, planned hour calculation and schedule validation.');
