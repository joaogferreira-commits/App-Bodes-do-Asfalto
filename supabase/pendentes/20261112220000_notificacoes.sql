-- Notificações push: gatilhos que chamam a Edge Function "notificar" via pg_net.
-- AGUARDA AUTORIZAÇÃO DO DONO (fica em pendentes/; depois vai para migrations/).
--
-- Publicação automática pelo workflow .github/workflows/publicar-notificacoes.yml (com autorização do dono):
-- aplica esta migration, cria um segredo aleatório, publica a função "notificar" e chama
-- definir_config_notificacao(url, segredo). Sem essa configuração os gatilhos não fazem nada (e nunca travam o app).
--
-- LGPD: a prévia da mensagem nunca leva o conteúdo; o corpo é sempre "Nova mensagem".

create extension if not exists pg_net with schema extensions;

-- Configuração privada (uma linha). RLS ligada e SEM políticas: ninguém do app lê; só postgres/service_role.
create table public.config_notificacao (
  id boolean primary key default true check (id),
  url text,
  segredo text
);
insert into public.config_notificacao (id) values (true) on conflict do nothing;
alter table public.config_notificacao enable row level security;
revoke all on public.config_notificacao from anon, authenticated;

-- Dispara a função sem esperar a resposta. Qualquer falha é engolida: o gatilho nunca derruba o INSERT.
create function public.notificar_async(
  ids uuid[], tipo text, titulo text, corpo text, rota text default null
) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare c public.config_notificacao;
begin
  if ids is null or coalesce(array_length(ids, 1), 0) = 0 then return; end if;
  select * into c from public.config_notificacao where id;
  if c.url is null or c.segredo is null then return; end if;
  perform net.http_post(
    url := c.url,
    headers := jsonb_build_object('content-type', 'application/json', 'x-notificar-segredo', c.segredo),
    body := jsonb_build_object('usuario_ids', to_jsonb(ids), 'tipo', tipo, 'titulo', titulo, 'corpo', corpo, 'rota', rota)
  );
exception when others then
  null;
end $$;
revoke execute on function public.notificar_async(uuid[], text, text, text, text) from public, anon, authenticated;

-- Nova mensagem: outros participantes não silenciados, ativos e que não bloquearam o autor.
create function public.gatilho_notificar_mensagem() returns trigger
language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  select array_agg(p.usuario_id) into ids
    from public.participantes p
    join public.perfis f on f.id = p.usuario_id and f.desativado_em is null
   where p.conversa_id = new.conversa_id
     and p.usuario_id <> new.autor
     and not p.silenciado
     and not exists (select 1 from public.bloqueios b where b.quem = p.usuario_id and b.bloqueado = new.autor);
  perform public.notificar_async(ids, 'mensagem', 'Bodes do Asfalto', 'Nova mensagem', '/conversa/' || new.conversa_id::text);
  return new;
end $$;
create trigger notificar_mensagem after insert on public.mensagens
  for each row execute function public.gatilho_notificar_mensagem();

-- Aceno recebido (sem revelar o nome na prévia).
create function public.gatilho_notificar_aceno() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.bloqueios b where b.quem = new.para and b.bloqueado = new.de) then
    perform public.notificar_async(array[new.para], 'aceno', 'Bodes do Asfalto', 'Você recebeu um aceno', '/conversas');
  end if;
  return new;
end $$;
create trigger notificar_aceno after insert on public.acenos
  for each row execute function public.gatilho_notificar_aceno();

-- Pedido de entrada novo: quem pode aprovar o capítulo (mesma regra de posso_aprovar).
create function public.gatilho_notificar_pedido() returns trigger
language plpgsql security definer set search_path = public as $$
declare ids uuid[]; tem_dir boolean;
begin
  select exists (select 1 from public.perfis where capitulo_id = new.capitulo_id and papel = 'diretoria_capitulo' and desativado_em is null)
    into tem_dir;
  select array_agg(id) into ids from public.perfis
   where desativado_em is null
     and (papel = 'admin'
          or (tem_dir and (papel = 'diretoria_geral' or (papel = 'diretoria_capitulo' and capitulo_id = new.capitulo_id)))
          or (not tem_dir and papel = 'moderador'));
  perform public.notificar_async(ids, 'aprovacao', 'Bodes do Asfalto', 'Novo pedido de entrada', '/aprovacoes');
  return new;
end $$;
create trigger notificar_pedido after insert on public.solicitacoes_entrada
  for each row execute function public.gatilho_notificar_pedido();

-- Pedido aprovado ou recusado: avisa o candidato.
-- Obs.: o candidato só tem token depois de entrar como membro; antes disso o aviso não tem destino.
create function public.gatilho_notificar_decisao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'aberta' and new.status in ('aprovada', 'recusada') then
    perform public.notificar_async(
      array[new.usuario_id], 'aprovacao', 'Bodes do Asfalto',
      case when new.status = 'aprovada' then 'Seu pedido foi aprovado' else 'Seu pedido foi respondido' end,
      '/'
    );
  end if;
  return new;
end $$;
create trigger notificar_decisao after update of status on public.solicitacoes_entrada
  for each row execute function public.gatilho_notificar_decisao();

-- Configuração feita pela rotina de publicação (GitHub), chamando com a chave de serviço.
-- Ninguém do app consegue chamar (sem permissão para anon/authenticated).
create function public.definir_config_notificacao(p_url text, p_segredo text) returns void
language sql security definer set search_path = public as $$
  update public.config_notificacao set url = p_url, segredo = p_segredo where id;
$$;
revoke all on function public.definir_config_notificacao(text, text) from public, anon, authenticated;
grant execute on function public.definir_config_notificacao(text, text) to service_role;
