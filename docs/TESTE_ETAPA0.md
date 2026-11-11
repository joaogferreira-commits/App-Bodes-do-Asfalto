# Ponto de Teste 0 — roteiro do dono

Objetivo: ver uma rota navegando no celular, o mapa com o estilo dos Bodes, a navegação no Android Auto do PC e o Catálogo de componentes.

## A. Instalar o app no celular Android
1. No celular, abra o link de instalação enviado pelo agente (página do Expo).
2. Toque em **Install** / **Instalar**. Se o celular avisar sobre "fontes desconhecidas", permita para o navegador.
3. Abra o app **Bodes do Asfalto**. **Esperado:** tela escura "Prova técnica" com três cartões.

## B. Catálogo de componentes
4. Toque em **Catálogo de componentes**. **Esperado:** botões laranja/contorno/vermelho (SOS), filtros em pílula, cartões escuros com borda laranja costurada, avatares com anel colorido, barra com 5 abas.
5. Toque nos filtros e nas abas. **Esperado:** o item tocado fica laranja.
6. Toque em **Abrir folha**. **Esperado:** um painel sobe de baixo; **Fechar** o recolhe.
7. Volte. Anote o que achou do visual (gostou, mudaria cor/tamanho?).

## C. Mapa com estilo próprio
8. Toque em **Mapa com estilo próprio**. **Esperado:** mapa escuro marrom, rodovias creme, rios azuis, nomes das cidades em creme, centrado em Cuiabá. Arraste e aproxime com dois dedos.

## D. Navegação (parado ou na garupa)
9. Toque em **Prova de navegação**. Escolha um destino (**Ponto a 5 km daqui** serve em qualquer cidade).
10. Toque em **Iniciar navegação**. Permita a localização e **aceite os termos do Google**.
11. **Esperado:** a rota aparece em modo noite, com a próxima manobra no alto e voz falando em português. Com fone/intercomunicador Bluetooth ligado, a voz sai nele.
12. Toque em **Encerrar**. **Esperado:** a navegação para.

## E. Android Auto no PC (Desktop Head Unit)
13. Ligue o celular ao PC pelo cabo USB. No celular, aceite "Permitir depuração USB" (marque "Sempre permitir").
14. No celular: **Configurações → Android Auto → ⋮ (três pontinhos) → Iniciar servidor da unidade principal**.
15. No PC (Windows), abra o **Prompt de Comando** e cole, uma linha por vez:
    - `cd %LOCALAPPDATA%\Android\Sdk\platform-tools`
    - `adb forward tcp:5277 tcp:5277`
    - `cd ..\extras\google\auto`
    - `desktop-head-unit.exe`
16. **Esperado:** abre uma janela imitando a tela do carro, com o Android Auto. Toque no ícone de apps e escolha **Bodes do Asfalto**.
17. Com a navegação iniciada no celular (passo D), **esperado:** a rota aparece na tela do "carro", com os botões **Alerta** e **SOS** (tocar mostra um aviso rápido).

## Responda ao agente
Para cada letra (A a E): **funcionou** ou **deu problema** (com print da tela, se possível).
