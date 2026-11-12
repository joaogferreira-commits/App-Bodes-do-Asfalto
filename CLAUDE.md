# CLAUDE.md — App Bodes do Asfalto

Regras permanentes deste projeto. Leia este arquivo, `docs/PROGRESSO.md` e a etapa atual em `docs/ETAPAS.md` no início de toda sessão. A especificação completa está em `docs/ESPECIFICACAO.md`.

## O produto

Rede social, copiloto de estrada e ferramenta de **confraternização** do motoclube **Bodes do Asfalto**, um motoclube de **maçons**. Publicado na App Store e no Google Play com o nome "Bodes do Asfalto". Funciona no celular, no **Android Auto** e no **CarPlay**, no lançamento (o CarPlay pode entrar depois, por atualização, se a Apple atrasar).

**O app é propriedade do dono do projeto (pessoa física), não da diretoria do clube.** A diretoria do clube participa abonando membros; o dono nomeia moderadores. O uso do nome e do escudo depende de autorização/licença escrita do clube (tarefa do dono).

Princípios, nesta ordem:
1. **Segurança na estrada.** Com a moto em movimento, só rota, alertas, voz e botões grandes. Nenhuma pontuação por velocidade ou tempo de percurso.
2. **Discrição e privacidade (LGPD).** Ser usuário do app revela filiação maçônica, que é **dado pessoal sensível** (LGPD, art. 5º, II: filiação a organização de caráter filosófico). Coletar só o necessário, consentimento específico e destacado, criptografia, nada de anúncios personalizados, localização sempre sob controle do irmão. Nunca coletar grau, ritual, sinais, palavras ou qualquer conteúdo reservado.
3. **Confraternização.** Facilitar que irmãos se encontrem, se ajudem e se visitem na estrada.
4. **Identidade do clube.** Capítulos, patches e sedes estão no centro.

## Decisões de 11/11/2026 (prevalecem sobre qualquer outro trecho)

O dono aceitou todas as recomendações do agente: stack Google + MapLibre + Valhalla (sem Mapbox); navegação curva a curva no Premium com 7 dias grátis (SOS, alertas e comboio grátis); Apple em CPF e Google Play como empresa; CarPlay não segura o lançamento; teto de alerta R$ 500/mês com orçamento o mais apertado possível; avatar por IA 1 grátis por conta e 2/mês no Premium (avatar "montar" na Etapa 1, por IA na Etapa 8); revisão de segurança por um desenvolvedor (4 a 8 h) antes do envio às lojas; v1 sem anúncios e sem aviso de rastreamento (ATT); imagens pelo Caminho A (dono gera no ChatGPT); cores do DESIGN.md; modo pilotando com 6 botões.

**12/11/2026 (pesquisa):** as decisões de interface seguem `reports/Usabilidade e interface Bodes do Asfalto.md` (resumo no topo do `docs/DESIGN.md`); itens marcados como decisão do dono aguardam o OK dele.

**12/11/2026 (publicação):** Google Play em conta **pessoal no CPF** já (US$ 25), para mandar link da loja aos irmãos pelo teste interno; migrar para a conta da empresa depois. Só Android por enquanto (Apple depois).

**12/11/2026:** a interface é prioridade igual ao desenvolvimento e passa pelo dono antes de virar código (Interface v2 em `docs/telas/v2/`). Tipo de estrada no planejamento (Só asfalto / Misto / Prefiro terra) e terra sempre com cor/traço próprios. Pendências externas (licença da marca, empresa) ficam para depois do app pronto.

**Como falar com o dono:** entregar **uma tarefa por vez**, em texto de passos numerados; só mandar a próxima depois que ele disser que a anterior foi feita.

## Decisões fechadas (não mude sem perguntar)

| Tema | Decisão |
| --- | --- |
| Propriedade | App do dono do projeto, operado pela empresa dele (SLU, aberta até mar/2027). Até lá, CPF. Papel `admin` = dono. Moderadores nomeados pelo dono. |
| Quem entra | **Somente membros do Bodes do Asfalto.** Regra por capítulo: (a) se o capítulo (cidade) do candidato **já tem diretoria ativa no app**, só essa diretoria aprova os próprios membros; (b) se o capítulo **ainda não tem diretoria no app**, o candidato preenche o formulário de solicitação (nome, apelido, capítulo, cidade, telefone, foto, membro que indica) e o **admin (dono) ou um moderador** aprova. Quando a diretoria de um capítulo entra no app, a aprovação daquele capítulo passa automaticamente para ela (admin mantém poder de exceção). Até a aprovação, o usuário fica `pendente` e só vê a tela de espera. Sem papel de convidado na v1. |
| Organização | Vários capítulos. Cada membro pertence a um capítulo. Rankings geral e por capítulo. |
| Papéis | `pendente`, `membro`, `diretoria_capitulo`, `diretoria_geral`, `moderador`, `admin`. Diretoria: abona membros e cria passeios do seu capítulo. Moderador: modera conteúdo, revisa formulários. Admin: tudo. |
| Perfil maçônico | Loja, Oriente e Potência **opcionais**, cada campo com visibilidade escolhida pelo irmão (ninguém, amigos, todos os membros). Não pedir grau. Consentimento LGPD específico para dados maçônicos, revogável. |
| Mapa ao vivo dos irmãos | Visibilidade por irmão: `invisivel`, `cidade`, `aproximado` (~5 km, **padrão**), `preciso_amigos`, `preciso_comboio`. Zonas privadas (casa, trabalho) nunca exibidas. Modo temporário (ex.: 2 h, durante a viagem) que desliga sozinho. Status: na estrada, parado para café, aberto a encontro, não perturbe. Posição aproximada calculada no **servidor** (o app nunca recebe a coordenada exata de quem escolheu aproximado). |
| Chat pelo mapa | Começa por **aceno**; chat só abre se o outro aceitar. Respostas rápidas de estrada. Pilotando: aviso só por voz. Bloquear, denunciar, limite de acenos por dia. |
| Confraternização | Irmão na Rota, Ágape Relâmpago, Socorro Fraterno, Chegada na Cidade, Visitação de Lojas, Guia de Negócios de Irmãos — regras em `docs/ETAPAS.md` (Etapas 2, 4 e 6). Toda notificação de confraternização é opcional (opt-in) e configurável por tipo e raio. |
| Lojas | Cadastradas por um irmão da própria Loja (Oriente, Potência, dias de sessão, irmão de contato), visíveis só para membros. O app só aproxima; a entrada segue o procedimento da Loja. |
| Idiomas | pt-BR (padrão), es, en. Nenhum texto fixo no código: tudo em arquivos de tradução. |
| Receita | Freemium + parceiros/negócios. **v1 sem anúncios** (decisão de 11/11/2026: anúncios revelariam a filiação a terceiros; reavaliar após o lançamento, e nunca com o aviso de rastreamento do iPhone/ATT). Premium (RevenueCat): navegação curva a curva no app e no carro, estatísticas e diário, visual exclusivo, regiões offline, avatar por IA 2/mês; 7 dias grátis. SOS, alertas e comboio sempre grátis, inclusive no carro. Guia de Negócios: cadastro gratuito; destaque no mapa como plano pago. |
| SOS | Push para o grupo do passeio e contatos que usam o app + WhatsApp com mensagem pronta e link da localização. Sem SMS pago. Não substitui 192/193. |
| Lugares | Monumentos e pontos turísticos do OpenStreetMap (atribuição visível); sedes, Lojas e negócios cadastrados no app/painel. |
| Gamificação | Tabela de XP e níveis da especificação (Cabrito, Bode, Bode Velho, Bode Lendário), configurável no painel, mais selos de confraternização (Ágape, Socorro Fraterno, Visitação de Lojas, Irmão na Rota). |
| Visual | Identidade "Patch de Colete" com os tokens de `docs/DESIGN.md`. Tudo em `app/src/theme/`. Logo provisório. |
| Publicação | Apple em CPF (migrada depois para a empresa), aberta só quando for necessária. Google Play como conta de organização da empresa (exige CNPJ e D-U-N-S), o que dispensa a regra dos 12 testadores por 14 dias; teste fechado com irmãos mantido. Android testado antes disso por link de instalação do EAS. Como o app exige login aprovado, preparar **conta de demonstração** para os revisores da Apple e do Google. |

## Regras detalhadas (revisão de 10/11/2026)

**Acesso e membros**
- Desligamento: a diretoria do capítulo (ou admin/moderador) desativa o irmão na hora; o acesso cai e o perfil fica oculto. Dados apagados conforme a política de retenção ou a pedido.
- Formulário (capítulos sem diretoria no app) exige: foto do irmão com o colete, foto da carteirinha do clube e indicação de um membro já aprovado, que recebe pedido de confirmação no app.
- Lista de membros (nome, apelido, capítulo) visível a todos os membros.
- Login: e-mail com link mágico, Google e Apple. Sem SMS.

**Localização**
- Localização em segundo plano: desligada por padrão; só funciona se o irmão ativar (mapa ao vivo e Chegada na Cidade). Textos de permissão claros para a revisão da Apple.
- Trilhas e rotas gravadas: privadas por padrão; o irmão compartilha cada uma.
- Histórico de posições ao vivo: apagado automaticamente após **7 dias** (tarefa agendada no banco).

**Chat e comunidade**
- Chat: 1:1 por aceno; grupo do passeio (criado para quem confirmou presença); grupo do capítulo; grupo do Ágape (temporário, encerra ao fim do ágape).
- Feed: posts visíveis a todos os membros por padrão; autor pode restringir ao capítulo ou aos amigos.
- Moderação: moderadores e admin em tudo; diretoria só no próprio capítulo.
- Conteúdo maçônico: sem regra específica; moderação apenas por denúncia.
- Notificações: todas na hora, cada tipo ligável/desligável nas preferências.
- Eventos de Lojas, Potências e eventos maçônicos: divulgação gratuita no app (cadastro por irmãos, com moderação).

**Negócio**
- Premium: R$ 9,90/mês ou R$ 89/ano (configurado no RevenueCat e nas lojas). Inclui: estatísticas e diário de viagem, sem anúncios, visual exclusivo e regiões inteiras offline.
- Destaque no Guia de Negócios: cobrado **fora do app** (Pix/boleto direto com o dono), ativado manualmente no painel com data de validade. Nenhum link de pagamento externo dentro do app.
- Receita no nome da empresa do dono (SLU) quando existir; até lá, CPF.

**Estrada e gamificação**
- Rota em navegação funciona offline de graça (rota e mapas do trajeto salvos no aparelho).
- Importar/exportar GPX: grátis.
- O irmão pode sair dos rankings (continua com XP e selos).
- CarPlay: o lançamento **não espera** a aprovação da Apple; se atrasar, o CarPlay entra por atualização. Avise o dono com antecedência.

**Operação e lançamento**
- Escala esperada: 300 a 1.000 irmãos no primeiro ano. Dimensione planos de Supabase, Google e servidor de rotas para isso.
- Orçamento: **o mais apertado possível** (pedido do dono em 11/11/2026). Use planos gratuitos até o lançamento; só crie conta paga quando ela for indispensável para a tarefa atual e avise o custo antes. Alerta ao dono se a infraestrutura passar de **R$ 500/mês**; limite diário e alerta de orçamento no Google Cloud; alertas de uso no Supabase e Expo.
- Lançamento em fases: primeiro o capítulo de **Cuiabá** (cerca de 1 mês), depois os demais. Prever um interruptor por capítulo no painel.
- Domínio novo (sugira opções livres) para site simples, e-mail de suporte, política de privacidade e termos.
- Suporte: botão "Ajuda" no app (texto, print e dados do aparelho, chega no painel), e-mail de suporte e link para o WhatsApp de suporte.
- LGPD: o encarregado de dados é o dono. O agente redige política de privacidade e termos (com a seção de dados sensíveis e a base legal de cada dado) para revisão do dono.

## Interface (referência obrigatória)

As telas aprovadas ficam em `docs/telas/` (arquivos `.dc.html`, abra como HTML para ver). Elas definem visual, hierarquia e textos; reproduza-as em React Native com fidelidade. Telas sem referência seguem o mesmo padrão.

- **Estilo:** robusto de estrada, com as cores de `docs/DESIGN.md` (fundo `noite`, cartões `sarja`, texto `creme`, secundário `caramelo`, `laranja` só para ações principais e destaques, `vermelho` só para SOS, `alerta` só para alertas).
- **Tipografia:** Barlow Condensed (títulos, números grandes) e Inter (textos). Corpo 17 px, nunca menor que 13 px. Público majoritariamente de 40 a 60 anos: letras grandes, poucos itens por tela, frases curtas.
- **Toque:** mínimo 48 px no app. Modo pilotando: 6 botões (Alerta, Reagrupar, Posto mais próximo, Posto na rota, SOS, Encerrar) com lado menor ≥ 113 dp — em pé 2×3 (~150 × 120 dp), deitado 3×2; SOS segurando 3 s, Encerrar segurando 1,5 s (pesquisa de 12/11/2026; aguarda OK do dono). Carro: Android Auto aceita só 4 botões → SOS, Alerta, Postos, Encerrar (comboio por texto/alertas). Alto contraste sempre; tema Sol de dia.
- **Tela inicial:** o Mapa. Mostra tudo o que está na área visível: irmãos (avatares com anel de status), capítulos/sedes, Lojas, postos (preço e nota ANP), monumentos, pontos turísticos, negócios de irmãos e Ágapes; contador "Nesta área"; filtros; botão de visibilidade; botões "Posto mais próximo" e "Posto na rota"; cartão do evento mais próximo.
- **Kit visual (`docs/telas/Kit.dc.html`):** pinos do mapa por tipo (cor + ícone), avatares ilustrados padrão (até o irmão subir foto), mascote Bodinho (boas-vindas, estados vazios, conquistas — nunca no modo pilotando) e ilustrações de estado vazio. Converter para SVG/componentes React Native.
- **Feed:** stories no topo, compositor com Foto, Vídeo, Rota, Enquete e Evento; cartão de viagem com imagem, recap 3D, km, tempo, irmãos, XP, selo, marcados, reação "TFA", comentários, compartilhar e "Usar rota"; cartão de passeio com Vou/Talvez.
- **Navegação:** barra inferior com Mapa, Feed, Passeios, Conquistas, Perfil.
- **Ícones:** traço (stroke), nunca emoji. Acessibilidade: rótulos em botões só com ícone, contraste mínimo 4.5:1, suporte ao tamanho de fonte do sistema.
- **Tema trocável:** cores, fontes, nome e logo vêm de um único arquivo de tema (o nome e o escudo podem mudar conforme a licença da marca).

## Acabamento visual (ver docs/DESIGN.md — obrigatório)

- **Regra de ouro:** a IA de imagem gera matéria-prima (emblemas, texturas, ilustrações); a interface é desenhada em código. Nunca use imagem para botão, cartão, texto ou layout.
- **Identidade escolhida:** "Patch de Colete" refinada (`docs/telas/IconesPatch.dc.html`). Tokens de cor, tipografia, raios, 3 níveis de profundidade e componentes em `docs/DESIGN.md`.
- **Bibliotecas de acabamento:** `react-native-svg` (ícones vetoriais), `boxShadow` nativo (sombras), Lottie ou Rive (animações ≤ 100 KB), `expo-image` (cache de imagens). Skia saiu em 12/11/2026 (o visual v2 não precisa; volta só se um efeito exigir).
- **Mapa:** estilo MapLibre próprio em `app/src/map/estilo-bodes.json`, conforme a seção 3 do DESIGN.md.
- **Limite de peso:** seção 4 do DESIGN.md. Medir a cada build de teste.
- **Imagens geradas (decisão do dono em 12/11/2026):** fila única em `tools/fila_imagens.json` (lista legível em `docs/FILA_IMAGENS.md`). Itens `dono` = as mais importantes, o dono faz no ChatGPT (Caminho A). Itens `auto` = o agente gera grátis pelo workflow `imagens-ia.yml` em cascata Cloudflare → Gemini → Pollinations, com limite por rodada (Pollinations só para imagens de exemplo). Chaves só em GitHub Secrets (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY`). Nada pago sem autorização.
- **Enquanto as imagens não existirem:** use as versões vetoriais das pranchetas `.dc.html` como provisórias; nada trava por falta de imagem.

## Recursos vindos da pesquisa de mercado (ver docs/ESPECIFICACAO.md)

- **Postos:** "mais próximo" (raio a partir da posição) e "na rota" (à frente no trajeto, com desvio mínimo). Mostrar distância, preço e nota de qualidade da ANP. Na Etapa 0, verifique se a ANP oferece dados abertos de preços e da nota de qualidade dos postos (app "ANP com VC – Postos"); se não houver acesso, use preço colaborativo informado pelos irmãos (com data) e OpenStreetMap para a localização dos postos. Mostre sempre a fonte e a data do preço.
- **SOS revela a posição:** quem está em "aproximado" ou "invisível" passa a mostrar a posição exata ao grupo e aos contatos durante um SOS, e volta ao normal ao encerrar.
- **Avisos rápidos no comboio:** pausa, combustível baixo, ficou para trás.
- **Modo economia de bateria** e **voz pelo intercomunicador** (áudio Bluetooth padrão).
- **Gerador de bate-volta:** rota de ida e volta por distância e direção, com perfil "mais curvas".
- **Social completo:** stories de 24 h, vídeos curtos (até 60 s, comprimidos), enquetes, menções (@), hashtags, álbuns, salvar, compartilhar fora do app com marca d'água do clube, notificações centralizadas, mensagens diretas.
- **Fotos:** remover metadados de localização (EXIF) ao publicar; nunca expor a zona privada no trajeto publicado (cortar o início e o fim da trilha perto de casa).

## Stack (não troque sem perguntar)

- **App:** React Native + Expo (SDK estável mais recente), TypeScript estrito, Expo Router. **Development builds** (`expo prebuild` / EAS Build), nunca Expo Go.
- **Módulos nativos:** criados com Expo Modules API dentro de `app/modules/`:
  - navegação: Google Navigation SDK (pacote React Native oficial, em Beta), com ponte própria se faltar algo;
  - Android Auto (Car App Library, Kotlin, categoria navegação);
  - CarPlay (framework CarPlay, Swift, entitlement de navegação).
- **Mapas:** MapLibre (`@maplibre/maplibre-react-native`) com dados OpenFreeMap para o mapa principal; Google Navigation SDK para curva a curva (app, Android Auto e CarPlay); servidor Valhalla próprio para planejar rotas (só a partir da Etapa 3). Plano B da navegação: Ferrostar + Valhalla. **Mapbox fora do projeto.**
- **Backend:** Supabase — Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions. Migrations em `supabase/migrations`, seed em `supabase/seed.sql`.
- **Dados no app:** TanStack Query. Formulários: react-hook-form + zod. Traduções: i18next.
- **Monetização:** RevenueCat (`react-native-purchases`), Google AdMob (`react-native-google-mobile-ads`) com consentimento UMP e App Tracking Transparency no iOS.
- **Notificações:** Expo Notifications.
- **Erros em produção:** Sentry.
- **Painel de administração:** Next.js (dono, moderadores e diretoria) em `admin/`, ligado ao mesmo Supabase, publicado na Vercel.
- **Testes:** Jest + React Native Testing Library; testes SQL/pgTAP das políticas RLS no Supabase local; fluxos Maestro em `e2e/`.

## Estrutura do repositório

```
app/          App Expo (src/, modules/, assets/)
admin/        Painel web de administração (Next.js)
supabase/     migrations/, functions/, seed.sql, tests/
e2e/          Fluxos Maestro
docs/         ESPECIFICACAO.md, ETAPAS.md, PROGRESSO.md, decisões
.github/      Workflows de CI
```

## Como trabalhar (modo autônomo)

1. Comece pela etapa marcada como atual em `docs/ETAPAS.md`. Antes de codar uma etapa nova, mostre um plano curto e espere o OK.
2. Para cada tarefa: escreva o teste → escreva o código → rode `lint`, checagem de tipos e testes → corrija até passar → commit pequeno com mensagem clara.
3. Ao fim de cada tarefa, atualize `docs/PROGRESSO.md` (feito, falta, decisões, problemas).
4. Se o mesmo erro persistir após 3 tentativas: registre no PROGRESSO.md, explique e pergunte.
5. Nunca marque algo como pronto sem os testes passando. Nunca desative um teste para ele "passar".

## Quando parar e chamar o dono do projeto

Somente quando:
- precisar de conta, chave, senha, pagamento ou acesso;
- houver decisão de produto que a especificação e este arquivo não respondem;
- chegar a um **PONTO DE TESTE** de `docs/ETAPAS.md`.

No ponto de teste: gere a versão de teste (EAS Build, perfil `preview`), e entregue um roteiro numerado do que testar no celular, com o resultado esperado de cada passo.

## Como falar com o dono do projeto

O dono do projeto **não programa** e usa um **PC (Windows/Linux), sem Mac**. Portanto:
- Escreva em português simples, sem jargão. Se um termo técnico for inevitável, explique em uma linha.
- Instruções sempre em passos numerados, dizendo onde clicar e o que deve aparecer.
- Nunca peça para ele editar código. Se precisar de uma chave, diga exatamente onde obtê-la e onde colá-la (variáveis de ambiente do EAS / Supabase / GitHub Secrets).
- Testes de iPhone e CarPlay: via builds na nuvem (EAS) instalados pelo TestFlight; CarPlay testado num carro com CarPlay.
- Android Auto: teste com o Desktop Head Unit (DHU) no PC — dê o passo a passo — e depois num carro.

## Segurança e privacidade (inegociável)

- Toda tabela com RLS ativado e testado. Nenhuma chave `service_role` no app.
- Nunca grave chaves, senhas ou `.env` no repositório; mantenha `.env.example` atualizado.
- Contatos de emergência, telefone, dados maçônicos e localização ao vivo só visíveis a quem a regra permitir (teste isso).
- Localização ao vivo: tabela separada, apagada/expirada automaticamente; posições `aproximado` e `cidade` geradas no servidor; zonas privadas aplicadas no servidor.
- Dados maçônicos (Loja, Oriente, Potência) criptografados em repouso e nunca enviados a terceiros (anúncios, analytics, Sentry).
- Localização ao vivo apagada ao fim do comboio; trilhas gravadas pertencem ao piloto e podem ser apagadas.
- Moderação: denunciar post/mensagem e bloquear usuário desde a primeira versão do feed e do chat (exigido pelas lojas).
- Antifraude da gamificação conforme a especificação (GPS ativo, descartar >200 km/h e saltos, check-in a ≤200 m).

## Economia de uso (plano Claude Pro)

O agente roda na assinatura Pro, com limite a cada 5 horas e semanal.
- Leia só os arquivos necessários para a tarefa; use o PROGRESSO.md em vez de reexplorar o projeto.
- Prefira tarefas pequenas e completas. Não refaça trabalho já registrado.
- Se o limite estiver acabando, termine a tarefa em andamento, faça commit e atualize o PROGRESSO.md antes de parar.

## Comandos (atualize quando criar o projeto)

- App: `cd app && npm run lint && npm run typecheck && npm test` (instalar pacotes com `EXPO_OFFLINE=1 npx expo install ...`; a rede do agente bloqueia api.expo.dev)
- Imagens: `python3 tools/converter_imagens.py` (testes: `cd tools && python3 -m unittest`)
- Build de teste a partir do agente: editar `.github/build-request.txt` (plataforma=, perfil=) e fazer push — o GitHub Actions dispara o EAS. A cada versão de teste: subir `version` em `app/app.json` e registrar em `docs/VERSOES.md` (o teste confere)
- Imagens por IA: acrescentar itens em `tools/fila_imagens.json` (ou editar `.github/imagens-request.txt`) e fazer push — o workflow gera e faz commit
- Banco: `supabase start`, `supabase db reset`, `supabase test db`
- E2E: `maestro test e2e/`
- Build de teste: `eas build --profile preview --platform all`

## Permissões do agente (.claude/settings.json)

Se o arquivo `.claude/settings.json` não existir no repositório, crie-o com este conteúdo:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm install*)",
      "Bash(npm run *)",
      "Bash(npm test*)",
      "Bash(npx expo *)",
      "Bash(npx eas *)",
      "Bash(eas *)",
      "Bash(npx supabase *)",
      "Bash(supabase *)",
      "Bash(maestro *)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git checkout*)",
      "Bash(git branch*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.local)",
      "Read(./.env.production)",
      "Read(./app/.env)",
      "Read(./app/.env.local)",
      "Read(./app/.env.production)",
      "Read(./admin/.env)",
      "Read(./admin/.env.local)",
      "Read(./admin/.env.production)",
      "Bash(git push --force*)",
      "Bash(supabase db push*)",
      "Bash(eas submit*)"
    ]
  }
}
```
