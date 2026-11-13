-- Ajuda e suporte (P12): pedidos do irmão chegam ao admin/moderador, com print opcional e dados do aparelho.
-- AGUARDA o CI verde (pgTAP) e entra em migrations/ pelo workflow, conforme a autorização permanente do dono.
--
-- LGPD: "dados_aparelho" guarda só versão do app, sistema, modelo e idioma (nunca localização nem dados
-- maçônicos); o app mostra ao irmão exatamente o que vai e só envia se ele marcar.

create table public.pedidos_suporte (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  categoria text not null check (categoria in ('duvida', 'problema', 'sugestao', 'denuncia_outro')),
  dados_aparelho jsonb check (
    dados_aparelho is null
    or (jsonb_typeof(dados_aparelho) = 'object' and char_length(dados_aparelho::text) <= 600)
  ),
  print_path text check (print_path is null or char_length(print_path) <= 200),
  status text not null default 'aberto' check (status in ('aberto', 'respondido', 'fechado')),
  resposta text check (resposta is null or char_length(resposta) <= 2000),
  respondido_por uuid references public.perfis (id) on delete set null,
  created_at timestamptz not null default now()
);
create index pedidos_suporte_usuario on public.pedidos_suporte (usuario_id, created_at desc);
create index pedidos_suporte_status on public.pedidos_suporte (status, created_at);
alter table public.pedidos_suporte enable row level security;

-- Cada irmão cria (como aberto, sem resposta, print só na própria pasta) e lê os seus; moderação lê todos.
-- Não há política de update/delete: a resposta só entra pela função responder_suporte.
create policy suporte_criar on public.pedidos_suporte for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and status = 'aberto' and resposta is null and respondido_por is null
    and (print_path is null or print_path like auth.uid()::text || '/%')
    and public.sou_membro_ativo()
  );
create policy suporte_ler on public.pedidos_suporte for select to authenticated
  using (usuario_id = auth.uid() or public.sou_moderacao());

-- No máximo 10 pedidos por dia por irmão (evita enchente).
create function public.limitar_suporte() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.pedidos_suporte where usuario_id = new.usuario_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'limite_diario' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger suporte_limite before insert on public.pedidos_suporte
  for each row execute function public.limitar_suporte();

-- Responder (ou só fechar): moderador e admin.
create function public.responder_suporte(p_id uuid, p_resposta text, p_status text default 'respondido')
returns text
language plpgsql security definer set search_path = public as $$
declare r text := nullif(btrim(coalesce(p_resposta, '')), '');
begin
  if not public.sou_moderacao() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  if p_status not in ('respondido', 'fechado') then raise exception 'status' using errcode = 'P0001'; end if;
  if r is null and p_status = 'respondido' then raise exception 'resposta' using errcode = 'P0001'; end if;
  if r is not null and char_length(r) > 2000 then raise exception 'resposta' using errcode = 'P0001'; end if;
  update public.pedidos_suporte
     set resposta = coalesce(r, resposta), status = p_status, respondido_por = auth.uid()
   where id = p_id;
  if not found then raise exception 'inexistente' using errcode = 'P0001'; end if;
  return p_status;
end $$;
revoke all on function public.responder_suporte(uuid, text, text) from public, anon;
grant execute on function public.responder_suporte(uuid, text, text) to authenticated;

-- Avisos (sem o conteúdo do pedido na prévia). O tipo 'suporte' precisa estar na lista da Edge Function "notificar".
create function public.gatilho_notificar_suporte_novo() returns trigger
language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  select array_agg(id) into ids from public.perfis where papel in ('moderador', 'admin') and desativado_em is null;
  perform public.notificar_async(ids, 'suporte', 'Bodes do Asfalto', 'Novo pedido de suporte', '/aprovacoes');
  return new;
end $$;
create trigger notificar_suporte_novo after insert on public.pedidos_suporte
  for each row execute function public.gatilho_notificar_suporte_novo();

create function public.gatilho_notificar_suporte_resposta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('respondido', 'fechado') and new.resposta is not null and new.resposta is distinct from old.resposta then
    perform public.notificar_async(array[new.usuario_id], 'suporte', 'Bodes do Asfalto', 'Seu pedido de ajuda foi respondido', '/ajuda');
  end if;
  return new;
end $$;
create trigger notificar_suporte_resposta after update on public.pedidos_suporte
  for each row execute function public.gatilho_notificar_suporte_resposta();

-- Bucket PRIVADO dos prints: o irmão envia e vê só na própria pasta; moderação vê todos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('suporte', 'suporte', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy suporte_enviar_o_seu on storage.objects for insert to authenticated
  with check (bucket_id = 'suporte' and (storage.foldername(name))[1] = auth.uid()::text);
create policy suporte_ver on storage.objects for select to authenticated
  using (bucket_id = 'suporte' and ((storage.foldername(name))[1] = auth.uid()::text or public.sou_moderacao()));
create policy suporte_apagar_o_seu on storage.objects for delete to authenticated
  using (bucket_id = 'suporte' and (storage.foldername(name))[1] = auth.uid()::text);
