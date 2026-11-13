-- SOS real (P10): aviso por push ao grupo do passeio/comboio de hoje e à diretoria, com a posição EXATA
-- durante o SOS. AGUARDA AUTORIZAÇÃO DO DONO (fica em pendentes/; depois vai para migrations/).
--
-- Regras (CLAUDE.md):
--  * a posição exata vive só nesta tabela, só enquanto o SOS está ativo (encerra ao fim, em 6 h no máximo);
--    posicoes_ao_vivo/posicoes_visiveis NÃO mudam: quem está "aproximado"/"invisivel" continua assim no mapa;
--  * quem lê: o próprio irmão, os participantes de grupos 'passeio'/'comboio' ativos dele, a diretoria do
--    capítulo (e a geral), moderador e admin;
--  * o push nunca leva dado maçônico: título "SOS — apelido", corpo curto fixo;
--  * contatos de emergência NÃO recebem push: eles guardam só nome e telefone (sem vínculo seguro com um
--    perfil do app); para eles segue o WhatsApp com mensagem pronta (fluxo local do app);
--  * telefone: copiado do pedido de entrada aprovado do irmão, só para o botão "Ligar" de quem recebe o SOS;
--    some junto com a linha (apagada 7 dias depois de encerrar).

create table public.sos_ativos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  tipo text check (tipo is null or tipo in ('acidente', 'pane', 'pneu', 'combustivel', 'perdido', 'saude', 'bateria', 'outro')),
  mensagem text check (char_length(mensagem) <= 200),
  telefone text,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  iniciado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  encerrado_em timestamptz
);
create unique index sos_um_ativo on public.sos_ativos (usuario_id) where encerrado_em is null;
create index sos_encerrado on public.sos_ativos (encerrado_em);

alter table public.sos_ativos enable row level security;

-- Quem deve receber o SOS do irmão u (interno; o app não chama).
create function public.sos_destinatarios(u uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct x.id), '{}'::uuid[]) from (
    -- grupos de passeio (que sai em até 1 dia) e de comboio ainda ativos em que ele está
    select p.usuario_id as id
      from public.participantes eu
      join public.conversas c on c.id = eu.conversa_id
      join public.participantes p on p.conversa_id = c.id
     where eu.usuario_id = u
       and ((c.tipo = 'comboio' and (c.termina_em is null or c.termina_em > now()))
         or (c.tipo = 'passeio' and c.termina_em > now()
             and exists (select 1 from public.passeios ps where ps.id = c.passeio_id and ps.data <= now() + interval '1 day')))
    union
    -- diretoria do capítulo dele, diretoria geral, moderação e admin
    select d.id
      from public.perfis d
      join public.perfis o on o.id = u
     where d.papel in ('diretoria_geral', 'moderador', 'admin')
        or (d.papel = 'diretoria_capitulo' and d.capitulo_id is not distinct from o.capitulo_id and o.capitulo_id is not null)
  ) x
  join public.perfis f on f.id = x.id and f.desativado_em is null and f.papel <> 'pendente'
  where x.id <> u
$$;
revoke execute on function public.sos_destinatarios(uuid) from public, anon, authenticated;

create function public.pode_ver_sos(dono uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and auth.uid() = any (public.sos_destinatarios(dono))
$$;
revoke execute on function public.pode_ver_sos(uuid) from public, anon;
grant execute on function public.pode_ver_sos(uuid) to authenticated;

create policy sos_ler on public.sos_ativos for select to authenticated using (
  usuario_id = auth.uid()
  or (encerrado_em is null and iniciado_em > now() - interval '6 hours' and public.pode_ver_sos(usuario_id))
);
create policy sos_criar on public.sos_ativos for insert to authenticated
  with check (usuario_id = auth.uid() and public.sou_membro_ativo());
create policy sos_atualizar on public.sos_ativos for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
revoke all on public.sos_ativos from anon, authenticated;
grant select, insert on public.sos_ativos to authenticated;
grant update (lat, lng, encerrado_em) on public.sos_ativos to authenticated;

-- Inicia o SOS: fecha um anterior, grava a posição exata, avisa por push e devolve o id.
create function public.iniciar_sos(p_tipo text, p_mensagem text, p_lat double precision, p_lng double precision)
returns uuid
language plpgsql security definer set search_path = public as $$
declare eu public.perfis; novo uuid; tel text; curto text;
begin
  if not public.sou_membro_ativo() then raise exception 'só membros ativos' using errcode = '42501'; end if;
  select * into eu from public.perfis where id = auth.uid();
  update public.sos_ativos set encerrado_em = now() where usuario_id = auth.uid() and encerrado_em is null;
  select telefone into tel from public.solicitacoes_entrada
   where usuario_id = auth.uid() and status = 'aprovada' order by criado_em desc limit 1;
  insert into public.sos_ativos (usuario_id, tipo, mensagem, telefone, lat, lng)
    values (auth.uid(), nullif(p_tipo, ''), left(nullif(btrim(p_mensagem), ''), 200), tel, p_lat, p_lng)
    returning id into novo;
  curto := coalesce(nullif(btrim(eu.apelido), ''), split_part(eu.nome, ' ', 1));
  perform public.notificar_async(
    public.sos_destinatarios(auth.uid()), 'sos', 'SOS — ' || curto,
    'Pediu ajuda. Toque para ver onde ele está.', '/sos-ativo/' || novo::text);
  return novo;
end $$;

create function public.atualizar_posicao_sos(p_id uuid, p_lat double precision, p_lng double precision)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.sos_ativos set lat = p_lat, lng = p_lng, atualizado_em = now()
   where id = p_id and usuario_id = auth.uid() and encerrado_em is null
     and iniciado_em > now() - interval '6 hours';
  return found;
end $$;

create function public.encerrar_sos(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.sos_ativos set encerrado_em = now()
   where id = p_id and usuario_id = auth.uid() and encerrado_em is null;
  return found;
end $$;

revoke execute on function public.iniciar_sos(text, text, double precision, double precision) from public, anon;
revoke execute on function public.atualizar_posicao_sos(uuid, double precision, double precision) from public, anon;
revoke execute on function public.encerrar_sos(uuid) from public, anon;
grant execute on function public.iniciar_sos(text, text, double precision, double precision) to authenticated;
grant execute on function public.atualizar_posicao_sos(uuid, double precision, double precision) to authenticated;
grant execute on function public.encerrar_sos(uuid) to authenticated;

-- Encerra sozinho depois de 6 h e apaga o histórico 7 dias depois de encerrado.
create function public.encerrar_sos_vencidos() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.sos_ativos set encerrado_em = now()
   where encerrado_em is null and iniciado_em < now() - interval '6 hours';
  delete from public.sos_ativos where encerrado_em < now() - interval '7 days';
end $$;
revoke all on function public.encerrar_sos_vencidos() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.schedule('encerrar-sos-vencidos', '*/10 * * * *', 'select public.encerrar_sos_vencidos()');
    exception when others then
      raise notice 'pg_cron indisponível (%): agende public.encerrar_sos_vencidos() manualmente', sqlerrm;
    end;
  else
    raise notice 'pg_cron não disponível: agende public.encerrar_sos_vencidos() manualmente';
  end if;
end $$;
