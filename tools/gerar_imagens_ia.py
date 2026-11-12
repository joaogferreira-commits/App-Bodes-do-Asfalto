"""Gera as imagens da fila (tools/fila_imagens.json) com serviços de IA gratuitos, em cascata.

Roda no GitHub Actions (a rede do agente bloqueia esses serviços):
  python3 tools/gerar_imagens_ia.py            # gera os pendentes "auto"
  python3 tools/gerar_imagens_ia.py --markdown  # só reescreve docs/FILA_IMAGENS.md

Ordem dos serviços (cada um com limite por rodada, para não estourar as cotas grátis):
  1. Cloudflare Workers AI (FLUX.1 schnell, licença Apache-2.0) — precisa de CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN
  2. Google Gemini (modelo em GEMINI_MODELO) — precisa de GEMINI_API_KEY
  3. Pollinations — precisa de POLLINATIONS_TOKEN (sem conta: 1 imagem com marca d'água e depois 402); só imagens de EXEMPLO
Se um serviço falhar ou não tiver chave, passa para o próximo. Itens "dono" nunca são gerados aqui:
viram a lista de pedidos para o ChatGPT em docs/FILA_IMAGENS.md.
"""

from __future__ import annotations

import base64
import io
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FILA = RAIZ / "tools" / "fila_imagens.json"
MARKDOWN = RAIZ / "docs" / "FILA_IMAGENS.md"
AGENTE = "BodesDoAsfaltoApp/1.0 (gerador de imagens do app)"

LIMITES = {
    "cloudflare": int(os.environ.get("LIMITE_CLOUDFLARE", "12")),
    "gemini": int(os.environ.get("LIMITE_GEMINI", "6")),
    "pollinations": int(os.environ.get("LIMITE_POLLINATIONS", "8")),
}

ESTILOS = {
    "foto": (
        "Fotografia realista, profissional, luz natural de fim de tarde, cores quentes, nitidez alta. "
        "Sem pessoas identificáveis (motociclistas de costas ou de capacete, sem rosto visível), "
        "sem logotipos, sem marcas, sem placas legíveis, sem texto. Cena no Mato Grosso, Brasil."
    ),
    "ilustracao": (
        "Ilustração plana e moderna, traço limpo, paleta: fundo #141110, creme #EFE3C8, laranja #E8692A, "
        "caramelo #C9A46A, ocre #C68A45, jeans #6F95B8. Sem texto, sem logotipos, sem símbolos maçônicos."
    ),
}


def _pedir(url: str, dados: dict | None = None, cabecalhos: dict | None = None, tempo: int = 120) -> bytes:
    corpo = json.dumps(dados).encode() if dados is not None else None
    req = urllib.request.Request(url, data=corpo, headers={"User-Agent": AGENTE, **(cabecalhos or {})})
    if corpo is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=tempo) as r:
        return r.read()


def cloudflare(prompt: str, largura: int, altura: int) -> bytes:
    conta, token = os.environ.get("CLOUDFLARE_ACCOUNT_ID"), os.environ.get("CLOUDFLARE_API_TOKEN")
    if not conta or not token:
        raise RuntimeError("sem chave do Cloudflare")
    url = f"https://api.cloudflare.com/client/v4/accounts/{conta}/ai/run/@cf/black-forest-labs/flux-1-schnell"
    r = json.loads(_pedir(url, {"prompt": prompt, "steps": 6}, {"Authorization": f"Bearer {token}"}))
    imagem = (r.get("result") or {}).get("image")
    if not imagem:
        raise RuntimeError(f"Cloudflare sem imagem: {str(r)[:200]}")
    return base64.b64decode(imagem)


def gemini(prompt: str, largura: int, altura: int) -> bytes:
    chave = os.environ.get("GEMINI_API_KEY")
    if not chave:
        raise RuntimeError("sem chave do Gemini")
    modelo = os.environ.get("GEMINI_MODELO", "gemini-2.5-flash-image")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent"
    dados = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}}
    r = json.loads(_pedir(url, dados, {"x-goog-api-key": chave}))
    for cand in r.get("candidates", []):
        for parte in (cand.get("content") or {}).get("parts", []):
            dado = (parte.get("inlineData") or parte.get("inline_data") or {}).get("data")
            if dado:
                return base64.b64decode(dado)
    raise RuntimeError(f"Gemini sem imagem: {str(r)[:200]}")


def pollinations(prompt: str, largura: int, altura: int) -> bytes:
    # Teste de 12/11/2026: sem conta, o Pollinations entrega 1 imagem, com marca d'água, e depois
    # responde "402 Payment Required". Só usamos se houver POLLINATIONS_TOKEN (conta grátis deles).
    token = os.environ.get("POLLINATIONS_TOKEN")
    if not token:
        raise RuntimeError("sem chave do Pollinations")
    q = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{q}?width={largura}&height={altura}&nologo=true&model=flux"
    return _pedir(url, None, {"Authorization": f"Bearer {token}"}, tempo=180)


SERVICOS = {"cloudflare": cloudflare, "gemini": gemini, "pollinations": pollinations}


def montar_prompt(item: dict) -> str:
    estilo = ESTILOS.get(item.get("tipo", "foto"), "")
    return f"{item['prompt']} {estilo}".strip()


def gerar_pendentes(fila: list[dict], servicos=SERVICOS, limites=None, salvar=None, hoje: str | None = None) -> list[str]:
    """Gera os itens 'auto' pendentes, por prioridade, respeitando o limite de cada serviço. Devolve os ids feitos."""
    limites = dict(limites or LIMITES)
    feitos: list[str] = []
    pendentes = sorted(
        (i for i in fila if i.get("quem") == "auto" and i.get("status") == "pendente"),
        key=lambda i: i.get("prioridade", 9),
    )
    for item in pendentes:
        if not any(limites.get(n, 0) > 0 for n in servicos):
            break
        for nome, gerar in servicos.items():
            if limites.get(nome, 0) <= 0:
                continue
            if nome == "pollinations" and not item.get("exemplo", True):
                continue  # Pollinations só para imagens de exemplo
            try:
                bruto = gerar(montar_prompt(item), item.get("largura", 1024), item.get("altura", 768))
            except Exception as e:  # noqa: BLE001
                print(f"  {nome} falhou em {item['id']}: {e}", file=sys.stderr)
                parar = "sem chave" in str(e) or "402" in str(e) or "429" in str(e)
                limites[nome] = 0 if parar else limites[nome] - 1
                continue
            limites[nome] -= 1
            (salvar or salvar_webp)(item, bruto)
            item.update(status="feito", fonte=nome, data=hoje or date.today().isoformat())
            feitos.append(item["id"])
            print(f"ok {item['id']} via {nome}")
            break
    return feitos


def salvar_webp(item: dict, bruto: bytes) -> None:
    from PIL import Image

    destino = RAIZ / item["destino"]
    destino.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(io.BytesIO(bruto)).convert("RGB")
    im.thumbnail((item.get("largura", 1024), item.get("altura", 1024)))
    im.save(destino, "WEBP", quality=74, method=6)


def escrever_markdown(fila: list[dict]) -> str:
    dono = [i for i in fila if i.get("quem") == "dono"]
    auto = [i for i in fila if i.get("quem") == "auto"]
    linhas = [
        "# Fila de imagens",
        "",
        "Gerada por `tools/gerar_imagens_ia.py` a partir de `tools/fila_imagens.json`. Não edite à mão.",
        "",
        "## Para o dono fazer no ChatGPT (as mais importantes)",
        "",
        "Como fazer: abra o ChatGPT, cole primeiro o GUIA DE ESTILO de `docs/PROMPTS_IMAGENS.md` e depois o pedido.",
        "Salve a imagem com o nome indicado e mande aqui na conversa (ou em `docs/assets-originais/`).",
        "",
    ]
    n = 0
    for i in sorted(dono, key=lambda x: x.get("prioridade", 9)):
        marca = "✅ feito" if i.get("status") == "feito" else "⏳ a fazer"
        n += 1
        linhas += [f"{n}. **{i['titulo']}** — `{Path(i['destino']).stem}` — {marca}", "", f"   > {i['prompt']}", ""]
    linhas += ["## Automáticas (geradas pelo agente com Cloudflare, Gemini ou Pollinations)", ""]
    for i in sorted(auto, key=lambda x: x.get("prioridade", 9)):
        marca = f"✅ {i.get('fonte', '')} {i.get('data', '')}" if i.get("status") == "feito" else "⏳"
        linhas.append(f"- {marca} **{i['titulo']}** → `{i['destino']}`")
    return "\n".join(linhas) + "\n"


def main() -> None:
    fila = json.loads(FILA.read_text(encoding="utf-8"))
    if "--markdown" not in sys.argv:
        feitos = gerar_pendentes(fila)
        print(f"{len(feitos)} imagem(ns) gerada(s)")
        FILA.write_text(json.dumps(fila, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MARKDOWN.write_text(escrever_markdown(fila), encoding="utf-8")


if __name__ == "__main__":
    main()
