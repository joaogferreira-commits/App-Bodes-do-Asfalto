# Discussão da equipe — pontos de interesse e Sugestões de passeios (12/11/2026)

Base: `reports/Pontos de interesse para o mapa.md`. Participaram Paulo (Produto), Sofia (Simplicidade), Lia (Jurídico), Carlos (Diretoria) e Rui (Estrada).

## Consenso
- **Sem robô de redes sociais.** Termos de Instagram/Facebook/Strava/Wikiloc proíbem; ligar perfis a irmãos revela filiação maçônica (LGPD art. 11). Robô só de **fontes abertas** (OpenStreetMap via Geofabrik, ANP, Wikidata, CNUC), coletando **lugares, nunca pessoas**, com fila de revisão humana.
- **Onde ficam as sugestões:** seção "Sugestões" dentro da aba **Passeios** ("Recomendado pelo clube" primeiro, depois "Perto de você", raio 50/100/200/400 km e busca por cidade). No **Mapa**, só um chip "Passeios perto: N" que abre uma folha com até 3 cartões; a linha da rota só aparece ao abrir o cartão. Nenhuma aba nova.
- **Filtros do mapa: no máximo 6** — Clube (sedes, Ágapes, eventos), Postos, Irmãos (ligados por padrão); Passeio e natureza (cachoeira, mirante, monumento, turístico, parque), Encontros (pontos de encontro, cafés, marcos da Rota Biker), Negócios de irmãos (desligados por padrão; o app lembra a escolha).
- **Trilhas/terra:** não viram pino; traço próprio só com "Prefiro terra"/"Misto". `highway=path` nunca é roteável ("não é para moto de estrada").
- **Pilotando e carro:** nada muda (6 botões / 4 no Android Auto). Sugestões e pinos de turismo somem. Alertas do trecho só por voz/faixa: "terra em 2 km", "sem posto pelos próximos 145 km", "queda de rochas à frente".
- **Cada sugestão traz, antes de "Usar rota":** maior trecho sem posto ("abasteça em X"), % e trechos de terra, época de chuva (ex.: Transpantaneira só maio–outubro), alertas permanentes (MT-251 Portão do Inferno), sem sinal/hospital mais próximo, tempo só como estimativa.
- **Nunca:** ranking por tempo/velocidade, "tempo dos irmãos", desafio de curvas, notificação de passeio pilotando, mascote pilotando, nota negativa pública (só "TFA", "já fiz", "quero fazer" e "informar problema").
- **Sedes dos Bodes:** cadastradas pela diretoria do capítulo no painel (publica direto; capítulo sem diretoria → admin/moderador), visíveis só a membros, opção "mostrar só a cidade". Nunca enviar ao OpenStreetMap.
- **Outros motoclubes:** fora do lançamento em Cuiabá. Depois, só por cadastro voluntário do próprio clube (convite de presidente para presidente), aceite de termos, botão remover, pino genérico (capacete), sem brasão, camada desligada. Nunca importar `club=motorcycle` do OSM.
- **Rota Biker:** não copiar a lista (base de dados protegida). Irmãos cadastram marcos um a um com link ao site oficial, ou autorização escrita da organização.
- **Sugestões de irmãos:** vão para a diretoria do capítulo onde a rota começa; capítulo vizinho recebe aviso.
- **Atribuição:** "© OpenStreetMap contributors" sempre; tabela `poi_osm` separada (ODbL); "Dados: ANP, atualizado em [data]" — nunca "nota ANP". Tela "Créditos e fontes".
- **Termo na tela:** "capítulo" (busca aceita "facção") — decisão final do dono.

## MVP agora (dados de exemplo marcados "exemplo")
Pinos de cachoeira, mirante, monumento, ponto de encontro e sede (Cuiabá, sem endereço real); seção Sugestões na aba Passeios com raio e busca; chip no mapa; cartões com avisos de segurança e "Usar rota" (planejador atual).

## Depois do Supabase
Importação OSM semanal (GitHub Actions + osmium), sedes pela diretoria, fila de revisão, votos, coletor de fontes abertas, cadastro de clubes externos, termos (advogado).

## Decisões do dono
1. Confirmar Feira de Santana (BA) como sede nacional.
2. "Capítulo" na tela (recomendado) ou "facção"?
3. Outros motoclubes só por cadastro voluntário e depois do lançamento?
4. Autoriza contato com a organização da Rota Biker?
