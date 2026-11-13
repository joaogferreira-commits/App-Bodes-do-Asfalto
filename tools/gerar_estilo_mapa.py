"""Gera os estilos MapLibre do app (noite e sol) a partir de uma única definição.

Uso: python3 tools/gerar_estilo_mapa.py
Saída: app/src/map/estilo-bodes.json (noite) e app/src/map/estilo-bodes-sol.json (sol).

Regras: pesquisa de usabilidade (reports/Usabilidade e interface Bodes do Asfalto.md, R35–R41).
- Terra (surface=unpaved): leito na largura da classe + tracejado ocre com 60 % da largura,
  dasharray [2, 1.5], desenhada ABAIXO do asfalto da mesma classe.
- Trilha (class=track): só o tracejado ocre, padrão [2.5, 1.5, 1, 1.5] (o OpenFreeMap não traz o grau).
- Larguras com interpolação exponencial 1,5 (R39); vias locais com contraste >= 3:1 no chão do mapa.

Mapa v2 (docs/MAPA_VISUAL_PROPOSTA.md, opção A aprovada em 13/11/2026): cores com vida, rodovias âmbar com contorno,
escudos BR/estaduais (texto com halo, sem sprite), rótulos sem caixa alta, relevo e prédios 3D.
Camadas "extra-*" (relevo e prédios 3D) são as que o app esconde no modo pilotando (ver docs/DESIGN.md, seção 3).
As cores precisam ser as mesmas de app/src/theme/tokens.ts (o teste estilo.test.ts confere).
"""

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "app" / "src" / "map"

PALETAS = {
    "noite": {
        "chao": "#1A1612", "vegetacao": "#213022", "parque": "#25402A", "urbano": "#2A231D", "agua": "#1F3A4D",
        "rio": "#3D6E8F", "limite": "#5A4A3A", "asfalto": "#EFE3C8", "contorno": "#141110", "secundaria": "#C9BBA2",
        "autoestrada": "#F2B968", "autoestradaContorno": "#7A4A12", "contornoPrincipal": "#141110",
        "viaLocal": "#7A6A54", "terra": "#C68A45", "terraEscura": "#5A3E1F",
        "rotulo": "#EFE3C8", "rotuloSec": "#C2B39B", "rotuloRio": "#7FA6C2", "halo": "#141110",
        "predio": "#2E2620", "relevo": 0.25,
        "escudoBrTexto": "#FFFFFF", "escudoBrHalo": "#1B3A7A", "escudoUfTexto": "#141110", "escudoUfHalo": "#F2B968",
    },
    "sol": {
        "chao": "#F2EEE6", "vegetacao": "#CFE3BE", "parque": "#BFDDAA", "urbano": "#E9E3D6", "agua": "#A9CFE6",
        "rio": "#5B8DB0", "limite": "#9C8B72", "asfalto": "#FFFFFF", "contorno": "#8F887E", "secundaria": "#FBF7EE",
        "autoestrada": "#FFD580", "autoestradaContorno": "#B07A1E", "contornoPrincipal": "#8F887E",
        "viaLocal": "#857259", "terra": "#8A5A1E", "terraEscura": "#E3CBA6",
        "rotulo": "#1A1410", "rotuloSec": "#5A4632", "rotuloRio": "#2F5E86", "halo": "#FFFFFF",
        "predio": "#DDD5C6", "relevo": 0.35,
        "escudoBrTexto": "#FFFFFF", "escudoBrHalo": "#1B3A7A", "escudoUfTexto": "#1A1410", "escudoUfHalo": "#FFD580",
    },
}

FONTE = "openmaptiles"
FONTE_RELEVO = "terreno"
CAMADA_VIAS = "transportation"
TERRA = ["==", ["get", "surface"], "unpaved"]
TRILHA = ["==", ["get", "class"], "track"]
NAO_TERRA = ["all", ["!", TERRA], ["!", TRILHA]]

AUTOESTRADAS = ["motorway", "trunk"]
RODOVIAS = ["primary"]
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


L_RODOVIA = [(6, 1.4), (10, 3), (14, 8), (17, 18)]
L_SECUNDARIA = [(8, 0.8), (12, 2.5), (15, 6), (17, 12)]
L_LOCAL = [(13, 1), (16, 5)]
#: Contorno das rodovias = 1,35x a largura do preenchimento.
F_CONTORNO = 1.35
#: Largura da rota planejada: 1,6x a rodovia (R38). Usada também em rota.tsx.
L_ROTA = [(z, round(w * 1.6, 2)) for z, w in L_RODOVIA]


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
        "paint": {"text-color": cor, "text-halo-color": halo, "text-halo-width": 1.5, "text-halo-blur": 0.5},
    }
    c["layout"]["text-letter-spacing"] = 0.02
    if filtro is not None:
        c["filter"] = filtro
    if minzoom:
        c["minzoom"] = minzoom
    if linha_:
        c["layout"]["symbol-placement"] = "line"
    if extra:
        c["layout"].update(extra)
    return c


def escudo(id_, filtro, cor, halo, p):
    """Escudo sem sprite: número da rodovia em negrito com halo grosso colorido (efeito de caixa)."""
    c = rotulo(id_, "transportation_name", filtro, ["get", "ref"], cor, halo,
               ["interpolate", ["linear"], ["zoom"], 8, 15, 12, 17, 16, 19], fonte="Noto Sans Bold", minzoom=8,
               linha_=True, extra={"symbol-spacing": 400, "symbol-sort-key": ["get", "rank"],
                                   "text-max-angle": 20, "text-letter-spacing": 0.05})
    c["paint"]["text-halo-width"] = 3.5
    c["paint"]["text-halo-blur"] = 0
    return c


def estilo(nome, p):
    tem_ref = ["has", "ref"]
    br = ["==", ["slice", ["to-string", ["get", "ref"]], 0, 2], "BR"]
    camadas = [
        {"id": "fundo", "type": "background", "paint": {"background-color": p["chao"]}},
        {"id": "vegetacao", "type": "fill", "source": FONTE, "source-layer": "landcover",
         "filter": classe(["wood", "forest", "grass", "scrub", "farmland"]),
         "paint": {"fill-color": p["vegetacao"], "fill-opacity": 0.85}},
        {"id": "parques", "type": "fill", "source": FONTE, "source-layer": "park",
         "paint": {"fill-color": p["parque"], "fill-opacity": 0.85}},
        {"id": "urbano", "type": "fill", "source": FONTE, "source-layer": "landuse",
         "filter": classe(["residential", "commercial", "industrial", "retail"]),
         "paint": {"fill-color": p["urbano"]}},
        # Relevo suave (AWS Terrain Tiles). Prefixo "extra-": o app esconde no modo pilotando.
        {"id": "extra-relevo", "type": "hillshade", "source": FONTE_RELEVO, "minzoom": 5, "maxzoom": 12,
         "paint": {"hillshade-exaggeration": p["relevo"],
                   "hillshade-shadow-color": "#000000" if nome == "noite" else "#5A4632",
                   "hillshade-highlight-color": "#FFFFFF" if nome == "sol" else "#EFE3C8",
                   "hillshade-accent-color": "#000000" if nome == "noite" else "#5A4632"}},
        {"id": "agua", "type": "fill", "source": FONTE, "source-layer": "water", "paint": {"fill-color": p["agua"]}},
        {"id": "rios", "type": "line", "source": FONTE, "source-layer": "waterway",
         "paint": {"line-color": p["rio"], "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 14, 3]}},
        {"id": "limites", "type": "line", "source": FONTE, "source-layer": "boundary",
         "filter": ["<=", ["get", "admin_level"], 4],
         "paint": {"line-color": p["limite"], "line-width": 1.2, "line-dasharray": [3, 2]}},
        # Vias locais: traço neutro, só de perto (z13+), >= 3:1 (R37, R39).
        linha("locais", ["all", NAO_TERRA, classe(LOCAIS)], p["viaLocal"], L_LOCAL, minzoom=13),
        # Terra de qualquer classe (exceto trilha e caminho): leito + tracejado 60 % (R35).
        linha("terra-base", ["all", TERRA, ["!", TRILHA], ["!=", ["get", "class"], "path"]],
              p["terraEscura"], L_SECUNDARIA, minzoom=7),
        linha("terra", ["all", TERRA, ["!", TRILHA], ["!=", ["get", "class"], "path"]],
              p["terra"], L_SECUNDARIA, fator=0.6, traco=[2, 1.5], minzoom=7, cap="butt"),
        # Trilha: só o tracejado ocre (R36).
        linha("trilhas", TRILHA, p["terra"], L_LOCAL, fator=1.2, traco=[2.5, 1.5, 1, 1.5], minzoom=10, cap="butt"),
        # Asfalto (acima da terra da mesma classe): secundárias, principais, autoestradas/troncos.
        linha("secundarias-contorno", ["all", NAO_TERRA, classe(SECUNDARIAS)], p["contorno"], L_SECUNDARIA,
              fator=1.5, minzoom=8),
        linha("secundarias", ["all", NAO_TERRA, classe(SECUNDARIAS)], p["secundaria"], L_SECUNDARIA, minzoom=8),
        linha("rodovias-contorno", ["all", NAO_TERRA, classe(RODOVIAS)], p["contornoPrincipal"], L_RODOVIA,
              fator=F_CONTORNO),
        linha("rodovias", ["all", NAO_TERRA, classe(RODOVIAS)], p["asfalto"], L_RODOVIA),
        linha("autoestradas-contorno", ["all", NAO_TERRA, classe(AUTOESTRADAS)], p["autoestradaContorno"], L_RODOVIA,
              fator=F_CONTORNO),
        linha("autoestradas", ["all", NAO_TERRA, classe(AUTOESTRADAS)], p["autoestrada"], L_RODOVIA),
        # Prédios 3D só bem de perto. Prefixo "extra-": o app esconde no modo pilotando.
        {"id": "extra-predios", "type": "fill-extrusion", "source": FONTE, "source-layer": "building", "minzoom": 16,
         "paint": {"fill-extrusion-color": p["predio"], "fill-extrusion-opacity": 0.85,
                   "fill-extrusion-height": ["coalesce", ["get", "render_height"], 0],
                   "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0]}},
        # Escudos BR (halo azul) e estaduais (halo âmbar): número grande e legível (>= 16 dp no zoom médio).
        escudo("escudos-br", ["all", tem_ref, br], p["escudoBrTexto"], p["escudoBrHalo"], p),
        escudo("escudos-estaduais", ["all", tem_ref, ["!", br]], p["escudoUfTexto"], p["escudoUfHalo"], p),
        # Rodovia sem número: mostra o nome.
        rotulo("rotulos-rodovias", "transportation_name", ["all", ["!", tem_ref], classe(AUTOESTRADAS + RODOVIAS)],
               ["get", "name"], p["rotulo"], p["halo"], 13, fonte="Noto Sans Bold", minzoom=9, linha_=True),
        # Nomes de ruas e estradas menores.
        rotulo("rotulos-ruas", "transportation_name", classe(SECUNDARIAS + LOCAIS), ["get", "name"],
               p["rotuloSec"], p["halo"], ["interpolate", ["linear"], ["zoom"], 13, 12, 17, 15],
               minzoom=13, linha_=True),
        rotulo("rotulos-terra", "transportation_name", TRILHA, ["get", "name"], p["terra"], p["halo"], 12,
               minzoom=12, linha_=True),
        rotulo("rotulos-rios", "waterway", None, ["get", "name"], p["rotuloRio"], p["halo"], 12, minzoom=10, linha_=True),
        # Lugares: sem caixa alta; menor classe primeiro some quando falta espaço (rank).
        rotulo("rotulos-vilas", "place", classe(["village", "suburb", "neighbourhood"]), ["get", "name"],
               p["rotuloSec"], p["halo"], 13, minzoom=11, extra={"symbol-sort-key": ["get", "rank"]}),
        rotulo("rotulos-cidades-pequenas", "place", classe(["town"]), ["get", "name"], p["rotulo"], p["halo"], 15,
               minzoom=8, extra={"symbol-sort-key": ["get", "rank"]}),
        rotulo("rotulos-cidades", "place", classe(["city"]), ["get", "name"], p["rotulo"], p["halo"],
               ["interpolate", ["linear"], ["zoom"], 5, 18, 10, 20], fonte="Noto Sans Bold", minzoom=5,
               extra={"symbol-sort-key": ["get", "rank"]}),
    ]
    return {
        "version": 8,
        "name": f"Bodes do Asfalto — {nome}",
        "metadata": {
            "gerado_por": "tools/gerar_estilo_mapa.py",
            "fonte": "reports/Usabilidade e interface Bodes do Asfalto.md (R35–R41)",
            "larguraRota": L_ROTA,
            "camadasExtras": [c["id"] for c in camadas if c["id"].startswith("extra-")],
            "pendente": "grau das trilhas não vem no OpenFreeMap; escudos sem sprite (texto com halo)",
        },
        "sources": {
            FONTE: {
                "type": "vector",
                "url": "https://tiles.openfreemap.org/planet",
                "attribution": '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            },
            FONTE_RELEVO: {
                "type": "raster-dem",
                "tiles": ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
                "encoding": "terrarium",
                "tileSize": 256,
                "maxzoom": 15,
                "attribution": '<a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles (Mapzen, AWS)</a>',
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
