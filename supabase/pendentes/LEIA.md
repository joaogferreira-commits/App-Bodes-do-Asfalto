# Migrations aguardando autorização do dono

Ficam fora de `supabase/migrations/` para que o workflow "Aplicar o banco" não as aplique junto com outra mudança.
Voltam para `migrations/` (e o teste para `tests/`) só depois de passar no CI e de o dono autorizar.

- `20261112220000_notificacoes.sql` + `notificacoes.test.sql`: gatilhos de notificação (mensagem, aceno, pedido de entrada, decisão). Publicação junto com a função pelo workflow `publicar-notificacoes.yml`.
