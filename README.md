# Endfield Architect

A multi-site AIC factory production planner for Arknights: Endfield. Enter production goals, the solver calculates facility counts and raw material requirements, and the results tree shows the full production chain.

## Quick start

**Read the AI context docs first** (for anyone working on this codebase):

```
docs/ai/01-meta.yaml       — Project identity and operating rules
docs/ai/02-system.yaml    — System map and key rules
docs/ai/03-structure.yaml — Repo layout and ownership
docs/ai/04-memory.yaml    — Active risks and open debt
docs/ai/05-update-tracker.md — Change log
```

## Running

```bash
npm install
npm run dev
```

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | ESLint |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Vitest CI mode |
| `npm run preview` | Preview production build |
