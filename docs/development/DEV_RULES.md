# Development Rules

Last updated: 2026-05-14

## Project Baseline

- Next.js App Router is the application framework.
- TypeScript is required.
- TailwindCSS is the styling baseline.
- `src/` is the source root.
- `docs/` remains the planning and architecture source of truth.
- Admin MVP is route-only at this stage; CRUD is not implemented yet.

## Naming

- Keep Supabase table and column names in `snake_case`.
- Keep API payload fields aligned with database names unless a mapper is explicitly documented.
- React component names use `PascalCase`.
- Local TypeScript variables may use `camelCase`.

## Data Access

- Supabase client setup lives in `src/lib/supabase`.
- Do not write raw Supabase queries in shared UI components.
- Prefer server-side actions or route handlers for future writes.
- Do not expose service role keys to browser code.

## Forms and Validation

- Use React Hook Form for form state.
- Use Zod for input validation.
- Keep form schemas near the feature they validate or in `src/lib/validations` if shared.

## State

- Use Zustand only for client UI state.
- Do not use Zustand as a server data cache.
- Keep server data fetching in server components, route handlers, or dedicated data modules.

## Testing

- Use Playwright for E2E tests.
- E2E tests live under `tests/e2e`.
- Start with route smoke tests before writing workflow tests.

## Formatting

- Use Prettier for formatting.
- Use ESLint for code checks.
- Run `npm run lint`, `npm run typecheck`, and `npm run format:check` before handoff when practical.
