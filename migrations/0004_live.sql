-- A character, a once-a-day bonus, a question bank the desk can edit,
-- sponsor slots, and dated field notes. Notes are claims with a source,
-- not a ticker of unsourced headlines.

alter table learner_profiles add column if not exists character text not null default 'quill';
alter table learner_profiles add column if not exists bonus_date text not null default '';

create table if not exists question_bank (
  id text primary key,
  lesson_id text not null,
  position integer not null,
  kind text not null,
  prompt text not null,
  payload text not null default '{}',
  answer text not null default '',
  explain text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists question_bank_lesson on question_bank (lesson_id, position);

create table if not exists house_ads (
  id text primary key,
  title text not null,
  body text not null,
  placement text not null,
  reward_hearts integer not null default 0,
  reward_gems integer not null default 0,
  reward_xp integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists ad_claims (
  user_id text not null,
  ad_id text not null,
  claimed_on text not null,
  primary key (user_id, ad_id, claimed_on)
);

create table if not exists field_notes (
  id text primary key,
  title text not null,
  summary text not null,
  source_name text not null,
  source_url text not null,
  published_on text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists field_notes_active on field_notes (active, published_on desc);

insert into house_ads (id, title, body, placement, reward_hearts, reward_gems, reward_xp, active)
values
  (
    'heart-refill',
    'A sponsor can refill a heart',
    'This card is an ad slot you control. Rewrite it, or turn it off, from the desk. Claiming it returns one heart, once a day.',
    'hearts',
    1, 0, 0, true
  ),
  (
    'lesson-gem',
    'A sponsor can leave a gem',
    'Shown after a lesson. The reward is paid once a day. Say who paid for the card, in the title.',
    'lesson_end',
    0, 5, 0, true
  )
on conflict (id) do nothing;

insert into field_notes (id, title, summary, source_name, source_url, published_on, active)
values (
  'nist-rmf',
  'Risk is a checklist, not a vibe',
  'NIST''s AI Risk Management Framework is a public guide for mapping, measuring, and managing AI risk. It does not name a winning model. When a product fact changes, add a new note with the vendor''s own page as the source, and retire the old one.',
  'NIST',
  'https://www.nist.gov/itl/ai-risk-management-framework',
  '2023-01-26',
  true
)
on conflict (id) do nothing;
