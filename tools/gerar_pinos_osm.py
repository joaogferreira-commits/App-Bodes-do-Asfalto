#!/usr/bin/env python3
"""Gera os emblemas vetoriais (escudo de patch + pictograma de traço) dos pinos de pontos do OpenStreetMap.

Os caminhos dos pictogramas vêm de app/src/ui/icones.tsx (uma só fonte). Saída: app/assets/gerados/pinos/pino-<tipo>.webp
(208x256, como os demais pinos). Requer cairosvg e Pillow. Uso: python3 tools/gerar_pinos_osm.py
"""
import re
import io
from pathlib import Path

import cairosvg  # pip install cairosvg pillow
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ICONES = RAIZ / 'app/src/ui/icones.tsx'
SAIDA = RAIZ / 'app/assets/gerados/pinos'

# tipo -> (icone, cor do pino). Mantenha em sincronia com app/src/ui/Pino.tsx (o teste confere os arquivos).
PINOS = {
    'oficina_moto': ('porca', '#C2B39B'),
    'borracharia': ('pneu', '#C68A45'),
    'cachoeira': ('cachoeira', '#7FA6C2'),
    'mirante': ('mirante', '#C68A45'),
    'museu': ('museu', '#C2B39B'),
    'atracao': ('camera', '#E8692A'),
    'praia': ('praia', '#6F95B8'),
    'parque': ('parque', '#3FA27A'),
    'igreja_historica': ('igreja', '#C2B39B'),
    'hospedagem': ('cama', '#6F95B8'),
    'camping': ('barraca', '#C68A45'),
    'hospital': ('hospital', '#E8692A'),
    'policia_rodoviaria': ('policia', '#6F95B8'),
}


def caminhos():
    texto = ICONES.read_text(encoding='utf-8')
    bloco = re.sub(r'^ *//.*\n', '', texto[texto.index('caminhosIcones = {'):texto.index('} as const;')], flags=re.M)
    res = {}
    for m in re.finditer(r"^  (\w+): \[(.*?)\],?\n(?=  \w+:|$)", bloco + '  x:', re.S | re.M):
        res[m.group(1)] = re.findall(r"'([^']+)'", m.group(2))
    return res


def svg(tipo, ds, cor):
    paths = ''.join(
        f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' for d in ds
    )
    escudo = 'M104 6 C140 6 172 12 200 22 V150 C200 200 156 236 104 250 C52 236 8 200 8 150 V22 C36 12 68 6 104 6 Z'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="208" height="256" viewBox="0 0 208 256">
<path d="{escudo}" fill="{cor}"/>
<path d="{escudo}" fill="#141110" transform="translate(104 128) scale(0.9) translate(-104 -128)"/>
<path d="{escudo}" fill="none" stroke="#EFE3C8" stroke-width="2.5" stroke-dasharray="7 6" transform="translate(104 128) scale(0.82) translate(-104 -128)"/>
<g transform="translate(34 56) scale(6.0)">{paths}</g></svg>'''


def main():
    c = caminhos()
    for tipo, (icone, cor) in PINOS.items():
        png = cairosvg.svg2png(bytestring=svg(tipo, c[icone], cor).encode('utf-8'), output_width=208, output_height=256)
        Image.open(io.BytesIO(png)).save(SAIDA / f'pino-{tipo}.webp', quality=85)
        print('gerado', tipo)


if __name__ == '__main__':
    main()
