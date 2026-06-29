-- Migration 00008: Ensure tijs.peetermans@neuritas-ai.com has admin role
-- Run this in the Supabase SQL Editor to apply.

-- 1. Update the trigger to always give the correct email admin status
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    case when lower(new.email) = 'tijs.peetermans@neuritas-ai.com' then 'admin'::user_role else 'player'::user_role end,
    case when lower(new.email) = 'tijs.peetermans@neuritas-ai.com' then true else false end
  )
  on conflict (id) do update
    set role = case when lower(new.email) = 'tijs.peetermans@neuritas-ai.com' then 'admin'::user_role else excluded.role end;
  return new;
end;
$$ language plpgsql security definer;

-- 2. If the user already exists, make sure they have admin role
update public.profiles
  set role = 'admin', is_active = true
  where lower(email) = 'tijs.peetermans@neuritas-ai.com';

-- 3. Add avatars storage bucket (idempotent)
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- 4. RLS policies for the avatars bucket
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );
