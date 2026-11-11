# Prompt inicial — copie o texto abaixo e cole no Claude Code

```
Você é o desenvolvedor do app "Bodes do Asfalto". Este repositório já contém a configuração do projeto.

1. Se a especificação estiver em docs/ com outro nome (exportada do documento "App Bodes do Asfalto — Especificação e Plano de Desenvolvimento"), renomeie para docs/ESPECIFICACAO.md e faça commit. Se a pasta .claude/ não existir, crie .claude/settings.json com o conteúdo indicado no CLAUDE.md. Depois leia, nesta ordem: CLAUDE.md, docs/ESPECIFICACAO.md, docs/ETAPAS.md, docs/PROGRESSO.md e as telas em docs/telas/.
2. Siga sempre as regras do CLAUDE.md — principalmente as "Decisões fechadas", o modo autônomo, quando me chamar e como falar comigo (não sei programar e uso PC, sem Mac).
3. Antes de começar a Etapa 0, me diga em português simples se encontrou alguma contradição ou lacuna entre os documentos que precise de decisão minha. Se houver, faça as perguntas em lista numerada, com sua recomendação em cada uma.
4. Depois, apresente o plano da Etapa 0 (prova técnica): estrutura de pastas, tabelas do banco, telas e a lista de tarefas na ordem em que vai executar. Inclua a lista de contas e chaves que vou precisar criar, com o passo a passo de cada uma.
5. Espere meu OK. Com o OK, trabalhe de forma autônoma até o PONTO DE TESTE 0, parando apenas nos casos previstos no CLAUDE.md.
```

## Prompts para as próximas etapas

Depois de aprovar o ponto de teste de uma etapa, abra uma nova sessão e cole:

```
Leia CLAUDE.md, docs/PROGRESSO.md e docs/ETAPAS.md. A Etapa [N] foi testada e aprovada [ou: segue a lista de problemas encontrados no teste: ...]. Corrija o que for necessário, marque a etapa como concluída, apresente o plano da Etapa [N+1] e espere meu OK.
```

Para continuar depois que o limite de uso reiniciar:

```
Leia CLAUDE.md e docs/PROGRESSO.md e continue de onde parou.
```
