import json
import unittest
from pathlib import Path

import gerar_estilo_mapa as g


class TestEstiloMapa(unittest.TestCase):
    def test_arquivos_do_app_estao_atualizados(self):
        """Os JSON em app/src/map precisam ser a saída atual do gerador (rode o script após mudar)."""
        for nome, arquivo in (("noite", "estilo-bodes.json"), ("sol", "estilo-bodes-sol.json")):
            no_disco = json.loads((g.SAIDA / arquivo).read_text(encoding="utf-8"))
            self.assertEqual(no_disco, json.loads(json.dumps(g.estilo(nome, g.PALETAS[nome]))), arquivo)

    def test_terra_abaixo_do_asfalto(self):
        ids = [c["id"] for c in g.estilo("noite", g.PALETAS["noite"])["layers"]]
        self.assertLess(ids.index("terra"), ids.index("secundarias"))
        self.assertLess(ids.index("terra"), ids.index("rodovias"))

    def test_mesmas_camadas_nos_dois_temas(self):
        a = [c["id"] for c in g.estilo("noite", g.PALETAS["noite"])["layers"]]
        b = [c["id"] for c in g.estilo("sol", g.PALETAS["sol"])["layers"]]
        self.assertEqual(a, b)


if __name__ == "__main__":
    unittest.main()
