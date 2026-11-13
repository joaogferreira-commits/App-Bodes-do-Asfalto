"""
Importa postos de combustível da ANP (dados abertos) para a tabela public.postos_anp.

Roda no GitHub Actions (a rede do agente bloqueia sites do governo). Fontes:
  - LPC: "Levantamento de Preços de Combustíveis" (CSV por semestre, ';', pode vir em latin-1). Traz CNPJ, razão social,
    endereço, bairro, município, UF, produto, data da coleta, valor de venda e bandeira. É uma AMOSTRA de postos.
  - Cadastro: "Revendedores Varejistas de Combustíveis Automotivos" (postos autorizados). Todos os postos, sem preço.
Nenhuma das duas tem coordenadas garantidas: se a coluna existir (latitude/longitude) é usada; senão o posto é casado com
o OpenStreetMap (nome + cidade, depois distância) ou geocodificado no Nominatim (1 req/s, com cache).

ATENÇÃO: as URLs e os nomes de colunas abaixo vêm de memória e podem ter mudado. A etapa de descoberta consulta a API do
dados.gov.br (CKAN) e as páginas do gov.br, grava o que achou em tools/coleta/anp/descoberta.log e tenta cada candidato.

Uso:
  python3 tools/importar_anp.py --descobrir
  python3 tools/importar_anp.py --coletar --enviar --ufs MT [--modo completo|precos] [--max-geocodes 1500]
  --ufs banco  = só as UFs que já têm postos em postos_anp (usado na rotina semanal de preços)
O banco (leitura do OSM, envio) usa SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do ambiente (nunca impressas).
"""

import argparse
import csv
import io
import json
import math
import os
import re
import sys
import time
import unicodedata
from datetime import date, datetime
from pathlib import Path

RAIZ = Path(__file__).parent / 'coleta'
SAIDA = RAIZ / 'anp'
CACHE_GEO = RAIZ / 'geocode_cache.json'
AGENTE = 'BodesDoAsfaltoANP/1.0 (importacao de postos ANP para mapa de motoclube; contato via repositorio)'
NOMINATIM = 'https://nominatim.openstreetmap.org/search'

UFS = ['MT'] + sorted(set('AC AL AP AM BA CE DF ES GO MA MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split()))
UF_NOME = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará',
    'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
    'SE': 'Sergipe', 'TO': 'Tocantins',
}

# ---------------------------------------------------------------- descoberta (URLs de memória; podem mudar)

CKAN = 'https://dados.gov.br/api/3/action'
# Slugs prováveis no dados.gov.br (incerto). A busca por texto cobre o caso de mudarem.
PACOTES_LPC = ['serie-historica-de-precos-de-combustiveis-e-de-glp', 'serie-historica-de-precos-de-combustiveis',
               'levantamento-de-precos-de-combustiveis']
PACOTES_CADASTRO = ['revendedores-varejistas-de-combustiveis-automotivos', 'postos-revendedores-de-combustiveis',
                    'dados-cadastrais-dos-revendedores-varejistas-de-combustiveis-automotivos']
BUSCAS_CKAN = {
    'lpc': ['levantamento de precos de combustiveis', 'serie historica precos combustiveis'],
    'cadastro': ['revendedores varejistas combustiveis automotivos', 'postos revendedores combustiveis ANP'],
}
PAGINAS_GOV = {
    'lpc': ['https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/'
            'levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas',
            'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/'
            'serie-historica-do-levantamento-de-precos-e-de-margens-de-comercializacao-de-combustiveis'],
    'cadastro': ['https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos',
                 'https://www.gov.br/anp/pt-br/assuntos/distribuicao-e-revenda/revendedor'],
}
BASE_LPC = 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/arquivos-lpc'
BASE_LPC_ALT = 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/arquivos-lpc'
# Nome dos arquivos semestrais: ca-AAAA-SS.csv (memória mais forte) ou revendas_lpc_AAAA-SS.csv (variante antiga).
MODELOS_NOME_LPC = ['ca-{ano}-{sem:02d}.csv', 'revendas_lpc_{ano}-{sem:02d}.csv', 'precos-gasolina-etanol-{ano}-{sem:02d}.csv']
RE_RECURSO = {
    'lpc': re.compile(r'lpc|levantamento|serie.hist|ca-\d{4}|pre[cç]os', re.I),
    'cadastro': re.compile(r'revendedor|posto|autorizad|varejist', re.I),
}


def semestres_recentes(hoje=None, quantos=2):
    """[(ano, semestre)] do mais novo ao mais antigo: o semestre atual e o anterior."""
    h = hoje or date.today()
    ano, sem = h.year, 1 if h.month <= 6 else 2
    saida = []
    for _ in range(quantos):
        saida.append((ano, sem))
        sem -= 1
        if sem == 0:
            ano, sem = ano - 1, 2
    return saida


def candidatos_lpc(hoje=None):
    urls = []
    for ano, sem in semestres_recentes(hoje):
        for base in (BASE_LPC, BASE_LPC_ALT):
            for modelo in MODELOS_NOME_LPC:
                urls.append(f'{base}/{ano}/{modelo.format(ano=ano, sem=sem)}')
    return urls


def links_de_dados(html, base=''):
    """href de arquivos de dados (csv/xlsx/zip) numa página."""
    achados = re.findall(r'href=["\']([^"\']+\.(?:csv|xlsx?|zip)(?:\?[^"\']*)?)["\']', html or '', re.I)
    saida = []
    for h in achados:
        if h.startswith('//'):
            h = 'https:' + h
        elif h.startswith('/'):
            m = re.match(r'(https?://[^/]+)', base)
            h = (m.group(1) if m else '') + h
        if h not in saida:
            saida.append(h)
    return saida


def recursos_do_pacote(pacote):
    """URLs de recursos csv/xlsx de um pacote CKAN (resposta de package_show/package_search)."""
    urls = []
    for r in (pacote or {}).get('resources', []) or []:
        url = (r.get('url') or '').strip()
        fmt = (r.get('format') or '').lower()
        if url and (fmt in ('csv', 'xls', 'xlsx', 'zip') or re.search(r'\.(csv|xlsx?|zip)(\?|$)', url, re.I)):
            urls.append(url)
    return urls


def descobrir(sessao, log=print, hoje=None):
    """Tenta a API CKAN e as páginas do gov.br. Devolve {'lpc': [urls], 'cadastro': [urls]} e escreve o log."""
    achados = {'lpc': [], 'cadastro': []}

    def pegar_json(url, params=None):
        try:
            r = sessao.get(url, params=params, headers={'User-Agent': AGENTE, 'Accept': 'application/json'}, timeout=60)
            log(f'GET {r.url} -> {r.status_code}')
            return r.json() if r.status_code == 200 else None
        except Exception as e:  # rede ou JSON inválido
            log(f'GET {url} falhou ({type(e).__name__})')
            return None

    for chave, slugs in (('lpc', PACOTES_LPC), ('cadastro', PACOTES_CADASTRO)):
        for slug in slugs:
            j = pegar_json(f'{CKAN}/package_show', {'id': slug})
            if j and j.get('success'):
                urls = recursos_do_pacote(j.get('result'))
                log(f'[{chave}] pacote {slug}: {len(urls)} recursos {urls[:6]}')
                achados[chave] += urls
        for q in BUSCAS_CKAN[chave]:
            j = pegar_json(f'{CKAN}/package_search', {'q': q, 'rows': 10})
            for p in ((j or {}).get('result') or {}).get('results', []) or []:
                urls = [u for u in recursos_do_pacote(p) if RE_RECURSO[chave].search(u + ' ' + (p.get('title') or ''))]
                log(f'[{chave}] busca "{q}": {p.get("name")} -> {len(urls)} recursos')
                achados[chave] += urls
        for pagina in PAGINAS_GOV[chave]:
            try:
                r = sessao.get(pagina, headers={'User-Agent': AGENTE}, timeout=60)
                log(f'GET {pagina} -> {r.status_code}')
                if r.status_code == 200:
                    urls = [u for u in links_de_dados(r.text, pagina) if RE_RECURSO[chave].search(u)]
                    log(f'[{chave}] página: {len(urls)} links {urls[:8]}')
                    achados[chave] += urls
            except Exception as e:
                log(f'GET {pagina} falhou ({type(e).__name__})')
    # Os modelos de URL por semestre vão por último: o que a descoberta achou tem prioridade.
    achados['lpc'] += candidatos_lpc(hoje)
    for k in achados:
        vistos, unicos = set(), []
        for u in achados[k]:
            if u not in vistos:
                vistos.add(u)
                unicos.append(u)
        achados[k] = unicos
    achados['lpc'] = ordenar_recentes(achados['lpc'])
    achados['cadastro'] = ordenar_recentes(achados['cadastro'])
    return achados


# ---------------------------------------------------------------- leitura de tabelas

def sem_acento(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s or '')) if unicodedata.category(c) != 'Mn')


def chave_coluna(nome):
    k = re.sub(r'[^A-Z0-9]', '', sem_acento(nome).upper())
    # Preço de venda aparece com vários nomes ("PREÇO DE REVENDA", "PREÇO DE VENDA (R$/l)", "VALOR DE VENDA R$"...)
    if 'COMPRA' not in k and (k.startswith('PRECO') or k.startswith('VALORDEVENDA') or k.startswith('VALORVENDA')):
        return 'PRECODEVENDA'
    return k


ALIASES = {
    'cnpj': ['CNPJ', 'CNPJDAREVENDA', 'CNPJREVENDA', 'CNPJDORESPONSAVEL'],
    'razao': ['RAZAOSOCIAL', 'REVENDA', 'RAZAOSOCIALREVENDA', 'AGENTEECONOMICO'],
    'fantasia': ['NOMEFANTASIA', 'FANTASIA', 'NOMEDEFANTASIA'],
    'rua': ['NOMEDARUA', 'LOGRADOURO', 'ENDERECO', 'RUA'],
    'numero': ['NUMERORUA', 'NUMERO', 'NUMEROENDERECO'],
    'complemento': ['COMPLEMENTO'],
    'bairro': ['BAIRRO'],
    'municipio': ['MUNICIPIO', 'CIDADE', 'MUNICIPIOREVENDA'],
    'uf': ['ESTADOSIGLA', 'UF', 'SIGLAUF', 'ESTADO'],
    'cep': ['CEP'],
    'bandeira': ['BANDEIRA', 'DISTRIBUIDORA', 'BANDEIRAREVENDA'],
    'produto': ['PRODUTO'],
    'data': ['DATADACOLETA', 'DATACOLETA', 'DATA'],
    'valor': ['VALORDEVENDA', 'PRECOREVENDA', 'PRECODEVENDA', 'VALORVENDA'],
    'lat': ['LATITUDE', 'LAT'],
    'lng': ['LONGITUDE', 'LONG', 'LNG', 'LON'],
}


def decodificar(bruto):
    """ANP costuma publicar em latin-1/cp1252; tenta UTF-8 (com BOM) primeiro."""
    if isinstance(bruto, str):
        return bruto
    for cod in ('utf-8-sig', 'cp1252', 'latin-1'):
        try:
            return bruto.decode(cod)
        except UnicodeDecodeError:
            continue
    return bruto.decode('latin-1', errors='replace')


def detectar_separador(linha):
    contagens = {s: linha.count(s) for s in (';', ',', '\t', '|')}
    melhor = max(contagens, key=contagens.get)
    return melhor if contagens[melhor] > 0 else ';'


def linhas_csv(texto):
    """Gera dicts com os nomes de coluna já mapeados para as chaves internas (ALIASES)."""
    f = io.StringIO(texto)
    primeira = f.readline()
    sep = detectar_separador(primeira)
    f.seek(0)
    leitor = csv.reader(f, delimiter=sep)
    cab = next(leitor, None)
    if not cab:
        return
    chaves = [chave_coluna(c) for c in cab]
    indice = {}
    for interno, nomes in ALIASES.items():
        for n in nomes:  # a ordem de ALIASES é a de preferência
            if n in chaves:
                indice[interno] = chaves.index(n)
                break
    for linha in leitor:
        if not linha or not any(c.strip() for c in linha):
            continue
        yield {k: (linha[i].strip() if i < len(linha) else '') for k, i in indice.items()}


def pular_titulo(texto, max_linhas=40):
    """Planilhas da ANP têm linhas de título antes da tabela: começa na primeira linha que parece cabeçalho."""
    linhas = texto.split('\n')
    for k in range(min(max_linhas, len(linhas))):
        if len(colunas_presentes(linhas[k])) >= 3:
            return '\n'.join(linhas[k:])
    return texto


def ordenar_recentes(urls):
    """Arquivos mais novos primeiro (pelo ano e pelas datas no nome); por semana as revendas antes do resumo."""
    def chave(u):
        anos = [int(a) for a in re.findall(r'20\d\d', u)] or [0]
        datas = re.findall(r'\d{4}-\d{2}-\d{2}', u)
        return (max(anos), max(datas) if datas else '', 'revenda' in u.lower(), u)
    return sorted(dict.fromkeys(urls), key=chave, reverse=True)


def colunas_presentes(texto):
    cab = texto.split('\n', 1)[0]
    sep = detectar_separador(cab)
    chaves = [chave_coluna(c) for c in cab.split(sep)]
    return [k for k, nomes in ALIASES.items() if any(n in chaves for n in nomes)]


def numero_br(v):
    """'6,29' -> 6.29; '1.234,56' -> 1234.56; '6.29' -> 6.29. Vazio/ruim -> None."""
    t = str(v or '').strip().replace('R$', '').strip()
    if not t:
        return None
    if ',' in t:
        t = t.replace('.', '').replace(',', '.')
    try:
        n = float(t)
    except ValueError:
        return None
    return n if math.isfinite(n) else None


def data_iso(v):
    t = str(v or '').strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d/%m/%y', '%d-%m-%Y'):
        try:
            return datetime.strptime(t[:10], fmt).date().isoformat()
        except ValueError:
            continue
    return None


def so_digitos(v):
    return re.sub(r'\D', '', str(v or ''))


def cnpj_valido(v):
    d = so_digitos(v)
    return d if len(d) == 14 else None


PRODUTOS = {
    'GASOLINA': 'gasolina_comum', 'GASOLINA COMUM': 'gasolina_comum',
    'GASOLINA ADITIVADA': 'gasolina_aditivada',
    'ETANOL': 'etanol', 'ETANOL HIDRATADO': 'etanol', 'ALCOOL': 'etanol',
    'DIESEL': 'diesel', 'OLEO DIESEL': 'diesel',
    'DIESEL S10': 'diesel_s10', 'OLEO DIESEL S10': 'diesel_s10', 'DIESEL S 10': 'diesel_s10',
    'OLEO DIESEL S 10': 'diesel_s10',
    'GNV': 'gnv',
}


def produto_normalizado(v):
    t = re.sub(r'\s+', ' ', sem_acento(v).upper().replace('-', ' ')).strip()
    return PRODUTOS.get(t)


def maiuscula_inicial(s):
    """'POSTO TREVO LTDA' -> 'Posto Trevo LTDA' (preposições em minúscula, siglas societárias em maiúscula)."""
    peq = {'de', 'do', 'da', 'dos', 'das', 'e'}
    sig = {'ltda', 'me', 'epp', 'sa', 'eireli', 'br'}
    out = []
    for i, w in enumerate(str(s or '').lower().split()):
        out.append(w if (w in peq and i) else (w.upper() if w in sig else w.capitalize()))
    return ' '.join(out)


def parse_lpc(linhas, ufs, hoje=None, max_idade_dias=None):
    """
    Linhas do LPC -> {cnpj: {'meta': {...}, 'precos': {produto: {'valor', 'data_coleta'}}}} (só UFs pedidas).
    Para cada produto fica o preço de coleta mais recente. Descarta preços absurdos (fora de 1–30 R$).
    """
    ufs = set(ufs)
    saida = {}
    h = hoje or date.today()
    for l in linhas:
        uf = (l.get('uf') or '').strip().upper()
        if uf not in ufs:
            continue
        cnpj = cnpj_valido(l.get('cnpj'))
        prod = produto_normalizado(l.get('produto'))
        valor = numero_br(l.get('valor'))
        data = data_iso(l.get('data'))
        if not cnpj or not prod or valor is None or not data or not (1 <= valor <= 30):
            continue
        if max_idade_dias is not None and (h - date.fromisoformat(data)).days > max_idade_dias:
            continue
        reg = saida.setdefault(cnpj, {'meta': {}, 'precos': {}})
        m = reg['meta']
        for k in ('razao', 'rua', 'numero', 'complemento', 'bairro', 'municipio', 'cep', 'bandeira'):
            if l.get(k) and not m.get(k):
                m[k] = l[k]
        m['uf'] = uf
        atual = reg['precos'].get(prod)
        if not atual or data > atual['data_coleta']:
            reg['precos'][prod] = {'valor': round(valor, 3), 'data_coleta': data}
    return saida


def parse_cadastro(linhas, ufs):
    """Linhas do cadastro -> {cnpj: meta}. Aceita colunas de latitude/longitude se existirem."""
    ufs = set(ufs)
    saida = {}
    for l in linhas:
        uf = (l.get('uf') or '').strip().upper()
        cnpj = cnpj_valido(l.get('cnpj'))
        if uf not in ufs or not cnpj:
            continue
        m = {k: l[k] for k in ('razao', 'fantasia', 'rua', 'numero', 'complemento', 'bairro', 'municipio', 'cep',
                               'bandeira') if l.get(k)}
        m['uf'] = uf
        lat, lng = numero_br(l.get('lat')), numero_br(l.get('lng'))
        if lat is not None and lng is not None and -35 <= lat <= 6 and -75 <= lng <= -30:
            m['lat'], m['lng'] = lat, lng
        saida[cnpj] = m
    return saida


def juntar(cadastro, lpc):
    """Cadastro é a base; LPC acrescenta preços e cobre postos que faltam no cadastro."""
    est = {}
    for cnpj, m in cadastro.items():
        est[cnpj] = {'cnpj': cnpj, **m, 'precos': {}}
    for cnpj, reg in lpc.items():
        e = est.setdefault(cnpj, {'cnpj': cnpj, **reg['meta'], 'precos': {}})
        for k, v in reg['meta'].items():
            e.setdefault(k, v)
        e['precos'] = reg['precos']
    for e in est.values():
        e['nome'] = maiuscula_inicial(e.get('fantasia') or e.get('razao') or 'Posto')[:200]
        e['bandeira_exibicao'] = maiuscula_inicial(e.get('bandeira') or '') or None
    return est


# ---------------------------------------------------------------- casamento com o OpenStreetMap

GENERICAS = set('''POSTO POSTOS AUTO CENTRO COMERCIO COMERCIAL LTDA EIRELI ME EPP SA S A DE DO DA DOS DAS E
COMBUSTIVEIS COMBUSTIVEL DERIVADOS PETROLEO REDE SERVICOS SERVICO LUBRIFICANTES DISTRIBUIDORA GRUPO IRMAOS FILHOS
FILHO E CIA EM NO NA MOTO MOTORES CONVENIENCIA LOJA'''.split())
MARCAS = set('''IPIRANGA SHELL PETROBRAS BR RAIZEN ALE VIBRA TEXACO ATEM CHARRUA TOTAL DAKAR ALESAT AMERICANOAS
RODOIL SABBA'''.split())


def normalizar(s):
    return re.sub(r'[^A-Z0-9]+', ' ', sem_acento(s).upper()).strip()


def fichas_nome(s):
    """Palavras que identificam o posto (sem 'Posto', 'Ltda' e sem marcas)."""
    return {t for t in normalizar(s).split() if t not in GENERICAS and t not in MARCAS and len(t) > 1}


def palavras(s):
    return {t for t in normalizar(s).split() if len(t) > 1}


def metros(a_lat, a_lng, b_lat, b_lng):
    dlat = (a_lat - b_lat) * 111320
    dlng = (a_lng - b_lng) * 111320 * math.cos(math.radians((a_lat + b_lat) / 2))
    return math.hypot(dlat, dlng)


def pontuacao_nome(est, osm):
    """Quanto o nome do posto ANP combina com o ponto OSM (0 a 1), ignorando palavras genéricas e marcas."""
    a = fichas_nome(est.get('fantasia') or '') | fichas_nome(est.get('razao') or '')
    b = fichas_nome(osm.get('nome') or '') | fichas_nome((osm.get('extras') or {}).get('marca') or '')
    if not a or not b:
        return 0.0
    return len(a & b) / min(len(a), len(b))


def mesma_marca(est, osm):
    band = palavras(est.get('bandeira') or '') & MARCAS
    if not band:
        return False
    txt = palavras(osm.get('nome') or '') | palavras((osm.get('extras') or {}).get('marca') or '')
    return bool(band & txt)


def casar_por_nome_cidade(est, osm_postos, usados, minimo=0.6, folga=0.25):
    """Etapa 1: mesma cidade e nome parecido (único). Sem endereço no OSM não há como confirmar: só aceita se for claro."""
    cidade = normalizar(est.get('municipio') or '')
    if not cidade:
        return None
    pontuados = []
    for o in osm_postos:
        if o['osm_id'] in usados or normalizar(o.get('cidade') or '') != cidade:
            continue
        s = pontuacao_nome(est, o)
        if s >= minimo:
            pontuados.append((s, o))
    if not pontuados:
        return None
    pontuados.sort(key=lambda x: -x[0])
    if len(pontuados) > 1 and pontuados[0][0] - pontuados[1][0] < folga:
        return None  # ambíguo: deixa para a distância
    return pontuados[0][1]


def casar_por_distancia(lat, lng, est, osm_postos, usados, raio=150):
    """Etapa 2: com coordenadas (do ANP ou geocodificadas). Aceita o mais perto que tenha nome ou marca compatível,
    ou o único posto OSM a menos de 60 m."""
    perto = []
    for o in osm_postos:
        if o['osm_id'] in usados:
            continue
        d = metros(lat, lng, o['lat'], o['lon'])
        if d <= raio:
            perto.append((d, o))
    perto.sort(key=lambda x: x[0])
    for d, o in perto:
        if pontuacao_nome(est, o) >= 0.5 or mesma_marca(est, o):
            return o
    if len(perto) == 1 and perto[0][0] <= 60:
        return perto[0][1]
    return None


# ---------------------------------------------------------------- geocodificação (Nominatim, com cache)

ABREV = [(r'^AV\.?\s', 'Avenida '), (r'^R\.?\s', 'Rua '), (r'^ROD\.?\s', 'Rodovia '), (r'^TRAV\.?\s', 'Travessa '),
         (r'^PC\.?\s|^PCA\.?\s', 'Praça '), (r'^EST\.?\s', 'Estrada '), (r'^AL\.?\s', 'Alameda '),
         (r'^LRG\.?\s', 'Largo '), (r'^VL\.?\s', 'Vila ')]


def expandir_rua(rua):
    t = re.sub(r'\s+', ' ', str(rua or '').strip())
    for padrao, troca in ABREV:
        if re.match(padrao, t, re.I):
            return re.sub(padrao, troca, t, flags=re.I).strip()
    return t


def numero_util(n):
    t = str(n or '').strip()
    if not t or re.search(r'S\s*/?\s*N|SN|KM', t, re.I):
        return ''
    return re.sub(r'[^0-9]', '', t)[:6]


def consultas_geocode(est):
    """Tentativas em ordem de precisão: (nivel, params). Rua com número, rua, bairro."""
    uf, cidade = est.get('uf'), (est.get('municipio') or '').strip().title()
    estado = UF_NOME.get(uf, uf)
    base = {'city': cidade, 'state': estado, 'country': 'Brasil'}
    saida = []
    rua = expandir_rua(est.get('rua') or '')
    if rua and cidade:
        n = numero_util(est.get('numero'))
        if n:
            saida.append(('endereco', {**base, 'street': f'{n} {rua}'}))
        saida.append(('rua', {**base, 'street': rua}))
    if est.get('bairro') and cidade:
        saida.append(('bairro', {'q': f'{est["bairro"].strip().title()}, {cidade}, {estado}, Brasil'}))
    return saida


def chave_cache(params):
    return json.dumps(params, sort_keys=True, ensure_ascii=False)


class Geocodificador:
    """Nominatim: 1 requisição por segundo, User-Agent próprio, cache em arquivo (positivo e negativo)."""

    def __init__(self, sessao=None, cache=None, limite=1500, pausa=1.1, dormir=time.sleep):
        self.sessao, self.cache = sessao, cache if cache is not None else {}
        self.limite, self.pausa, self.dormir = limite, pausa, dormir
        self.requisicoes = 0
        self.ultima = 0.0

    @property
    def esgotado(self):
        return self.requisicoes >= self.limite

    def _buscar(self, params, uf):
        k = chave_cache(params)
        if k in self.cache:
            return self.cache[k]
        if self.esgotado:
            return 'adiado'
        espera = self.pausa - (time.monotonic() - self.ultima)
        if espera > 0:
            self.dormir(espera)
        self.ultima = time.monotonic()
        self.requisicoes += 1
        try:
            r = self.sessao.get(NOMINATIM, params={**params, 'format': 'jsonv2', 'limit': 1, 'addressdetails': 1,
                                                  'countrycodes': 'br'},
                                headers={'User-Agent': AGENTE, 'Accept-Language': 'pt-BR'}, timeout=60)
        except Exception as e:
            print(f'Nominatim falhou ({type(e).__name__})', file=sys.stderr)
            return 'adiado'  # erro de rede não vira cache negativo
        if r.status_code in (429, 503):
            self.limite = self.requisicoes  # pediram para parar
            return 'adiado'
        if r.status_code != 200:
            return 'adiado'
        res = None
        for item in r.json() or []:
            iso = (item.get('address') or {}).get('ISO3166-2-lvl4')
            if iso and iso != f'BR-{uf}':
                continue  # achou outro estado: descarta
            res = {'lat': round(float(item['lat']), 6), 'lng': round(float(item['lon']), 6)}
            break
        self.cache[k] = res
        return res

    def localizar(self, est):
        """(lat, lng, precisao) ou None se não achou; 'adiado' se o limite desta rodada acabou antes de decidir."""
        pendente = False
        for nivel, params in consultas_geocode(est):
            r = self._buscar(params, est.get('uf'))
            if r == 'adiado':
                pendente = True
                break
            if r:
                return r['lat'], r['lng'], nivel
        return 'adiado' if pendente else None


def carregar_cache(arq=CACHE_GEO):
    try:
        return json.loads(Path(arq).read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {}


def salvar_cache(cache, arq=CACHE_GEO):
    Path(arq).parent.mkdir(parents=True, exist_ok=True)
    Path(arq).write_text(json.dumps(cache, ensure_ascii=False), encoding='utf-8')


# ---------------------------------------------------------------- processamento

CIDADES_PRIORITARIAS = ['CUIABA', 'VARZEA GRANDE']


def ordem_de_prioridade(est):
    """Primeiro quem tem preço (mais útil), depois Cuiabá e Várzea Grande."""
    cidade = normalizar(est.get('municipio') or '')
    return (0 if est.get('precos') else 1, 0 if cidade in CIDADES_PRIORITARIAS else 1, cidade, est['cnpj'])


def linha_do_banco(est, lat, lng, precisao, osm_id=None):
    end = ', '.join(x for x in [
        ' '.join(x for x in [expandir_rua(est.get('rua') or ''), numero_util(est.get('numero')) or ''] if x),
        (est.get('bairro') or '').title()] if x)
    return {
        'cnpj': est['cnpj'],
        'nome': est['nome'],
        'bandeira': est.get('bandeira_exibicao'),
        'endereco': end[:300] or None,
        'municipio': maiuscula_inicial(est.get('municipio') or '')[:100] or None,
        'uf': est['uf'],
        'lat': round(lat, 6),
        'lng': round(lng, 6),
        'precisao': precisao,
        'osm_id': osm_id,
        'precos': est.get('precos') or {},
    }


def processar(estacoes, osm_postos, geo=None):
    """
    estacoes: {cnpj: dict}; osm_postos: lista de {'osm_id','nome','lat','lon','cidade','extras'} (mesma UF ou todas).
    Devolve (linhas, sem_local): linhas prontas para a tabela; sem_local = quantos ficaram sem coordenadas.
    """
    usados, linhas, sem_local = set(), [], 0
    lista = sorted(estacoes.values(), key=ordem_de_prioridade)
    pendentes = []
    # Etapa 1: coordenadas do ANP (se houver) ou nome + cidade.
    for est in lista:
        if 'lat' in est and 'lng' in est:
            o = casar_por_distancia(est['lat'], est['lng'], est, osm_postos, usados)
            if o:
                usados.add(o['osm_id'])
                linhas.append(linha_do_banco(est, o['lat'], o['lon'], 'osm', o['osm_id']))
            else:
                linhas.append(linha_do_banco(est, est['lat'], est['lng'], 'anp'))
            continue
        o = casar_por_nome_cidade(est, osm_postos, usados)
        if o:
            usados.add(o['osm_id'])
            linhas.append(linha_do_banco(est, o['lat'], o['lon'], 'osm', o['osm_id']))
        else:
            pendentes.append(est)
    # Etapa 2: geocodifica o resto (limitado por rodada) e tenta casar por distância.
    for est in pendentes:
        r = geo.localizar(est) if geo else None
        if r is None or r == 'adiado':
            sem_local += 1
            continue
        lat, lng, nivel = r
        o = casar_por_distancia(lat, lng, est, osm_postos, usados) if nivel == 'endereco' else None
        if o:
            usados.add(o['osm_id'])
            linhas.append(linha_do_banco(est, o['lat'], o['lon'], 'osm', o['osm_id']))
        else:
            linhas.append(linha_do_banco(est, lat, lng, nivel))
    return linhas, sem_local


def atualizar_precos(linhas_existentes, lpc):
    """Modo semanal: troca só os preços das linhas que já estão no banco (os que o LPC trouxe)."""
    saida = []
    for l in linhas_existentes:
        reg = lpc.get(l['cnpj'])
        if reg and reg['precos']:
            novos = {**(l.get('precos') or {}), **reg['precos']}
            l = {**l, 'precos': novos}
        saida.append(l)
    return saida


# ---------------------------------------------------------------- rede (somente no Actions)

def baixar(sessao, url, destino, log=print):
    """Baixa em disco (stream). Devolve o caminho ou None. Rejeita HTML de erro."""
    try:
        with sessao.get(url, headers={'User-Agent': AGENTE}, stream=True, timeout=300) as r:
            log(f'download {url} -> {r.status_code} {r.headers.get("content-type", "")}')
            if r.status_code != 200 or 'text/html' in r.headers.get('content-type', ''):
                return None
            with open(destino, 'wb') as f:
                for bloco in r.iter_content(1 << 20):
                    f.write(bloco)
        return destino
    except Exception as e:
        log(f'download {url} falhou ({type(e).__name__})')
        return None


def ler_arquivo(caminho):
    """CSV (latin-1/UTF-8), XLSX ou ZIP (primeiro CSV/XLSX de dentro) -> texto CSV."""
    import zipfile
    bruto = Path(caminho).read_bytes()
    if bruto[:2] != b'PK':
        return decodificar(bruto)
    if str(caminho).lower().endswith('.xlsx'):
        return xlsx_para_csv(caminho)
    with zipfile.ZipFile(caminho) as z:
        for n in z.namelist():
            if n.lower().endswith('.csv'):
                return decodificar(z.read(n))
            if n.lower().endswith('.xlsx'):
                dest = SAIDA / 'interno.xlsx'
                dest.write_bytes(z.read(n))
                return xlsx_para_csv(str(dest))
    raise ValueError('zip sem csv/xlsx')


def xlsx_para_csv(caminho):
    import openpyxl
    wb = openpyxl.load_workbook(caminho, read_only=True, data_only=True, keep_links=False)
    out = io.StringIO()
    w = csv.writer(out, delimiter=';')
    for linha in wb.worksheets[0].iter_rows(values_only=True):
        w.writerow(['' if c is None else c for c in linha])
    return out.getvalue()


def cabecalho_do_banco():
    url = os.environ.get('SUPABASE_URL', '').rstrip('/')
    chave = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not url or not chave:
        return None, None
    return url, {'apikey': chave, 'Authorization': f'Bearer {chave}', 'Content-Type': 'application/json'}


def ler_paginado(sessao, url, cab, params, pagina=1000):
    saida, ini = [], 0
    while True:
        r = sessao.get(url, params=params, headers={**cab, 'Range-Unit': 'items', 'Range': f'{ini}-{ini + pagina - 1}'},
                       timeout=120)
        if r.status_code == 404 or (r.status_code == 400 and 'PGRST' in r.text):
            sys.exit(f'Tabela não encontrada ({url.rsplit("/", 1)[-1]}): aplique a migration postos_anp antes.')
        if r.status_code >= 300:
            sys.exit(f'Leitura falhou com status {r.status_code}: {r.text[:300]}')
        lote = r.json()
        saida += lote
        if len(lote) < pagina:
            return saida
        ini += pagina


def ufs_do_banco(sessao, url, cab):
    """UFs que já têm postos em postos_anp (uma consulta barata por UF)."""
    carregadas = []
    for uf in UFS:
        r = sessao.get(f'{url}/rest/v1/postos_anp', params={'select': 'cnpj', 'uf': f'eq.{uf}', 'limit': 1},
                       headers=cab, timeout=60)
        if r.status_code >= 300:
            sys.exit(f'Consulta falhou com status {r.status_code}: {r.text[:200]}')
        if r.json():
            carregadas.append(uf)
    return carregadas


def carregar_tabelas(sessao, achados, ufs, usar_cadastro=True, log=print):
    """Baixa e lê LPC (todos os semestres que existirem) e cadastro. Devolve (lpc, cadastro) já filtrados por UF."""
    SAIDA.mkdir(parents=True, exist_ok=True)
    lpc, cadastro = {}, {}
    baixados = 0
    for i, url in enumerate(achados['lpc']):
        if baixados >= 2 or i >= 40:
            break
        destino = str(SAIDA / f'lpc_{i}{Path(url.split("?")[0]).suffix or ".csv"}')
        if not baixar(sessao, url, destino, log):
            continue
        try:
            texto = pular_titulo(ler_arquivo(destino))
        except Exception as e:  # planilha com vínculo externo, corrompida etc.: pula e segue
            log(f'  não consegui ler {url}: {type(e).__name__}: {str(e)[:120]}; ignorado')
            continue
        cols = colunas_presentes(texto)
        (SAIDA / f'amostra_lpc_{i}.txt').write_text('\n'.join(texto.split('\n')[:6]), encoding='utf-8')
        log(f'LPC {url}: colunas reconhecidas {cols}')
        if not {'cnpj', 'produto', 'valor', 'data', 'uf'} <= set(cols):
            log('  faltam colunas essenciais; ignorado')
            continue
        baixados += 1
        for cnpj, reg in parse_lpc(linhas_csv(texto), ufs, max_idade_dias=180).items():
            atual = lpc.setdefault(cnpj, {'meta': reg['meta'], 'precos': {}})
            for p, v in reg['precos'].items():  # o semestre mais novo vem primeiro; vale a coleta mais recente
                if p not in atual['precos'] or v['data_coleta'] > atual['precos'][p]['data_coleta']:
                    atual['precos'][p] = v
    if not usar_cadastro:
        return lpc, cadastro
    for i, url in enumerate(achados['cadastro']):
        destino = str(SAIDA / f'cadastro_{i}{Path(url.split("?")[0]).suffix or ".csv"}')
        if not baixar(sessao, url, destino, log):
            continue
        try:
            texto = pular_titulo(ler_arquivo(destino))
        except Exception as e:  # planilha com vínculo externo, corrompida etc.: pula e segue
            log(f'  não consegui ler {url}: {type(e).__name__}: {str(e)[:120]}; ignorado')
            continue
        cols = colunas_presentes(texto)
        (SAIDA / f'amostra_cadastro_{i}.txt').write_text('\n'.join(texto.split('\n')[:6]), encoding='utf-8')
        log(f'Cadastro {url}: colunas reconhecidas {cols}')
        if not {'cnpj', 'uf'} <= set(cols) or not ({'rua', 'municipio'} <= set(cols)):
            log('  faltam colunas essenciais; ignorado')
            continue
        cadastro = parse_cadastro(linhas_csv(texto), ufs)
        log(f'  {len(cadastro)} postos no cadastro (lat/lng no arquivo: {"sim" if "lat" in cols else "nao"})')
        break
    return lpc, cadastro


def enviar(sessao, url, cab, uf, linhas, lote=500):
    cab = {**cab, 'Prefer': 'resolution=merge-duplicates,return=minimal'}
    for i in range(0, len(linhas), lote):
        r = sessao.post(f'{url}/rest/v1/postos_anp?on_conflict=cnpj', headers=cab,
                        data=json.dumps(linhas[i:i + lote]), timeout=120)
        if r.status_code >= 300:  # não imprime cabeçalhos nem a chave
            sys.exit(f'{uf}: envio falhou com status {r.status_code}: {r.text[:300]}')
    print(f'{uf}: {len(linhas)} enviados')


def main(argv=None):
    import requests
    p = argparse.ArgumentParser()
    p.add_argument('--ufs', default='MT')
    p.add_argument('--descobrir', action='store_true')
    p.add_argument('--coletar', action='store_true')
    p.add_argument('--enviar', action='store_true')
    p.add_argument('--modo', default='completo', choices=['completo', 'precos'])
    p.add_argument('--max-geocodes', type=int, default=1500)
    a = p.parse_args(argv)
    SAIDA.mkdir(parents=True, exist_ok=True)
    sessao = requests.Session()
    url, cab = cabecalho_do_banco()

    if a.ufs.strip().lower() == 'banco':
        if not url:
            sys.exit('--ufs banco precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
        ufs = ufs_do_banco(sessao, url, cab)
        print(f'UFs já carregadas: {ufs}')
        if not ufs:
            return
    else:
        ufs = [u.strip().upper() for u in a.ufs.split(',') if u.strip()]
        invalidos = [u for u in ufs if u not in UFS]
        if invalidos:
            sys.exit(f'UFs inválidas: {invalidos}')

    if a.coletar or a.descobrir or not a.enviar:
        with open(SAIDA / 'descoberta.log', 'w', encoding='utf-8') as arq_log:
            def log(msg):
                print(msg)
                arq_log.write(msg + '\n')
                arq_log.flush()

            achados = descobrir(sessao, log)
            log(f'Candidatos LPC: {achados["lpc"][:12]}')
            log(f'Candidatos cadastro: {achados["cadastro"][:12]}')
            if a.descobrir and not a.coletar:
                return
            lpc, cadastro = carregar_tabelas(sessao, achados, ufs, usar_cadastro=a.modo == 'completo', log=log)
            log(f'LPC: {len(lpc)} postos com preço nas UFs {ufs}; cadastro: {len(cadastro)} postos')
            if not lpc and not cadastro:
                sys.exit('Nenhuma tabela da ANP foi lida; veja descoberta.log (as URLs podem ter mudado).')

            if a.modo == 'precos':
                if not url:
                    sys.exit('Modo precos precisa do banco (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).')
                for uf in ufs:
                    campos = 'cnpj,nome,bandeira,endereco,municipio,uf,lat,lng,precisao,osm_id,precos'
                    atuais = ler_paginado(sessao, f'{url}/rest/v1/postos_anp', cab, {'select': campos, 'uf': f'eq.{uf}',
                                                                                      'order': 'cnpj'})
                    novas = atualizar_precos(atuais, lpc)
                    (SAIDA / f'{uf}.ndjson').write_text('\n'.join(json.dumps(l, ensure_ascii=False) for l in novas),
                                                       encoding='utf-8')
                    log(f'{uf}: {len(novas)} postos no banco, preços atualizados em '
                        f'{sum(1 for l in novas if l["cnpj"] in lpc)}')
            else:
                cache = carregar_cache()
                geo = Geocodificador(sessao, cache, limite=a.max_geocodes)
                for uf in ufs:
                    est = juntar({c: m for c, m in cadastro.items() if m['uf'] == uf},
                                 {c: r for c, r in lpc.items() if r['meta'].get('uf') == uf})
                    osm = []
                    if url:
                        osm = ler_paginado(sessao, f'{url}/rest/v1/pontos_osm', cab,
                                           {'select': 'osm_id,nome,lat,lon,extras,cidade', 'tipo': 'eq.posto',
                                            'uf': f'eq.{uf}', 'order': 'osm_id'})
                    linhas, sem_local = processar(est, osm, geo)
                    (SAIDA / f'{uf}.ndjson').write_text('\n'.join(json.dumps(l, ensure_ascii=False) for l in linhas),
                                                       encoding='utf-8')
                    log(f'{uf}: {len(est)} postos ANP, {len(osm)} postos OSM, {len(linhas)} com local '
                        f'({sum(1 for l in linhas if l["osm_id"])} casados com o OSM), {sem_local} sem local '
                        f'(geocodes usados: {geo.requisicoes}/{geo.limite})')
                    salvar_cache(cache)
    if a.enviar:
        if not url:
            sys.exit('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
        for uf in ufs:
            arq = SAIDA / f'{uf}.ndjson'
            if not arq.exists():
                print(f'{uf}: sem arquivo, pulando')
                continue
            linhas = [json.loads(x) for x in arq.read_text(encoding='utf-8').splitlines() if x.strip()]
            enviar(sessao, url, cab, uf, linhas)


if __name__ == '__main__':
    main()
