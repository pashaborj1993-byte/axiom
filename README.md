# Axiom

Daily practice for how AI works. Short lessons sit on a winding path, a placement quiz picks where you start, and an account keeps the streak.

Quill, a pine bird in a paper cap, walks the path with you.

## What you do

1. Create an account with email and password.
2. Answer twelve placement questions. The score chooses a beginner, intermediate, or advanced start and places you past the lessons you already know.
3. Walk the path. Each node is a short lesson. Bonus nodes are campaigns.
4. Practice mistakes again, or open your profile for the streak, hearts, and settings.

Hearts limit careless answers. Beginners get a few free misses before hearts start. XP, gems, crowns, and streak shields are the rest of the loop. Progress is saved on the signed-in account.

A company can open a workspace from the You tab. The owner shares an invite code. Admins open the desk to see who has signed up, which track they are on, and a record of joins, role changes, and placements. The same desk edits the SQL bank: lesson questions, sponsor cards, and field notes.

Field notes are dated claims with an https source. The lessons teach mechanisms that stay true when a product name changes. When a fact about a model, a price, or a law changes, publish a note and retire the old one. The app does not invent a news ticker.

The same site installs on a phone. On iPhone, use Safari’s Share menu and Add to Home Screen. On Android, Chrome can install it. It stays online either way: progress, ads, and notes come from the account.

Quill, Pip, Lumen, or Dot can walk the path. A daily bonus and a sponsor card, both editable, sit on top of the lessons.

## Curriculum

Eight units, from the first definition to the decision not to ship:

| Unit | What it covers |
| --- | --- |
| Foundations | What AI is, narrow tools, datasets, and products you already use |
| Learning | Supervision, rewards, train and test, loss, and bias in the pile |
| Networks | Weights, layers, embeddings, transformers, and attention |
| Language | Tokens, sampling, context windows, and who is speaking in a prompt |
| Craft | Specs, checking drafts, cost, retrieval, and tools |
| Judgment | Evals, privacy, credit, safety, and when to refuse |
| Workshop | Guardrails, human review, drift, and a shipping list |
| Frontier | Scale, adapters, multimodal models, longer thinking, and open weights |

Lessons use five exercise types: multiple choice, true or false, fill-in, matching, and ordering. Every answer has a short explanation. New lessons open with a note from Quill. A run of right answers shows up as a streak inside the round.

Twelve placement questions choose a beginner, intermediate, or advanced start. Campaigns sit off the path: word camp, spot-the-model, a holdout dare, the weekend lab, chests, a streak shield, bench day, and a legendary last call. They pay gems and XP. Some grant a streak shield.

## Stack

- React 19, TanStack Start, Tailwind CSS 4
- Zustand for the learning loop, then a debounced save to the server
- Better Auth for email and password
- Postgres when `DATABASE_URL` is set, otherwise [PGLite](https://pglite.dev) in the app process

Google and X sign-in appear only when the auth broker for this deployment is configured. Locally, email and password is the path that works out of the box.

## Run it

```bash
npm install
npm run dev
```

The dev server listens on port 8080. Open it, create an account, and take the placement quiz.

To use a real database:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/axiom npm run dev
```

Migrations run as part of `npm run build`, or on their own with `npm run db:migrate`.

## Layout

```
src/routes/          sign-in, home, lesson, auth API
src/components/      path, placement, lesson player, profile, Quill
src/data/            units, placement questions, campaigns
src/lib/progress.ts  hearts, streak, XP, and the sync to the server
src/lib/auth/        sessions and the sign-in gate
migrations/          account tables and learner_profiles
public/quill/        Quill's poses
```

`learner_profiles` is one row per user. Crowns, mistakes, placed-out lessons, and campaign progress are stored as JSON text.

## Pipeline

Every push to `main`, and every pull request, runs typecheck, tests, and a production build. A green build is what ships.

Production deploy from GitHub runs after that, on `main` only, when these repository secrets exist:

| Secret | Where it comes from |
| --- | --- |
| `VERCEL_TOKEN` | A Vercel token with deploy access |
| `VERCEL_ORG_ID` | The team or user id from the project settings |
| `VERCEL_PROJECT_ID` | The project id |

Without those secrets the checks still run, and the deploy step waits. Migrations apply during the build only when `DATABASE_URL` is set.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run typecheck` | Typecheck |
| `npm run build` | Production build, then migrations |
| `npm test` | Unit tests |
| `npm run lint` | Lint |
