# -*- coding: utf-8 -*-
import os, re, json, glob
AQUI = os.path.dirname(os.path.abspath(__file__))
CSS = open(os.path.join(AQUI, 'estilo.css'), encoding='utf-8').read()
pj = os.path.join(AQUI, 'paginas_manual.json')
paginas = json.load(open(pj)) if os.path.exists(pj) else {}
secoes = []
for f in sorted(glob.glob(os.path.join(AQUI, 'manual', 's*.html'))):
    t = open(f, encoding='utf-8').read().replace('\\"', '"')
    m = re.match(r'<!--T:(.*?)-->', t)
    secoes.append((m.group(1), t[m.end():]))
toc = ['<ul class="sumario">']
corpo = []
for i, (tit, html) in enumerate(secoes, 1):
    chave = f'{i}. {tit}'
    toc.append(f'<li><a>{chave}</a><span class="pt"></span><span>{paginas.get(chave, "…")}</span></li>')
    corpo.append(f'<section class="secao"><h2>{chave}</h2>{html}</section>')
toc.append('</ul>')
doc = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Manual do usuário - Bodes do Asfalto</title><style>{CSS}</style></head><body>
<section class="capa"><div class="marca">BODES DO ASFALTO</div>
<h1>Manual do usuário</h1>
<div class="sub">O app dos irmãos: estrada, comboio e confraternização</div>
<p class="meta">Versão do app descrita: 0.20.1 &middot; novembro de 2026</p>
<p style="margin-top:30pt">Escrito em linguagem simples, com os nomes das telas e dos botões do app, para você achar tudo com facilidade.</p></section>
<section class="secao"><h2>Sumário</h2>{''.join(toc)}</section>
{''.join(corpo)}
</body></html>'''
out = os.path.join(AQUI, '..', 'src', 'Manual-do-Usuario-Bodes-do-Asfalto.html')
open(out, 'w', encoding='utf-8').write(doc)
print(json.dumps({f'{i}. {t}': f'{i}. {t}' for i, (t, _) in enumerate(secoes, 1)}, ensure_ascii=False))
