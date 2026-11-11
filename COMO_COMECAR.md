# Como começar — guia para o dono do projeto

Você não precisa programar. Seu papel é: preparar as contas, colocar estes arquivos no GitHub, conversar com o agente e testar o app no celular e no carro.

## 1. Deixe a assinatura Claude sem cobranças extras

1. No claude.ai, abra **Configurações > Uso** e confirme que os **créditos de uso estão desligados**.
2. Pronto: quando o limite do plano Pro acabar, o agente pausa e volta quando o limite reiniciar (a cada 5 horas, com um teto semanal). Nada é cobrado além da mensalidade.
3. Se em algum momento o Claude Code oferecer "créditos de API", recuse.

## 2. Baixe a especificação

1. Abra o documento "App Bodes do Asfalto — Especificação e Plano de Desenvolvimento" no Claude.
2. No menu do documento (no nome dele), escolha **Exportar > Markdown** e salve o arquivo.
3. Guarde esse arquivo junto com os deste pacote, dentro da pasta `docs/`. Não precisa renomear: o agente renomeia para `ESPECIFICACAO.md` na primeira sessão.

Se mudar algo no documento depois, exporte de novo e envie por cima.

## 3. Crie o repositório no GitHub

1. Crie uma conta em github.com (se ainda não tiver).
2. Clique em **New repository**, nome `bodes-do-asfalto`, marque **Private** e crie.
3. Clique em **uploading an existing file** e envie todos os arquivos e pastas deste pacote, mantendo a estrutura:
   - `CLAUDE.md`
   - `PROMPT_INICIAL.md` e `COMO_COMECAR.md`
   - pasta `docs/` (ETAPAS.md, PROGRESSO.md e a especificação exportada)
   - pasta `.claude/` (settings.json)
   
   Dica: a pasta `.claude` começa com ponto e pode ficar oculta no Windows. Se o envio pelo site não pegar essa pasta, peça ao agente na primeira sessão para criá-la com o conteúdo do arquivo `settings.json`.
4. Clique em **Commit changes**.

## 4. Abra o agente

1. Acesse **claude.ai/code** (funciona no PC e no celular).
2. Conecte sua conta do GitHub quando pedir e escolha o repositório `bodes-do-asfalto`.
3. Abra o arquivo `PROMPT_INICIAL.md`, copie o primeiro bloco de texto e cole no Claude Code.
4. Responda às perguntas do agente e dê o OK no plano.

## 5. Enquanto o agente trabalha (semana 0)

Faça estas tarefas em paralelo — elas são a parte que mais demora:
- [ ] Apple Developer Program em seu CPF (US$ 99/ano) — developer.apple.com
- [ ] Google Play Console em seu CPF (US$ 25) — play.google.com/console
- [ ] Pedido do entitlement de navegação do CarPlay (peça ao agente o texto pronto)
- [ ] Contas gratuitas: Supabase, Mapbox, Expo, RevenueCat, AdMob, Sentry, Vercel (o agente explica cada uma quando precisar)
- [ ] Autorização ou licença escrita do clube para usar o nome e o escudo num app que é seu
- [ ] Combinar com a diretoria como será o abono de membros e escolher os primeiros moderadores
- [ ] Lista de 15+ irmãos testadores (com Android e iPhone) e carros com Android Auto e CarPlay para os testes

## 6. Imagens do app (ícones, texturas, ilustrações)

Escolha um caminho e avise o agente qual escolheu.

**Caminho A — você gera no ChatGPT (recomendado para começar, sem custo extra):**
1. Abra o ChatGPT (ou o Gemini), cole todo o bloco de `docs/PROMPTS_IMAGENS.md` e envie.
2. A cada lote, baixe a imagem. Quando houver dois itens na mesma imagem, salve e diga ao agente — ele recorta.
3. Envie os arquivos para a pasta `docs/assets-originais/` do GitHub (botão "Add file > Upload files"), com os nomes entre colchetes do prompt.

**Caminho B — o agente gera sozinho pela API (paga por imagem):**
A assinatura do ChatGPT **não** inclui a API; ela é cobrada à parte. Valores de referência do gpt-image-2 (quadrado 1024): cerca de US$ 0,006 (baixa), US$ 0,05 (média) e US$ 0,21 (alta) por imagem. As cerca de 50 imagens do app custam em geral menos de US$ 10.
1. Crie uma conta em platform.openai.com, adicione um cartão em "Billing", defina um limite mensal (ex.: US$ 15) e gere uma chave em "API keys". (Alternativa: Google AI Studio, chave do Gemini.)
2. Em claude.ai/code, abra as configurações do ambiente (ícone de engrenagem do ambiente) e adicione um **segredo de rede**: em "Allowed websites" coloque `api.openai.com`; em "Custom headers", mantenha `Authorization` com prefixo `Bearer` e cole a chave em "Value". (Para o Gemini: site `generativelanguage.googleapis.com`, cabeçalho `x-goog-api-key` sem prefixo.)
3. Assim a chave nunca aparece para o agente nem vai para o GitHub; ela é anexada automaticamente às chamadas para esse site.
4. Diga ao agente: "Caminho B ativo, use a OpenAI" (ou Gemini). Ele mostra uma prancha de revisão antes de gerar as versões finais e para ao chegar em US$ 10.

## 7. Nos pontos de teste

O agente vai parar e mandar um roteiro numerado. Instale a versão de teste (link do Expo no Android, TestFlight no iPhone), siga o roteiro e responda com o que funcionou e o que deu errado — print de tela ajuda muito.

## 8. Quando o limite acabar

Volte depois que o limite reiniciar, abra uma sessão nova e cole: "Leia CLAUDE.md e docs/PROGRESSO.md e continue de onde parou."

## Recomendação importante

Antes de publicar nas lojas, contrate um desenvolvedor para uma revisão de segurança de algumas horas. O app guarda localização, contatos de emergência e a filiação maçônica dos irmãos (dado sensível pela LGPD), e isso merece um segundo olhar humano.
