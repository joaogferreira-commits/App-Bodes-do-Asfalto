# Mapa de versões

Cada versão de teste tem um número (mostrado em Perfil, no rodapé). Regra: o número sobe a cada versão de teste pedida
(`0.MENOR.0`); correções dentro da mesma versão sobem o último número. O número interno do Android (versionCode) sobe
sozinho no EAS. A versão mais nova fica no topo; o teste automático confere que este arquivo e o `app/app.json` batem.

## 0.12.0 — 12/11/2026

- SOS sempre à mão: botão vermelho no Mapa e em todas as abas; "Pedir ajuda (SOS)" ao segurar o ícone do app; pergunta no primeiro uso se quer o atalho de SOS na tela inicial; no Perfil, "Colocar atalho na tela inicial" e "Colocar widget de SOS" (Android).
- Mapa: todo ícone abre uma ficha (irmão, posto, sede, Loja, negócio, lugar turístico, Ágape); 45 monumentos da Rota Biker com ícone próprio; 180 cachoeiras, mirantes, monumentos e atrações de MT (OpenStreetMap); filtro "Passeio"; irmãos viram pontos coloridos de longe.
- Android Auto: cartão de manobra (seta, distância, rua), chegada prevista e botões de zoom/recentrar.
- Garagem: editar moto direto do perfil; moto de exemplo identificada.
- Guia de Negócios, vitrine e carteirinha "Sou membro".
- Feed sem o título "Feed".

## 0.11.1 — 12/11/2026

- Navegação: na partida o app pede ao Google uma rota NOVA saindo de onde o irmão está (o token feito na tela de rota partia do ponto do planejamento e podia ter vencido — era o "aceita e depois recusa").
- Se o Google recusar, o aviso mostra o motivo (código), para corrigirmos na próxima.
- Partida mais rápida: o botão Iniciar não espera mais a conferência do Google; posição e rota correm junto com a abertura da navegação; limites de tempo (Google 8 s por tentativa, 12 s para aceitar a rota, servidor de rotas 20 s).
- Texto da tela de rota ficou honesto: "O Google calculou esta rota. A confirmação final é na partida."
- Guia de Negócios da 0.11.0 entra nesta versão de teste.

## 0.11.0 — 12/11/2026

- Guia de Negócios novo: parceiros pagos aparecem primeiro com selo dourado "Parceiro"; plano vencido perde o destaque sozinho.
- Vitrine do negócio: fotos, benefício para irmãos em destaque, horário, comodidades, botões Rota, WhatsApp e Ligar, e "Recomendo".
- Carteirinha "Sou membro" para mostrar no balcão (relógio andando prova que não é print; nada maçônico aparece).
- Contadores anônimos para o anunciante: só números somados, nunca quem foi; números pequenos aparecem como "menos de 5".

## 0.10.0 — 12/11/2026
- Ferramentas virou aba (Mapa, Feed, Passeios, Ferramentas, Perfil); Conquistas abre pelo Perfil.
- Botão "Eu" do mapa: avisa se falta permissão ou GPS, usa a última posição na hora e mostra "Você está aqui".
- Mapa: de longe, os emblemas viram pontinhos coloridos; o emblema só aparece de perto.
- Manutenção: dá para editar nome, intervalo e km de cada item, criar itens novos e apagar.
- Classificados novos: categorias, fotos, preço, estado, cidade, anunciar e marcar como vendido.
- Stories de 24 h; R8 desligado (ganho de só 0,2 MB).
- **SOS funcional sem servidor:** segurar 3 s abre a tela de SOS com localização, ficha de emergência, WhatsApp de cada contato, grupo do comboio e 192/193.
- **Km automático:** no modo pilotando o GPS soma os km rodados e atualiza a Manutenção e a moto principal da garagem.
- Classificados revisados pela design (preço digitado "98.500" agora fica certo, ficha da moto, contador de fotos, guardar com rótulo).
- Telas fora das abas (classificados, garagem, publicar…) também travam com a moto andando.
- Número da versão e este mapa de versões.

## 0.9.0 — 12/11/2026 (build 265c0b66)
- Teste da compactação R8 (70,2 MB). Enquete e posts salvos no feed.

## 0.8.0 — 12/11/2026 (build 517bc726)
- Garagem de motos, contatos de emergência, editar perfil (Loja/Oriente/Potência com consentimento).
- 8 correções da revisão de QA (sair limpa os dados, guarda de acesso, confirmações, toques de 48 dp).
- Rota com até 3 caminhos, barra de trechos de terra e km onde a terra começa.

## 0.7.0 — 12/11/2026 (build 78454dcd)
- Etapa 1: entrada (link mágico, Google, Apple, demonstração), consentimentos LGPD, pedido de entrada, espera, Meus dados.
- Banco do clube (Supabase) com regras de acesso e 20 testes.

## 0.6.0 — 12/11/2026 (build af4a8692)
- Retorno do dono: painel recolhível, botões do pilotando menores, pinos agrupados, tema Sol, aviso de rota × Google.
- Feed: publicar, editar, excluir, comentar; fotos de domínio público; avatares ilustrados.

## 0.5.0 — 12/11/2026 (build 4224aa0c)
- Perfil novo, criador de avatar, aba Passeios, Ágape flutuante no mapa, 20 ferramentas.

## 0.4.0 — 12/11/2026 (build 75e40885)
- Feed com cara de feed, conquistas, busca no mapa, bate-volta, pinos bordados, nomes de ruas.

## 0.3.0 — 12/11/2026 (build 4eb03b5e)
- Pesquisa de usabilidade aplicada: tema Sol, trava em movimento, modo pilotando, estilo do mapa, carro.

## 0.2.0 — 12/11/2026 (build 10955da2)
- Interface v2 (visual novo), tipo de estrada (Só asfalto / Misto / Prefiro terra), ícone do app.

## 0.1.0 — 11/11/2026 (builds 1 a 6)
- Etapa 0: prova técnica — mapa, navegação do Google, Android Auto no DHU.
