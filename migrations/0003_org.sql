-- A company workspace. One membership per person. Admins read the roster
-- and the audit log; owners also rotate the invite. Progress stays on
-- learner_profiles and is only joined in for the desk.

create table if not exists organizations (
  id text primary key,
  name text not null,
  slug text not null unique,
  invite_code text not null unique,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists org_members (
  org_id text not null references organizations (id) on delete cascade,
  user_id text not null unique,
  role text not null,
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists org_members_org on org_members (org_id);

create table if not exists audit_events (
  id text primary key,
  org_id text,
  actor_id text not null,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists audit_events_org on audit_events (org_id, created_at desc);
