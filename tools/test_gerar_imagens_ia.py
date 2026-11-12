import unittest

import gerar_imagens_ia as g


def fila():
    return [
        {"id": "a", "quem": "auto", "status": "pendente", "prioridade": 2, "titulo": "A", "destino": "x/a.webp", "prompt": "p"},
        {"id": "b", "quem": "auto", "status": "pendente", "prioridade": 1, "titulo": "B", "destino": "x/b.webp", "prompt": "p"},
        {"id": "c", "quem": "auto", "status": "pendente", "prioridade": 3, "titulo": "C", "destino": "x/c.webp", "prompt": "p", "exemplo": False},
        {"id": "d", "quem": "dono", "status": "pendente", "prioridade": 1, "titulo": "D", "destino": "x/d.webp", "prompt": "p"},
    ]


class TestFila(unittest.TestCase):
    def test_cascata_e_limites(self):
        chamadas = []

        def falha(*_):
            raise RuntimeError("sem chave do Cloudflare")

        def ok(nome):
            def f(*_):
                chamadas.append(nome)
                return b"img"
            return f

        f = fila()
        feitos = g.gerar_pendentes(
            f,
            servicos={"cloudflare": falha, "gemini": ok("gemini"), "pollinations": ok("pollinations")},
            limites={"cloudflare": 5, "gemini": 1, "pollinations": 5},
            salvar=lambda *_: None,
            hoje="2026-11-12",
        )
        # prioridade 1 primeiro (b), gemini só 1 vez; c não usa Pollinations (não é exemplo)
        self.assertEqual(feitos, ["b", "a"])
        self.assertEqual(chamadas, ["gemini", "pollinations"])
        self.assertEqual(f[1]["fonte"], "gemini")
        self.assertEqual(f[2]["status"], "pendente")
        self.assertEqual(f[3]["status"], "pendente")  # do dono nunca é gerado

    def test_markdown_separa_dono_e_auto(self):
        md = g.escrever_markdown(fila())
        self.assertIn("Para o dono fazer no ChatGPT", md)
        self.assertIn("1. **D**", md)
        self.assertIn("**B** → `x/b.webp`", md)

    def test_fila_real_valida(self):
        import json

        itens = json.loads(g.FILA.read_text(encoding="utf-8"))
        ids = [i["id"] for i in itens]
        self.assertEqual(len(ids), len(set(ids)))
        for i in itens:
            self.assertIn(i["quem"], ("auto", "dono"))
            self.assertTrue(i["destino"].startswith(("app/assets/", "docs/assets-originais/")))
            # nada de símbolo maçônico nem de velocidade (só pode aparecer como proibição)
            for proibido in ("esquadro", "compasso", "velocímetro", "velocidade"):
                self.assertNotIn(proibido, i["prompt"].lower())


if __name__ == "__main__":
    unittest.main()
