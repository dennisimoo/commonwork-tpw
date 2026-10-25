import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {summarizeActivity,normalizeActivity,modelImpact} from '../public/impact-core.mjs';
const data=JSON.parse(await readFile(new URL('../public/data/collective-impact.json',import.meta.url)));
const s=summarizeActivity(data.records);
assert.equal(data.records.length,36);assert.equal(data.source.excluded.length,2);
assert.equal(s.participants,1441);assert.equal(s.completions,739);assert.equal(s.hours,4552);
assert.equal(s.organizations,2);assert.equal(s.knownParticipants,35);assert.equal(s.knownHours,32);assert.equal(s.knownCompletions,31);
assert.equal(s.rateDenominator,1261);assert.equal(s.rateNumerator,739);assert.equal(s.overlapGroups.length,3);
const base={organization:'Provider',program:'Program',facility:'Facility',status:'Completed',participants:10,completions:0,program_hours:0,start_date:'2025-01-01'};
const zero=normalizeActivity(base);assert.equal(zero.completions,0);assert.equal(zero.program_hours,0);assert.equal(summarizeActivity([zero]).rate,0);
assert.equal(normalizeActivity({...base,completions:'TBD'}).completions,null);
assert.equal(summarizeActivity([{...zero,completions:null}]).rate,null);
assert.throws(()=>normalizeActivity({...base,completions:11}));assert.throws(()=>normalizeActivity({...base,participants:-1}));assert.throws(()=>normalizeActivity({...base,start_date:'2025-02-30'}));
const model=modelImpact({released:100,baseline:40,scenario:30,years:1,annualCost:21534,programCost:100000});
assert.equal(model.returns,10);assert.equal(model.costs,215340);assert.equal(model.ratio,2.1534);assert.equal(model.roi,1.1534);
assert.equal(modelImpact({released:0,baseline:40,scenario:30,years:1,annualCost:21534,programCost:0}).ratio,null);
console.log('PASS: workbook totals, sample exclusion, zero vs missing, matched completion denominator, overlap warnings, import validation and scenario formulas.');

