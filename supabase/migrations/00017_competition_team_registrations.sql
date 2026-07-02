-- Migration 00017: Competition team registrations for doubles

create table if not exists public.competition_team_registrations (
  id uuid default uuid_generate_v4() primary key,
  competition_id uuid references public.competitions on delete cascade not null,
  team_id uuid references public.teams on delete cascade not null,
  status text not null default 'registered' check (status in ('registered', 'paid_test', 'paid', 'cancelled')),
  payment_provider text,
  payment_reference text,
  amount decimal(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (competition_id, team_id)
);

alter table public.competition_team_registrations enable row level security;

create policy "Teams can view own registrations" on public.competition_team_registrations for select using (
  exists (
    select 1 from public.team_members tm
    join public.profiles p on p.id = auth.uid()
    where tm.team_id = competition_team_registrations.team_id and tm.player_id = p.id
  )
);

create policy "Teams insertion by team member" on public.competition_team_registrations for insert with check (
  exists (
    select 1 from public.team_members tm where tm.team_id = competition_team_registrations.team_id and tm.player_id = auth.uid()
  )
);

create policy "Teams update by team member" on public.competition_team_registrations for update using (
  exists (
    select 1 from public.team_members tm where tm.team_id = competition_team_registrations.team_id and tm.player_id = auth.uid()
  )
);

create index if not exists idx_competition_team_registrations_team on public.competition_team_registrations (team_id);
create index if not exists idx_competition_team_registrations_competition on public.competition_team_registrations (competition_id);
