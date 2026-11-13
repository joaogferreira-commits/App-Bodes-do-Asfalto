-- Desafios, XP, selos e ranking no servidor (P11). AGUARDA AUTORIZAÇÃO DO DONO (fica em pendentes/).
--
-- Regras (CLAUDE.md e decisões de 12/11/2026):
--  * desafios criados por irmão (vai para aprovação da diretoria do capítulo OU de um moderador/admin),
--    pela diretoria (publica direto) e por capítulos em conjunto (cada capítulo da lista aceita);
--  * XP do desafio é FIXO pela tabela de km total (xp_do_desafio); nunca velocidade nem tempo de percurso;
--  * XP só nasce dentro de funções security definer (registrar_progresso); xp_eventos é append-only;
--  * antifraude no servidor (limitado: o servidor não vê o GPS, só o que o app informa): salto maior que
--    200 km numa chamada, velocidade implícita acima de 200 km/h entre chamadas e teto diário de km;
--  * ranking: top 50 por XP, sem quem escolheu sair (fora_do_ranking, que continua com XP e selos).

alter table public.perfis add column if not exists fora_do_ranking boolean not null default false;

-- Tabela de XP por km total (desafios de irmãos). Oficiais (diretoria/capítulos) valem 50% a mais.
create function public.xp_do_desafio(p_km numeric, p_tipo text) returns integer
language sql immutable set search_path = public as $$
  select case when p_tipo = 'membro' then base else round(base * 1.5)::integer end
  from (select case
    when p_km <= 100 then 50
    when p_km <= 300 then 120
    when p_km <= 600 then 250
    when p_km <= 1000 then 400
    when p_km <= 2000 then 700
    else 1000 end as base) f
$$;

-- Equivalência em km das modalidades que não são de km (1 sede/Loja/passeio/marco = 100 km; Ágape 50; socorro 150).
create function public.km_equivalente(p_modalidade text, p_meta integer) returns numeric
language sql immutable set search_path = public as $$
  select p_meta * case p_modalidade
    when 'km' then 1 when 'agape' then 50 when 'socorro' then 150 else 100 end
$$;

create table public.desafios (
  id uuid primary key default gen_random_uuid(),
  criador uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 4 and 80),
  descricao text check (char_length(descricao) <= 500),
  modalidade text not null default 'km' check (modalidade in ('km', 'sedes', 'lojas', 'passeios', 'agape', 'rotaBiker', 'socorro')),
  meta integer not null check (meta between 1 and 20000),
  km_total numeric not null,
  xp integer not null,
  capitulo_id uuid references public.capitulos (id),
  tipo text not null check (tipo in ('membro', 'diretoria', 'capitulos')),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  dias integer not null check (dias between 1 and 90),
  aprovado_por uuid references public.perfis (id) on delete set null,
  motivo_recusa text check (char_length(motivo_recusa) <= 200),
  participantes integer not null default 0,
  inicio date,
  fim date,
  criado_em timestamptz not null default now()
);
create index desafios_status on public.desafios (status, fim);
create index desafios_capitulo on public.desafios (capitulo_id);
create index desafios_criador on public.desafios (criador, criado_em);

-- Capítulos de um desafio "entre capítulos": cada um precisa do aceite da própria diretoria.
create table public.desafio_capitulos (
  desafio_id uuid not null references public.desafios (id) on delete cascade,
  capitulo_id uuid not null references public.capitulos (id),
  aceito_por uuid references public.perfis (id) on delete set null,
  aceito_em timestamptz,
  primary key (desafio_id, capitulo_id)
);

create table public.participacoes (
  desafio_id uuid not null references public.desafios (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  km_feitos numeric not null default 0 check (km_feitos >= 0),
  entrou_em timestamptz not null default now(),
  ultimo_registro_em timestamptz,
  concluido_em timestamptz,
  primary key (desafio_id, usuario_id)
);
create index participacoes_usuario on public.participacoes (usuario_id);

-- Cada envio de progresso (para o teto diário e a trilha de auditoria). Só funções escrevem.
create table public.progresso_registros (
  id bigint generated always as identity primary key,
  desafio_id uuid not null references public.desafios (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  km numeric not null,
  criado_em timestamptz not null default now()
);
create index progresso_usuario_dia on public.progresso_registros (usuario_id, criado_em);

create table public.xp_eventos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  origem text not null check (char_length(origem) between 3 and 80),
  pontos integer not null check (pontos > 0),
  criado_em timestamptz not null default now(),
  unique (usuario_id, origem)
);
create index xp_eventos_periodo on public.xp_eventos (criado_em, usuario_id);

create table public.conquistas (
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  selo text not null check (selo in ('agape', 'irmaoNaRota', 'sedesMt', 'pantanal', 'visitaLojas', 'socorroFraterno', 'desafio')),
  ganho_em timestamptz not null default now(),
  primary key (usuario_id, selo)
);

-- XP e selos não se alteram nem se apagam (só somem com a conta, por cascata).
create function public.somente_inclusao() returns trigger
language plpgsql set search_path = public as $$
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old); -- cascata do apagamento da conta
  end if;
  raise exception 'registro somente de inclusao' using errcode = '42501';
end $$;
create trigger xp_eventos_so_inclusao before update or delete on public.xp_eventos
  for each row execute function public.somente_inclusao();
create trigger progresso_so_inclusao before update on public.progresso_registros
  for each row execute function public.somente_inclusao();

alter table public.desafios enable row level security;
alter table public.desafio_capitulos enable row level security;
alter table public.participacoes enable row level security;
alter table public.progresso_registros enable row level security;
alter table public.xp_eventos enable row level security;
alter table public.conquistas enable row level security;

-- Quem pode decidir este desafio (interno e usado na RLS): moderação, diretoria do capítulo, diretoria de
-- um capítulo da lista (entre capítulos). Nunca o próprio criador.
create function public.pode_decidir_desafio(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.desafios d
    where d.id = p_id and d.status = 'pendente' and d.criador <> auth.uid()
      and (public.sou_moderacao()
        or (d.capitulo_id is not null and public.sou_diretoria_de(d.capitulo_id))
        or exists (select 1 from public.desafio_capitulos c
                   where c.desafio_id = d.id and public.sou_diretoria_de(c.capitulo_id)))
  )
$$;
revoke execute on function public.pode_decidir_desafio(uuid) from public, anon;
grant execute on function public.pode_decidir_desafio(uuid) to authenticated;

create policy desafios_ler on public.desafios for select to authenticated using (
  (status = 'aprovado' and public.sou_membro_ativo())
  or criador = auth.uid()
  or public.pode_decidir_desafio(id)
);
create policy desafio_capitulos_ler on public.desafio_capitulos for select to authenticated using (
  public.sou_membro_ativo()
);
create policy participacoes_ler on public.participacoes for select to authenticated using (usuario_id = auth.uid());
create policy xp_ler_o_meu on public.xp_eventos for select to authenticated using (usuario_id = auth.uid());
create policy conquistas_ler on public.conquistas for select to authenticated using (
  usuario_id = auth.uid() or public.sou_membro_ativo()
);
-- progresso_registros: sem política = ninguém lê pelo app (auditoria só no painel/servidor).

revoke all on public.desafios, public.desafio_capitulos, public.participacoes,
  public.progresso_registros, public.xp_eventos, public.conquistas from anon, authenticated;
grant select on public.desafios, public.desafio_capitulos, public.participacoes,
  public.xp_eventos, public.conquistas to authenticated;

-- Concede um selo (e o XP dele uma vez só). Interno.
create function public.conceder_selo(p_usuario uuid, p_selo text, p_xp integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.conquistas (usuario_id, selo) values (p_usuario, p_selo) on conflict do nothing;
  if found and p_xp > 0 then
    insert into public.xp_eventos (usuario_id, origem, pontos) values (p_usuario, 'selo:' || p_selo, p_xp)
    on conflict do nothing;
  end if;
end $$;
revoke execute on function public.conceder_selo(uuid, text, integer) from public, anon, authenticated;

-- Cria um desafio. Irmão: fica pendente; diretoria: publica direto; vários capítulos: pendente até cada um aceitar.
create function public.criar_desafio(
  p_titulo text, p_descricao text, p_modalidade text, p_meta integer, p_dias integer,
  p_capitulos uuid[] default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  eu public.perfis;
  v_tipo text;
  v_status text := 'pendente';
  v_km numeric;
  v_id uuid;
  v_cap uuid;
  v_caps uuid[] := coalesce(p_capitulos, '{}');
begin
  select * into eu from public.perfis where id = auth.uid() and papel <> 'pendente' and desativado_em is null;
  if not found then raise exception 'sem_acesso' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_titulo, ''))) < 4 then raise exception 'titulo' using errcode = 'P0001'; end if;
  if p_meta is null or p_meta < 1 or p_meta > 20000 then raise exception 'meta' using errcode = 'P0001'; end if;
  if p_dias is null or p_dias < 1 or p_dias > 90 then raise exception 'prazo' using errcode = 'P0001'; end if;
  if p_modalidade not in ('km', 'sedes', 'lojas', 'passeios', 'agape', 'rotaBiker', 'socorro') then
    raise exception 'modalidade' using errcode = 'P0001';
  end if;
  v_km := public.km_equivalente(p_modalidade, p_meta);

  if cardinality(v_caps) > 1 then
    if eu.papel not in ('diretoria_capitulo', 'diretoria_geral', 'admin') then
      raise exception 'sem_acesso' using errcode = '42501';
    end if;
    v_tipo := 'capitulos';
  elsif eu.papel in ('diretoria_capitulo', 'diretoria_geral', 'admin') then
    v_tipo := 'diretoria';
    v_status := 'aprovado';
  else
    v_tipo := 'membro';
    if eu.capitulo_id is null then raise exception 'sem_capitulo' using errcode = 'P0001'; end if;
    if exists (select 1 from public.desafios d where d.criador = eu.id and d.tipo = 'membro'
               and d.status <> 'recusado' and date_trunc('month', d.criado_em) = date_trunc('month', now())) then
      raise exception 'um_por_mes' using errcode = 'P0001';
    end if;
    if (select count(*) from public.desafios d where d.tipo = 'membro' and d.status = 'aprovado'
        and d.capitulo_id = eu.capitulo_id and d.fim >= current_date) >= 3 then
      raise exception 'limite_capitulo' using errcode = 'P0001';
    end if;
  end if;

  insert into public.desafios (criador, titulo, descricao, modalidade, meta, km_total, xp, capitulo_id, tipo, status,
                               dias, aprovado_por, inicio, fim)
  values (eu.id, btrim(p_titulo), nullif(btrim(coalesce(p_descricao, '')), ''), p_modalidade, p_meta, v_km,
          public.xp_do_desafio(v_km, v_tipo), eu.capitulo_id, v_tipo, v_status, p_dias,
          case when v_status = 'aprovado' then eu.id end,
          case when v_status = 'aprovado' then current_date end,
          case when v_status = 'aprovado' then current_date + p_dias end)
  returning id into v_id;

  if v_tipo = 'capitulos' then
    foreach v_cap in array v_caps loop
      insert into public.desafio_capitulos (desafio_id, capitulo_id, aceito_por, aceito_em)
      values (v_id, v_cap,
              case when v_cap = eu.capitulo_id or eu.papel in ('diretoria_geral', 'admin') then eu.id end,
              case when v_cap = eu.capitulo_id or eu.papel in ('diretoria_geral', 'admin') then now() end)
      on conflict do nothing;
    end loop;
    -- se todos já aceitaram (criador é geral/admin), publica
    if not exists (select 1 from public.desafio_capitulos where desafio_id = v_id and aceito_em is null) then
      update public.desafios set status = 'aprovado', aprovado_por = eu.id, inicio = current_date,
        fim = current_date + p_dias where id = v_id;
    end if;
  end if;
  return v_id;
end $$;
revoke execute on function public.criar_desafio(text, text, text, integer, integer, uuid[]) from public, anon;
grant execute on function public.criar_desafio(text, text, text, integer, integer, uuid[]) to authenticated;

-- Decide um desafio pendente (diretoria do capítulo, geral, moderador, admin). Recusar exige motivo.
create function public.decidir_desafio(p_desafio uuid, p_aprovar boolean, p_motivo text default null)
returns text
language plpgsql security definer set search_path = public as $$
declare
  d public.desafios;
  v_cap uuid;
begin
  if not public.pode_decidir_desafio(p_desafio) then
    raise exception 'sem_permissao' using errcode = '42501';
  end if;
  select * into d from public.desafios where id = p_desafio for update;
  if d.status <> 'pendente' then raise exception 'ja_decidido' using errcode = 'P0001'; end if;

  if not p_aprovar then
    if char_length(btrim(coalesce(p_motivo, ''))) = 0 then raise exception 'motivo' using errcode = 'P0001'; end if;
    update public.desafios set status = 'recusado', aprovado_por = auth.uid(), motivo_recusa = left(btrim(p_motivo), 200)
      where id = d.id;
    return 'recusado';
  end if;

  if d.tipo = 'capitulos' and not public.sou_moderacao() and not exists (
       select 1 from public.perfis where id = auth.uid() and papel = 'diretoria_geral' and desativado_em is null) then
    -- diretoria de capítulo: aceita só o(s) seu(s) capítulo(s)
    update public.desafio_capitulos c set aceito_por = auth.uid(), aceito_em = now()
      where c.desafio_id = d.id and c.aceito_em is null and public.sou_diretoria_de(c.capitulo_id);
    if exists (select 1 from public.desafio_capitulos where desafio_id = d.id and aceito_em is null) then
      return 'pendente';
    end if;
  end if;

  update public.desafios set status = 'aprovado', aprovado_por = auth.uid(), inicio = current_date,
    fim = current_date + d.dias where id = d.id;
  return 'aprovado';
end $$;
revoke execute on function public.decidir_desafio(uuid, boolean, text) from public, anon;
grant execute on function public.decidir_desafio(uuid, boolean, text) to authenticated;

-- Participantes: contagem mantida por gatilho (a lista de quem participa é privada).
create function public.conta_participantes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.desafios set participantes = participantes + 1 where id = new.desafio_id;
  else
    update public.desafios set participantes = greatest(participantes - 1, 0) where id = old.desafio_id;
  end if;
  return null;
end $$;
create trigger participacoes_conta after insert or delete on public.participacoes
  for each row execute function public.conta_participantes();

create function public.entrar_desafio(p_desafio uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_membro_ativo() then raise exception 'sem_acesso' using errcode = '42501'; end if;
  if not exists (select 1 from public.desafios where id = p_desafio and status = 'aprovado' and fim >= current_date) then
    raise exception 'indisponivel' using errcode = 'P0001';
  end if;
  insert into public.participacoes (desafio_id, usuario_id) values (p_desafio, auth.uid()) on conflict do nothing;
  return found;
end $$;
revoke execute on function public.entrar_desafio(uuid) from public, anon;
grant execute on function public.entrar_desafio(uuid) to authenticated;

-- Sair não apaga XP já ganho; só tira o desafio em andamento.
create function public.sair_desafio(p_desafio uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.participacoes where desafio_id = p_desafio and usuario_id = auth.uid() and concluido_em is null;
  return found;
end $$;
revoke execute on function public.sair_desafio(uuid) from public, anon;
grant execute on function public.sair_desafio(uuid) to authenticated;

-- Registra avanço (km no desafio de km; quantidade nos demais). Antifraude no servidor:
--  * 'salto': mais de 200 km numa chamada, ou velocidade implícita acima de 200 km/h desde a chamada anterior
--    (ou desde a entrada); nos demais, no máximo 3 por chamada;
--  * 'limite_diario': 800 km/dia (3 itens/dia nos demais);
--  * 'fora_do_prazo' / 'nao_participa' / 'ja_concluido'.
-- Limite honesto: o servidor só enxerga o que o app informa; não confere o GPS de verdade.
-- Ao atingir a meta: XP da tabela (uma vez) e o selo 'desafio' no primeiro concluído. Devolve km_feitos.
create function public.registrar_progresso(p_desafio uuid, p_km numeric) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  d public.desafios;
  pa public.participacoes;
  v_horas numeric;
  v_hoje numeric;
  v_novo numeric;
  v_teto numeric;
begin
  if not public.sou_membro_ativo() then raise exception 'sem_acesso' using errcode = '42501'; end if;
  if p_km is null or p_km <= 0 then raise exception 'valor' using errcode = 'P0001'; end if;
  select * into d from public.desafios where id = p_desafio and status = 'aprovado';
  if not found then raise exception 'indisponivel' using errcode = 'P0001'; end if;
  select * into pa from public.participacoes where desafio_id = p_desafio and usuario_id = auth.uid() for update;
  if not found then raise exception 'nao_participa' using errcode = 'P0001'; end if;
  if pa.concluido_em is not null then raise exception 'ja_concluido' using errcode = 'P0001'; end if;
  if d.fim < current_date then raise exception 'fora_do_prazo' using errcode = 'P0001'; end if;

  if d.modalidade = 'km' then
    if p_km > 200 then raise exception 'salto' using errcode = 'P0001'; end if;
    v_horas := extract(epoch from (now() - coalesce(pa.ultimo_registro_em, pa.entrou_em))) / 3600.0;
    if p_km > 200 * greatest(v_horas, 0) then raise exception 'salto' using errcode = 'P0001'; end if;
  else
    if p_km > 3 or p_km <> trunc(p_km) then raise exception 'salto' using errcode = 'P0001'; end if;
  end if;

  select coalesce(sum(km), 0) into v_hoje from public.progresso_registros
    where usuario_id = auth.uid() and desafio_id = p_desafio and criado_em >= date_trunc('day', now());
  v_teto := case when d.modalidade = 'km' then 800 else 3 end;
  if v_hoje + p_km > v_teto then
    raise exception 'limite_diario' using errcode = 'P0001';
  end if;

  insert into public.progresso_registros (desafio_id, usuario_id, km) values (p_desafio, auth.uid(), p_km);
  v_novo := pa.km_feitos + p_km;
  update public.participacoes set km_feitos = v_novo, ultimo_registro_em = now(),
    concluido_em = case when v_novo >= d.meta then now() end
    where desafio_id = p_desafio and usuario_id = auth.uid();

  if v_novo >= d.meta then
    insert into public.xp_eventos (usuario_id, origem, pontos) values (auth.uid(), 'desafio:' || d.id, d.xp)
      on conflict do nothing;
    perform public.conceder_selo(auth.uid(), 'desafio', 0);
  end if;
  return v_novo;
end $$;
revoke execute on function public.registrar_progresso(uuid, numeric) from public, anon;
grant execute on function public.registrar_progresso(uuid, numeric) to authenticated;

-- "Sair do ranking": o irmão continua com XP e selos, só não aparece na lista.
create function public.definir_fora_do_ranking(p_fora boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.perfis set fora_do_ranking = coalesce(p_fora, false) where id = auth.uid();
  return found;
end $$;
revoke execute on function public.definir_fora_do_ranking(boolean) from public, anon;
grant execute on function public.definir_fora_do_ranking(boolean) to authenticated;

-- Ranking por XP: top 50, sem quem saiu, sem desativados/pendentes. Períodos: 'mes' (30 dias) e 'sempre'.
-- Só XP: nunca velocidade nem tempo.
create function public.ranking(p_capitulo uuid default null, p_periodo text default 'sempre')
returns table (posicao bigint, usuario_id uuid, nome text, apelido text, capitulo_id uuid, xp bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_membro_ativo() then raise exception 'sem_acesso' using errcode = '42501'; end if;
  if p_periodo not in ('mes', 'sempre') then raise exception 'periodo' using errcode = 'P0001'; end if;
  return query
    select row_number() over (order by sum(x.pontos) desc, p.nome, p.id) as posicao,
           p.id, p.nome, p.apelido, p.capitulo_id, sum(x.pontos)::bigint as xp
      from public.xp_eventos x
      join public.perfis p on p.id = x.usuario_id
     where not p.fora_do_ranking and p.desativado_em is null and p.papel <> 'pendente'
       and (p_capitulo is null or p.capitulo_id = p_capitulo)
       and (p_periodo = 'sempre' or x.criado_em >= now() - interval '30 days')
     group by p.id, p.nome, p.apelido, p.capitulo_id
     order by 1
     limit 50;
end $$;
revoke execute on function public.ranking(uuid, text) from public, anon;
grant execute on function public.ranking(uuid, text) to authenticated;

-- Meu XP total (inclui quem saiu do ranking).
create function public.meu_xp() returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce(sum(pontos), 0)::bigint from public.xp_eventos where usuario_id = auth.uid()
$$;
revoke execute on function public.meu_xp() from public, anon;
grant execute on function public.meu_xp() to authenticated;
