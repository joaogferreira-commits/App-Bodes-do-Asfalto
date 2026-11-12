# Migrations aguardando autorização do dono

Ficam fora de `supabase/migrations/` para que o workflow "Aplicar o banco" não as aplique junto com outra mudança.
Voltam para `migrations/` (e o teste para `tests/`) só depois de passar no CI e de o dono autorizar.

- `20261112230000_pontos_osm.sql` + `pontos_osm.test.sql`: tabela `pontos_osm` (pontos do OpenStreetMap) e RPC `pontos_na_area`. Carga de dados pelo workflow `importar-pois.yml`.
