"""Converte as imagens originais (docs/assets-originais) para WebP leve dentro do app.

Uso (pelo agente):  python3 tools/converter_imagens.py
Regras de tamanho e peso: docs/DESIGN.md, seção 4.

- Separa os lotes com dois itens lado a lado.
- Remove o fundo liso (branco ou preto) por preenchimento a partir das bordas,
  sem apagar o interior escuro dos patches (a borda bordada segura o preenchimento).
- Recorta as sobras, redimensiona e grava em WebP, baixando a qualidade até caber no limite.
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "docs" / "assets-originais"
DESTINO = RAIZ / "app" / "assets" / "gerados"

KB = 1024


@dataclass(frozen=True)
class Item:
    nome: str  # nome do arquivo final (sem extensão)
    grupo: str  # subpasta em app/assets/gerados
    lado: int  # maior lado em pixels
    limite_kb: int
    tipo: str = "emblema"  # emblema | textura | borda | ilustracao


@dataclass(frozen=True)
class Lote:
    arquivo: str
    itens: tuple[Item, ...]
    divisao: str = "pares"  # pares | metade (corte exato no meio) | inteiro


def _emb(nome: str, grupo: str, lado: int = 256) -> Item:
    return Item(nome, grupo, lado, 40)


def _ilu(nome: str, lado: int = 1080, limite: int = 150) -> Item:
    return Item(nome, "ilustracoes", lado, limite, "ilustracao")


def _tex(nome: str) -> Item:
    return Item(nome, "texturas", 256, 50, "textura")


LOTES: tuple[Lote, ...] = (
    Lote("lote-01.webp", (_emb("pino-irmao", "pinos"), _emb("pino-sede", "pinos"))),
    Lote("lote-02.webp", (_emb("pino-loja", "pinos"), _emb("pino-posto", "pinos"))),
    Lote("lote-03.webp", (_emb("pino-monumento", "pinos"), _emb("pino-ponto-turistico", "pinos"))),
    Lote("lote-04.webp", (_emb("pino-restaurante", "pinos"), _emb("pino-oficina", "pinos"))),
    Lote("lote-05.webp", (_emb("pino-agape", "pinos"), _emb("pino-socorro-fraterno", "pinos"))),
    Lote("lote-06.webp", (_emb("pino-sos", "pinos"), _emb("pino-alerta", "pinos"))),
    Lote("lote-07.webp", (_emb("nivel-cabrito", "niveis"), _emb("nivel-bode", "niveis"))),
    Lote("lote-08.webp", (_emb("nivel-bode-velho", "niveis"), _emb("nivel-bode-lendario", "niveis"))),
    Lote("lote-09.webp", (_emb("selo-agape", "selos"), _emb("selo-socorro-fraterno", "selos"))),
    Lote("lote-10.webp", (_emb("selo-pantanal", "selos"), _emb("selo-visita-lojas", "selos"))),
    Lote("lote-11.webp", (_emb("selo-irmao-na-rota", "selos"), _emb("selo-sedes-mt", "selos"))),
    Lote("lote-12.webp", (_emb("moto-custom", "motos", 384), _emb("moto-touring", "motos", 384))),
    Lote("lote-13.webp", (_emb("moto-big-trail", "motos", 384), _emb("moto-naked", "motos", 384))),
    Lote("lote-14.webp", (_emb("moto-esportiva", "motos", 384), _emb("moto-street", "motos", 384))),
    Lote("lote-15.webp", (_emb("moto-trail", "motos", 384), _emb("moto-scooter", "motos", 384))),
    Lote("lote-16.webp", (_emb("moto-triciclo", "motos", 384), _emb("mascote-bodinho", "mascote", 384))),
    Lote("lote-18.webp", (_ilu("ilustra-vazio-estrada", 900), _ilu("ilustra-primeira-viagem", 900))),
    Lote("lote-19.webp", (_ilu("ilustra-sem-sinal", 900),), "inteiro"),
    Lote("lote-20.webp", (_ilu("ilustra-boas-vindas", 900), _ilu("ilustra-entrada-aprovada", 900)), "metade"),
    Lote("lote-21.webp", (_ilu("ilustra-nivel-novo"),), "inteiro"),
    Lote("lote-22.webp", (_tex("textura-sarja"),), "inteiro"),
    Lote("lote-23.webp", (_tex("textura-couro"),), "inteiro"),
    Lote("lote-24.webp", (_tex("textura-jeans"), _tex("textura-lona")), "metade"),
    Lote("lote-25.webp", (Item("borda-overlock-9slice", "borda", 256, 40, "borda"),), "inteiro"),
    Lote("lote-26a.webp", (_ilu("splash", 1080, 150),), "inteiro"),
)


# ---------------------------------------------------------------- fundo e recorte


def _cor_do_fundo(img: Image.Image) -> tuple[int, int, int]:
    rgb = img.convert("RGB")
    w, h = rgb.size
    cantos = [rgb.getpixel((x, y)) for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))]
    return tuple(sorted(c[i] for c in cantos)[1] for i in range(3))  # type: ignore[return-value]


def remover_fundo(img: Image.Image, tolerancia: int = 38, semente_central: bool = False) -> Image.Image:
    """Torna transparente o fundo liso conectado às bordas (e ao centro, se pedido)."""
    rgba = np.array(img.convert("RGBA"), dtype=np.int16)
    fundo = np.array(_cor_do_fundo(img), dtype=np.int16)
    parecido = (np.abs(rgba[:, :, :3] - fundo).sum(axis=2) <= tolerancia) | (rgba[:, :, 3] < 20)
    regiao = np.zeros_like(parecido)
    regiao[0, :] = regiao[-1, :] = regiao[:, 0] = regiao[:, -1] = True
    if semente_central:
        h, w = parecido.shape
        regiao[h // 2, w // 2] = True
    regiao &= parecido
    while True:
        nova = regiao.copy()
        nova[1:, :] |= regiao[:-1, :]
        nova[:-1, :] |= regiao[1:, :]
        nova[:, 1:] |= regiao[:, :-1]
        nova[:, :-1] |= regiao[:, 1:]
        nova &= parecido
        if np.array_equal(nova, regiao):
            break
        regiao = nova
    rgba[regiao] = 0
    return Image.fromarray(rgba.astype(np.uint8), "RGBA")


def recortar_sobra(img: Image.Image, folga: int = 4) -> Image.Image:
    caixa = img.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    if not caixa:
        return img
    x0, y0, x1, y1 = caixa
    w, h = img.size
    return img.crop((max(0, x0 - folga), max(0, y0 - folga), min(w, x1 + folga), min(h, y1 + folga)))


def dividir_em_pares(img: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Corta na coluna transparente mais próxima do meio (o vão entre os dois itens)."""
    alfa = np.array(img.getchannel("A")) > 24
    w, h = img.size
    meio = w // 2
    colunas = range(int(w * 0.35), int(w * 0.65))
    melhor = min(colunas, key=lambda x: (int(alfa[:, x].sum()), abs(x - meio)))
    return img.crop((0, 0, melhor, h)), img.crop((melhor, 0, w, h))


# ---------------------------------------------------------------- texturas


def tornar_continua(img: Image.Image) -> Image.Image:
    """Mistura cada borda com a oposta para a textura repetir sem emenda visível."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    deslocada = ImageChops.offset(rgb, w // 2, h // 2)
    faixa = max(8, w // 6)
    xs = np.minimum(np.arange(w), np.arange(w)[::-1])
    ys = np.minimum(np.arange(h), np.arange(h)[::-1])
    d = np.minimum(ys[:, None], xs[None, :])
    mascara = Image.fromarray((np.clip(d / faixa, 0, 1) * 255).astype(np.uint8), "L")
    return Image.composite(rgb, deslocada, mascara)


# ---------------------------------------------------------------- gravação


def redimensionar(img: Image.Image, lado: int) -> Image.Image:
    w, h = img.size
    escala = lado / max(w, h)
    if escala >= 1:
        return img
    return img.resize((max(1, round(w * escala)), max(1, round(h * escala))), Image.LANCZOS)


def gravar_webp(img: Image.Image, destino: Path, limite_kb: int) -> tuple[int, Image.Image]:
    """Grava baixando a qualidade (até 40) e, se preciso, o tamanho, até caber no limite."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    atual = img
    for _ in range(6):
        for qualidade in range(86, 39, -8):
            atual.save(destino, "WEBP", quality=qualidade, method=6)
            tamanho = destino.stat().st_size
            if tamanho <= limite_kb * KB:
                return tamanho, atual
        w, h = atual.size
        atual = atual.resize((round(w * 0.85), round(h * 0.85)), Image.LANCZOS)
    raise ValueError(f"{destino.name} não coube em {limite_kb} KB")


def processar_item(img: Image.Image, item: Item) -> Image.Image:
    if item.tipo == "textura":
        lado = min(img.size)
        quadrado = img.crop((0, 0, lado, lado))
        return redimensionar(tornar_continua(quadrado), item.lado)
    if item.tipo == "borda":
        return redimensionar(recortar_sobra(remover_fundo(img, semente_central=True)), item.lado)
    if item.tipo == "ilustracao":
        return redimensionar(img.convert("RGB"), item.lado)
    return redimensionar(recortar_sobra(img), item.lado)


def converter(lotes: tuple[Lote, ...] = LOTES, origem: Path = ORIGEM, destino: Path = DESTINO) -> list[dict]:
    relatorio = []
    for lote in lotes:
        caminho = origem / lote.arquivo
        if not caminho.exists():
            relatorio.append({"lote": lote.arquivo, "erro": "arquivo não encontrado"})
            continue
        original = Image.open(caminho)
        if lote.divisao == "pares":
            partes = dividir_em_pares(remover_fundo(original))
        elif lote.divisao == "metade":
            w, h = original.size
            margem = int(w * 0.04)  # descarta a costura do meio
            partes = (original.crop((0, 0, w // 2 - margem, h)), original.crop((w // 2 + margem, 0, w, h)))
        else:
            partes = (original,)
        for parte, item in zip(partes, lote.itens, strict=True):
            final = processar_item(parte, item)
            arquivo = destino / item.grupo / f"{item.nome}.webp"
            tamanho, final = gravar_webp(final, arquivo, item.limite_kb)
            relatorio.append(
                {"item": item.nome, "grupo": item.grupo, "px": list(final.size), "kb": round(tamanho / KB, 1)}
            )
    return relatorio


if __name__ == "__main__":
    resultado = converter()
    print(json.dumps(resultado, ensure_ascii=False, indent=1))
    total = sum(r.get("kb", 0) for r in resultado)
    print(f"Total: {total:.0f} KB em {sum(1 for r in resultado if 'kb' in r)} arquivos")
    sys.exit(1 if any("erro" in r for r in resultado) else 0)
