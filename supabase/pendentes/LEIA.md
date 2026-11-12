# Migrations aguardando autorização do dono

Ficam fora de `supabase/migrations/` para que o workflow "Aplicar o banco" não as aplique junto com outra mudança.
Voltam para `migrations/` (e o teste para `tests/`) só depois de passar no CI e de o dono autorizar.

- `20261112210000_social_chat.sql` + `social_chat.test.sql`: feed, stories, denúncias, bloqueios, chat, acenos, notificações, mapa ao vivo e passeios.
