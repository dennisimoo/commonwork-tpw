"""Build public snapshots from downloaded official sources. No generated records.

Prerequisites: pdftotext; the two CDCR PDFs and Iowa public CSV in source-data/.
Iowa CSV: data.iowa.gov/catalog/dataset/984 > Download > CSV.
"""
from pathlib import Path
import csv
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/data'
OUT.mkdir(parents=True, exist_ok=True)
STATE_URL = 'https://www.cdcr.ca.gov/research/wp-content/uploads/sites/174/2026/06/Statewide-Recidivism-Report-for-Individuals-Released-in-Fiscal-Year-2020-21.pdf'
PROGRAM_URL = 'https://www.cdcr.ca.gov/research/wp-content/uploads/sites/174/2026/09/Recidivism-Rates-for-Rehabilitative-Program-Achievements-FY-2020-21.pdf'
texts = {}
hashes = {}
for name in ['cdcr-statewide', 'cdcr-programs']:
    path = ROOT / 'source-data' / (name + '.pdf')
    hashes[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    texts[name] = subprocess.check_output(['pdftotext', '-layout', str(path), '-']).decode()

rows = []
for table, metric in [(14, 'arrest'), (15, 'conviction'), (16, 'return')]:
    text = texts['cdcr-statewide'].split('Table ' + str(table) + '. ')[-1].split('\f')[0]
    for line in text.splitlines():
        parts = line.split()
        if not parts or not re.fullmatch(r'20\d\d-\d\d', parts[0]):
            continue
        assert len(parts) == 8, parts
        for year in range(1, 4):
            count, published = parts[2*year:2*year+2]
            if count == 'N/A':
                continue
            denominator = int(parts[1].replace(',', ''))
            count = int(count.replace(',', ''))
            rate = float(published.strip('%'))
            assert abs(count / denominator * 100 - rate) < .06
            rows.append(dict(cohort=parts[0], metric=metric, years=year,
                             denominator=denominator, count=count, rate=rate,
                             table=table, pdf_page=table+47, source='cdcr-statewide'))

programs = []
section = texts['cdcr-programs'].split('Table 1. Arrest, Conviction')[1].split('*Individuals')[0]
section = section[section.index('Arrest Rates'):]
for metric, heading, end in [('arrest', 'Arrest Rates', 'Conviction Rates'),
                             ('conviction', 'Conviction Rates', 'Return-to-Prison Rates'),
                             ('return', 'Return-to-Prison Rates', None)]:
    part = section.split(heading, 1)[1]
    if end:
        part = part.split(end, 1)[0]
    lines = [line.split() for line in part.splitlines() if line.split() and line.split()[0] == 'Achievement']
    assert len(lines) == 3
    for (key, name), parts in zip([('edu', 'Academic education'), ('cte', 'Career technical education'), ('cbp', 'Cognitive behavioral programs')], lines):
        n = int(parts[1].replace(',', ''))
        for year in range(1, 4):
            count = int(parts[year*2].replace(',', ''))
            rate = float(parts[year*2+1].strip('%'))
            assert abs(count / n * 100 - rate) < .06
            programs.append(dict(program=key, name=name, cohort='2020-21', metric=metric,
                                 years=year, denominator=n, count=count, rate=rate,
                                 table=1, pdf_page=3, source='cdcr-programs'))

# Only retain fields needed to demonstrate outcomes. Do not retain offense,
# charge identifiers, inferred identities, or person-level risk scores.
records = []
iowa_path = ROOT / 'source-data/iowa.csv'
with iowa_path.open() as f:
    for index, row in enumerate(csv.DictReader(f), 1):
        assert row['is_recid'] in ['True', 'False']
        age = int(row['age']) if row['age'] else None
        records.append(dict(row=index, cohort=int(row['cohort_fiscal_year']),
                            report_year=int(row['report_fiscal_year']),
                            age_group=('Under 25' if age < 25 else '25–34' if age < 35 else '35–44' if age < 45 else '45–54' if age < 55 else '55+') if age is not None else 'Unknown',
                            sex=row['sex'], release_type=row['exit_sup'],
                            release_date=row['exit_sup_end_date'],
                            returned=row['is_recid']=='True', reason=row['new_tech'],
                            days=int(row['days_to_recid']) if row['days_to_recid'] else None))
assert len(records) == 31703
assert next(x for x in rows if x['cohort']=='2020-21' and x['metric']=='return' and x['years']==3)['count'] == 6249
assert next(x for x in programs if x['program']=='edu' and x['metric']=='return' and x['years']==3)['count'] == 196

sources = [
 dict(id='cdcr-statewide', title='California statewide recidivism', publisher='CDCR · Office of Research', url=STATE_URL,
      geography='California', type='Official aggregate data', publication='June 2026',
      detail='Tables 14–16, printed pages 51–53. Release cohorts FY 2002–03 through FY 2022–23; one-, two- and three-year outcomes where published. Later cohorts have incomplete follow-up.',
      limitations='Returns include CDCR custody, not county jail. Arrest and conviction denominators differ from returns. COVID-19 and policy changes affect trends. Historical cohorts may include the same person in different years.', sha256=hashes['cdcr-statewide']),
 dict(id='cdcr-programs', title='California rehabilitation achievements', publisher='CDCR · Office of Research', url=PROGRAM_URL,
      geography='California', type='Official aggregate data', publication='September 2026',
      detail='Table 1, printed page 3. Academic education, career technical education, and cognitive behavioral achievements; FY 2020–21 release cohort.',
      limitations='Achievement groups overlap and must not be summed. These are statewide program categories, not TPW member organizations. Comparisons are descriptive and do not establish causation.', sha256=hashes['cdcr-programs']),
 dict(id='iowa', title='Iowa Prison Recidivism Status', publisher='Iowa Department of Corrections', url='https://data.iowa.gov/catalog/dataset/984',
      geography='Iowa', type='Deidentified case records', publication='January 22, 2026 update',
      detail=f'{len(records):,} public rows downloaded October 24, 2026. Cohort year is release fiscal year; report fiscal year is three years later. Only selected source fields are retained.',
      limitations='Iowa outcomes are not TPW outcomes or California benchmarks. Names and person identifiers are masked in the source; rows cannot be deduplicated into unique people. A row reference is a snapshot position, not a participant ID. Return for any reason is Iowa’s definition.', sha256=hashlib.sha256(iowa_path.read_bytes()).hexdigest()),
 dict(id='aws', title='AWS Open Data discovery', publisher='Registry of Open Data on AWS', url='https://registry.opendata.aws/',
      geography='Global', type='Discovery only · not ingested', publication='Checked October 24, 2026',
      detail='Searched the registry for prison and recidivism datasets. No suitable direct outcome dataset was found. Common Crawl was assessed as a possible web-evidence source.',
      limitations='Common Crawl is not an outcome registry. Anonymous S3 bucket listing returned AccessDenied. No AWS-hosted outcome data is represented in this application; no AWS infrastructure was provisioned.')]
discoveries = ROOT / 'source-discoveries.json'
if discoveries.exists():
    sources.extend(json.loads(discoveries.read_text()))
data = dict(retrieved='2026-10-24', statewide=rows, programs=programs, sources=sources)
(OUT/'california.json').write_text(json.dumps(data, separators=(',', ':')))
(OUT/'iowa.json').write_text(json.dumps(records, separators=(',', ':')))
with (OUT/'california.csv').open('w') as f:
    writer=csv.DictWriter(f, fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
with (OUT/'iowa-selected-fields.csv').open('w') as f:
    writer=csv.DictWriter(f, fieldnames=list(records[0]));writer.writeheader();writer.writerows(records)
print(f'Validated {len(rows)} California measurements, {len(programs)} program measurements, {len(records)} Iowa case rows.')
