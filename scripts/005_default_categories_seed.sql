-- Seed default categories for every new user and backfill existing users.
-- Supports both schema variants: categorias (PT) and categories (EN).

do $$
begin
  if to_regclass('public.categorias') is not null then
    execute $fn$
      create or replace function public.seed_default_categories_pt()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $inner$
      begin
        insert into public.categorias (usuario_id, nome, cor)
        values
          (new.id, 'Estudos', '#8b5cf6'),
          (new.id, 'Trabalho', '#06b6d4'),
          (new.id, 'Pessoal', '#10b981');
        return new;
      exception when others then
        return new;
      end;
      $inner$;
    $fn$;

    execute 'drop trigger if exists on_auth_user_created_default_categories_pt on auth.users';
    execute '
      create trigger on_auth_user_created_default_categories_pt
      after insert on auth.users
      for each row
      execute function public.seed_default_categories_pt()
    ';

    execute '
      insert into public.categorias (usuario_id, nome, cor)
      select u.id, v.nome, v.cor
      from auth.users u
      cross join (
        values
          (''Estudos'', ''#8b5cf6''),
          (''Trabalho'', ''#06b6d4''),
          (''Pessoal'', ''#10b981'')
      ) as v(nome, cor)
      where not exists (
        select 1
        from public.categorias c
        where c.usuario_id = u.id
          and c.nome = v.nome
      )
    ';
  end if;

  if to_regclass('public.categories') is not null then
    execute $fn$
      create or replace function public.seed_default_categories_en()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $inner$
      begin
        insert into public.categories (user_id, name, color)
        values
          (new.id, 'Estudos', '#8b5cf6'),
          (new.id, 'Trabalho', '#06b6d4'),
          (new.id, 'Pessoal', '#10b981');
        return new;
      exception when others then
        return new;
      end;
      $inner$;
    $fn$;

    execute 'drop trigger if exists on_auth_user_created_default_categories_en on auth.users';
    execute '
      create trigger on_auth_user_created_default_categories_en
      after insert on auth.users
      for each row
      execute function public.seed_default_categories_en()
    ';

    execute '
      insert into public.categories (user_id, name, color)
      select u.id, v.name, v.color
      from auth.users u
      cross join (
        values
          (''Estudos'', ''#8b5cf6''),
          (''Trabalho'', ''#06b6d4''),
          (''Pessoal'', ''#10b981'')
      ) as v(name, color)
      where not exists (
        select 1
        from public.categories c
        where c.user_id = u.id
          and c.name = v.name
      )
    ';
  end if;
end $$;
