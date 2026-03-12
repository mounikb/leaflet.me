-- Profiles table
create table profiles (
  id uuid references auth.users primary key,
  username text unique,
  bio text,
  topics text[],
  onboarded boolean default false,
  created_at timestamp default now()
);

-- Cards table
create table cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  title text,
  content text,
  topic text,
  image_url text,
  created_at timestamp default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table cards enable row level security;

-- Profile policies
create policy "Profiles are publicly readable"
on profiles for select using (true);

create policy "Users can insert their own profile"
on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
on profiles for update using (auth.uid() = id);

-- Card policies
create policy "Cards are publicly readable"
on cards for select using (true);

create policy "Users can insert their own cards"
on cards for insert with check (auth.uid() = user_id);

create policy "Users can update their own cards"
on cards for update using (auth.uid() = user_id);