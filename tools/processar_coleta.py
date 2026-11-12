"""
Transforma a coleta bruta (tools/coleta/) em app/src/dados/pontos-coletados.json.

Guarda só FATOS: tipo, nome, coordenada, fonte e link. Nada de textos ou fotos de terceiros.
- OpenStreetMap (ODbL): cachoeiras, mirantes, monumentos/memoriais e atrações (tipo 'atracao') de MT com nome.
- Rota Biker: monumentos do mapa público do site oficial (decisão do dono, 12/11/2026),
  com número, nome, cidade e link para monumentobikers.com.br/monumentos/.
"""

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COLETA = RAIZ / 'tools' / 'coleta'
SAIDA = RAIZ / 'app' / 'src' / 'dados' / 'pontos-coletados.json'
LINK_RB = 'https://monumentobikers.com.br/monumentos/'


def tipo_osm(t):
    if t.get('waterway') == 'waterfall':
        return 'cachoeira'
    if t.get('tourism') == 'viewpoint':
        return 'mirante'
    if t.get('historic') in ('monument', 'memorial'):
        return 'monumento'
    if t.get('tourism') == 'attraction':
        # Atração genérica do OSM: só vira cachoeira/mirante se o NOME disser (nunca por padrão), para uma
        # atração urbana não ganhar ícone de cachoeira (queixa do dono, 12/11/2026).
        nome = (t.get('name') or '').lower()
        if re.search(r'\b(cachoeira|cascata|salto|queda d.?[aá]gua)\b', nome):
            return 'cachoeira'
        if re.search(r'\bmirante\b', nome):
            return 'mirante'
        return 'atracao'
    return None


def osm(arquivo='osm_mt.json'):
    caminho = COLETA / arquivo
    if not caminho.exists():
        return []
    pontos, vistos = [], set()
    for e in json.loads(caminho.read_text(encoding='utf-8')).get('elements', []):
        t = e.get('tags', {})
        tipo, nome = tipo_osm(t), (t.get('name') or '').strip()
        lat = e.get('lat', e.get('center', {}).get('lat'))
        lon = e.get('lon', e.get('center', {}).get('lon'))
        if not tipo or not nome or lat is None:
            continue
        chave = (tipo, nome.lower(), round(lat, 3), round(lon, 3))
        if chave in vistos:
            continue
        vistos.add(chave)
        pontos.append(
            {
                'id': f"osm-{e['type'][0]}{e['id']}",
                'tipo': tipo,
                'nome': nome,
                'lat': round(lat, 6),
                'lng': round(lon, 6),
                'fonte': 'osm',
                'link': f"https://www.openstreetmap.org/{e['type']}/{e['id']}",
            }
        )
    return pontos


def rota_biker():
    kml = COLETA / 'rota_biker' / 'mapa.kml'
    if not kml.exists() or not kml.read_text(encoding='utf-8').lstrip().startswith('<'):
        return []
    ns = {'k': 'http://www.opengis.net/kml/2.2'}
    raiz = ET.parse(kml).getroot()
    pontos = []
    for pm in raiz.iter('{http://www.opengis.net/kml/2.2}Placemark'):
        nome = (pm.findtext('k:name', default='', namespaces=ns) or '').strip()
        coord = pm.findtext('.//k:Point/k:coordinates', default='', namespaces=ns).strip()
        if not nome or not coord:
            continue
        lon, lat = (float(x) for x in coord.split(',')[:2])
        num = re.match(r'\s*(?:monumento\s*)?(\d{1,3})\b', nome, re.I)
        pontos.append(
            {
                'id': f"rb-{num.group(1) if num else re.sub(r'[^a-z0-9]+', '-', nome.lower())[:30]}",
                'tipo': 'rotaBiker',
                'nome': nome,
                'numero': int(num.group(1)) if num else None,
                'lat': round(lat, 6),
                'lng': round(lon, 6),
                'fonte': 'rotaBiker',
                'link': LINK_RB,
            }
        )
    return pontos


def ids_unicos(pontos):
    # o mapa da Rota Biker tem número repetido (dois "38"): o segundo ganha sufixo
    vistos = {}
    for p in pontos:
        n = vistos.get(p['id'], 0)
        vistos[p['id']] = n + 1
        if n:
            p['id'] = f"{p['id']}-{n + 1}"
    return pontos


if __name__ == '__main__':
    pontos = ids_unicos(rota_biker() + osm())
    SAIDA.write_text(json.dumps(pontos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    from collections import Counter

    print(len(pontos), Counter(p['tipo'] for p in pontos))
