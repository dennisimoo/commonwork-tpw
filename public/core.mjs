export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const number = value => new Intl.NumberFormat('en-US').format(value);
export const percent = (count, total) => total ? (count / total * 100).toFixed(1) + '%' : '—';

export function parseCSV(text) {
  const rows = []; let row = [], value = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i+1] === '"') { value += '"'; i++; }
      else if (quoted || value === '') quoted = !quoted;
      else throw new Error('A quote appears inside an unquoted field. Please export the file as CSV again.');
    } else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i+1] === '\n') i++;
      row.push(value); if (row.some(v => v.trim())) rows.push(row); row = []; value = '';
    } else value += c;
  }
  if (quoted) throw new Error('The file has an unfinished quoted field.');
  row.push(value); if (row.some(v => v.trim())) rows.push(row);
  if (rows.length < 2) throw new Error('Include column headers and at least one data row.');
  const headers = rows.shift().map(x => x.trim());
  if (headers.some(x => !x) || new Set(headers).size !== headers.length) throw new Error('Column names must be unique and cannot be blank.');
  if (rows.length > 50000) throw new Error('V1 supports up to 50,000 rows per file.');
  return { headers, rows: rows.map((r, i) => {
    if (r.length !== headers.length) throw new Error(`Row ${i+2} has ${r.length} values; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((h, j) => [h, r[j].trim()]));
  }) };
}

export const importFields = [
  ['participant_id','Participant ID',true], ['organization','Organization',true],
  ['release_date','Release date',true], ['outcome_status','Outcome status',true],
  ['return_date','Return date',false], ['observation_end_date','Observed through',false],
  ['credit_days_applied','Applied credit days',false], ['credit_evidence','Credit evidence reference',false]
];
export function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s ?? '')) return null;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(+d) && d.toISOString().slice(0,10) === s ? d : null;
}
export function anniversary(date) {
  const d = new Date(date); d.setUTCFullYear(d.getUTCFullYear()+3); return d;
}
export function analyzeImport(rows, mapping, asOf, organization = 'all') {
  const cutoff = validDate(asOf);
  if (!cutoff) throw new Error('Choose a valid reporting date.');
  for (const [key, label, required] of importFields) if (required && !mapping[key]) throw new Error(`Map the ${label.toLowerCase()} column first.`);
  const seen = new Set(), errors = [], episodes = [];
  rows.forEach((r, i) => {
    const read = key => String(r[mapping[key]] ?? '').trim();
    const id = read('participant_id'), org = read('organization'), release = validDate(read('release_date'));
    const status = read('outcome_status').toLowerCase();
    const fail = message => errors.push(`Row ${i+2}: ${message}`);
    if (!id || !org || !release) { fail('participant ID, organization, and a YYYY-MM-DD release date are required.'); return; }
    if (+release > +cutoff) { fail('release date is after the reporting date.'); return; }
    if (!['returned','no_return','unknown'].includes(status)) { fail('outcome status must be returned, no_return, or unknown.'); return; }
    const key = JSON.stringify([org, id, read('release_date')]);
    if (seen.has(key)) { fail('duplicate participant/release episode within this organization.'); return; }
    seen.add(key);
    const end = anniversary(release), returnText = read('return_date'), observedText = read('observation_end_date');
    const returned = validDate(returnText), observed = validDate(observedText);
    if (returnText && !returned) { fail('return date must be a valid YYYY-MM-DD date.'); return; }
    if (observedText && !observed) { fail('observed-through date must be a valid YYYY-MM-DD date.'); return; }
    if (returned && (+returned < +release || +returned > +cutoff)) { fail('return date must fall between release and the reporting date.'); return; }
    if (observed && (+observed < +release || +observed > +cutoff)) { fail('observed-through date must fall between release and the reporting date.'); return; }
    if (status === 'returned' && !returned) { fail('returned outcomes require a return date.'); return; }
    if (status !== 'returned' && returned) { fail('a return date conflicts with this outcome status.'); return; }
    const creditText = read('credit_days_applied');
    const creditDays = creditText === '' ? null : Number(creditText);
    if (creditDays !== null && (!Number.isSafeInteger(creditDays) || creditDays < 0)) { fail('applied credit days must be a non-negative whole number or blank.'); return; }
    const mature = +end <= +cutoff;
    // Missing observation is unknown; an early observed event is definitive, but
    // only mature release episodes enter this fixed three-year cohort report.
    const outcome = status === 'returned' && +returned < +end ? 'returned'
      : status !== 'unknown' && observed && +observed >= +end ? 'no_return' : 'unknown';
    episodes.push({id, org, release:read('release_date'), mature, outcome, creditDays, creditEvidence:read('credit_evidence'), row:r});
  });
  const selected = episodes.filter(r => organization === 'all' || r.org === organization);
  const mature = selected.filter(r => r.mature), returned = mature.filter(r => r.outcome === 'returned').length;
  const noReturn = mature.filter(r => r.outcome === 'no_return').length, unknown = mature.length-returned-noReturn;
  const credited = selected.filter(r=>r.creditDays !== null && r.creditEvidence);
  const creditDays = credited.reduce((total,r)=>total+r.creditDays,0);
  return {errors, episodes, selected, organizations:[...new Set(episodes.map(r=>r.org))].sort(),
    credits:{days:creditDays,documented:credited.length,missing:selected.length-credited.length},
    total:selected.length, mature:mature.length, returned, noReturn, unknown,
    pending:selected.length-mature.length, observed:returned+noReturn,
    lower:mature.length ? returned/mature.length*100 : null,
    upper:mature.length ? (returned+unknown)/mature.length*100 : null};
}
export function toCSV(rows, headers = Object.keys(rows[0] ?? {})) {
  const quote = value => { let s = String(value ?? ''); if (/^[=+@\-\t\r]/.test(s)) s = "'" + s; return '"'+s.replaceAll('"','""')+'"'; };
  return [headers, ...rows.map(r => headers.map(h => r[h]))].map(r => r.map(quote).join(',')).join('\r\n');
}
