"""Read the supplied workbook without changing it; preserve source cells and missing values."""
import zipfile,xml.etree.ElementTree as E,json,datetime,hashlib,pathlib,argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('workbook',type=pathlib.Path,help='Path to the original TPW workbook')
source=parser.parse_args().workbook
n={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(source) as z:
 strings=[''.join(v.itertext()) for v in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',n)] if 'xl/sharedStrings.xml' in z.namelist() else []
 def read(sheet):
  result=[]
  for row in E.fromstring(z.read('xl/worksheets/'+sheet+'.xml')).findall('s:sheetData/s:row',n):
   cells={}
   for c in row.findall('s:c',n):
    v=c.find('s:v',n);val=v.text if v is not None else ''.join(c.find('s:is',n).itertext()) if c.find('s:is',n) is not None else ''
    if c.get('t')=='s':val=strings[int(val)]
    cells[''.join(x for x in c.get('r') if x.isalpha())]=val or ''
   result.append((int(row.get('r')),cells))
  return result
 def num(v):
  try:return float(v) if v not in ('',None) else None
  except ValueError:return None
 def date(v):
  value=num(v)
  return (datetime.datetime(1899,12,30)+datetime.timedelta(days=value)).date().isoformat() if value is not None else None
 records=[];excluded=[]
 for row,c in read('sheet1')[1:]:
  if not any(c.get(k) for k in ['A','C','D']):continue
  if 'sample' in c.get('M','').lower():excluded.append({'sheet':'Data Entry Sheet','row':row,'reason':'Explicit SAMPLE DATA label'});continue
  records.append(dict(facility=c.get('A',''),yard=c.get('B',''),organization=c.get('C',''),program=c.get('D',''),status=c.get('E',''),start_date=date(c.get('F')),end_date=date(c.get('G')),program_hours=num(c.get('H')),participants=num(c.get('I')),completions=num(c.get('J')),notes=c.get('M',''),source_sheet='Data Entry Sheet',source_row=row))
 for row,c in read('sheet2')[1:]:
  if c.get('D','').lower()=='test':excluded.append({'sheet':'Form Responses','row':row,'reason':'Explicit Test organization / program'})
 facilities=[c['A'] for row,c in read('sheet3')[1:] if c.get('A')]
 data={'source':{'title':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'retrieved':'2026-10-24','url':'https://docs.google.com/spreadsheets/d/1icSY90fNL_tF94yN9XKP4W-fGxRFbIp9R11__YHHiuM/edit','verification':'Partner-supplied workbook; remaining rows are not independently verified.','excluded':excluded,'hours_definition':'Workbook column H: Total Programming hours. Form sheet calls this Course Hours (per Participant). Display as reported course/program hours; do not claim observed attendance or staff labor.','period_definition':'Whole-course totals grouped by start year; no allocation across quarters or calendar years.'},'facilities':facilities,'records':records}
 pathlib.Path('public/data/collective-impact.json').write_text(json.dumps(data,indent=2)+'\n')
 print(json.dumps({'records':len(records),'excluded':excluded,'organizations':sorted(set(r['organization'] for r in records)),'participants':sum(r['participants'] or 0 for r in records),'completions':sum(r['completions'] or 0 for r in records),'program_hours':sum(r['program_hours'] or 0 for r in records)}))
