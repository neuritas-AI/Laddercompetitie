-- Migration 020: multi-period winter competitions
--
-- Winter competitions can consist of multiple periods (default 3), each with
-- its own start/end date. After a period ends, the top 2 of every poule get
-- promoted a level, the bottom 2 get demoted a level, and a fresh set of
-- matches is generated for the next period. Summer competitions keep working
-- exactly as before — they simply get a single period spanning their whole
-- start/end date range.

create table if not exists public.competition_periods (
  id uuid default uuid_generate_v4() primary key,
  competition_id uuid references public.competitions on delete cascade not null,
  period_number int not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending', -- pending | active | completed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(competition_id, period_number)
);

create index if not exists idx_competition_periods_competition_id on public.competition_periods (competition_id);

alter table public.competition_periods enable row level security;

create policy "Competition periods are viewable by everyone" on public.competition_periods
  for select using (true);

create policy "Admins manage competition periods" on public.competition_periods
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Tag matches with the period they belong to so standings and "have these two
-- already played this period" checks can be scoped per period instead of
-- bleeding across a competition's whole history. Nullable: existing matches
-- and anything generated outside the period flow are simply period-less.
alter table public.matches
  add column if not exists period_id uuid references public.competition_periods on delete set null;

create index if not exists idx_matches_period_id on public.matches (period_id);

SELECT 'competition_periods aangemaakt' AS status;
