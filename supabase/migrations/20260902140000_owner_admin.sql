-- Owner mailbox is always CMS admin.

create or replace function public.cms_ensure_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
  total int;
  user_email text;
  owner_email constant text := 'martin@viraal.media';
begin
  if auth.uid() is null then
    return 'viewer';
  end if;

  user_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  select role into current_role
  from public.user_roles
  where user_id = auth.uid();

  if user_email = owner_email then
    if current_role is not null then
      update public.user_roles
      set
        role = 'admin',
        status = 'active',
        email = coalesce(nullif(email, ''), user_email)
      where user_id = auth.uid();
    else
      insert into public.user_roles (user_id, email, display_name, role, status)
      values (
        auth.uid(),
        user_email,
        coalesce(auth.jwt() ->> 'email', 'Admin'),
        'admin',
        'active'
      )
      on conflict (user_id) do update
        set role = 'admin', status = 'active';
    end if;
    return 'admin';
  end if;

  if current_role is not null then
    update public.user_roles
    set
      status = 'active',
      email = case when email = '' then user_email else email end
    where user_id = auth.uid();
    return current_role;
  end if;

  select count(*) into total from public.user_roles;
  if total = 0 then
    insert into public.user_roles (user_id, email, display_name, role, status)
    values (
      auth.uid(),
      user_email,
      coalesce(auth.jwt() ->> 'email', 'Admin'),
      'admin',
      'active'
    );
    return 'admin';
  end if;

  insert into public.user_roles (user_id, email, display_name, role, status)
  values (
    auth.uid(),
    user_email,
    coalesce(user_email, 'Gebruiker'),
    'viewer',
    'active'
  )
  on conflict (user_id) do nothing;

  return 'viewer';
end;
$$;

insert into public.user_roles (user_id, email, display_name, role, status)
select
  id,
  lower(coalesce(email, '')),
  coalesce(email, 'Admin'),
  'admin',
  'active'
from auth.users
where lower(coalesce(email, '')) = 'martin@viraal.media'
on conflict (user_id) do update
  set role = 'admin',
      status = 'active',
      email = excluded.email;
