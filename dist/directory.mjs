import {escapeHTML as esc, number, toCSV} from './core.mjs';
const SOURCE = 'https://data.iowa.gov/catalog/dataset/984';
let dataPromise;
let activeRoot;
let shortcutInstalled = false;
const icon = name => `<img src="assets/reference/${name}.svg" alt="" width="17" height="17">`;
const label = row => `Record ${String(row.row).padStart(5,'0')}`;
const outcome = row => row.returned ? 'Returned within 3 years' : 'No recorded return';
const facets = [['Release · Cohort',[['cohort','Fiscal year'],['release_type','Release pathway']]],['Recorded · Outcome',[['returned','Return status'],['reason','Return reason']]],['Record · Characteristics',[['age_group','Age group'],['sex','Sex']]]];
const valueLabel = (key,value) => key==='returned' ? (value==='true' ? 'Returned' : 'No recorded return') : value || 'Not recorded';
export async function renderDirectory({mount,download}) {
  mount.innerHTML = '<div class="directory"><p class="dir-loading" role="status">Loading public Iowa release records…</p></div>';
  let rows;
  try { rows=await (dataPromise ??= fetch('data/iowa.json').then(r=>{if(!r.ok) throw Error('Source records could not be loaded.');return r.json();}).catch(error=>{dataPromise=null;throw error;})); }
  catch(error) { mount.innerHTML=`<div class="directory"><p role="alert">${esc(error.message)} Please reload to try again.</p></div>`;return; }
  if(!mount.isConnected || !['','#directory','#records'].includes(location.hash)) return;
  const state={query:'',view:'table',sort:'latest',filters:{},page:1,size:20,selected:new Set(),detail:null};
  const options=Object.fromEntries(facets.flatMap(([,fields])=>fields).map(([key])=>{const counts=new Map();rows.forEach(r=>{const v=String(r[key]??'');counts.set(v,(counts.get(v)||0)+1);});return [key,[...counts].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true}))];}));
  mount.innerHTML=`<div class="directory">
    <div class="dir-toolbar"><label class="dir-search">${icon('search-md')}<input type="search" aria-label="Search release records" placeholder="Search records, cohorts, release pathways…"><kbd>⌘ K</kbd></label>
    <div class="dir-tabs" role="group" aria-label="Record view">${[['table','list','Table'],['cards','grid-01','Cards'],['people','user-01','People']].map(([view,img,text])=>`<button data-view="${view}" aria-pressed="${view==='table'}">${icon(img)}${text}</button>`).join('')}</div>
    <label class="dir-sort">${icon('switch-vertical-01')}<span>Sort</span><select aria-label="Sort records"><option value="latest">Latest release</option><option value="oldest">Oldest release</option><option value="days">Time to return</option><option value="row">Source row</option></select></label>
    <button class="dir-filter-toggle" aria-label="Toggle filters" aria-expanded="false">${icon('filter-funnel-02')}<span class="dir-filter-number">0</span></button></div>
    <div class="dir-secondary"><a class="dir-pill" href="${SOURCE}" target="_blank" rel="noopener">${icon('icon-briefcase')}Iowa · public records ${icon('link-03')}</a><button class="dir-pill dir-return" aria-pressed="false">${icon('users-01')}Returned within 3 years</button><button class="dir-pill dir-export">${icon('link-03')}Export filtered records</button><span class="dir-selection-note">Selection clears when filters change.</span></div>
    <p class="dir-scope">Public Iowa example · not TPW participants. Names and person IDs are masked; row references are not identities.</p>
    <div class="dir-active"><span>ACTIVE</span><button class="dir-add">${icon('plus')}Add filter</button><div class="dir-chips"></div><span class="dir-active-count">0 filters</span></div>
    <div class="dir-columns"><aside class="dir-sidebar"><div class="dir-filter-heading"><strong>Filters <span class="dir-badge dir-filter-number">0</span></strong><button class="dir-reset">Reset</button></div><label class="dir-facet-search">${icon('search-md')}<input type="search" placeholder="Find a filter" aria-label="Find a filter"></label><div class="dir-facets">${facets.map(([group,fields])=>`<section class="dir-facet-group"><h3>${group}</h3>${fields.map(([key,title])=>`<details data-facet="${key}"><summary>${icon('chevron-right')}<span>${title}</span><small data-summary="${key}">Any <span>${options[key].length}</span></small></summary><div class="dir-options">${options[key].map(([v,count])=>`<label><input type="checkbox" data-key="${key}" value="${esc(v)}"><span>${esc(valueLabel(key,v))}</span><small>${number(count)}</small></label>`).join('')}</div></details>`).join('')}</section>`).join('')}</div></aside>
    <section class="dir-results" aria-label="Release records"><div class="dir-result-heading"><h2>Release records <span class="dir-badge dir-results-count"></span></h2><span>Known for these records <b>Release cohort</b><b>Recorded outcome</b></span></div><div class="dir-records"></div><div class="dir-footer"><span class="dir-page-note" role="status" aria-live="polite"></span><label>Rows <select class="dir-page-size" aria-label="Records per page"><option>20</option><option>40</option></select></label><button class="dir-prev" aria-label="Previous page">${icon('icon-chevron-left')}</button><span class="dir-page-current"></span><button class="dir-next" aria-label="Next page">${icon('chevron-right')}</button></div></section></div>
    <dialog class="dir-dialog"><div class="dir-dialog-inner"></div><button class="dir-dialog-close" aria-label="Close record detail">${icon('x-close')}</button></dialog>
  </div>`;
  const root=mount.querySelector('.directory'), $=selector=>root.querySelector(selector);
  let filtered=[];
  function detail(row) {return `<div class="dir-detail"><span class="dir-eyebrow">IOWA DOC · SOURCE ROW ${number(row.row)}</span><h2>${label(row)}</h2><p class="dir-detail-intro">A deidentified release record from Iowa’s public three-year recidivism dataset.</p><dl>${[['Release date',row.release_date],['Fiscal release cohort',row.cohort],['Report year',row.report_year],['Age at release',row.age_group],['Sex',row.sex],['Release pathway',row.release_type],['Recorded outcome',outcome(row)],['Return reason',row.reason||'Not recorded'],['Days to return',row.days??'Not recorded']].map(([key,v])=>`<div><dt>${key}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="dir-unavailable">Employment, housing and program participation are unavailable in this dataset. No inference is made about those outcomes.</p><a href="${SOURCE}" target="_blank" rel="noopener">View official source ${icon('link-03')}</a></div>`;}
  const avatar=row=>`<span class="dir-avatar dir-color-${row.row%4}">${String(row.row).slice(-2).padStart(2,'0')}</span>`;
  const recordName=row=>`${avatar(row)}<span class="dir-record-name"><strong>${label(row)}</strong><small>Iowa DOC · source row ${number(row.row)}</small></span>`;
  const checkbox=row=>`<input type="checkbox" data-select="${row.row}" aria-label="Select ${label(row)}" ${state.selected.has(row.row)?'checked':''}>`;
  function renderRecords() {
    $('.dir-results-count').textContent=number(filtered.length);
    const start=(state.page-1)*state.size, visible=filtered.slice(start,start+state.size);
    if(!visible.length) $('.dir-records').innerHTML='<div class="dir-empty"><h3>No matching records</h3><p>Try a different search or reset your filters.</p></div>';
    else if(state.view==='table') $('.dir-records').innerHTML=`<div class="dir-table-scroll"><table><thead><tr><th><input type="checkbox" class="dir-select-page" aria-label="Select records on this page" ${visible.every(r=>state.selected.has(r.row))?'checked':''}></th><th>Record</th><th>Age at release</th><th>Release cohort</th><th>Pathway</th><th>Outcome</th><th>Source</th></tr></thead><tbody>${visible.map(row=>`<tr><td>${checkbox(row)}</td><td><button class="dir-record-button" data-record="${row.row}">${recordName(row)}</button></td><td>${esc(row.age_group||'Not recorded')}</td><td><span class="dir-cohort">FY ${esc(row.cohort)}</span></td><td>${esc(row.release_type)}</td><td><span class="dir-outcome ${row.returned?'is-returned':''}">${outcome(row)}</span></td><td><a class="dir-source-link" href="${SOURCE}" target="_blank" rel="noopener">Iowa DOC ${icon('link-03')}</a></td></tr>`).join('')}</tbody></table></div>`;
    else if(state.view==='cards') $('.dir-records').innerHTML=`<div class="dir-card-grid">${visible.map(row=>`<article class="dir-card"><div class="dir-card-top">${checkbox(row)}<span class="dir-cohort">FY ${esc(row.cohort)}</span></div><button class="dir-record-button" data-record="${row.row}">${recordName(row)}</button><dl><div><dt>Release pathway</dt><dd>${esc(row.release_type)}</dd></div><div><dt>Age at release</dt><dd>${esc(row.age_group||'Not recorded')}</dd></div></dl><span class="dir-outcome ${row.returned?'is-returned':''}">${outcome(row)}</span></article>`).join('')}</div>`;
    else {const selected=visible.find(r=>r.row===state.detail);$('.dir-records').innerHTML=`<div class="dir-people"><div class="dir-people-list">${visible.map(row=>`<div class="dir-person ${row.row===state.detail?'is-active':''}">${checkbox(row)}<button class="dir-record-button" data-person="${row.row}" aria-pressed="${row.row===state.detail}">${recordName(row)}${icon('chevron-right')}</button></div>`).join('')}</div><div class="dir-people-detail">${selected?detail(selected):'<div class="dir-empty"><h3>Explore a release record</h3><p>Select a record to view its source-backed details. These references do not identify people.</p></div>'}</div></div>`;}
    $('.dir-page-note').textContent=filtered.length?`${number(start+1)}–${number(Math.min(start+state.size,filtered.length))} of ${number(filtered.length)} records`:'0 records';
    $('.dir-page-current').textContent=`${state.page} / ${Math.max(1,Math.ceil(filtered.length/state.size))}`;
    $('.dir-prev').disabled=state.page===1;$('.dir-next').disabled=start+state.size>=filtered.length;
    $('.dir-export').innerHTML=`${icon('link-03')}Export ${state.selected.size?`${number(state.selected.size)} selected`:'filtered'} records`;
    $('.dir-export').disabled=!filtered.length;
  }
  function update(reset=true) {
    if(reset){state.page=1;state.detail=null;state.selected.clear();if($('.dir-dialog').open) $('.dir-dialog').close();}
    const query=state.query.trim().toLowerCase();
    filtered=rows.filter(row=>Object.entries(state.filters).every(([key,values])=>values.includes(String(row[key]??'')))&&(!query||[label(row),row.row,row.cohort,row.report_year,row.release_type,row.age_group,row.sex,row.release_date,outcome(row),row.reason].join(' ').toLowerCase().includes(query)));
    filtered.sort((a,b)=>state.sort==='row'?a.row-b.row:state.sort==='days'?(a.days??Infinity)-(b.days??Infinity)||a.row-b.row:state.sort==='oldest'?a.release_date.localeCompare(b.release_date)||a.row-b.row:b.release_date.localeCompare(a.release_date)||a.row-b.row);
    const count=Object.values(state.filters).reduce((n,v)=>n+v.length,0);
    root.querySelectorAll('.dir-filter-number').forEach(el=>el.textContent=count);
    $('.dir-active-count').textContent=`${count} filter${count===1?'':'s'}`;
    $('.dir-chips').innerHTML=Object.entries(state.filters).flatMap(([key,values])=>values.map(v=>`<button data-remove-key="${key}" data-remove-value="${esc(v)}">${esc(valueLabel(key,v))} ${icon('x-close')}</button>`)).join('');
    root.querySelectorAll('[data-key]').forEach(el=>el.checked=state.filters[el.dataset.key]?.includes(el.value)||false);
    root.querySelectorAll('[data-summary]').forEach(el=>{const values=state.filters[el.dataset.summary];el.textContent=values?`${values.length} selected`:`Any · ${options[el.dataset.summary].length}`;});
    $('.dir-return').setAttribute('aria-pressed',state.filters.returned?.length===1&&state.filters.returned[0]==='true');
    renderRecords();
  }
  let searchTimer;
  $('.dir-search input').addEventListener('input',event=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=event.target.value;update();},120);});
  $('.dir-sort select').addEventListener('change',event=>{state.sort=event.target.value;state.page=1;state.detail=null;renderSorted();});
  function renderSorted(){update(false);}
  $('.dir-page-size').addEventListener('change',event=>{state.size=Number(event.target.value);state.page=1;state.detail=null;renderRecords();});
  $('.dir-facet-search input').addEventListener('input',event=>{const q=event.target.value.toLowerCase();root.querySelectorAll('[data-facet]').forEach(el=>el.hidden=!el.querySelector('summary').textContent.toLowerCase().includes(q));root.querySelectorAll('.dir-facet-group').forEach(el=>el.hidden=[...el.querySelectorAll('details')].every(d=>d.hidden));});
  function toggleFilters(force){const open=force??!root.classList.contains('dir-filters-open');root.classList.toggle('dir-filters-open',open);$('.dir-filter-toggle').setAttribute('aria-expanded',String(open));}
  root.addEventListener('change',event=>{const target=event.target;if(target.matches('[data-key]')){const key=target.dataset.key;let values=state.filters[key]||[];values=target.checked?[...values,target.value]:values.filter(v=>v!==target.value);if(values.length)state.filters[key]=values;else delete state.filters[key];update();}else if(target.matches('[data-select]')){const row=Number(target.dataset.select);target.checked?state.selected.add(row):state.selected.delete(row);renderRecords();}else if(target.matches('.dir-select-page')){filtered.slice((state.page-1)*state.size,state.page*state.size).forEach(row=>target.checked?state.selected.add(row.row):state.selected.delete(row.row));renderRecords();}});
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.view){state.view=button.dataset.view;state.detail=null;root.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));renderRecords();}
    else if(button.matches('.dir-reset')){state.filters={};state.query='';$('.dir-search input').value='';clearTimeout(searchTimer);update();}
    else if(button.dataset.removeKey){const key=button.dataset.removeKey;state.filters[key]=state.filters[key].filter(v=>v!==button.dataset.removeValue);if(!state.filters[key].length)delete state.filters[key];update();}
    else if(button.matches('.dir-return')){if(state.filters.returned?.length===1&&state.filters.returned[0]==='true')delete state.filters.returned;else state.filters.returned=['true'];update();}
    else if(button.matches('.dir-filter-toggle'))toggleFilters();
    else if(button.matches('.dir-add')){toggleFilters(true);$('.dir-facet-search input').focus();}
    else if(button.matches('.dir-prev,.dir-next')){state.page+=button.matches('.dir-prev')?-1:1;state.detail=null;renderRecords();}
    else if(button.dataset.person){state.detail=Number(button.dataset.person);renderRecords();}
    else if(button.dataset.record){const row=rows.find(r=>r.row===Number(button.dataset.record));$('.dir-dialog-inner').innerHTML=detail(row);$('.dir-dialog').showModal();}
    else if(button.matches('.dir-dialog-close'))$('.dir-dialog').close();
    else if(button.matches('.dir-export')){const chosen=state.selected.size?filtered.filter(row=>state.selected.has(row.row)):filtered;download(`iowa-release-${state.selected.size?'selected':'filtered'}-records.csv`,toCSV(chosen.map(row=>({...row,source:SOURCE,record_reference:label(row)}))));}
  });
  $('.dir-dialog').addEventListener('click',event=>{if(event.target===$('.dir-dialog'))$('.dir-dialog').close();});
  activeRoot=root;
  if(!shortcutInstalled){
    document.addEventListener('keydown',event=>{
      if(activeRoot?.isConnected && ['', '#directory', '#records'].includes(location.hash) && (event.metaKey||event.ctrlKey) && event.key.toLowerCase()==='k'){
        event.preventDefault();activeRoot.querySelector('.dir-search input').focus();
      }
    });
    shortcutInstalled=true;
  }
  update();
}
