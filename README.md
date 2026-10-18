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

The same site installs on a phone home screen and opens full screen. On iPhone or iPad, use Safari: Share, then Add to Home Screen. On Android, use Chrome: menu, then Install app. That does not require an Apple or Google developer account. A listing in the App Store is a separate step (Apple Developer Program, 99 USD a year). Google Play is a one-time 25 USD fee. Neither store is required for the home-screen app.

## Where the data lives

While you are trying it here, accounts sit in an in-memory Postgres (PGLite) inside the server process. It is not a file on disk. Restarting the server wipes it.

When the app is published, `deploy.database` is on, so the host sets `DATABASE_URL` and the same tables move to hosted Postgres (Neon). Questions, field notes, ads, and learner rows are in that database. The desk is how you edit them. You only need a connection string if you want a SQL client; the app does not ship a separate admin console for raw tables.

To point a copy at your own Postgres:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/axiom npm run dev
```

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

Migrations run as part of `npm run build`, or on their own with `npm run db:migrate`.

## What you pay for

You do not need a paid service to practice in the preview. That database resets.

To keep real accounts online:

| Service | Why | Required? |
|---|---|---|
| This app's publish host, with the database flag already on | Serves the site and attaches Postgres | Yes, for a lasting deployment |
| Neon, or any Postgres, if you host it yourself | The `DATABASE_URL` the app already uses | Only if you are not using the included database |
| A domain name | A stable address for the home-screen icon | Optional |
| Apple Developer Program, 99 USD a year | App Store listing | No. Home Screen install does not need it |
| Google Play Console, 25 USD once | Play Store listing | No. Chrome install does not need it |
| An ad network such as AdSense or AdMob | Real paid ads from other companies | No. The sponsor cards in the desk are yours to write |
| An email sender such as Resend | Password-reset mail | Not yet. Sign-in is email and password stored in the database |

Google and X sign-in appear only when the auth broker for this deployment is configured. Locally, email and password is the path that works.

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

## How this runs

The live site is [https://palm-brick-terra-lilac.grok.me](https://palm-brick-terra-lilac.grok.me). Accounts and lessons are stored in the Postgres database that comes with that site. You do not rent a separate server. A new migration in `migrations/` is applied the next time the site is published.

The phone apps open that same address. The bundle id is `app.axiom.learn`.

Signed-in people report a problem from the You tab. An owner or admin reads it on `/admin`, under Problems. Fix it in this repository, push to `main`, and let the checks pass. Then publish again so the live site picks up the fix, and mark the report fixed.

Play Console is a one-time 25 USD fee. Open `android/` in Android Studio, sign the bundle, and upload it. The Apple Developer Program is 99 USD a year, and the iOS build has to be made on a Mac from the `ios/` folder. Set the price in those consoles. `/privacy` and account deletion are already in the app.

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
| `npm run mobile:sync` | Copy the phone shell into the Android and iOS projects |
| `npm run lint` | Lint |
