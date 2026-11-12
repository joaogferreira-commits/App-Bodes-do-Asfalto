-- Etapa B: fotos da solicitação de entrada (colete e carteirinha) e primeiro administrador.

-- Bucket PRIVADO: as fotos só são vistas pelo próprio irmão e por quem pode aprovar o capítulo dele.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('entrada', 'entrada', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Caminho obrigatório: <id do usuário>/<arquivo>
create policy entrada_enviar_a_sua on storage.objects for insert to authenticated
  with check (bucket_id = 'entrada' and (storage.foldername(name))[1] = auth.uid()::text);

create policy entrada_ver on storage.objects for select to authenticated
  using (
    bucket_id = 'entrada'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.solicitacoes_entrada s
        where s.usuario_id::text = (storage.foldername(name))[1]
          and public.posso_aprovar(s.capitulo_id)
      )
    )
  );

create policy entrada_apagar_a_sua on storage.objects for delete to authenticated
  using (bucket_id = 'entrada' and (storage.foldername(name))[1] = auth.uid()::text);

-- Primeiro administrador (o dono). Só roda no editor SQL do Supabase (como postgres);
-- o app não consegue chamar: permissão retirada de anon e authenticated.
create function public.tornar_admin_por_email(email_dono text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(email_dono);
  if uid is null then raise exception 'ninguém entrou no app com este e-mail ainda'; end if;
  perform set_config('bodes.mudanca_autorizada', 'sim', true);
  insert into public.perfis (id, nome, papel)
  values (uid, coalesce(split_part(email_dono, '@', 1), 'Admin'), 'admin')
  on conflict (id) do update set papel = 'admin', desativado_em = null;
  perform set_config('bodes.mudanca_autorizada', '', true);
end $$;
revoke all on function public.tornar_admin_por_email(text) from public, anon, authenticated;
