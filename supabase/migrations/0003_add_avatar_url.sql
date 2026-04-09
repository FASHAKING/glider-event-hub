-- Add avatar_url to public.profiles
alter table public.profiles add column if not exists avatar_url text;

-- Update the handle_new_user trigger function to handle potentially missing avatar_url
-- (though it wouldn't be in raw_user_meta_data usually during initial signup)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
