"""
Importa pontos de interesse do OpenStreetMap (ODbL) para a tabela public.pontos_osm.

Roda no GitHub Actions (a rede do agente bloqueia o Overpass). Uso:
  python3 tools/importar_pois_osm.py --coletar [--ufs MT,GO] [--tipos posto,cachoeira]
  python3 tools/importar_pois_osm.py --enviar  [--ufs MT]
Sem --coletar nem --enviar, só coleta. Saída: tools/coleta/pois/<UF>.ndjson.
O envio usa SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do ambiente (nunca impressas).
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

SAIDA = Path(__file__).parent / 'coleta' / 'pois'
AGENTE = 'BodesDoAsfaltoPOIs/1.0 (importacao OSM para mapa de motoclube; contato via repositorio)'
OVERPASS = 'https://overpass-api.de/api/interpreter'

# Mato Grosso primeiro, depois as demais UFs.
UFS = ['MT'] + sorted(set(
    'AC AL AP AM BA CE DF ES GO MA MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split()))

TIPOS = ['posto', 'oficina_moto', 'borracharia', 'cachoeira', 'mirante', 'museu', 'monumento',
         'atracao', 'praia', 'parque', 'igreja_historica', 'hospedagem', 'camping',
         'hospital', 'policia_rodoviaria']
# Só estes podem não ter nome (recebem nome pela marca ou genérico).
SEM_NOME_OK = {'posto': 'Posto', 'borracharia': 'Borracharia'}

# Filtros Overpass por tipo (dentro de nwr(area.a)).
FILTROS = {
    'posto': ['[amenity=fuel]'],
    'oficina_moto': ['[shop=motorcycle_repair]', '[shop=motorcycle]'],
    'borracharia': ['[shop=tyres]', '[craft=tyres]', '["name"~"[Bb]orracharia"]'],
    'cachoeira': ['[waterway=waterfall]'],
    'mirante': ['[tourism=viewpoint]["name"]'],
    'museu': ['[tourism=museum]["name"]'],
    'monumento': ['[historic=monument]["name"]', '[historic=memorial]["name"]'],
    'atracao': ['[tourism~"^(attraction|artwork|theme_park|zoo)$"]["name"]'],
    'praia': ['[natural=beach]["name"]'],
    'parque': ['[boundary=national_park]["name"]', '[leisure=nature_reserve]["name"]'],
    'igreja_historica': ['[historic=church]["name"]', '[building=church][heritage]["name"]',
                         '[amenity=place_of_worship][heritage]["name"]'],
    'hospedagem': ['[tourism~"^(hotel|motel|guest_house)$"]["name"]'],
    'camping': ['[tourism=camp_site]["name"]'],
    'hospital': ['[amenity=hospital]["name"]', '[emergency=yes]["name"]'],
    'policia_rodoviaria': ['[amenity=police]["name"]'],
}

RE_PRF = re.compile(r'\bPRF\b|rodovi[aá]ri', re.I)
RE_BORRACHARIA = re.compile(r'borracharia', re.I)


def tipo_da_tag(tags):
    """Converte as tags do OSM em um tipo do app (ou None). A ordem define a prioridade."""
    t = tags or {}
    if t.get('amenity') == 'fuel':
        return 'posto'
    if t.get('shop') == 'tyres' or t.get('craft') == 'tyres' or RE_BORRACHARIA.search(t.get('name', '')):
        return 'borracharia'
    if t.get('shop') in ('motorcycle_repair', 'motorcycle'):
        return 'oficina_moto'
    if t.get('amenity') == 'police':
        if RE_PRF.search(t.get('operator', '')) or RE_PRF.search(t.get('name', '')):
            return 'policia_rodoviaria'
        return None
    if t.get('amenity') == 'hospital' or t.get('emergency') == 'yes':
        return 'hospital'
    if t.get('waterway') == 'waterfall':
        return 'cachoeira'
    if t.get('tourism') == 'viewpoint':
        return 'mirante'
    if t.get('tourism') == 'museum':
        return 'museu'
    if t.get('historic') == 'church' or (
            t.get('heritage') and (t.get('building') == 'church' or t.get('amenity') == 'place_of_worship')):
        return 'igreja_historica'
    if t.get('historic') in ('monument', 'memorial'):
        return 'monumento'
    if t.get('tourism') in ('attraction', 'artwork', 'theme_park', 'zoo'):
        return 'atracao'
    if t.get('natural') == 'beach':
        return 'praia'
    if t.get('boundary') == 'national_park' or t.get('leisure') == 'nature_reserve':
        return 'parque'
    if t.get('tourism') in ('hotel', 'motel', 'guest_house'):
        return 'hospedagem'
    if t.get('tourism') == 'camp_site':
        return 'camping'
    return None


def _cortar(valor, n=200):
    return str(valor).strip()[:n]


def elemento_para_linha(el, uf):
    """Elemento do Overpass (out center) -> dict da tabela, ou None se não serve."""
    tags = el.get('tags') or {}
    tipo = tipo_da_tag(tags)
    if not tipo:
        return None
    nome = (tags.get('name') or '').strip()
    if not nome and tipo in SEM_NOME_OK:
        nome = (tags.get('brand') or tags.get('operator') or SEM_NOME_OK[tipo]).strip()
    if not nome:
        return None
    if 'lat' in el and 'lon' in el:
        lat, lon = el['lat'], el['lon']
    elif el.get('center'):
        lat, lon = el['center']['lat'], el['center']['lon']
    else:
        return None
    extras = {}
    site = tags.get('website') or tags.get('contact:website')
    tel = tags.get('phone') or tags.get('contact:phone')
    if site:
        extras['site'] = _cortar(site)
    if tel:
        extras['telefone'] = _cortar(tel, 60)
    if tags.get('opening_hours'):
        extras['horario'] = _cortar(tags['opening_hours'], 200)
    if tipo == 'posto' and (tags.get('brand') or tags.get('operator')):
        extras['marca'] = _cortar(tags.get('brand') or tags['operator'], 80)
    return {
        'osm_id': f"{el['type']}/{el['id']}",
        'tipo': tipo,
        'nome': _cortar(nome),
        'lon': round(lon, 6),
        'lat': round(lat, 6),
        'uf': uf,
        'cidade': _cortar(tags['addr:city'], 100) if tags.get('addr:city') else None,
        'extras': extras,
    }


def deduplicar(linhas):
    """Remove repetições por osm_id e por (tipo, nome, ~100 m)."""
    por_id, por_lugar, saida = set(), set(), []
    for l in linhas:
        if l['osm_id'] in por_id:
            continue
        por_id.add(l['osm_id'])
        chave = (l['tipo'], l['nome'].lower(), round(l['lat'], 3), round(l['lon'], 3))
        if chave in por_lugar:
            continue
        por_lugar.add(chave)
        saida.append(l)
    return saida


def consulta(uf, tipos):
    partes = []
    for tipo in tipos:
        for f in FILTROS[tipo]:
            partes.append(f'  nwr(area.a){f};')
    return (f'[out:json][timeout:300];\narea["ISO3166-2"="BR-{uf}"]->.a;\n(\n' + '\n'.join(partes)
            + '\n);\nout center tags;')


def chamar_overpass(q, tentativas=4, sessao=None):
    import requests
    s = sessao or requests
    for n in range(tentativas):
        try:
            r = s.post(OVERPASS, data={'data': q}, headers={'User-Agent': AGENTE}, timeout=360)
            if r.status_code == 200:
                return r.json().get('elements', [])
            print(f'Overpass respondeu {r.status_code}; tentativa {n + 1}', file=sys.stderr)
        except Exception as e:  # rede instável
            print(f'Falha de rede ({type(e).__name__}); tentativa {n + 1}', file=sys.stderr)
        time.sleep(30 * (n + 1))
    raise RuntimeError('Overpass não respondeu')


def coletar(ufs, tipos, pausa=20):
    SAIDA.mkdir(parents=True, exist_ok=True)
    # Duas consultas por UF (estrada e turismo) para não estourar o tempo do servidor.
    grupos = [[t for t in tipos if t in ('posto', 'oficina_moto', 'borracharia', 'hospital', 'policia_rodoviaria')],
              [t for t in tipos if t not in ('posto', 'oficina_moto', 'borracharia', 'hospital', 'policia_rodoviaria')]]
    for uf in ufs:
        linhas = []
        for g in grupos:
            if not g:
                continue
            for el in chamar_overpass(consulta(uf, g)):
                l = elemento_para_linha(el, uf)
                if l and l['tipo'] in tipos:
                    linhas.append(l)
            time.sleep(pausa)
        linhas = deduplicar(linhas)
        with open(SAIDA / f'{uf}.ndjson', 'w', encoding='utf-8') as f:
            for l in linhas:
                f.write(json.dumps(l, ensure_ascii=False) + '\n')
        print(f'{uf}: {len(linhas)} pontos')


def enviar(ufs, lote=500):
    import requests
    url = os.environ.get('SUPABASE_URL', '').rstrip('/')
    chave = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not url or not chave:
        sys.exit('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
    cab = {'apikey': chave, 'Authorization': f'Bearer {chave}', 'Content-Type': 'application/json',
           'Prefer': 'resolution=merge-duplicates,return=minimal'}
    for uf in ufs:
        arq = SAIDA / f'{uf}.ndjson'
        if not arq.exists():
            print(f'{uf}: sem arquivo, pulando')
            continue
        linhas = [json.loads(x) for x in arq.read_text(encoding='utf-8').splitlines() if x.strip()]
        enviados = 0
        for i in range(0, len(linhas), lote):
            r = requests.post(f'{url}/rest/v1/pontos_osm?on_conflict=osm_id', headers=cab,
                              data=json.dumps(linhas[i:i + lote]), timeout=120)
            if r.status_code >= 300:  # não imprime cabeçalhos nem a chave
                sys.exit(f'{uf}: envio falhou com status {r.status_code}: {r.text[:300]}')
            enviados += len(linhas[i:i + lote])
        print(f'{uf}: {enviados} enviados')


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument('--ufs', default=','.join(UFS))
    p.add_argument('--tipos', default=','.join(TIPOS))
    p.add_argument('--coletar', action='store_true')
    p.add_argument('--enviar', action='store_true')
    a = p.parse_args(argv)
    ufs = [u.strip().upper() for u in a.ufs.split(',') if u.strip()]
    tipos = [t.strip() for t in a.tipos.split(',') if t.strip()]
    invalidos = [u for u in ufs if u not in UFS] + [t for t in tipos if t not in TIPOS]
    if invalidos:
        sys.exit(f'Valores inválidos: {invalidos}')
    if a.coletar or not a.enviar:
        coletar(ufs, tipos)
    if a.enviar:
        enviar(ufs)


if __name__ == '__main__':
    main()
