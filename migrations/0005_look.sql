alter table learner_profiles add column if not exists locale text not null default 'en';
alter table learner_profiles add column if not exists theme text not null default 'lagoon';
