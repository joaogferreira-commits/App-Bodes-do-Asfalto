-- Papéis: só o administrador (dono) nomeia moderadores e diretorias (CLAUDE.md: "Moderadores nomeados pelo dono").
create function public.definir_papel(irmao uuid, novo public.papel, cap uuid default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'só o administrador muda papéis'; end if;
  if irmao = auth.uid() and novo <> 'admin' then raise exception 'o administrador não tira o próprio papel'; end if;
  if novo = 'pendente' then raise exception 'para tirar o acesso, use desativar_irmao'; end if;
  if novo = 'diretoria_capitulo' and cap is null
     and (select capitulo_id from public.perfis where id = irmao) is null then
    raise exception 'diretoria de capítulo precisa de um capítulo';
  end if;
  perform set_config('bodes.mudanca_autorizada', 'sim', true);
  update public.perfis set papel = novo, capitulo_id = coalesce(cap, capitulo_id) where id = irmao;
  if not found then raise exception 'irmão não encontrado'; end if;
  perform set_config('bodes.mudanca_autorizada', '', true);
end $$;
revoke all on function public.definir_papel(uuid, public.papel, uuid) from public, anon;
grant execute on function public.definir_papel(uuid, public.papel, uuid) to authenticated;
