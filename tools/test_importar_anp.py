import json
import unittest
from datetime import date

import importar_anp as m

LPC = (
    'REGIÃO - SIGLA;ESTADO - SIGLA;MUNICÍPIO;REVENDA;CNPJ DA REVENDA;NOME DA RUA;NÚMERO RUA;COMPLEMENTO;BAIRRO;CEP;'
    'PRODUTO;DATA DA COLETA;VALOR DE VENDA;VALOR DE COMPRA;UNIDADE DE MEDIDA;BANDEIRA\n'
    'CO;MT;CUIABÁ;POSTO TREVO LTDA;12.345.678/0001-90;AV ISSAC PÓVOAS;1200;;CENTRO NORTE;78000-000;GASOLINA;'
    '03/11/2026;6,29;;R$/l;IPIRANGA\n'
    'CO;MT;CUIABÁ;POSTO TREVO LTDA;12.345.678/0001-90;AV ISSAC PÓVOAS;1200;;CENTRO NORTE;78000-000;GASOLINA;'
    '10/11/2026;6,35;;R$/l;IPIRANGA\n'
    'CO;MT;CUIABÁ;POSTO TREVO LTDA;12.345.678/0001-90;AV ISSAC PÓVOAS;1200;;CENTRO NORTE;78000-000;ETANOL;'
    '10/11/2026;4,19;;R$/l;IPIRANGA\n'
    'CO;MT;CUIABÁ;POSTO TREVO LTDA;12.345.678/0001-90;AV ISSAC PÓVOAS;1200;;CENTRO NORTE;78000-000;DIESEL S10;'
    '10/11/2026;6,05;;R$/l;IPIRANGA\n'
    'SE;SP;SÃO PAULO;OUTRO POSTO;98.765.432/0001-10;RUA A;1;;X;01000-000;GASOLINA;10/11/2026;5,99;;R$/l;BRANCA\n'
    'CO;MT;CUIABÁ;POSTO SEM DATA;11.111.111/0001-11;RUA B;2;;Y;78000-000;GASOLINA;;6,00;;R$/l;BRANCA\n'
)
HOJE = date(2026, 11, 13)


class Leitura(unittest.TestCase):
    def test_decodifica_latin1_e_utf8(self):
        self.assertEqual(m.decodificar('Cuiabá'.encode('latin-1')), 'Cuiabá')
        self.assertEqual(m.decodificar('﻿Cuiabá'.encode('utf-8')), 'Cuiabá')

    def test_separador_e_colunas_com_acento(self):
        texto = LPC.replace(';', ',') if False else LPC
        linhas = list(m.linhas_csv(m.decodificar(texto.encode('latin-1', errors='replace'))))
        self.assertEqual(linhas[0]['municipio'].upper()[:3], 'CUI')
        self.assertEqual(linhas[0]['cnpj'], '12.345.678/0001-90')
        self.assertEqual(m.detectar_separador('a,b,c'), ',')
        self.assertEqual(m.detectar_separador('a;b;c'), ';')
        self.assertEqual(m.detectar_separador('a\tb'), '\t')

    def test_csv_com_virgula_e_cabecalho_do_cadastro(self):
        t = 'CNPJ,Razão Social,Nome Fantasia,Endereço,Bairro,Município,UF,CEP,Bandeira\n' \
            '12345678000190,POSTO A LTDA,POSTO A,"AV X, 10",CENTRO,CUIABA,MT,78000000,BRANCA\n'
        l = list(m.linhas_csv(t))[0]
        self.assertEqual(l['rua'], 'AV X, 10')
        self.assertEqual(l['fantasia'], 'POSTO A')
        self.assertEqual(set(m.colunas_presentes(t)) >= {'cnpj', 'uf', 'rua', 'municipio'}, True)

    def test_numeros_e_datas(self):
        self.assertEqual(m.numero_br('6,29'), 6.29)
        self.assertEqual(m.numero_br('1.234,56'), 1234.56)
        self.assertEqual(m.numero_br('6.29'), 6.29)
        self.assertIsNone(m.numero_br('abc'))
        self.assertEqual(m.data_iso('03/11/2026'), '2026-11-03')
        self.assertEqual(m.data_iso('2026-11-03'), '2026-11-03')
        self.assertIsNone(m.data_iso(''))
        self.assertEqual(m.cnpj_valido('12.345.678/0001-90'), '12345678000190')
        self.assertIsNone(m.cnpj_valido('123'))

    def test_produtos(self):
        self.assertEqual(m.produto_normalizado('GASOLINA'), 'gasolina_comum')
        self.assertEqual(m.produto_normalizado('Gasolina Aditivada'), 'gasolina_aditivada')
        self.assertEqual(m.produto_normalizado('ETANOL HIDRATADO'), 'etanol')
        self.assertEqual(m.produto_normalizado('ÓLEO DIESEL S-10'), 'diesel_s10')
        self.assertIsNone(m.produto_normalizado('GLP'))


class Precos(unittest.TestCase):
    def setUp(self):
        self.lpc = m.parse_lpc(m.linhas_csv(LPC), ['MT'], hoje=HOJE, max_idade_dias=180)

    def test_filtra_uf_e_linhas_sem_data(self):
        self.assertEqual(list(self.lpc), ['12345678000190'])

    def test_fica_o_preco_mais_recente_por_produto(self):
        p = self.lpc['12345678000190']['precos']
        self.assertEqual(p['gasolina_comum'], {'valor': 6.35, 'data_coleta': '2026-11-10'})
        self.assertEqual(p['etanol']['valor'], 4.19)
        self.assertEqual(p['diesel_s10']['valor'], 6.05)

    def test_descarta_preco_velho_e_absurdo(self):
        velho = m.parse_lpc(m.linhas_csv(LPC), ['MT'], hoje=date(2027, 6, 1), max_idade_dias=60)
        self.assertEqual(velho, {})
        absurdo = LPC.replace('6,35', '635,00').replace('6,29', '635,00')
        p = m.parse_lpc(m.linhas_csv(absurdo), ['MT'], hoje=HOJE)['12345678000190']['precos']
        self.assertNotIn('gasolina_comum', p)

    def test_juntar_cadastro_e_precos(self):
        cad = {'12345678000190': {'uf': 'MT', 'fantasia': 'AUTO POSTO TREVO', 'municipio': 'CUIABA', 'rua': 'AV X'},
               '22222222000122': {'uf': 'MT', 'razao': 'POSTO SEM PRECO LTDA', 'municipio': 'CUIABA'}}
        est = m.juntar(cad, self.lpc)
        self.assertEqual(est['12345678000190']['nome'], 'Auto Posto Trevo')
        self.assertEqual(est['12345678000190']['precos']['etanol']['valor'], 4.19)
        self.assertEqual(est['22222222000122']['precos'], {})
        self.assertEqual(est['22222222000122']['nome'], 'Posto Sem Preco LTDA')

    def test_lpc_sozinho_cria_o_posto(self):
        est = m.juntar({}, self.lpc)
        self.assertEqual(est['12345678000190']['nome'], 'Posto Trevo LTDA')
        self.assertEqual(est['12345678000190']['bandeira_exibicao'], 'Ipiranga')

    def test_atualizar_precos_so_muda_o_que_o_lpc_trouxe(self):
        antigas = [{'cnpj': '12345678000190', 'precos': {'gasolina_comum': {'valor': 1, 'data_coleta': '2026-01-01'},
                                                         'gnv': {'valor': 4, 'data_coleta': '2026-01-01'}}},
                   {'cnpj': '99999999000199', 'precos': {}}]
        novas = m.atualizar_precos(antigas, self.lpc)
        self.assertEqual(novas[0]['precos']['gasolina_comum']['valor'], 6.35)
        self.assertEqual(novas[0]['precos']['gnv']['valor'], 4)
        self.assertEqual(novas[1], antigas[1])


class Cadastro(unittest.TestCase):
    def test_coordenadas_do_arquivo_sao_usadas_se_validas(self):
        t = 'CNPJ;UF;MUNICIPIO;NOME DA RUA;LATITUDE;LONGITUDE\n' \
            '12345678000190;MT;CUIABA;AV X;-15,60;-56,10\n' \
            '22222222000122;MT;CUIABA;AV Y;0;0\n' \
            '33333333000133;SP;SAO PAULO;AV Z;-23,5;-46,6\n'
        c = m.parse_cadastro(m.linhas_csv(t), ['MT'])
        self.assertEqual(c['12345678000190']['lat'], -15.60)
        self.assertNotIn('lat', c['22222222000122'])
        self.assertNotIn('33333333000133', c)


OSM = [
    {'osm_id': 'node/1', 'nome': 'Posto Trevo', 'lat': -15.5712, 'lon': -56.0751, 'cidade': 'Cuiabá',
     'extras': {'marca': 'Ipiranga'}},
    {'osm_id': 'node/2', 'nome': 'Ipiranga', 'lat': -15.60, 'lon': -56.10, 'cidade': None, 'extras': {}},
    {'osm_id': 'node/3', 'nome': 'Shell', 'lat': -15.601, 'lon': -56.101, 'cidade': None, 'extras': {}},
]


class Casamento(unittest.TestCase):
    def est(self, **kw):
        base = {'cnpj': '12345678000190', 'uf': 'MT', 'municipio': 'CUIABA', 'nome': 'Auto Posto Trevo',
                'fantasia': 'AUTO POSTO TREVO LTDA', 'bandeira': 'IPIRANGA', 'rua': 'AV ISSAC PÓVOAS', 'numero': '1200',
                'precos': {}}
        base.update(kw)
        return base

    def test_nome_e_cidade_ignoram_palavras_genericas(self):
        o = m.casar_por_nome_cidade(self.est(), OSM, set())
        self.assertEqual(o['osm_id'], 'node/1')

    def test_nome_so_com_marca_nao_casa_por_nome(self):
        e = self.est(fantasia='POSTO ALFA', razao='ALFA COMBUSTIVEIS LTDA')
        self.assertIsNone(m.casar_por_nome_cidade(e, OSM, set()))

    def test_osm_ja_usado_nao_casa_de_novo(self):
        self.assertIsNone(m.casar_por_nome_cidade(self.est(), OSM, {'node/1'}))

    def test_ambiguo_nao_casa(self):
        dois = OSM[:1] + [dict(OSM[0], osm_id='node/9')]
        self.assertIsNone(m.casar_por_nome_cidade(self.est(), dois, set()))

    def test_distancia_prefere_marca_compativel(self):
        e = self.est(fantasia='POSTO ALFA', bandeira='SHELL')
        o = m.casar_por_distancia(-15.6005, -56.1005, e, OSM, set())
        self.assertEqual(o['osm_id'], 'node/3')

    def test_distancia_unico_muito_perto_casa_mesmo_sem_nome(self):
        e = self.est(fantasia='POSTO ALFA', bandeira='BRANCA')
        self.assertEqual(m.casar_por_distancia(-15.5712, -56.0752, e, OSM, set())['osm_id'], 'node/1')
        dois = OSM[:1] + [dict(OSM[1], osm_id='node/7', lat=-15.5715, lon=-56.0755, nome='Posto Gama')]
        self.assertIsNone(m.casar_por_distancia(-15.5713, -56.0752, e, dois[1:] + [dict(dois[1], osm_id='node/8')], set()))

    def test_longe_nao_casa(self):
        self.assertIsNone(m.casar_por_distancia(-15.0, -56.0, self.est(), OSM, set()))


class FalsaResposta:
    def __init__(self, dados, status=200):
        self.dados, self.status_code = dados, status

    def json(self):
        return self.dados


class FalsaSessao:
    def __init__(self, respostas):
        self.respostas, self.chamadas = list(respostas), []

    def get(self, url, params=None, **kw):
        self.chamadas.append(params)
        return self.respostas.pop(0) if self.respostas else FalsaResposta([])


class Geocodificacao(unittest.TestCase):
    def test_expande_abreviacoes_e_numero(self):
        self.assertEqual(m.expandir_rua('AV ISSAC PÓVOAS'), 'Avenida ISSAC PÓVOAS')
        self.assertEqual(m.expandir_rua('R. DAS FLORES'), 'Rua DAS FLORES')
        self.assertEqual(m.numero_util('S/N'), '')
        self.assertEqual(m.numero_util('1200'), '1200')
        self.assertEqual(m.numero_util('KM 12'), '')

    def test_consultas_em_ordem_de_precisao(self):
        q = m.consultas_geocode({'uf': 'MT', 'municipio': 'CUIABA', 'rua': 'AV X', 'numero': '10', 'bairro': 'CENTRO'})
        self.assertEqual([n for n, _ in q], ['endereco', 'rua', 'bairro'])
        self.assertEqual(q[0][1]['street'], '10 Avenida X')
        self.assertEqual(q[0][1]['state'], 'Mato Grosso')
        sn = m.consultas_geocode({'uf': 'MT', 'municipio': 'CUIABA', 'rua': 'AV X', 'numero': 'S/N'})
        self.assertEqual([n for n, _ in sn], ['rua'])

    def test_usa_cache_respeita_limite_e_descarta_outro_estado(self):
        est = {'uf': 'MT', 'municipio': 'CUIABA', 'rua': 'AV X', 'numero': '10'}
        sessao = FalsaSessao([
            FalsaResposta([{'lat': '-15.6', 'lon': '-56.1', 'address': {'ISO3166-2-lvl4': 'BR-SP'}}]),  # estado errado
            FalsaResposta([{'lat': '-15.6', 'lon': '-56.1', 'address': {'ISO3166-2-lvl4': 'BR-MT'}}]),
        ])
        pausas = []
        geo = m.Geocodificador(sessao, {}, limite=5, pausa=1.1, dormir=pausas.append)
        self.assertEqual(geo.localizar(est), (-15.6, -56.1, 'rua'))
        self.assertEqual(geo.requisicoes, 2)
        self.assertTrue(pausas)
        # segunda vez vem do cache: nenhuma requisição nova
        self.assertEqual(geo.localizar(est), (-15.6, -56.1, 'rua'))
        self.assertEqual(geo.requisicoes, 2)

    def test_limite_da_rodada_adia_sem_gravar_cache_negativo(self):
        est = {'uf': 'MT', 'municipio': 'CUIABA', 'rua': 'AV X', 'numero': '10'}
        geo = m.Geocodificador(FalsaSessao([]), {}, limite=0, dormir=lambda s: None)
        self.assertEqual(geo.localizar(est), 'adiado')
        self.assertEqual(geo.cache, {})

    def test_rate_limit_para_a_rodada(self):
        est = {'uf': 'MT', 'municipio': 'CUIABA', 'rua': 'AV X', 'numero': '10'}
        geo = m.Geocodificador(FalsaSessao([FalsaResposta([], 429)]), {}, limite=100, dormir=lambda s: None)
        self.assertEqual(geo.localizar(est), 'adiado')
        self.assertTrue(geo.esgotado)

    def test_nao_achou_vira_none_e_fica_no_cache(self):
        est = {'uf': 'MT', 'municipio': 'CUIABA', 'rua': 'AV X', 'numero': '10'}
        geo = m.Geocodificador(FalsaSessao([FalsaResposta([]), FalsaResposta([])]), {}, dormir=lambda s: None)
        self.assertIsNone(geo.localizar(est))
        self.assertEqual(len(geo.cache), 2)


class Processamento(unittest.TestCase):
    def test_pipeline_osm_geocode_e_pendentes(self):
        lpc = m.parse_lpc(m.linhas_csv(LPC), ['MT'], hoje=HOJE)
        cad = {
            '22222222000122': {'uf': 'MT', 'fantasia': 'POSTO ALFA', 'municipio': 'CUIABA', 'rua': 'R B',
                               'numero': '5', 'bandeira': 'SHELL'},
            '33333333000133': {'uf': 'MT', 'fantasia': 'POSTO BETA', 'municipio': 'CUIABA', 'rua': 'R C',
                               'numero': '7'},
        }
        est = m.juntar(cad, lpc)
        sessao = FalsaSessao([FalsaResposta([{'lat': '-15.6004', 'lon': '-56.1004', 'address': {}}])])
        geo = m.Geocodificador(sessao, {}, limite=1, dormir=lambda s: None)
        linhas, sem_local = m.processar(est, OSM, geo)
        por = {l['cnpj']: l for l in linhas}
        # com preço e nome+cidade: casa com o OSM e usa a coordenada do OSM
        trevo = por['12345678000190']
        self.assertEqual((trevo['osm_id'], trevo['precisao']), ('node/1', 'osm'))
        self.assertEqual(trevo['lat'], -15.5712)
        self.assertEqual(trevo['precos']['gasolina_comum']['valor'], 6.35)
        # geocodificado perto de um posto Shell do OSM: casa por distância
        self.assertEqual(por['22222222000122']['osm_id'], 'node/3')
        # estourou o limite de geocodes: fica para a próxima rodada
        self.assertNotIn('33333333000133', por)
        self.assertEqual(sem_local, 1)
        json.dumps(linhas)  # serializável para o envio

    def test_prioridade_preco_primeiro_depois_cuiaba(self):
        e = [{'cnpj': '3', 'municipio': 'SINOP', 'precos': {}}, {'cnpj': '2', 'municipio': 'CUIABA', 'precos': {}},
             {'cnpj': '1', 'municipio': 'SINOP', 'precos': {'etanol': {}}}]
        self.assertEqual([x['cnpj'] for x in sorted(e, key=m.ordem_de_prioridade)], ['1', '2', '3'])

    def test_coordenadas_do_anp_sem_osm_ficam_com_precisao_anp(self):
        est = {'1': {'cnpj': '1', 'uf': 'MT', 'nome': 'X', 'lat': -10.0, 'lng': -50.0, 'municipio': 'A', 'precos': {}}}
        linhas, _ = m.processar(est, OSM, None)
        self.assertEqual(linhas[0]['precisao'], 'anp')


class Descoberta(unittest.TestCase):
    def test_semestres_recentes(self):
        self.assertEqual(m.semestres_recentes(date(2026, 11, 13)), [(2026, 2), (2026, 1)])
        self.assertEqual(m.semestres_recentes(date(2027, 2, 1)), [(2027, 1), (2026, 2)])

    def test_candidatos_lpc_tem_modelos_dos_dois_semestres(self):
        urls = m.candidatos_lpc(date(2026, 11, 13))
        self.assertTrue(any(u.endswith('/2026/ca-2026-02.csv') for u in urls))
        self.assertTrue(any(u.endswith('/2026/ca-2026-01.csv') for u in urls))

    def test_links_e_recursos(self):
        html = '<a href="/anp/arquivos/ca-2026-02.csv">x</a> <a href="https://x/y.xlsx?a=1">y</a> <a href="/z.pdf">z</a>'
        self.assertEqual(m.links_de_dados(html, 'https://www.gov.br/anp/pagina'),
                         ['https://www.gov.br/anp/arquivos/ca-2026-02.csv', 'https://x/y.xlsx?a=1'])
        pacote = {'resources': [{'url': 'https://a/b', 'format': 'CSV'}, {'url': 'https://a/c.pdf', 'format': 'PDF'},
                                {'url': 'https://a/d.xlsx', 'format': ''}]}
        self.assertEqual(m.recursos_do_pacote(pacote), ['https://a/b', 'https://a/d.xlsx'])

    def test_descobrir_tolera_falhas_e_loga(self):
        class Sessao:
            def get(self, url, **kw):
                raise OSError('sem rede')
        logs = []
        achados = m.descobrir(Sessao(), logs.append, hoje=date(2026, 11, 13))
        self.assertTrue(achados['lpc'])  # cai nos modelos de URL
        self.assertEqual(achados['cadastro'], [])
        self.assertTrue(any('falhou' in l for l in logs))


if __name__ == '__main__':
    unittest.main()


class TestTituloERecentes(unittest.TestCase):
    def test_pula_linhas_de_titulo(self):
        from importar_anp import pular_titulo, colunas_presentes
        txt = 'AGÊNCIA NACIONAL DO PETRÓLEO;;;\nLevantamento semanal;;;\n\nCNPJ DA REVENDA;PRODUTO;VALOR DE VENDA;DATA DA COLETA;ESTADO - SIGLA\n1;GASOLINA;6,29;01/11/2026;MT'
        saida = pular_titulo(txt)
        self.assertTrue(saida.startswith('CNPJ DA REVENDA'))
        self.assertGreaterEqual(len(colunas_presentes(saida)), 3)

    def test_mais_recentes_primeiro(self):
        from importar_anp import ordenar_recentes
        urls = ['x/2023/revendas_lpc_2023-05-07_2023-05-13.xlsx', 'x/2026/revendas_lpc_2026-10-26_2026-11-01.xlsx',
                'x/2026/resumo_semanal_lpc_2026-10-26_2026-11-01.xlsx']
        r = ordenar_recentes(urls)
        self.assertEqual(r[0], 'x/2026/revendas_lpc_2026-10-26_2026-11-01.xlsx')
        self.assertEqual(r[-1], 'x/2023/revendas_lpc_2023-05-07_2023-05-13.xlsx')


class TestColunaPreco(unittest.TestCase):
    def test_nomes_variados_do_preco(self):
        from importar_anp import chave_coluna
        for nome in ['PREÇO DE REVENDA', 'Preço de Venda (R$/l)', 'VALOR DE VENDA', 'Preço Revenda']:
            self.assertEqual(chave_coluna(nome), 'PRECODEVENDA', nome)
        self.assertNotEqual(chave_coluna('PREÇO DE COMPRA'), 'PRECODEVENDA')
