# Backlog da equipe (ordem de prioridade)

Mantido por Paulo (Produto). Cada ciclo do agente pega o primeiro item "a fazer", entrega com testes, marca como feito e registra no `docs/PROGRESSO.md`. Itens que dependem do dono ficam em "Aguardando o dono".

## A fazer
1. ~~**Etapa 1 — banco (Bia):**~~ FEITO em 12/11 (migration + 20 testes pgTAP no CI). `supabase/` com migrations de capítulos, perfis, papéis, solicitações de entrada, consentimentos LGPD, garagem, contatos de emergência e perfil maçônico (criptografado, visibilidade por campo); RLS em tudo; testes pgTAP rodando com `supabase start` (Docker disponível no agente).
2. ~~**Etapa 1 — app (Mateus):**~~ FEITO em 12/11 no modo local (falta ligar ao Supabase quando houver chaves). camada de dados com interface única (local agora, Supabase quando houver chaves); telas de entrada: boas-vindas com o Bodinho, login (link mágico, Google, Apple), formulário de solicitação (foto do colete, carteirinha, quem indica), tela de espera; consentimentos separados; "Meus dados" (ver, baixar, revogar); excluir conta.
3. ~~**Garagem (Mateus):**~~ FEITO 12/11. várias motos (marca, modelo, ano, apelido, foto da galeria, km); a moto principal aparece no perfil.
4. ~~**Contatos de emergência (Mateus/Bia):**~~ FEITO 12/11 (local; banco já tem a tabela com RLS). até 3, usados pelo SOS; só o dono vê.
5. ~~**Perfil editável (Mateus):**~~ FEITO 12/11. nome, apelido, cidade, foto (câmera/galeria), Loja/Oriente/Potência com visibilidade.
6. ~~**Rota (Mateus):**~~ FEITO 12/11: até 3 caminhos para escolher, barra de trechos na ordem do percurso, "a terra começa no km X". Pendentes: "piso desconhecido" (o Valhalla não informa quando o piso não está etiquetado no OSM) e voz "Terra em 2 km" (etapa da navegação).
7. ~~**Peso do APK:**~~ ENCERRADO 12/11: R8 testado (70,4 → 70,2 MB, ganho desprezível; o peso são as bibliotecas nativas). Desligado. Na Play Store o App Bundle (AAB) já baixa só o necessário para cada aparelho.
8. ~~**Android Auto:**~~ FEITO 12/11 (entra na próxima versão de teste; Java só é compilado no EAS): cartão de manobra (seta própria + distância + rua), chegada prevista, "recalculando", botões Mover/Mais zoom/Menos zoom/Recentrar. Testar no DHU.
9. **Feed:** ~~enquete~~ e ~~salvar post~~ FEITOS 12/11. ~~Stories de 24 h~~ FEITO 12/11. Faltam: vídeo (até 60 s), menções (@).
9b. **Sugestões de passeios e pontos de interesse (docs/DISCUSSAO_POIS.md):** MVP com exemplos — seção Sugestões na aba Passeios (raio 50/100/200/400 km, busca), chip no mapa, 6 filtros agrupados, pinos de natureza/encontros, avisos de segurança no cartão. Aceite: some no modo pilotando; pinos sem rótulo abaixo do z13; ordenado por distância com 'Recomendado pelo clube' no topo; selo 'exemplo' e fonte; nenhuma sede de outro clube.
10. **Revisões de Dora e Quintino** em cada tela nova; corrigir achados.

11. ~~**Comercial**~~ FEITO 12/11 (v0.11.0): Guia com parceiros primeiro e selo dourado, vitrine com fotos/benefício/comodidades/Rota/WhatsApp/Ligar/Recomendo, carteirinha "Sou membro" com relógio, planos com validade, contadores anônimos (só soma, "<5"). Falta: pino de parceiro no mapa (aguarda imagem do dono) e envio dos contadores ao Supabase. Original: vitrine do negócio, benefício para irmãos + "Sou membro", planos com validade, pino de parceiro, contadores anônimos.
12. **Detecção de queda (experimental):** sensor de movimento + contagem regressiva de 30 s antes do SOS (decisão do dono pendente; Premium?).
13. **Revisões das personas novas** (Rui, Sofia, Lia, Carlos, Otávio, Pedro) e corrigir os achados.

14. **Imagens por IA:** a cada nova imagem gerada, ligar no app (feed, passeios, classificados, guia) no lugar das provisórias; acompanhar a fila em `docs/FILA_IMAGENS.md`.

## Aguardando o dono (uma tarefa por vez)
- ~~Ativar a **Routes API**~~ FEITO (o vídeo de 12/11 mostra o Google devolvendo a rota planejada).
- Criar o projeto grátis no **Supabase** e cadastrar a URL e a chave pública no EAS.
- Login com Google e Apple: credenciais (depois do Supabase).
- Contas grátis de imagem: Cloudflare (Account ID + token Workers AI) e Google AI Studio (chave Gemini) nos GitHub Secrets.
- Fazer no ChatGPT as imagens "dono" de `docs/FILA_IMAGENS.md`, quando puder.

## Feito recentemente
- Botões do pilotando menores (3×2), painel recolhível, pinos agrupados, tema Sol ajustado, rota conferida com o Google antes de sair.
- Feed: publicar (texto + foto sem localização), editar, excluir, comentar, compartilhar; fotos de domínio público nos exemplos; avatares ilustrados por nome.
