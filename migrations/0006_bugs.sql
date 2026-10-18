create table if not exists bug_reports (
  id text primary key,
  user_id text,
  email text not null default '',
  page text not null default '',
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists bug_reports_created on bug_reports (created_at desc);
