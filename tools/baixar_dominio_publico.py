"""Baixa fotos de DOMÍNIO PÚBLICO ou CC0 do Wikimedia Commons para os posts de exemplo do feed.

Roda no GitHub Actions (a rede do agente bloqueia a Wikimedia):
  python3 tools/baixar_dominio_publico.py
Lê tools/imagens_dominio_publico.json (buscas), guarda em app/assets/exemplos/<chave>.webp (largura 900)
e escreve app/assets/exemplos/creditos.json com autor, licença e link de cada foto.
Só aceita licenças "Public domain" / "CC0" (nada que exija atribuição ou proíba uso comercial).
Fotos com pessoas identificáveis são evitadas pelas buscas (paisagens, estradas, motos).
"""

import io
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "app" / "assets" / "exemplos"
API = "https://commons.wikimedia.org/w/api.php"
AGENTE = "BodesDoAsfaltoApp/1.0 (aplicativo de motoclube; exemplos de feed)"
LICENCAS_OK = ("public domain", "cc0", "pd")


def pedir(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def licenca_ok(meta):
    nome = (meta.get("LicenseShortName", {}).get("value") or "").lower()
    return any(nome.startswith(x) or x in nome for x in LICENCAS_OK) and "by" not in nome.replace("public domain", "")


def buscar(consulta, quantos):
    dados = pedir({
        "action": "query", "generator": "search", "gsrsearch": f"{consulta} filetype:bitmap",
        "gsrnamespace": 6, "gsrlimit": 40, "prop": "imageinfo",
        "iiprop": "url|extmetadata|size", "iiurlwidth": 900,
    })
    paginas = sorted((dados.get("query", {}).get("pages", {}) or {}).values(), key=lambda p: p.get("index", 0))
    achados = []
    for p in paginas:
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        if not licenca_ok(meta) or info.get("width", 0) < 800:
            continue
        achados.append({
            "titulo": p["title"],
            "url": info.get("thumburl") or info["url"],
            "pagina": info.get("descriptionurl"),
            "autor": (meta.get("Artist", {}).get("value") or "").replace("\n", " ")[:200],
            "licenca": meta.get("LicenseShortName", {}).get("value"),
        })
        if len(achados) >= quantos:
            break
    return achados


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)
    pedidos = json.loads((RAIZ / "tools" / "imagens_dominio_publico.json").read_text(encoding="utf-8"))
    creditos = {}
    for chave, consulta in pedidos.items():
        try:
            achados = buscar(consulta, 1)
        except Exception as e:  # noqa: BLE001
            print("falhou", chave, e, file=sys.stderr)
            continue
        if not achados:
            print("nada em domínio público para", chave, file=sys.stderr)
            continue
        a = achados[0]
        req = urllib.request.Request(a["url"], headers={"User-Agent": AGENTE})
        with urllib.request.urlopen(req, timeout=60) as r:
            im = Image.open(io.BytesIO(r.read())).convert("RGB")
        im.thumbnail((900, 900))
        im.save(DESTINO / f"{chave}.webp", "WEBP", quality=72, method=6)
        creditos[chave] = a
        print("ok", chave, a["titulo"], a["licenca"])
    (DESTINO / "creditos.json").write_text(json.dumps(creditos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
