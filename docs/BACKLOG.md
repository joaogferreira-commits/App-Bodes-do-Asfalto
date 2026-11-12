# Backlog da equipe (ordem de prioridade)

Mantido por Paulo (Produto). Cada ciclo do agente pega o primeiro item "a fazer", entrega com testes, marca como feito e registra no `docs/PROGRESSO.md`. Itens que dependem do dono ficam em "Aguardando o dono".

## A fazer
1. ~~**Etapa 1 — banco (Bia):**~~ FEITO em 12/11 (migration + 20 testes pgTAP no CI). `supabase/` com migrations de capítulos, perfis, papéis, solicitações de entrada, consentimentos LGPD, garagem, contatos de emergência e perfil maçônico (criptografado, visibilidade por campo); RLS em tudo; testes pgTAP rodando com `supabase start` (Docker disponível no agente).
2. ~~**Etapa 1 — app (Mateus):**~~ FEITO em 12/11 no modo local (falta ligar ao Supabase quando houver chaves). camada de dados com interface única (local agora, Supabase quando houver chaves); telas de entrada: boas-vindas com o Bodinho, login (link mágico, Google, Apple), formulário de solicitação (foto do colete, carteirinha, quem indica), tela de espera; consentimentos separados; "Meus dados" (ver, baixar, revogar); excluir conta.
3. ~~**Garagem (Mateus):**~~ FEITO 12/11. várias motos (marca, modelo, ano, apelido, foto da galeria, km); a moto principal aparece no perfil.
4. ~~**Contatos de emergência (Mateus/Bia):**~~ FEITO 12/11 (local; banco já tem a tabela com RLS). até 3, usados pelo SOS; só o dono vê.
5. ~~**Perfil editável (Mateus):**~~ FEITO 12/11. nome, apelido, cidade, foto (câmera/galeria), Loja/Oriente/Potência com visibilidade.
6. **Rota (Mateus):** resumo "Terra / Piso desconhecido" e barra de piso em segmentos (R43); voz "Terra em 2 km".
7. **Peso do APK:** R8/shrink com teste da navegação (meta ~60 MB).
8. **Android Auto:** cartão de manobra (seta + distância) e zoom/recentrar (R26).
9. **Feed:** enquete e vídeo de verdade; stories de 24 h; salvar post; menções.
10. **Revisões de Dora e Quintino** em cada tela nova; corrigir achados.

## Aguardando o dono (uma tarefa por vez)
- Ativar a **Routes API** no Google Cloud (faz a navegação seguir a rota planejada).
- Criar o projeto grátis no **Supabase** e cadastrar a URL e a chave pública no EAS.
- Login com Google e Apple: credenciais (depois do Supabase).

## Feito recentemente
- Botões do pilotando menores (3×2), painel recolhível, pinos agrupados, tema Sol ajustado, rota conferida com o Google antes de sair.
- Feed: publicar (texto + foto sem localização), editar, excluir, comentar, compartilhar; fotos de domínio público nos exemplos; avatares ilustrados por nome.
