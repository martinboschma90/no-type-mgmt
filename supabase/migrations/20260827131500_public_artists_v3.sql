-- Public roster cache moved to slug-keyed `notype-public-artists-v3`.
-- Keep v2 readable so existing rows still work until the CMS republishes.

drop policy if exists "Public can read public CMS cache" on public.cms_content;
create policy "Public can read public CMS cache"
  on public.cms_content
  for select
  to anon, authenticated
  using (
    key in (
      'notype-public-artists-v2',
      'notype-public-artists-v3'
    )
  );
