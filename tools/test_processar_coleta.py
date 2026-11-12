import unittest

import processar_coleta as m


class TipoOsm(unittest.TestCase):
    def test_atracao_generica_nao_vira_cachoeira(self):
        self.assertEqual(m.tipo_osm({'tourism': 'attraction', 'name': 'Praça Alencastro'}), 'atracao')
        self.assertEqual(m.tipo_osm({'tourism': 'attraction', 'name': 'Esfinge'}), 'atracao')

    def test_nome_pode_refinar(self):
        self.assertEqual(m.tipo_osm({'tourism': 'attraction', 'name': 'Cachoeira Cristal'}), 'cachoeira')
        self.assertEqual(m.tipo_osm({'tourism': 'attraction', 'name': 'Mirante da Serra'}), 'mirante')

    def test_tags_proprias(self):
        self.assertEqual(m.tipo_osm({'waterway': 'waterfall'}), 'cachoeira')
        self.assertEqual(m.tipo_osm({'tourism': 'viewpoint'}), 'mirante')
        self.assertEqual(m.tipo_osm({'historic': 'memorial'}), 'monumento')
        self.assertIsNone(m.tipo_osm({'amenity': 'cafe'}))
