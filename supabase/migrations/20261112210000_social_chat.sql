-- Missão Publicação P4 a P8: feed, denúncias e bloqueios, chat, notificações, mapa ao vivo, passeios, Storage.
-- Regras: CLAUDE.md "Segurança e privacidade". TODA tabela nova tem RLS. Nada aqui é aplicado em produção sem revisão.
-- Padrão: o app só escreve nas tabelas permitidas pelas políticas; ações com regra (aceitar aceno, grupo, denúncia)
-- passam por funções security definer.

create extension if not exists postgis with schema extensions;

-- ================================================================ funções de apoio

-- Capítulo do usuário logado (security definer: sem recursão de RLS).
create function public.meu_capitulo() returns uuid
language sql stable security definer set search_path = public as $$
  select capitulo_id from public.perfis where id = auth.uid()
$$;

-- Perfil ativo (não pendente, não desativado) de um usuário qualquer.
create function public.perfil_ativo(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = u and papel <> 'pendente' and desativado_em is null)
$$;

-- ================================================================ bloqueios (Etapa exigida pelas lojas)
create table public.bloqueios (
  quem uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  bloqueado uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (quem, bloqueado),
  check (quem <> bloqueado)
);

-- Verdadeiro se um bloqueou o outro, em qualquer sentido. Security definer: quem foi bloqueado
-- não pode ler a tabela, mas o conteúdo dele precisa sumir para quem bloqueou (e vice-versa).
create function public.bloqueado_entre(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bloqueios
    where (quem = a and bloqueado = b) or (quem = b and bloqueado = a)
  )
$$;

alter table public.bloqueios enable row level security;
-- só o próprio irmão lê e escreve os seus bloqueios
create policy bloqueios_dono on public.bloqueios for all to authenticated
  using (quem = auth.uid()) with check (quem = auth.uid() and public.sou_membro_ativo());

-- ================================================================ feed
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  texto text not null default '' check (char_length(texto) <= 2000),
  visibilidade text not null default 'todos' check (visibilidade in ('todos', 'capitulo', 'amigos')),
  capitulo_id uuid references public.capitulos (id), -- sempre o do autor (trigger)
  -- [{ "path": "<uid>/arquivo.jpg", "tipo": "foto" | "video" }]
  midias jsonb not null default '[]' check (jsonb_typeof(midias) = 'array' and jsonb_array_length(midias) <= 10),
  enquete jsonb check (enquete is null or jsonb_typeof(enquete) = 'object'),
  criado_em timestamptz not null default now(),
  check (texto <> '' or jsonb_array_length(midias) > 0 or enquete is not null)
);
create index posts_criado on public.posts (criado_em desc);
create index posts_autor on public.posts (autor);
create index posts_midias on public.posts using gin (midias jsonb_path_ops);

-- O capítulo do post vem do perfil do autor, nunca do app.
create function public.posts_definir_capitulo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.capitulo_id := (select capitulo_id from public.perfis where id = new.autor);
  return new;
end $$;
create trigger posts_capitulo before insert on public.posts
  for each row execute function public.posts_definir_capitulo();

-- Regra única de leitura de post: membro ativo, sem bloqueio entre os dois, autor ativo e visibilidade respeitada.
create function public.pode_ver_post(p_autor uuid, vis text, cap uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.sou_membro_ativo()
     and not public.bloqueado_entre(auth.uid(), p_autor)
     and (
       p_autor = auth.uid()
       or (
         public.perfil_ativo(p_autor)
         and (
           vis = 'todos'
           or (vis = 'capitulo' and cap is not distinct from public.meu_capitulo())
           or (vis = 'amigos' and public.somos_amigos(p_autor))
         )
       )
     )
$$;

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  criado_em timestamptz not null default now()
);
create index comentarios_post on public.comentarios (post_id, criado_em);

create table public.reacoes_tfa (
  post_id uuid not null references public.posts (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, usuario_id)
);

create table public.salvos (
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, post_id)
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  midia_path text,
  tipo text not null check (tipo in ('foto', 'video', 'texto')),
  conteudo jsonb not null default '{}' check (jsonb_typeof(conteudo) = 'object'),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '24 hours'),
  check (tipo = 'texto' or midia_path is not null)
);
create index stories_expira on public.stories (expira_em);
create index stories_autor on public.stories (autor);

-- A validade de 24 h é do servidor: o app não escolhe.
create function public.stories_definir_expiracao() returns trigger
language plpgsql as $$
begin
  new.criado_em := now();
  new.expira_em := now() + interval '24 hours';
  return new;
end $$;
create trigger stories_expiracao before insert on public.stories
  for each row execute function public.stories_definir_expiracao();

alter table public.posts enable row level security;
alter table public.comentarios enable row level security;
alter table public.reacoes_tfa enable row level security;
alter table public.salvos enable row level security;
alter table public.stories enable row level security;

-- posts: leitura por visibilidade (a moderação lê tudo para decidir denúncias); só o autor cria e edita;
-- autor, moderação e diretoria do capítulo apagam
create policy posts_ler on public.posts for select to authenticated using (
  public.pode_ver_post(autor, visibilidade, capitulo_id) or public.sou_moderacao()
);
create policy posts_criar on public.posts for insert to authenticated
  with check (autor = auth.uid() and public.sou_membro_ativo());
create policy posts_editar on public.posts for update to authenticated
  using (autor = auth.uid()) with check (autor = auth.uid());
create policy posts_apagar on public.posts for delete to authenticated
  using (autor = auth.uid() or public.sou_moderacao() or public.sou_diretoria_de(capitulo_id));
-- o autor só edita texto, visibilidade, mídias e enquete (nunca autor/capítulo)
revoke update on public.posts from authenticated;
grant update (texto, visibilidade, midias, enquete) on public.posts to authenticated;

-- comentários: quem enxerga o post (a regra de posts já vale na subconsulta) enxerga os comentários
create policy comentarios_ler on public.comentarios for select to authenticated using (
  not public.bloqueado_entre(auth.uid(), autor)
  and exists (select 1 from public.posts p where p.id = post_id)
);
create policy comentarios_criar on public.comentarios for insert to authenticated with check (
  autor = auth.uid() and public.sou_membro_ativo()
  and exists (select 1 from public.posts p where p.id = post_id)
);
create policy comentarios_apagar on public.comentarios for delete to authenticated using (
  autor = auth.uid() or public.sou_moderacao()
);

-- reações TFA: veem quem vê o post; cada um cria e desfaz a sua
create policy reacoes_ler on public.reacoes_tfa for select to authenticated using (
  not public.bloqueado_entre(auth.uid(), usuario_id)
  and exists (select 1 from public.posts p where p.id = post_id)
);
create policy reacoes_criar on public.reacoes_tfa for insert to authenticated with check (
  usuario_id = auth.uid() and public.sou_membro_ativo()
  and exists (select 1 from public.posts p where p.id = post_id)
);
create policy reacoes_desfazer on public.reacoes_tfa for delete to authenticated using (usuario_id = auth.uid());

-- salvos: privados
create policy salvos_dono on public.salvos for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid() and public.sou_membro_ativo());

-- stories: membros ativos leem enquanto não expirou e sem bloqueio; só o autor cria; autor ou moderação apaga
create policy stories_ler on public.stories for select to authenticated using (
  public.sou_membro_ativo()
  and expira_em > now()
  and not public.bloqueado_entre(auth.uid(), autor)
  and (autor = auth.uid() or public.perfil_ativo(autor))
);
create policy stories_criar on public.stories for insert to authenticated
  with check (autor = auth.uid() and public.sou_membro_ativo());
create policy stories_apagar on public.stories for delete to authenticated
  using (autor = auth.uid() or public.sou_moderacao());

-- ================================================================ passeios (antes do chat: o grupo do passeio aponta para cá)
create table public.passeios (
  id uuid primary key default gen_random_uuid(),
  capitulo_id uuid not null references public.capitulos (id),
  criador uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 120),
  descricao text check (char_length(descricao) <= 2000),
  data timestamptz not null,
  ponto_encontro text check (char_length(ponto_encontro) <= 200),
  rota jsonb,
  criado_em timestamptz not null default now()
);
create index passeios_data on public.passeios (data);

create table public.presencas (
  passeio_id uuid not null references public.passeios (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  status text not null check (status in ('vou', 'talvez')),
  atualizado_em timestamptz not null default now(),
  primary key (passeio_id, usuario_id)
);

alter table public.passeios enable row level security;
alter table public.presencas enable row level security;

-- passeios: todos os membros ativos veem; cria só diretoria do capítulo (ou geral) e admin
create policy passeios_ler on public.passeios for select to authenticated using (public.sou_membro_ativo());
create policy passeios_criar on public.passeios for insert to authenticated with check (
  criador = auth.uid() and (public.sou_admin() or public.sou_diretoria_de(capitulo_id))
);
create policy passeios_editar on public.passeios for update to authenticated
  using (public.sou_admin() or public.sou_diretoria_de(capitulo_id))
  with check (public.sou_admin() or public.sou_diretoria_de(capitulo_id));
create policy passeios_apagar on public.passeios for delete to authenticated
  using (public.sou_admin() or public.sou_diretoria_de(capitulo_id));

-- presenças: membros veem quem vai; cada um marca a sua
create policy presencas_ler on public.presencas for select to authenticated using (public.sou_membro_ativo());
create policy presencas_marcar on public.presencas for insert to authenticated
  with check (usuario_id = auth.uid() and public.sou_membro_ativo());
create policy presencas_mudar on public.presencas for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy presencas_desmarcar on public.presencas for delete to authenticated using (usuario_id = auth.uid());
revoke update on public.presencas from authenticated;
grant update (status) on public.presencas to authenticated;

-- ================================================================ chat
create table public.conversas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('direto', 'capitulo', 'avisos', 'passeio', 'comboio', 'agape')),
  titulo text check (char_length(titulo) <= 120),
  capitulo_id uuid references public.capitulos (id),
  passeio_id uuid references public.passeios (id) on delete cascade,
  -- par ordenado, só para conversa direta (evita duas conversas entre os mesmos irmãos)
  par_a uuid references public.perfis (id) on delete cascade,
  par_b uuid references public.perfis (id) on delete cascade,
  termina_em timestamptz, -- Ágape, passeio e comboio encerram sozinhos
  criado_em timestamptz not null default now(),
  check (tipo <> 'direto' or (par_a is not null and par_b is not null and par_a < par_b))
);
create unique index conversa_capitulo_unica on public.conversas (capitulo_id) where tipo = 'capitulo';
create unique index conversa_avisos_unica on public.conversas (capitulo_id) where tipo = 'avisos';
create unique index conversa_passeio_unica on public.conversas (passeio_id) where tipo = 'passeio';
create unique index conversa_direta_unica on public.conversas (par_a, par_b) where tipo = 'direto';

create table public.participantes (
  conversa_id uuid not null references public.conversas (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  silenciado boolean not null default false,
  lido_ate timestamptz,
  entrou_em timestamptz not null default now(),
  primary key (conversa_id, usuario_id)
);
create index participantes_usuario on public.participantes (usuario_id);

create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas (id) on delete cascade,
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  rapida boolean not null default false, -- resposta rápida de estrada
  criado_em timestamptz not null default now()
);
create index mensagens_conversa on public.mensagens (conversa_id, criado_em desc);

-- Participante ativo da conversa (security definer: evita recursão nas políticas de participantes).
create function public.eh_participante(conv uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.sou_membro_ativo()
     and exists (select 1 from public.participantes where conversa_id = conv and usuario_id = auth.uid())
$$;

-- Pode escrever: participante, conversa não encerrada, "avisos" só diretoria/admin, conversa direta sem bloqueio.
create function public.pode_escrever_em(conv uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.sou_membro_ativo()
     and exists (
       select 1
       from public.conversas c
       join public.participantes p on p.conversa_id = c.id and p.usuario_id = auth.uid()
       where c.id = conv
         and (c.termina_em is null or c.termina_em > now())
         and (c.tipo <> 'avisos' or public.sou_admin() or public.sou_diretoria_de(c.capitulo_id))
         and (c.tipo <> 'direto' or not exists (
               select 1 from public.participantes o
               where o.conversa_id = c.id and o.usuario_id <> auth.uid()
                 and public.bloqueado_entre(auth.uid(), o.usuario_id)))
     )
$$;

create table public.acenos (
  id uuid primary key default gen_random_uuid(),
  de uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  para uuid not null references public.perfis (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'recusado')),
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  check (de <> para)
);
create unique index aceno_pendente_unico on public.acenos (de, para) where status = 'pendente';
create index acenos_para on public.acenos (para, status);

-- Limite de 10 acenos por dia (dia de Cuiabá) para cada remetente.
create function public.limitar_acenos() returns trigger
language plpgsql security definer set search_path = public as $$
declare hoje timestamptz := (date_trunc('day', now() at time zone 'America/Cuiaba') at time zone 'America/Cuiaba');
begin
  if (select count(*) from public.acenos where de = new.de and criado_em >= hoje) >= 10 then
    raise exception 'limite de 10 acenos por dia';
  end if;
  return new;
end $$;
create trigger acenos_limite before insert on public.acenos
  for each row execute function public.limitar_acenos();

alter table public.conversas enable row level security;
alter table public.participantes enable row level security;
alter table public.mensagens enable row level security;
alter table public.acenos enable row level security;

-- conversas: só participante lê (nem a moderação lê chat privado). Ninguém cria/altera pelo app:
-- só pelas funções aceitar_aceno, garantir_grupo_capitulo e pelo gatilho de presença.
create policy conversas_ler on public.conversas for select to authenticated using (public.eh_participante(id));

-- participantes: veem os colegas da própria conversa; cada um muda só o próprio "silenciado" e "lido_ate" e pode sair
create policy participantes_ler on public.participantes for select to authenticated using (public.eh_participante(conversa_id));
create policy participantes_meus on public.participantes for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy participantes_sair on public.participantes for delete to authenticated using (usuario_id = auth.uid());
revoke update on public.participantes from authenticated;
grant update (silenciado, lido_ate) on public.participantes to authenticated;

-- mensagens: lê o participante (sem mensagens de quem há bloqueio); escreve conforme pode_escrever_em; só o autor apaga
create policy mensagens_ler on public.mensagens for select to authenticated using (
  public.eh_participante(conversa_id) and not public.bloqueado_entre(auth.uid(), autor)
);
create policy mensagens_escrever on public.mensagens for insert to authenticated
  with check (autor = auth.uid() and public.pode_escrever_em(conversa_id));
create policy mensagens_apagar on public.mensagens for delete to authenticated using (autor = auth.uid());

-- acenos: as duas pontas veem; quem manda cria (pendente) e pode cancelar; resposta só pelas funções
create policy acenos_ler on public.acenos for select to authenticated using (auth.uid() in (de, para));
create policy acenos_criar on public.acenos for insert to authenticated with check (
  de = auth.uid() and status = 'pendente'
  and public.sou_membro_ativo() and public.perfil_ativo(para)
  and not public.bloqueado_entre(de, para)
);
create policy acenos_cancelar on public.acenos for delete to authenticated using (de = auth.uid() and status = 'pendente');

-- Aceitar: cria (ou reaproveita) a conversa direta e os 2 participantes. Retorna o id da conversa.
create function public.aceitar_aceno(aceno uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare a public.acenos; conv uuid; x uuid; y uuid;
begin
  select * into a from public.acenos where id = aceno and para = auth.uid() and status = 'pendente';
  if not found then raise exception 'aceno não encontrado ou já respondido'; end if;
  if not public.sou_membro_ativo() or not public.perfil_ativo(a.de) or public.bloqueado_entre(a.de, a.para) then
    raise exception 'não é possível aceitar este aceno';
  end if;
  update public.acenos set status = 'aceito', respondido_em = now() where id = aceno;
  x := least(a.de, a.para);
  y := greatest(a.de, a.para);
  insert into public.conversas (tipo, par_a, par_b) values ('direto', x, y)
    on conflict (par_a, par_b) where tipo = 'direto' do nothing;
  select id into conv from public.conversas where tipo = 'direto' and par_a = x and par_b = y;
  insert into public.participantes (conversa_id, usuario_id) values (conv, a.de), (conv, a.para)
    on conflict do nothing;
  return conv;
end $$;

create function public.recusar_aceno(aceno uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.acenos set status = 'recusado', respondido_em = now()
   where id = aceno and para = auth.uid() and status = 'pendente';
  if not found then raise exception 'aceno não encontrado ou já respondido'; end if;
end $$;

-- Grupo do capítulo (e o canal de avisos da diretoria, só leitura para os demais): cria se não existir
-- e inclui o próprio membro. Retorna o id do grupo do capítulo.
create function public.garantir_grupo_capitulo() returns uuid
language plpgsql security definer set search_path = public as $$
declare cap uuid := public.meu_capitulo(); grupo uuid; avisos uuid;
begin
  if not public.sou_membro_ativo() or cap is null then raise exception 'só membros com capítulo'; end if;
  insert into public.conversas (tipo, titulo, capitulo_id)
    select 'capitulo', nome, id from public.capitulos where id = cap
    on conflict (capitulo_id) where tipo = 'capitulo' do nothing;
  insert into public.conversas (tipo, titulo, capitulo_id)
    select 'avisos', nome, id from public.capitulos where id = cap
    on conflict (capitulo_id) where tipo = 'avisos' do nothing;
  select id into grupo from public.conversas where tipo = 'capitulo' and capitulo_id = cap;
  select id into avisos from public.conversas where tipo = 'avisos' and capitulo_id = cap;
  insert into public.participantes (conversa_id, usuario_id)
    values (grupo, auth.uid()), (avisos, auth.uid())
    on conflict do nothing;
  return grupo;
end $$;

-- Ao marcar "vou" no passeio, entra no grupo do passeio; ao mudar para "talvez" ou desmarcar, sai.
create function public.presenca_grupo() returns trigger
language plpgsql security definer set search_path = public as $$
declare pas public.passeios; cid uuid;
begin
  if tg_op <> 'DELETE' then
    if new.status = 'vou' then
      select * into pas from public.passeios where id = new.passeio_id;
      insert into public.conversas (tipo, titulo, capitulo_id, passeio_id, termina_em)
        values ('passeio', pas.titulo, pas.capitulo_id, pas.id, pas.data + interval '1 day')
        on conflict (passeio_id) where tipo = 'passeio' do nothing;
      select id into cid from public.conversas where tipo = 'passeio' and passeio_id = new.passeio_id;
      insert into public.participantes (conversa_id, usuario_id) values (cid, new.usuario_id)
        on conflict do nothing;
    else
      delete from public.participantes
       where usuario_id = new.usuario_id
         and conversa_id in (select id from public.conversas where tipo = 'passeio' and passeio_id = new.passeio_id);
    end if;
  else
    delete from public.participantes
     where usuario_id = old.usuario_id
       and conversa_id in (select id from public.conversas where tipo = 'passeio' and passeio_id = old.passeio_id);
  end if;
  return null;
end $$;
create trigger presencas_grupo after insert or update or delete on public.presencas
  for each row execute function public.presenca_grupo();

-- Realtime das mensagens (o Realtime respeita as políticas de leitura acima).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.mensagens;
  end if;
end $$;

-- ================================================================ denúncias (post, comentário, mensagem, story, usuário)
create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  alvo_tipo text not null check (alvo_tipo in ('post', 'comentario', 'mensagem', 'story', 'usuario')),
  alvo_id uuid not null,
  motivo text not null check (char_length(motivo) between 3 and 500),
  denunciante uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  status text not null default 'aberta' check (status in ('aberta', 'procedente', 'improcedente')),
  -- preenchidos pelo servidor
  alvo_autor uuid,
  capitulo_id uuid, -- capítulo do denunciado: a diretoria dele vê a denúncia
  trecho text,      -- cópia curta do conteúdo denunciado (a moderação não lê chat privado)
  decidido_por uuid references public.perfis (id) on delete set null,
  decidido_em timestamptz,
  criado_em timestamptz not null default now()
);
create index denuncias_status on public.denuncias (status, criado_em);
create index denuncias_capitulo on public.denuncias (capitulo_id);

-- Resolve o autor do alvo, copia um trecho e confere que o denunciante realmente enxerga o alvo.
create function public.denuncias_preencher() returns trigger
language plpgsql security definer set search_path = public as $$
declare a uuid; t text; ok boolean := false;
begin
  if new.alvo_tipo = 'post' then
    select p.autor, left(p.texto, 300), public.pode_ver_post(p.autor, p.visibilidade, p.capitulo_id)
      into a, t, ok from public.posts p where p.id = new.alvo_id;
  elsif new.alvo_tipo = 'comentario' then
    select c.autor, left(c.texto, 300), public.pode_ver_post(p.autor, p.visibilidade, p.capitulo_id)
      into a, t, ok from public.comentarios c join public.posts p on p.id = c.post_id where c.id = new.alvo_id;
  elsif new.alvo_tipo = 'mensagem' then
    select m.autor, left(m.texto, 300), public.eh_participante(m.conversa_id)
      into a, t, ok from public.mensagens m where m.id = new.alvo_id;
  elsif new.alvo_tipo = 'story' then
    select s.autor, left(coalesce(s.conteudo ->> 'texto', ''), 300), (s.expira_em > now() and public.sou_membro_ativo())
      into a, t, ok from public.stories s where s.id = new.alvo_id;
  else
    select p.id, null, public.sou_membro_ativo()
      into a, t, ok from public.perfis p where p.id = new.alvo_id;
  end if;
  if a is null or not coalesce(ok, false) then raise exception 'alvo não encontrado'; end if;
  new.alvo_autor := a;
  new.trecho := t;
  new.capitulo_id := (select capitulo_id from public.perfis where id = a);
  return new;
end $$;
create trigger denuncias_dados before insert on public.denuncias
  for each row execute function public.denuncias_preencher();

alter table public.denuncias enable row level security;
-- denunciante vê as suas; moderação vê todas; diretoria vê as do próprio capítulo
create policy denuncias_ler on public.denuncias for select to authenticated using (
  denunciante = auth.uid() or public.sou_moderacao() or (capitulo_id is not null and public.sou_diretoria_de(capitulo_id))
);
create policy denuncias_criar on public.denuncias for insert to authenticated with check (
  denunciante = auth.uid() and status = 'aberta' and public.sou_membro_ativo()
);
-- decisão só pela função abaixo (sem política de update/delete)

-- Moderação decide a denúncia e, se quiser, apaga o conteúdo (usuário: use desativar_irmao).
create function public.moderar_denuncia(den uuid, procedente boolean, apagar boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare d public.denuncias;
begin
  if not public.sou_moderacao() then raise exception 'só a moderação decide denúncias'; end if;
  select * into d from public.denuncias where id = den and status = 'aberta';
  if not found then raise exception 'denúncia não encontrada ou já decidida'; end if;
  update public.denuncias
     set status = case when procedente then 'procedente' else 'improcedente' end,
         decidido_por = auth.uid(), decidido_em = now()
   where id = den;
  if procedente and apagar then
    if d.alvo_tipo = 'post' then delete from public.posts where id = d.alvo_id;
    elsif d.alvo_tipo = 'comentario' then delete from public.comentarios where id = d.alvo_id;
    elsif d.alvo_tipo = 'mensagem' then delete from public.mensagens where id = d.alvo_id;
    elsif d.alvo_tipo = 'story' then delete from public.stories where id = d.alvo_id;
    end if;
  end if;
end $$;

-- ================================================================ notificações push
create table public.tokens_push (
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  token text not null check (char_length(token) between 10 and 300),
  plataforma text not null check (plataforma in ('android', 'ios')),
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, token)
);
create table public.preferencias_notificacao (
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  tipo text not null check (char_length(tipo) between 2 and 40), -- mensagem, aceno, aprovacao, sos, agape...
  ligado boolean not null default true,
  primary key (usuario_id, tipo)
);
alter table public.tokens_push enable row level security;
alter table public.preferencias_notificacao enable row level security;
-- só o dono (a Edge Function de envio usa a chave de serviço, que fica fora do app)
create policy tokens_dono on public.tokens_push for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy preferencias_dono on public.preferencias_notificacao for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ================================================================ mapa ao vivo
create type public.visibilidade_mapa as enum ('invisivel', 'cidade', 'aproximado', 'preciso_amigos', 'preciso_comboio');
create type public.status_mapa as enum ('na_estrada', 'parado_cafe', 'aberto_encontro', 'nao_perturbe');

-- Centro da cidade do capítulo, usado na visibilidade "cidade" (preenchido pelo admin).
alter table public.capitulos add column centro extensions.geography(Point, 4326);

-- Tabela SEPARADA e de curta vida: guarda só a última posição de cada irmão. Só o dono lê a própria linha.
create table public.posicoes_ao_vivo (
  usuario_id uuid primary key references public.perfis (id) on delete cascade,
  ponto extensions.geography(Point, 4326) not null,
  visibilidade public.visibilidade_mapa not null default 'aproximado',
  status public.status_mapa not null default 'na_estrada',
  comboio_id uuid references public.conversas (id) on delete set null, -- conversa 'comboio' que pode ver a posição exata
  modo_ate timestamptz, -- modo temporário: some sozinho depois desse instante
  atualizado_em timestamptz not null default now()
);
create index posicoes_atualizado on public.posicoes_ao_vivo (atualizado_em);

create table public.zonas_privadas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  nome text check (char_length(nome) <= 40), -- "casa", "trabalho"
  centro extensions.geography(Point, 4326) not null,
  raio_m int not null check (raio_m between 100 and 5000),
  criado_em timestamptz not null default now()
);
create index zonas_usuario on public.zonas_privadas (usuario_id);

alter table public.posicoes_ao_vivo enable row level security;
alter table public.zonas_privadas enable row level security;
-- Só o dono lê/escreve a própria posição. Os outros só veem o resultado de posicoes_visiveis().
create policy posicoes_dono on public.posicoes_ao_vivo for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid() and public.sou_membro_ativo());
create policy zonas_dono on public.zonas_privadas for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
revoke all on public.posicoes_ao_vivo from anon;
revoke all on public.zonas_privadas from anon;

-- Posições dos irmãos dentro da área (min/max lon/lat). Calculado no servidor:
--   invisivel          -> nada
--   cidade             -> centro da cidade do capítulo (ou grade de ~28 km se o capítulo não tem centro)
--   aproximado         -> centro da célula de ~5 km (grade de 0,05 grau), estável (sem ruído que se anule na média)
--   preciso_amigos     -> exata só para amigos; para os demais, aproximado
--   preciso_comboio    -> exata só para participantes do comboio escolhido; para os demais, aproximado
-- Quem está em zona privada, bloqueado, desativado, com modo temporário vencido ou sem sinal há 30 min não aparece.
-- O filtro da área vale para a posição PUBLICADA (nunca a exata), para não vazar por tentativa de áreas.
create function public.posicoes_visiveis(min_lon double precision, min_lat double precision, max_lon double precision, max_lat double precision)
returns table (usuario_id uuid, lat double precision, lon double precision, precisao text, status public.status_mapa, atualizado_em timestamptz)
language sql stable security definer set search_path = public, extensions as $$
  with base as (
    select p.usuario_id as uid, p.status as st, p.atualizado_em as quando,
           st_y(p.ponto::geometry) as ylat, st_x(p.ponto::geometry) as xlon,
           case
             when p.visibilidade = 'preciso_amigos' and public.somos_amigos(p.usuario_id) then 'exata'
             when p.visibilidade = 'preciso_comboio' and p.comboio_id is not null and exists (
                    select 1 from public.participantes c1
                    join public.participantes c2 on c2.conversa_id = c1.conversa_id
                    join public.conversas cv on cv.id = c1.conversa_id
                    where c1.conversa_id = p.comboio_id and cv.tipo = 'comboio'
                      and (cv.termina_em is null or cv.termina_em > now())
                      and c1.usuario_id = p.usuario_id and c2.usuario_id = auth.uid()) then 'exata'
             when p.visibilidade = 'cidade' then 'cidade'
             else 'aproximado'
           end as nivel,
           cap.centro as centro
    from public.posicoes_ao_vivo p
    join public.perfis pf on pf.id = p.usuario_id and pf.desativado_em is null and pf.papel <> 'pendente'
    left join public.capitulos cap on cap.id = pf.capitulo_id
    where public.sou_membro_ativo()
      and p.usuario_id <> auth.uid()
      and p.visibilidade <> 'invisivel'
      and p.atualizado_em > now() - interval '30 minutes'
      and (p.modo_ate is null or p.modo_ate > now())
      and not public.bloqueado_entre(auth.uid(), p.usuario_id)
      and not exists (
        select 1 from public.zonas_privadas z
        where z.usuario_id = p.usuario_id and st_dwithin(p.ponto, z.centro, z.raio_m)
      )
  ), publicada as (
    select uid, st, quando, nivel,
      case nivel
        when 'exata' then ylat
        when 'cidade' then coalesce(st_y(centro::geometry), (floor(ylat::numeric / 0.25) * 0.25 + 0.125)::double precision)
        else (floor(ylat::numeric / 0.05) * 0.05 + 0.025)::double precision
      end as plat,
      case nivel
        when 'exata' then xlon
        when 'cidade' then coalesce(st_x(centro::geometry), (floor(xlon::numeric / 0.25) * 0.25 + 0.125)::double precision)
        else (floor(xlon::numeric / 0.05) * 0.05 + 0.025)::double precision
      end as plon
    from base
  )
  select uid, plat, plon, nivel, st, quando
  from publicada
  where plon between min_lon and max_lon and plat between min_lat and max_lat
$$;

-- Limpeza: posições com mais de 7 dias, modo temporário vencido, stories expirados há mais de 1 dia
-- e conversas de Ágape/comboio encerradas há mais de 7 dias. Só o banco chama (agendamento abaixo).
create function public.limpar_posicoes() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.posicoes_ao_vivo
   where atualizado_em < now() - interval '7 days' or (modo_ate is not null and modo_ate < now());
  delete from public.stories where expira_em < now() - interval '1 day';
  delete from public.conversas where tipo in ('agape', 'comboio') and termina_em < now() - interval '7 days';
end $$;
revoke all on function public.limpar_posicoes() from public, anon, authenticated;

-- Agendamento a cada hora com pg_cron, só se a extensão existir neste banco (Supabase: ativar em Database > Extensions).
-- Se falhar, o bloco avisa e a migration segue; nesse caso agende pelo painel: select public.limpar_posicoes();
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.schedule('limpar-posicoes', '17 * * * *', 'select public.limpar_posicoes()');
    exception when others then
      raise notice 'pg_cron indisponível (%): agende public.limpar_posicoes() manualmente', sqlerrm;
    end;
  else
    raise notice 'pg_cron não disponível: agende public.limpar_posicoes() manualmente';
  end if;
end $$;

-- ================================================================ Storage: buckets privados 'feed' e 'stories'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('feed', 'feed', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('stories', 'stories', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
on conflict (id) do nothing;

-- Caminho obrigatório: <id do usuário>/<arquivo>. Só membro ativo envia na própria pasta.
create policy feed_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'feed' and public.sou_membro_ativo() and (storage.foldername(name))[1] = auth.uid()::text);
-- Leitura: membro ativo, e só do arquivo que consta num post que ele enxerga (respeita 'capitulo'/'amigos'/bloqueio);
-- o autor lê a própria pasta (para enviar antes de publicar).
create policy feed_ver on storage.objects for select to authenticated
  using (
    bucket_id = 'feed' and public.sou_membro_ativo()
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.posts p where p.midias @> jsonb_build_array(jsonb_build_object('path', name)))
    )
  );
create policy feed_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'feed' and ((storage.foldername(name))[1] = auth.uid()::text or public.sou_moderacao()));

create policy stories_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'stories' and public.sou_membro_ativo() and (storage.foldername(name))[1] = auth.uid()::text);
-- Leitura: só enquanto o story existe e não expirou (a política de stories já filtra expiração e bloqueio)
create policy stories_ver on storage.objects for select to authenticated
  using (
    bucket_id = 'stories' and public.sou_membro_ativo()
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.stories s where s.midia_path = name)
    )
  );
create policy stories_apagar_arquivo on storage.objects for delete to authenticated
  using (bucket_id = 'stories' and ((storage.foldername(name))[1] = auth.uid()::text or public.sou_moderacao()));

-- ================================================================ permissões das funções
-- Chamáveis só por usuário logado; gatilhos não precisam de permissão de execução.
revoke execute on function public.aceitar_aceno(uuid) from public, anon;
revoke execute on function public.recusar_aceno(uuid) from public, anon;
revoke execute on function public.garantir_grupo_capitulo() from public, anon;
revoke execute on function public.moderar_denuncia(uuid, boolean, boolean) from public, anon;
revoke execute on function public.posicoes_visiveis(double precision, double precision, double precision, double precision) from public, anon;
revoke execute on function public.posts_definir_capitulo() from public, anon, authenticated;
revoke execute on function public.stories_definir_expiracao() from public, anon, authenticated;
revoke execute on function public.limitar_acenos() from public, anon, authenticated;
revoke execute on function public.presenca_grupo() from public, anon, authenticated;
revoke execute on function public.denuncias_preencher() from public, anon, authenticated;
