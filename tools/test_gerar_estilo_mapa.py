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

    def test_limite_de_camadas_e_ids_extras(self):
        e = g.estilo("noite", g.PALETAS["noite"])
        self.assertLessEqual(len(e["layers"]), 45)
        self.assertEqual(e["metadata"]["camadasExtras"], ["extra-relevo", "extra-predios"])
        self.assertEqual(len({c["id"] for c in e["layers"]}), len(e["layers"]))

    def test_escudos_sem_caixa_alta_e_legiveis(self):
        e = g.estilo("noite", g.PALETAS["noite"])
        por_id = {c["id"]: c for c in e["layers"]}
        for id_ in ("escudos-br", "escudos-estaduais"):
            c = por_id[id_]
            self.assertEqual(c["layout"]["symbol-placement"], "line")
            self.assertEqual(c["layout"]["symbol-spacing"], 400)
            self.assertEqual(c["minzoom"], 8)
            self.assertEqual(c["layout"]["text-field"], ["get", "ref"])
            self.assertGreaterEqual(c["layout"]["text-size"][4], 12)
        self.assertNotIn("upcase", json.dumps(e))

    def test_cores_do_documento(self):
        n, s = g.PALETAS["noite"], g.PALETAS["sol"]
        self.assertEqual((n["chao"], n["urbano"], n["vegetacao"], n["parque"], n["agua"]),
                         ("#1A1612", "#2A231D", "#213022", "#25402A", "#1F3A4D"))
        self.assertEqual((s["chao"], s["urbano"], s["vegetacao"], s["parque"], s["agua"]),
                         ("#F2EEE6", "#E9E3D6", "#CFE3BE", "#BFDDAA", "#A9CFE6"))
        self.assertEqual((n["autoestrada"], n["autoestradaContorno"]), ("#F2B968", "#7A4A12"))
        self.assertEqual((s["autoestrada"], s["autoestradaContorno"]), ("#FFD580", "#B07A1E"))

    def test_relevo_e_predios(self):
        for nome, op in (("noite", 0.25), ("sol", 0.35)):
            e = g.estilo(nome, g.PALETAS[nome])
            por_id = {c["id"]: c for c in e["layers"]}
            self.assertEqual(por_id["extra-relevo"]["paint"]["hillshade-exaggeration"], op)
            self.assertEqual(e["sources"]["terreno"]["encoding"], "terrarium")
            self.assertEqual(por_id["extra-predios"]["minzoom"], 16)
            self.assertEqual(por_id["extra-predios"]["paint"]["fill-extrusion-opacity"], 0.85)


if __name__ == "__main__":
    unittest.main()
