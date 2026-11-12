"""
Coleta de pontos para o mapa, rodada no GitHub Actions (a rede do agente bloqueia estes sites).

1. Rota Biker (decisão do dono em 12/11/2026: "encontre os pontos e inclua"): baixa as páginas
   públicas do site oficial, respeitando o robots.txt, com pausa entre pedidos e sem login.
   Guardamos só FATOS (nome, número, cidade, endereço/coordenada, link) — sem textos nem fotos deles.
2. OpenStreetMap (ODbL) via Overpass: cachoeiras, mirantes, monumentos e atrações em Mato Grosso,
   e qualquer marco "Rota Biker"/"Monumento ao Motociclista" mapeado no Brasil.

Saída: tools/coleta/ (arquivos brutos que o agente transforma em dados do app).
"""

import json
import re
import time
import urllib.parse
import urllib.robotparser
from pathlib import Path

import requests

SAIDA = Path(__file__).parent / 'coleta'
AGENTE = 'BodesDoAsfaltoColeta/1.0 (coleta de pontos turisticos; contato via repositorio)'
OVERPASS = 'https://overpass-api.de/api/interpreter'


def rota_biker(base='https://monumentobikers.com.br/', limite=60):
    pasta = SAIDA / 'rota_biker'
    pasta.mkdir(parents=True, exist_ok=True)
    robots = urllib.robotparser.RobotFileParser()
    robots.set_url(urllib.parse.urljoin(base, '/robots.txt'))
    try:
        robots.read()
    except Exception:
        pass
    vistos, fila, indice = set(), [base], []
    dominio = urllib.parse.urlparse(base).netloc
    while fila and len(vistos) < limite:
        url = fila.pop(0).split('#')[0]
        if url in vistos:
            continue
        vistos.add(url)
        try:
            if not robots.can_fetch(AGENTE, url):
                indice.append({'url': url, 'status': 'robots'})
                continue
        except Exception:
            pass
        try:
            r = requests.get(url, headers={'User-Agent': AGENTE}, timeout=30)
        except Exception as e:
            indice.append({'url': url, 'erro': str(e)})
            continue
        nome = re.sub(r'[^a-z0-9]+', '_', url.lower())[-90:] + '.html'
        (pasta / nome).write_text(r.text, encoding='utf-8', errors='ignore')
        indice.append({'url': url, 'status': r.status_code, 'arquivo': nome})
        for href in re.findall(r'href=["\']([^"\']+)["\']', r.text):
            alvo = urllib.parse.urljoin(url, href)
            p = urllib.parse.urlparse(alvo)
            if p.netloc == dominio and not re.search(r'\.(jpg|jpeg|png|webp|gif|pdf|css|js|svg)$', p.path, re.I):
                fila.append(alvo)
        time.sleep(1.5)
    (pasta / 'indice.json').write_text(json.dumps(indice, ensure_ascii=False, indent=1), encoding='utf-8')


def overpass(nome, consulta):
    r = requests.post(OVERPASS, data={'data': consulta}, headers={'User-Agent': AGENTE}, timeout=300)
    (SAIDA / f'{nome}.json').write_text(r.text, encoding='utf-8')
    time.sleep(10)


MT = """[out:json][timeout:240];
area["ISO3166-2"="BR-MT"]->.mt;
(
  nwr["waterway"="waterfall"](area.mt);
  nwr["tourism"="viewpoint"](area.mt);
  nwr["historic"~"^(monument|memorial)$"](area.mt);
  nwr["tourism"="attraction"](area.mt);
  nwr["leisure"="nature_reserve"]["name"](area.mt);
  nwr["boundary"="protected_area"]["name"](area.mt);
);
out center tags;"""

BIKERS_BR = """[out:json][timeout:240];
area["ISO3166-1"="BR"]->.br;
(
  nwr["name"~"Rota Biker|Monumento Biker|Motociclista|Bikers?",i](area.br);
  nwr["club"="motorcycle"](area.br);
);
out center tags;"""

if __name__ == '__main__':
    SAIDA.mkdir(exist_ok=True)
    for passo in (rota_biker, lambda: overpass('osm_mt', MT), lambda: overpass('osm_bikers_br', BIKERS_BR)):
        try:
            passo()
        except Exception as e:  # um site fora do ar não impede os outros
            print('falhou:', e)
