"""Gera os estilos MapLibre do app (noite e sol) a partir de uma única definição.

Uso: python3 tools/gerar_estilo_mapa.py
Saída: app/src/map/estilo-bodes.json (noite) e app/src/map/estilo-bodes-sol.json (sol).

Regras: pesquisa de usabilidade (reports/Usabilidade e interface Bodes do Asfalto.md, R35–R41).
- Terra (surface=unpaved): leito na largura da classe + tracejado ocre com 60 % da largura,
  dasharray [2, 1.5], desenhada ABAIXO do asfalto da mesma classe.
- Trilha (class=track): só o tracejado ocre, padrão [2.5, 1.5, 1, 1.5] (o OpenFreeMap não traz o grau).
- Larguras com interpolação exponencial 1,5 (R39); vias locais com contraste >= 3:1 no chão do mapa.
As cores precisam ser as mesmas de app/src/theme/tokens.ts (o teste estilo.test.ts confere).
"""

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "app" / "src" / "map"

PALETAS = {
    "noite": {
        "chao": "#1A1612", "vegetacao": "#1C2318", "urbano": "#221C17", "agua": "#22323D", "rio": "#3D6E8F",
        "limite": "#5A4A3A", "asfalto": "#E9DCC4", "contorno": "#141110", "secundaria": "#C9BBA2",
        "viaLocal": "#7A6A54", "terra": "#C68A45", "terraEscura": "#5A3E1F",
        "rotulo": "#EFE3C8", "rotuloSec": "#C2B39B", "rotuloRio": "#7FA6C2", "halo": "#141110",
        "opRodovia": 0.75, "opSecundaria": 0.6,
    },
    "sol": {
        "chao": "#EFE9DC", "vegetacao": "#E1E8D2", "urbano": "#E7DFD0", "agua": "#BCD3E0", "rio": "#5B8DB0",
        "limite": "#9C8B72", "asfalto": "#FFFFFF", "contorno": "#857259", "secundaria": "#FFFFFF",
        "viaLocal": "#857259", "terra": "#8A5A1E", "terraEscura": "#E3CBA6",
        "rotulo": "#1A1410", "rotuloSec": "#5A4632", "rotuloRio": "#2F5E86", "halo": "#FFFFFF",
        "opRodovia": 1, "opSecundaria": 1,
    },
}

FONTE = "openmaptiles"
CAMADA_VIAS = "transportation"
TERRA = ["==", ["get", "surface"], "unpaved"]
TRILHA = ["==", ["get", "class"], "track"]
NAO_TERRA = ["all", ["!", TERRA], ["!", TRILHA]]

RODOVIAS = ["motorway", "trunk", "primary"]
SECUNDARIAS = ["secondary", "tertiary"]
LOCAIS = ["minor", "service"]


def classe(lista):
    return ["in", ["get", "class"], ["literal", lista]]


def largura(pontos, fator=1.0):
    """Interpolação exponencial 1,5 sobre pares (zoom, largura)."""
    expr = ["interpolate", ["exponential", 1.5], ["zoom"]]
    for z, w in pontos:
        expr += [z, round(w * fator, 2)]
    return expr


L_RODOVIA = [(6, 1.0), (10, 2.5), (14, 6), (17, 14)]
L_SECUNDARIA = [(8, 0.8), (12, 2.5), (15, 6), (17, 12)]
L_LOCAL = [(11, 0.6), (14, 2), (17, 8)]
#: Largura da rota planejada: 1,6x a rodovia (R38). Usada também em rota.tsx.
L_ROTA = [(6, 1.6), (10, 4), (14, 9.6), (17, 22.4)]


def linha(id_, filtro, cor, pontos, fator=1.0, opacidade=None, traco=None, minzoom=None, cap="round"):
    camada = {
        "id": id_,
        "type": "line",
        "source": FONTE,
        "source-layer": CAMADA_VIAS,
        "filter": filtro,
        "layout": {"line-cap": cap, "line-join": "round"},
        "paint": {"line-color": cor, "line-width": largura(pontos, fator)},
    }
    if opacidade is not None and opacidade < 1:
        camada["paint"]["line-opacity"] = opacidade
    if traco:
        camada["paint"]["line-dasharray"] = traco
    if minzoom:
        camada["minzoom"] = minzoom
    return camada


def rotulo(id_, camada_fonte, filtro, campo, cor, halo, tamanho, fonte="Noto Sans Regular", minzoom=None,
           linha_=False, extra=None):
    c = {
        "id": id_,
        "type": "symbol",
        "source": FONTE,
        "source-layer": camada_fonte,
        "layout": {"text-field": campo, "text-font": [fonte], "text-size": tamanho},
        "paint": {"text-color": cor, "text-halo-color": halo, "text-halo-width": 2},
    }
    if filtro is not None:
        c["filter"] = filtro
    if minzoom:
        c["minzoom"] = minzoom
    if linha_:
        c["layout"]["symbol-placement"] = "line"
    if extra:
        c["layout"].update(extra)
    return c


def estilo(nome, p):
    camadas = [
        {"id": "fundo", "type": "background", "paint": {"background-color": p["chao"]}},
        {"id": "vegetacao", "type": "fill", "source": FONTE, "source-layer": "landcover",
         "filter": classe(["wood", "forest", "grass", "scrub", "farmland"]),
         "paint": {"fill-color": p["vegetacao"], "fill-opacity": 0.85}},
        {"id": "parques", "type": "fill", "source": FONTE, "source-layer": "park",
         "paint": {"fill-color": p["vegetacao"], "fill-opacity": 0.6}},
        {"id": "urbano", "type": "fill", "source": FONTE, "source-layer": "landuse",
         "filter": classe(["residential", "commercial", "industrial", "retail"]),
         "paint": {"fill-color": p["urbano"]}},
        {"id": "agua", "type": "fill", "source": FONTE, "source-layer": "water", "paint": {"fill-color": p["agua"]}},
        {"id": "rios", "type": "line", "source": FONTE, "source-layer": "waterway",
         "paint": {"line-color": p["rio"], "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 14, 3]}},
        {"id": "limites", "type": "line", "source": FONTE, "source-layer": "boundary",
         "filter": ["<=", ["get", "admin_level"], 4],
         "paint": {"line-color": p["limite"], "line-width": 1.2, "line-dasharray": [3, 2]}},
        # Vias locais (piso quase sempre sem etiqueta): traço neutro, sem destaque, >= 3:1 (R37, R39).
        linha("locais", ["all", NAO_TERRA, classe(LOCAIS)], p["viaLocal"], L_LOCAL, minzoom=12),
        # Terra de qualquer classe (exceto trilha e caminho): leito + tracejado 60 % (R35).
        linha("terra-base", ["all", TERRA, ["!", TRILHA], ["!=", ["get", "class"], "path"]],
              p["terraEscura"], L_SECUNDARIA, minzoom=7),
        linha("terra", ["all", TERRA, ["!", TRILHA], ["!=", ["get", "class"], "path"]],
              p["terra"], L_SECUNDARIA, fator=0.6, traco=[2, 1.5], minzoom=7, cap="butt"),
        # Trilha: só o tracejado ocre (R36).
        linha("trilhas", TRILHA, p["terra"], L_LOCAL, fator=1.2, traco=[2.5, 1.5, 1, 1.5], minzoom=10, cap="butt"),
        # Asfalto (acima da terra da mesma classe).
        linha("secundarias-contorno", ["all", NAO_TERRA, classe(SECUNDARIAS)], p["contorno"], L_SECUNDARIA,
              fator=1.5, minzoom=8),
        linha("secundarias", ["all", NAO_TERRA, classe(SECUNDARIAS)], p["secundaria"], L_SECUNDARIA,
              opacidade=p["opSecundaria"], minzoom=8),
        linha("rodovias-contorno", ["all", NAO_TERRA, classe(RODOVIAS)], p["contorno"], L_RODOVIA, fator=1.45),
        linha("rodovias", ["all", NAO_TERRA, classe(RODOVIAS)], p["asfalto"], L_RODOVIA, opacidade=p["opRodovia"]),
        # Rótulos (halo de 2 px, R40).
        rotulo("rotulos-rodovias", "transportation_name", classe(RODOVIAS), ["coalesce", ["get", "ref"], ["get", "name"]],
               p["rotulo"], p["halo"], 13, fonte="Noto Sans Bold", minzoom=9, linha_=True),
        # Nomes de ruas e estradas menores (antes só as rodovias tinham nome).
        rotulo("rotulos-ruas", "transportation_name", classe(SECUNDARIAS + LOCAIS), ["get", "name"],
               p["rotuloSec"], p["halo"], ["interpolate", ["linear"], ["zoom"], 13, 12, 17, 15],
               minzoom=13, linha_=True),
        rotulo("rotulos-terra", "transportation_name", TRILHA, ["get", "name"], p["terra"], p["halo"], 12,
               minzoom=12, linha_=True),
        rotulo("rotulos-rios", "waterway", None, ["get", "name"], p["rotuloRio"], p["halo"], 12, minzoom=10, linha_=True),
        rotulo("rotulos-vilas", "place", classe(["village", "suburb", "neighbourhood"]), ["get", "name"],
               p["rotuloSec"], p["halo"], 14, minzoom=10),
        rotulo("rotulos-cidades", "place", classe(["city", "town"]), ["upcase", ["get", "name"]], p["rotulo"],
               p["halo"], ["interpolate", ["linear"], ["zoom"], 5, 13, 10, 18], fonte="Noto Sans Bold",
               extra={"text-letter-spacing": 0.08}),
    ]
    return {
        "version": 8,
        "name": f"Bodes do Asfalto — {nome}",
        "metadata": {
            "gerado_por": "tools/gerar_estilo_mapa.py",
            "fonte": "reports/Usabilidade e interface Bodes do Asfalto.md (R35–R41)",
            "larguraRota": L_ROTA,
            "pendente": "relevo (hillshade) precisa de fonte raster-dem; grau das trilhas não vem no OpenFreeMap",
        },
        "sources": {
            FONTE: {
                "type": "vector",
                "url": "https://tiles.openfreemap.org/planet",
                "attribution": '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }
        },
        "glyphs": "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
        "layers": camadas,
    }


def main():
    for nome, arquivo in (("noite", "estilo-bodes.json"), ("sol", "estilo-bodes-sol.json")):
        destino = SAIDA / arquivo
        destino.write_text(json.dumps(estilo(nome, PALETAS[nome]), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("gerado", destino.relative_to(RAIZ))


if __name__ == "__main__":
    main()
