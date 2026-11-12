-- Dados de exemplo para desenvolvimento (supabase db reset). Capítulos fictícios do MT.
insert into public.capitulos (id, nome, cidade, uf, liberado) values
  ('00000000-0000-0000-0000-0000000000c1', 'Cuiabá', 'Cuiabá', 'MT', true),
  ('00000000-0000-0000-0000-0000000000c2', 'Várzea Grande', 'Várzea Grande', 'MT', false),
  ('00000000-0000-0000-0000-0000000000c3', 'Tangará da Serra', 'Tangará da Serra', 'MT', false),
  ('00000000-0000-0000-0000-0000000000c4', 'Rondonópolis', 'Rondonópolis', 'MT', false),
  ('00000000-0000-0000-0000-0000000000c5', 'Sinop', 'Sinop', 'MT', false)
on conflict do nothing;
