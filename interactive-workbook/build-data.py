"""Rebuild the browser data file after editing data/workbook.json."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent
data=json.loads((root/'data/workbook.json').read_text(encoding='utf-8'))
assert [p['page'] for p in data['pages']]==list(range(4,65))
ids=[s['id'] for p in data['pages'] for s in p['sections']]
assert len(ids)==len(set(ids))
(root/'workbook-data.js').write_text('window.WORKBOOK_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Built',len(data['pages']),'activity pages')
