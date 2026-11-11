"""Testes do conversor (rodar: python3 -m unittest discover tools)."""

import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

import converter_imagens as c


def _par_de_patches(fundo=(255, 255, 255)) -> Image.Image:
    img = Image.new("RGB", (400, 200), fundo)
    d = ImageDraw.Draw(img)
    for x0 in (20, 220):
        d.ellipse((x0, 20, x0 + 160, 180), fill=(217, 98, 43))  # borda laranja
        d.ellipse((x0 + 12, 32, x0 + 148, 168), fill=(23, 19, 15))  # sarja escura por dentro
    return img


class TestConversor(unittest.TestCase):
    def test_remove_fundo_branco_sem_apagar_interior_escuro(self):
        img = c.remover_fundo(_par_de_patches())
        self.assertEqual(img.getpixel((2, 2))[3], 0)
        self.assertEqual(img.getpixel((100, 100))[3], 255)

    def test_remove_fundo_preto_sem_apagar_interior(self):
        img = c.remover_fundo(_par_de_patches(fundo=(0, 0, 0)))
        self.assertEqual(img.getpixel((2, 2))[3], 0)
        self.assertEqual(img.getpixel((100, 100))[3], 255)

    def test_divide_os_pares_no_vao(self):
        esq, dir_ = c.dividir_em_pares(c.remover_fundo(_par_de_patches()))
        self.assertTrue(180 <= esq.size[0] <= 220)
        self.assertEqual(esq.size[0] + dir_.size[0], 400)

    def test_textura_continua_tem_bordas_parecidas(self):
        # degradê da esquerda para a direita: emenda forte se repetido sem tratamento
        img = Image.linear_gradient("L").rotate(90).convert("RGB").resize((128, 128))
        cont = c.tornar_continua(img)
        emenda = sum(abs(cont.getpixel((0, y))[0] - cont.getpixel((127, y))[0]) for y in range(128)) / 128
        vizinho = sum(abs(cont.getpixel((63, y))[0] - cont.getpixel((64, y))[0]) for y in range(128)) / 128
        self.assertLessEqual(emenda, vizinho + 4)

    def test_converter_respeita_limite_e_tamanho(self):
        with tempfile.TemporaryDirectory() as tmp:
            origem, destino = Path(tmp, "o"), Path(tmp, "d")
            origem.mkdir()
            _par_de_patches().save(origem / "par.png")
            lote = c.Lote("par.png", (c._emb("a", "pinos"), c._emb("b", "pinos")))
            rel = c.converter((lote,), origem, destino)
            self.assertEqual([r["item"] for r in rel], ["a", "b"])
            for r in rel:
                self.assertLessEqual(r["kb"], 40)
                self.assertLessEqual(max(r["px"]), 256)
            self.assertTrue((destino / "pinos" / "a.webp").exists())


if __name__ == "__main__":
    unittest.main()
