import unittest

import importar_pois_osm as m


class TipoDaTag(unittest.TestCase):
    def test_mapeamentos(self):
        casos = [
            ({'amenity': 'fuel'}, 'posto'),
            ({'shop': 'tyres'}, 'borracharia'),
            ({'shop': 'car_repair', 'name': 'Borracharia do Zé'}, 'borracharia'),
            ({'shop': 'motorcycle_repair'}, 'oficina_moto'),
            ({'waterway': 'waterfall'}, 'cachoeira'),
            ({'tourism': 'viewpoint'}, 'mirante'),
            ({'tourism': 'museum'}, 'museu'),
            ({'historic': 'monument'}, 'monumento'),
            ({'tourism': 'artwork'}, 'atracao'),
            ({'tourism': 'zoo'}, 'atracao'),
            ({'natural': 'beach'}, 'praia'),
            ({'boundary': 'national_park'}, 'parque'),
            ({'historic': 'church'}, 'igreja_historica'),
            ({'building': 'church', 'heritage': '2'}, 'igreja_historica'),
            ({'tourism': 'guest_house'}, 'hospedagem'),
            ({'tourism': 'camp_site'}, 'camping'),
            ({'amenity': 'hospital'}, 'hospital'),
            ({'amenity': 'police', 'operator': 'Polícia Rodoviária Federal'}, 'policia_rodoviaria'),
            ({'amenity': 'police', 'name': 'Delegacia Central'}, None),
            ({'amenity': 'restaurant'}, None),
            ({}, None),
        ]
        for tags, esperado in casos:
            self.assertEqual(m.tipo_da_tag(tags), esperado, tags)

    def test_tipos_do_mapeamento_existem_na_lista(self):
        self.assertEqual(set(m.FILTROS), set(m.TIPOS))


class ElementoParaLinha(unittest.TestCase):
    def test_no_com_nome(self):
        l = m.elemento_para_linha({'type': 'node', 'id': 1, 'lat': -15.6, 'lon': -56.1,
                                   'tags': {'waterway': 'waterfall', 'name': 'Salto', 'website': 'x.com'}}, 'MT')
        self.assertEqual(l['osm_id'], 'node/1')
        self.assertEqual(l['tipo'], 'cachoeira')
        self.assertEqual(l['extras'], {'site': 'x.com'})

    def test_way_usa_centro(self):
        l = m.elemento_para_linha({'type': 'way', 'id': 7, 'center': {'lat': 1.0, 'lon': 2.0},
                                   'tags': {'tourism': 'museum', 'name': 'Museu'}}, 'MT')
        self.assertEqual((l['lat'], l['lon']), (1.0, 2.0))

    def test_sem_nome_so_posto_e_borracharia(self):
        posto = m.elemento_para_linha({'type': 'node', 'id': 2, 'lat': 0, 'lon': 0,
                                       'tags': {'amenity': 'fuel', 'brand': 'Ipiranga'}}, 'MT')
        self.assertEqual(posto['nome'], 'Ipiranga')
        self.assertEqual(posto['extras']['marca'], 'Ipiranga')
        generico = m.elemento_para_linha({'type': 'node', 'id': 3, 'lat': 0, 'lon': 0,
                                          'tags': {'amenity': 'fuel'}}, 'MT')
        self.assertEqual(generico['nome'], 'Posto')
        self.assertIsNone(m.elemento_para_linha({'type': 'node', 'id': 4, 'lat': 0, 'lon': 0,
                                                 'tags': {'tourism': 'viewpoint'}}, 'MT'))

    def test_sem_coordenada(self):
        self.assertIsNone(m.elemento_para_linha({'type': 'way', 'id': 5, 'tags': {'amenity': 'fuel'}}, 'MT'))


class Dedupe(unittest.TestCase):
    def test_por_id_e_por_lugar(self):
        base = {'tipo': 'posto', 'nome': 'Shell', 'lat': -15.6001, 'lon': -56.1001}
        linhas = [dict(base, osm_id='node/1'), dict(base, osm_id='node/1'),
                  dict(base, osm_id='way/2', lat=-15.6002),
                  dict(base, osm_id='node/3', lat=-14.0)]
        self.assertEqual([l['osm_id'] for l in m.deduplicar(linhas)], ['node/1', 'node/3'])


class Consulta(unittest.TestCase):
    def test_contem_area_e_filtros(self):
        q = m.consulta('MT', ['posto', 'cachoeira'])
        self.assertIn('BR-MT', q)
        self.assertIn('amenity=fuel', q)
        self.assertIn('waterway=waterfall', q)
        self.assertIn('out center', q)

    def test_mato_grosso_primeiro_e_27_ufs(self):
        self.assertEqual(m.UFS[0], 'MT')
        self.assertEqual(len(m.UFS), 27)


if __name__ == '__main__':
    unittest.main()
