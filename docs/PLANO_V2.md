# Plano das próximas etapas (v2) — 12/11/2026

Objetivo do dono: app todo operacional; "a maior rede social de motociclistas da América do Sul".
Cada etapa termina com versão de teste e roteiro para o dono.

## Etapa A — Social completo no aparelho (agora, sem servidor)
1. **Conversas (chat):** lista única ordenada pela última mensagem; 1:1 só depois de aceno aceito; grupos do capítulo (automático), do passeio/evento (quem marcou "Vou"), do comboio e do Ágape (temporários, fecham ao fim); canal de **Avisos da diretoria** fixado (só diretoria publica, membros reagem TFA); respostas rápidas de estrada; silenciar; denunciar; bloquear. Pilotando: só voz; trava acima de 8 km/h. Prévia da notificação só "Nova mensagem". Em modo local a mensagem não chega a outro celular (só para aprovar a interface).
2. **Stories com vídeo:** câmera própria (foto e vídeo até 60 s, trocar câmera, flash, galeria), filtros locais (sem reconhecimento facial), legenda rica (texto com estilos, cores, fundo, posição, @menção, local, km do dia), remove EXIF/GPS.
3. **Desafios:** em Perfil → Conquistas. Tipos prontos (km no mês, visitar sedes/Lojas, ir a passeios, Ágape, marcos Rota Biker, Socorro Fraterno confirmado pelo ajudado). Criados por irmão (1/mês, aprovação da diretoria), diretoria (publica direto) e entre capítulos (aceite das duas diretorias; média de km por irmão ativo). Prazo máx. 90 dias; selo de modelo pronto; nunca velocidade/tempo; ninguém aparece como "perdedor".
4. **Identidade visual:** logo nova (escudo + bode geométrico com chifres-estrada, sem símbolo maçônico), tela de carregamento animada (2,2 s, SVG + reanimated, respeita "reduzir movimento", nunca ao abrir em movimento), estados vazios, microanimações, esqueletos de carregamento.
5. **Mapa:** todos os irmãos visíveis; de longe viram pontos com a cor do status (feito); pontos coletados (Rota Biker, OSM) (feito).

## Etapa B — Servidor ligado (Supabase; depende da tarefa do dono)
Login real (link mágico, Google, Apple), aprovação por capítulo, perfis e garagem no banco, feed/stories/fotos no Storage, chat em tempo real (Realtime), aceno com limite no servidor, denúncia/bloqueio com fila (resposta em até 24 h), notificações push, retenção (stories 24 h, grupos 30 dias após o fim, conta excluída em 30 dias), painel mínimo (aprovar membros, moderar). RLS + pgTAP em tudo.

## Etapa C — Mapa ao vivo, passeios e segurança reais
Posições dos irmãos no servidor (aproximado ~5 km padrão, zonas privadas), modo temporário, comboio ao vivo, SOS para grupo e contatos, Ágape real, Sugestões de passeios (aba Passeios) e importação semanal do OpenStreetMap.

## Etapa D — Gamificação completa
XP e níveis, selos, rankings (geral e por capítulo, com opção de sair), desafios entre capítulos, antifraude (GPS, >200 km/h descartado, check-in ≤200 m).

## Etapa E — Receita e carro
Premium (RevenueCat, 7 dias grátis), Guia de Negócios com planos (cobrança fora do app), CarPlay.

## Etapa F — Lançamento
Revisão de segurança (desenvolvedor), conta de demonstração, teste fechado em Cuiabá (~1 mês), interruptor por capítulo, publicação nas lojas.

## Decisões pendentes do dono
1. Barra de abas: trocar **Ferramentas** por **Conversas** (Sofia) ou manter e pôr um botão "Conversas" no topo do Mapa/Feed (Paulo)?
2. Desafio criado por irmão dá só selo, e XP só nos da diretoria/admin (Paulo)?
3. Conceito da logo (Marcelo) aprovado? Se sim, o dono gera a arte no ChatGPT com o prompt e o agente redesenha em SVG.
