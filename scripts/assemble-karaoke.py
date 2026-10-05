import json,re
from pathlib import Path
root=Path('.');records=[]
for path in sorted((root/'karaoke'/'auto').glob('*.json')):
    data=json.loads(path.read_text())
    assert (root/data['instrumental'].lstrip('/')).is_file(),path
    assert data['groups'] and data['words']>=30,path
    groups=data['groups'];indices=[i for group in groups for i in group]
    assert indices==list(range(len(data['cues'])-1)),path
    assert all(data['cues'][i]['time']<data['cues'][i+1]['time'] for i in range(len(data['cues'])-1)),path
    records.append(data)
payload={'texts':{str(d['id']):d['text'] for d in records},'groups':{str(d['id']):d['groups'] for d in records},'instrumentals':{str(d['id']):d['instrumental'] for d in records},'automaticIds':[d['id'] for d in records]}
(root/'karaoke-data.js').write_text('window.andatraKaraokeExtra='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
print('Additional karaoke songs:',len(records))
