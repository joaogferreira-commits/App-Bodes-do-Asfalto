# Varredura P13: nada "em breve", nada de exemplo na versão das lojas

Regra do dono: "nenhum botão dizendo que isso só entra depois e nada sem função efetiva". O que não está pronto fica **escondido**.
"Servidor" = app com o Supabase configurado (versão das lojas). "Local" = sem servidor (só desenvolvimento e testes).
O teste `app/src/__tests__/sem-em-breve-servidor.test.tsx` confere que nenhuma aba principal mostra "em breve", "exemplo", "versão de teste" ou "simular" no modo servidor.

| Tela | Item | Ação |
| --- | --- | --- |
| Entrada / Espera | Botão "Simular aprovação" | Escondido no servidor (já era) e agora a função não faz nada com o servidor ligado (impossível aprovar sozinho) |
| Entrada | "Entrar em demonstração" e aviso "versão de teste" | Mantido só no local; a função também não faz nada no servidor |
| Perfil | Linha "Como apareço no mapa" (mostrava "em breve") | Ligado: leva ao Mapa, onde fica o botão de visibilidade |
| Perfil | Nome, cargo, "desde", números (km, viagens, passeios, selos) de exemplo | Escondido no servidor (mostra só o que o irmão cadastrou) |
| Perfil | Cartão da moto de exemplo com selo "Exemplo" | Escondido no servidor (só o botão "Cadastrar minha moto") |
| Perfil | Seção "Meu capítulo" (42 irmãos, diretor de exemplo) | Escondido no servidor |
| Perfil | Dados maçônicos de exemplo | Escondido no servidor (mostra os campos reais do irmão, vazios se não preencheu) |
| Perfil | Contatos de exemplo (contagem) | Servidor mostra a contagem real |
| Perfil | Rodapé da versão | Mantido; "(teste)" só quando `EXPO_PUBLIC_AMBIENTE` não é `production` |
| Perfil | Texto de atalhos "no iPhone isso chega com a versão..." | Reescrito sem promessa futura (3 idiomas) |
| Feed | Ferramenta "Vídeo" do compositor (só dava "em breve") | Escondido no servidor |
| Feed | Posts, stories, ágape e "chegou na cidade" de exemplo; botão Acenar do exemplo | Mantido só no local (no servidor a lista já vinha vazia/real) |
| Feed | Cartões de viagem com recap 3D e "Usar rota" | Só existem nos posts de exemplo (local); o feed real não os mostra |
| Passeios | "Criar passeio" mostrando "em breve" | Mantido só no local (no servidor abre a tela de criar, para diretoria) |
| Passeios | Passeios de exemplo e aviso "exemplo" | Mantido só no local |
| Mapa | Sede, postos com preço, Loja, oficina, restaurante e ágape inventados | Escondido no servidor (ficam monumentos, cachoeiras, mirantes e os pontos do banco) |
| Mapa | Irmãos de exemplo | Já escondido no servidor (irmãos reais) |
| Mapa | Botão "Posto mais próximo" ia para o "Posto Trevo (exemplo)" | Ligado: no servidor acha o posto real mais próximo (15 km); sem posto, avisa. Exemplo só no local |
| Mapa | Ações da ficha "perfil" e "falar com o contato" (diziam "em breve") | Não existem nas fichas do servidor; mensagem "em breve" só no local |
| Mapa | Folha "Mais" com aviso "dados de exemplo" | Escondido no servidor |
| Busca | Resultados do clube vinham dos lugares inventados | Servidor usa só lugares reais |
| Rota | Destinos de prova "Ponto a 5 km" e "Posto Trevo (exemplo)" | Escondido no servidor (ficam Chapada e Centro de Cuiabá, lugares reais) |
| Conquistas | Números de exemplo | Já usava XP e selos do servidor; aviso "exemplo" só no local |
| Conversas | Aviso "mensagens ficam só neste celular" | Mantido só no local |
| Ferramentas | Bode Amigo, Irmãos por perto, Membros, Aniversários, Lojas (Visitação), Eventos (listas de exemplo) | Escondido no servidor (não há tabela no servidor) |
| Ferramentas | Guia de Negócios e Classificados (só exemplos, sem servidor) | Escondido no servidor (a carteirinha "Sou membro" só abre por eles) |
| Ferramentas | Meta de km (usava km de exemplo) | Escondido no servidor |
| Ferramentas | Telefones de emergência, Checklist, Combustível, Tempo, Viagem, Comboio, Ágape, Manutenção, Ficha, Bate-volta, Sobre o clube | Mantido (funcionam) |
| Ferramentas > Sobre | "Texto provisório, a diretoria pode editar no painel" | Escondido em produção (o texto da história ainda é provisório: o dono deve revisar) |
| Desafios | Botão "Aprovar (versão de teste)" | Já era só no local; no servidor a aprovação é da diretoria |
| SOS | "Nesta versão de teste o aviso por notificação não existe" | No servidor troca por "o SOS avisa o grupo e seus contatos, mas não substitui o 192/193" |
| Avatar | Frase "Em breve: avatar por IA" | Escondido sempre |
| Premium / RevenueCat | Telas de assinatura | Não existem no app (nada a esconder) |
| Qualquer tela | Faixas "versão de teste" em produção | Só aparecem fora de produção, via `app/src/ambiente.ts` (`EXPO_PUBLIC_AMBIENTE`, definido por perfil no `app/eas.json`) |

## Para o dono revisar depois

- Texto de "Sobre o clube" e de "Código de conduta" (é provisório).
- Quando Guia de Negócios, Classificados, Lojas, Eventos e Bode Amigo tiverem tabela no servidor, voltam à lista em `app/src/ferramentas/catalogo.ts` (lista `soExemplo`).
- Chaves de tradução antigas ainda existem nos 3 idiomas mas sem uso (por exemplo `comum.emBreve` ainda é usado só no modo local).

## Atualização (13/11/2026): voltaram com dados reais do servidor

Lojas (Visitação), Guia de Negócios (com o cartão "Sou membro"), Lista de membros e Aniversários saíram da lista `soExemplo`.
Migration em `supabase/pendentes/20261113160000_lojas_negocios_membros.sql` (com teste pgTAP ao lado); só vale no app depois de aplicada pelo workflow.
Aniversário (só dia e mês) fica em tabela própria, escondido por padrão; a lista só o mostra se o irmão marcou.

## Atualização (13/11/2026): Classificados e Eventos com dados reais do servidor

Saíram da lista `soExemplo`. Migration em `supabase/pendentes/20261113190000_classificados_eventos.sql` (com teste pgTAP ao lado); só vale no app depois de aplicada pelo workflow.
- Classificados: sem aprovação prévia (moderação por denúncia, tipo `classificado` em `denuncias`), até 5 ativos por irmão, vale 60 dias, fotos em bucket privado `classificados`, contato por aceno (WhatsApp opcional, só membros), "Vendido" pelo dono. Nenhum pagamento no app.
- Eventos: qualquer irmão cadastra, moderador/admin aprova (aba "Eventos" em Aprovações, recusa com motivo), até 3 por dia; os irmãos veem só aprovados que ainda não terminaram.
