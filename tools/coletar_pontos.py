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
    # O servidor público vive cheio (502/429): tenta de novo com espera dobrando.
    espera = 30
    for _ in range(5):
        r = requests.post(OVERPASS, data={'data': consulta}, headers={'User-Agent': AGENTE}, timeout=300)
        if r.ok and r.text.lstrip().startswith('{'):
            (SAIDA / f'{nome}.json').write_text(r.text, encoding='utf-8')
            return
        print(nome, r.status_code, 'tentando de novo em', espera, 's')
        time.sleep(espera)
        espera *= 2


def mapa_rota_biker(mid='1ZHPck3Yykbhc8M1GYPrCcKf5pajiTvk'):
    # Mapa público ("Meus Mapas") que a própria Rota Biker publica no site oficial (página /monumentos/).
    url = f'https://www.google.com/maps/d/kml?mid={mid}&forcekml=1'
    r = requests.get(url, headers={'User-Agent': AGENTE}, timeout=60)
    (SAIDA / 'rota_biker' / 'mapa.kml').write_text(r.text, encoding='utf-8')
    print('kml', r.status_code, len(r.text))


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
    import sys

    so = sys.argv[1:]  # ex.: python coletar_pontos.py mapa osm_bikers
    passos = {
        'site': rota_biker,
        'mapa': mapa_rota_biker,
        'osm_mt': lambda: overpass('osm_mt', MT),
        'osm_bikers': lambda: overpass('osm_bikers_br', BIKERS_BR),
    }
    for nome, passo in passos.items():
        if so and nome not in so:
            continue
        try:
            passo()
        except Exception as e:  # um site fora do ar não impede os outros
            print(nome, 'falhou:', e)
