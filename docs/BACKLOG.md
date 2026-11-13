# Backlog da equipe (ordem de prioridade)

Mantido por Paulo (Produto). Cada ciclo do agente pega o primeiro item "a fazer", entrega com testes, marca como feito e registra no `docs/PROGRESSO.md`. Itens que dependem do dono ficam em "Aguardando o dono".

## A fazer
## MISSÃO PUBLICAÇÃO (decisão do dono 12/11: "nenhum botão dizendo que entra depois e nada sem função efetiva")
Ordem obrigatória; cada ciclo pega o primeiro não feito. Regra: o que não ficar pronto até o envio à loja é ESCONDIDO (nunca "em breve").
- ~~P1~~ FEITO 12/11 (falta testar no celular). Login real (link mágico por e-mail e Google) + estado do membro vindo do banco; consentimentos no banco; sair/excluir conta no servidor. Aplicar a migration 20261112190000 (fotos da solicitação + primeiro admin) — dono já autorizou aplicar o banco.
- ~~P2~~ FEITO 12/11 (falta testar no celular). Solicitação de entrada real (fotos no bucket privado) + tela de APROVAÇÃO dentro do app para diretoria/moderador/admin (fila, aprovar, recusar com motivo). Tirar "simular aprovação". Dono vira admin pela função tornar_admin_por_email.
- ~~P3~~ FEITO em parte 12/11 (perfil, garagem, contatos e dados maçônicos sincronizam; falta foto no servidor e 'Ver perfil' de outro irmão). Perfil, garagem e contatos de emergência no banco; perfil de outro irmão ("Ver perfil") real.
- ~~P4~~ FEITO 12/11 (falta: editar post, votar enquete, vídeo no post, desfazer bloqueio, vários stories por irmão, escolher motivo da denúncia). Feed real: posts, fotos/vídeos no Storage, curtir (TFA), comentar, denunciar, bloquear; stories 24 h no servidor. Tirar todos os posts de exemplo.
- ~~P5~~ FEITO 12/11 (falta: TFA em mensagem no servidor, acenos recebidos em tempo real, lista sem N+1). Chat em tempo real (Supabase Realtime): grupos do capítulo/passeio/comboio/Ágape automáticos, avisos da diretoria, 1:1 por aceno aceito; denúncia vai para a fila de moderação.
- ~~P6~~ FEITO 12/11 (função e gatilhos publicados no servidor; falta avisar candidato antes de aprovado). Notificações push (Expo + Firebase do dono): mensagem, aceno, aprovação, SOS. Preferências por tipo (tirar "Notificações — em breve" do Perfil).
- P6b. ~~Correções do mapa do dono (12/11)~~ FEITO 0.15.0: Ágape vira ponto, irmãos tocáveis, banner Vou/Não vou/X, seletor de visibilidade real, legenda fecha fora, 13 ícones novos, pontos do banco (tabela pontos_osm aguarda autorização do dono; importador importar-pois.yml). Inovações: docs/INOVACOES_20.md (top 5 depois do P13).
- P6c. Visual do mapa aprovado (13/11, opção A): itens 1–9 de docs/MAPA_VISUAL_PROPOSTA.md. Trava em movimento com 'Sou garupa / passageiro'.
- ~~P7~~ FEITO 13/11. Mapa ao vivo: irmãos reais (aproximado no servidor, zonas privadas, apagado em 7 dias), aceno real, "Falar com o contato" da Loja via aceno.
- ~~P8~~ FEITO 13/11 no app (Ágape real aguarda autorização da migration 20261113100000_agapes). Passeios reais: criar passeio (diretoria), "Vou/Talvez", grupo automático; Ágape real.
- ~~P9~~ FEITO 13/11 (voz com expo-speech; aviso só com a tela de pilotando aberta). Modo pilotando: Alerta (tipos de alerta para o comboio), Reagrupar, Posto mais próximo e Posto na rota funcionando; mesmos botões no Android Auto.
- ~~P10~~ FEITO 13/11 (contatos de emergência só por WhatsApp; posição só com o app aberto). SOS real: avisa o grupo do passeio e os contatos que usam o app (push) + posição exata durante o SOS.
- ~~P11~~ FEITO 13/11 (XP fixo em SQL; progresso não-km sem tela ainda). Desafios, conquistas e XP no servidor (aprovação real por diretoria/moderador); ranking.
- ~~P12~~ FEITO 13/11 (e-mail e WhatsApp do suporte aguardam o dono). Ajuda/suporte (texto, print e dados do aparelho chegam ao admin) e "Meus dados" baixando do servidor.
- P13. Varredura final: publicar o login do Google (sair do modo de teste no Google Cloud, exige site com política de privacidade); remover dados de exemplo, "modo local", avisos de versão de teste; conta de demonstração para revisores; política de privacidade e termos publicados.

0. ~~**Câmera v3**~~ FEITO 12/11 (falta: zoom de pinça e gravação em partes, que precisa juntar vídeos no aparelho). Pedido original ("tudo que tem no Instagram e TikTok"): zoom (pinça + barra), temporizador 3/10 s, grade, flash auto/ligado/desligado, modo mãos livres (toque inicia/para), anel de progresso com tempo, gravação em partes (pausar e continuar), velocidade 0,5×/2× na reprodução, textos e selos arrastáveis e redimensionáveis, desenho com o dedo, 12+ filtros, enquete/pergunta/contagem regressiva como selos, espelhar câmera frontal. FORA (motivo): efeitos de rosto/AR (dado biométrico, LGPD art. 5º II), biblioteca de músicas (direitos autorais/licença paga).
1. ~~**Etapa 1 — banco (Bia):**~~ FEITO em 12/11 (migration + 20 testes pgTAP no CI). `supabase/` com migrations de capítulos, perfis, papéis, solicitações de entrada, consentimentos LGPD, garagem, contatos de emergência e perfil maçônico (criptografado, visibilidade por campo); RLS em tudo; testes pgTAP rodando com `supabase start` (Docker disponível no agente).
2. ~~**Etapa 1 — app (Mateus):**~~ FEITO em 12/11 no modo local (falta ligar ao Supabase quando houver chaves). camada de dados com interface única (local agora, Supabase quando houver chaves); telas de entrada: boas-vindas com o Bodinho, login (link mágico, Google, Apple), formulário de solicitação (foto do colete, carteirinha, quem indica), tela de espera; consentimentos separados; "Meus dados" (ver, baixar, revogar); excluir conta.
3. ~~**Garagem (Mateus):**~~ FEITO 12/11. várias motos (marca, modelo, ano, apelido, foto da galeria, km); a moto principal aparece no perfil.
4. ~~**Contatos de emergência (Mateus/Bia):**~~ FEITO 12/11 (local; banco já tem a tabela com RLS). até 3, usados pelo SOS; só o dono vê.
5. ~~**Perfil editável (Mateus):**~~ FEITO 12/11. nome, apelido, cidade, foto (câmera/galeria), Loja/Oriente/Potência com visibilidade.
6. ~~**Rota (Mateus):**~~ FEITO 12/11: até 3 caminhos para escolher, barra de trechos na ordem do percurso, "a terra começa no km X". Pendentes: "piso desconhecido" (o Valhalla não informa quando o piso não está etiquetado no OSM) e voz "Terra em 2 km" (etapa da navegação).
7. ~~**Peso do APK:**~~ ENCERRADO 12/11: R8 testado (70,4 → 70,2 MB, ganho desprezível; o peso são as bibliotecas nativas). Desligado. Na Play Store o App Bundle (AAB) já baixa só o necessário para cada aparelho.
8. ~~**Android Auto:**~~ FEITO 12/11 (entra na próxima versão de teste; Java só é compilado no EAS): cartão de manobra (seta própria + distância + rua), chegada prevista, "recalculando", botões Mover/Mais zoom/Menos zoom/Recentrar. Testar no DHU.
9. **Feed:** ~~enquete~~ e ~~salvar post~~ FEITOS 12/11. ~~Stories de 24 h~~ FEITO 12/11. Faltam: vídeo (até 60 s), menções (@).
9a. **Pontos coletados (decisão do dono 12/11):** quando o workflow `coletar-pontos.yml` gravar `tools/coleta/`, extrair da Rota Biker só fatos (nº, nome, cidade, coordenada, link oficial) e do OSM de MT cachoeiras, mirantes, monumentos e atrações; gerar `app/src/dados/pontos-coletados.json` com fonte/licença; pinos 'Rota Biker' (grupo Encontros) e natureza; crédito na ficha. Sem textos nem fotos de terceiros.
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
