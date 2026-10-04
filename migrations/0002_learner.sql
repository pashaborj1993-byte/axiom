-- Per-user learning record. Placement, crowns, and campaigns belong to the
-- signed-in user. Progress columns are updated after placement; level and
-- placed-out lessons are written only by the placement function.

create table if not exists learner_profiles (
  user_id text primary key,
  display_name text not null default '',
  level text not null,
  placement_score integer not null,
  placement_total integer not null,
  daily_goal integer not null default 50,
  sound boolean not null default true,
  xp integer not null default 0,
  today_xp integer not null default 0,
  today_date text not null default '',
  streak integer not null default 0,
  longest_streak integer not null default 0,
  last_practice_date text,
  hearts integer not null default 5,
  heart_updated_at bigint not null default 0,
  gems integer not null default 0,
  shields integer not null default 0,
  grace integer not null default 0,
  correct_count integer not null default 0,
  attempt_count integer not null default 0,
  perfect_lessons integer not null default 0,
  crowns text not null default '{}',
  mistakes text not null default '[]',
  placed text not null default '{}',
  campaigns text not null default '{}',
  updated_at timestamptz not null default now()
);
