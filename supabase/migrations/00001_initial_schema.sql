-- Initial Schema for Tennis Ladder App

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Custom Types
create type user_role as enum ('admin', 'player');
create type match_status as enum ('scheduled', 'played', 'disputed', 'confirmed');
create type competition_type as enum ('single_winter', 'single_summer', 'double_winter', 'double_summer');

-- 2. Profiles (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role user_role default 'player' not null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  address text,
  birth_date date,
  preferences jsonb default '{"preferred_days": [], "preferred_times": []}'::jsonb,
  avatar_url text,
  stripe_customer_id text,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Competitions
create table public.competitions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type competition_type not null,
  season_year int not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Poules
create table public.poules (
  id uuid default uuid_generate_v4() primary key,
  competition_id uuid references public.competitions on delete cascade not null,
  name text not null, -- e.g. "Poule 1", "Poule 2"
  level int not null, -- 1 is highest
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Players in Poules (Many-to-Many with standings)
create table public.poule_players (
  id uuid default uuid_generate_v4() primary key,
  poule_id uuid references public.poules on delete cascade not null,
  player_id uuid references public.profiles on delete cascade not null,
  position int not null, -- 1 to 8 usually
  matches_played int default 0,
  matches_won int default 0,
  matches_lost int default 0,
  sets_won int default 0,
  sets_lost int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(poule_id, player_id)
);

-- 6. Matches
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  poule_id uuid references public.poules on delete cascade not null,
  player1_id uuid references public.profiles on delete cascade not null,
  player2_id uuid references public.profiles on delete cascade not null,
  scheduled_date timestamp with time zone,
  location text,
  deadline date not null,
  status match_status default 'scheduled' not null,
  winner_id uuid references public.profiles(id),
  score_player1 text, -- e.g., "6-4, 4-6, 10-7"
  score_player2 text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Chat Rooms & Messages
create table public.chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches on delete cascade not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text not null,
  message_type text default 'text', -- 'text', 'image', 'location'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  message text not null,
  type text not null, -- 'match_reminder', 'score_entered', etc.
  is_read boolean default false,
  link_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS (Row Level Security)

-- Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Matches
alter table public.matches enable row level security;
create policy "Matches are viewable by everyone" on public.matches for select using (true);
create policy "Players can update their own matches" on public.matches for update using (auth.uid() = player1_id or auth.uid() = player2_id);
create policy "Admins can manage matches" on public.matches using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Messages
alter table public.messages enable row level security;
create policy "Users can view messages in their rooms" on public.messages for select using (
  exists (
    select 1 from public.chat_rooms cr
    join public.matches m on cr.match_id = m.id
    where cr.id = messages.room_id
    and (m.player1_id = auth.uid() or m.player2_id = auth.uid())
  )
);
create policy "Users can insert messages in their rooms" on public.messages for insert with check (
  exists (
    select 1 from public.chat_rooms cr
    join public.matches m on cr.match_id = m.id
    where cr.id = messages.room_id
    and (m.player1_id = auth.uid() or m.player2_id = auth.uid())
  )
);
create policy "Admins can view all messages" on public.messages for select using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Competitions (Enable RLS for security)
alter table public.competitions enable row level security;
create policy "Competitions are viewable by everyone" on public.competitions for select using (true);
create policy "Admins can manage competitions" on public.competitions using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Poules
alter table public.poules enable row level security;
create policy "Poules are viewable by everyone" on public.poules for select using (true);
create policy "Admins can manage poules" on public.poules using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Poule Players
alter table public.poule_players enable row level security;
create policy "Poule standings are viewable by everyone" on public.poule_players for select using (true);
create policy "Admins can manage poule standings" on public.poule_players using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_match_updated
  before update on public.matches
  for each row execute procedure public.handle_updated_at();

-- Trigger to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.email,
    case when lower(new.email) = 'tijs.peetermans@neuritas-ai.com' then 'admin'::user_role else 'player'::user_role end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
