-- Add doubles support and admin tracking

-- 1. Teams (for doubles competitions)
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  competition_id uuid references public.competitions on delete cascade not null,
  name text, -- Optional, e.g., "The Smashers" or "Peeters / Smet"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Team Members
create table public.team_members (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams on delete cascade not null,
  player_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, player_id)
);

-- 3. Team Standings in Poules (similar to poule_players)
create table public.team_poules (
  id uuid default uuid_generate_v4() primary key,
  poule_id uuid references public.poules on delete cascade not null,
  team_id uuid references public.teams on delete cascade not null,
  position int not null,
  matches_played int default 0,
  matches_won int default 0,
  matches_lost int default 0,
  sets_won int default 0,
  sets_lost int default 0,
  games_won int default 0,
  games_lost int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(poule_id, team_id)
);

-- 4. Update Matches table to support teams
alter table public.matches
  alter column player1_id drop not null,
  alter column player2_id drop not null;

alter table public.matches
  add column team1_id uuid references public.teams on delete cascade,
  add column team2_id uuid references public.teams on delete cascade,
  add column winner_team_id uuid references public.teams on delete cascade;

-- Check constraint: Match must be either between players (singles) OR teams (doubles)
alter table public.matches add constraint match_participants_check
  check (
    (player1_id is not null and player2_id is not null and team1_id is null and team2_id is null)
    or
    (team1_id is not null and team2_id is not null and player1_id is null and player2_id is null)
  );

-- 5. Admin Logs
create table public.admin_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Setup RLS for new tables
alter table public.teams enable row level security;
create policy "Teams are viewable by everyone" on public.teams for select using (true);
create policy "Admins can manage teams" on public.teams using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

alter table public.team_members enable row level security;
create policy "Team members are viewable by everyone" on public.team_members for select using (true);
create policy "Admins can manage team members" on public.team_members using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

alter table public.team_poules enable row level security;
create policy "Team standings are viewable by everyone" on public.team_poules for select using (true);
create policy "Admins can manage team standings" on public.team_poules using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

alter table public.admin_logs enable row level security;
create policy "Only admins can view admin logs" on public.admin_logs for select using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "Only admins can insert admin logs" on public.admin_logs for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- 7. Triggers for teams updated_at
create trigger on_team_updated
  before update on public.teams
  for each row execute procedure public.handle_updated_at();

-- 8. Storage for Avatars
-- (Run this safely if the bucket doesn't exist yet)
-- Note: 'storage.buckets' table operations might require specific privileges.
-- Usually run by superuser in migrations.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete their own avatar."
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );
