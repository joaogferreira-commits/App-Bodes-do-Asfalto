import sys, json, subprocess, re
pdf, saida = sys.argv[1], sys.argv[2]
chaves = json.loads(sys.argv[3])  # {chave: texto do titulo}
from pypdf import PdfReader
r = PdfReader(pdf)
txt = [ (p.extract_text() or '') for p in r.pages ]
res = {}
for k, t in chaves.items():
    for i, x in enumerate(txt):
        if i < 2: continue  # pula capa e sumario
        if re.search(r'(^|\n)\s*' + re.escape(t) + r'\s*(\n|$)', x):
            res[k] = i + 1; break
json.dump(res, open(saida, 'w'))
print(res, 'paginas', len(txt))
