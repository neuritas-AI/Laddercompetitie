-- Competition status, price, and registration/payment support

-- Extend competitions table
alter table public.competitions
  add column if not exists status text default 'draft',
  add column if not exists max_participants int default 32,
  add column if not exists price decimal(10, 2) default 0;

-- Registration status enum values: registered, paid_test, paid, cancelled
create table if not exists public.competition_registrations (
  id uuid default uuid_generate_v4() primary key,
  competition_id uuid references public.competitions on delete cascade not null,
  player_id uuid references public.profiles on delete cascade not null,
  status text not null default 'registered'
    check (status in ('registered', 'paid_test', 'paid', 'cancelled')),
  payment_provider text,
  payment_reference text,
  amount decimal(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (competition_id, player_id)
);

alter table public.competition_registrations enable row level security;

create policy "Users can view own registrations"
  on public.competition_registrations for select
  using (auth.uid() = player_id);

create policy "Users can insert own registrations"
  on public.competition_registrations for insert
  with check (auth.uid() = player_id);

create policy "Users can update own registrations"
  on public.competition_registrations for update
  using (auth.uid() = player_id);

create policy "Admins can view all registrations"
  on public.competition_registrations for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create index if not exists idx_competition_registrations_player
  on public.competition_registrations (player_id);

create index if not exists idx_competition_registrations_competition
  on public.competition_registrations (competition_id);
