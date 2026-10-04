# Axiom

Daily practice for how AI works. A path of short lessons, a placement quiz that picks your starting point, bonus campaigns, and an account that keeps your streak.

Quill, a pine bird in a paper cap, walks the path with you.

## What you practice

Six units: Foundations, Learning, Networks, Language, Craft, and Judgment. Eight placement questions choose a beginner, intermediate, or advanced start. Hearts, XP, gems, crowns, and streak shields keep the habit.

## Stack

- React 19, TanStack Start, and Tailwind CSS 4
- Zustand for the learning loop
- Better Auth for email and password (Google and X sign-in when those providers are configured)
- Postgres in production, PGLite when no database URL is set

## Run it

```bash
npm install
npm run dev
```

The dev server listens on port 8080. Create an account, take the placement quiz, and start the next lesson on the path.

Set `DATABASE_URL` when you want a real Postgres database. Auth provider secrets stay in the environment, not in this repo.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app |
| `npm run typecheck` | Typecheck |
| `npm run build` | Production build and migrations |
| `npm test` | Unit tests |
| `npm run lint` | Lint |
