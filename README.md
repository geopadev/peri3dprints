# peri3dprints

Read `CLAUDE.md` before changing anything. It holds the stack decisions, design direction,
copy rules, and commit conventions for this repo.

## Requirements

- Node 20 or newer (developed on 22)
- npm 10 or newer
- A Supabase account with access to the linked project

## First run

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`. Values come from the Supabase dashboard (Settings > API), the Stripe
dashboard, and Resend. `.env.local` is gitignored and must stay that way.

```bash
npm run dev
```

The app serves on http://localhost:3000.

## Scripts

| Script              | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `npm run dev`       | Next dev server on port 3000                                   |
| `npm run build`     | Production build                                               |
| `npm start`         | Serve the production build, run `build` first                  |
| `npm run lint`      | ESLint over the repo                                           |
| `npm run typecheck` | `tsc --noEmit`, no emit, strict mode                           |
| `npm run format`    | Prettier write, sorts Tailwind classes                         |
| `npm run db:push`   | Push `supabase/migrations` to the linked Supabase project      |
| `npm run db:types`  | Regenerate `src/lib/database.types.ts` from the linked project |

Run `npm run typecheck` and `npm run lint` before every commit.

## Database

Migrations live in `supabase/migrations`. Create one with:

```bash
npx supabase migration new <name>
```

Apply them with `npm run db:push`, then regenerate types with `npm run db:types`.

**`db:push` writes to the linked project, which is currently `peri3dprints-prod`.** Check
`npx supabase projects list` and confirm the link before pushing. Point the CLI at a staging
project or a local stack (`npx supabase start`) if you are not certain.

Database types are generated, never hand written. Do not edit `src/lib/database.types.ts`.

## Layout

```
src/app                  routes, layouts, server actions
src/components/ui        shared primitives
src/components/shop      buyer facing components
src/components/admin     owner facing components
src/lib/supabase         browser, server, and admin clients
src/lib/shipping         ShippingProvider adapters
src/lib/payments         PaymentMethod adapters
src/lib/validation       zod schemas shared by forms and server actions
supabase/migrations      SQL migrations
```

Empty directories carry a `.gitkeep`. Delete it once the directory has real files.
