# Architecture Decisions

## ADR-001: Client-Side SPA with Supabase

**Decision:** Build as a static SPA (no SSR/server functions). All data access goes through the Supabase JS client with RLS.

**Rationale:**
- Supabase RLS handles authorization at the database level — no need for a custom backend.
- Static SPA deploys trivially to Vercel with zero cold starts.
- Keeps infrastructure simple and free-tier friendly.

**Trade-offs:**
- No server-side rendering (SEO is not a concern for an authenticated app).
- Complex aggregations must happen client-side or via Supabase Edge Functions (future).

---

## ADR-002: Zustand over React Context for State

**Decision:** Use Zustand for global state management instead of React Context + useReducer.

**Rationale:**
- Zustand has less boilerplate than Context + reducers.
- No provider nesting — stores are standalone hooks.
- Built-in selectors prevent unnecessary re-renders.
- Middleware for persistence, devtools, and immer available when needed.

**Trade-offs:**
- Additional dependency (though it's tiny: ~1KB).

---

## ADR-003: Zod for Validation

**Decision:** Use Zod as the single source of truth for runtime validation. Derive TypeScript types from Zod schemas.

**Rationale:**
- Ensures runtime and compile-time types stay in sync.
- Rich validation API (regex, transforms, refinements).
- Works well with forms — `safeParse` returns structured errors.

---

## ADR-004: Tailwind CSS v4 (CSS-first config)

**Decision:** Use Tailwind v4 with the Vite plugin (`@tailwindcss/vite`). No `tailwind.config.js`.

**Rationale:**
- Tailwind v4 is CSS-first — custom theme tokens go in CSS `@theme` blocks.
- The Vite plugin provides zero-config integration and faster builds.
- No PostCSS config needed.

---

## ADR-005: Folder Structure

**Decision:** Organize by concern (components, services, stores, hooks, utils, engines) rather than by feature.

**Rationale:**
- At the current scale (3 tables, single-user app), feature folders would create excessive nesting.
- Concern-based folders make it easy to find patterns and enforce conventions.
- Can migrate to feature folders later if the app grows significantly.

---

## ADR-006: Service Layer Returns `{ data, error }`

**Decision:** Service functions never throw. They return `{ data, error }` matching the Supabase client pattern.

**Rationale:**
- Consistent with the Supabase JS client API.
- Forces callers to handle errors explicitly.
- Avoids scattered try/catch blocks.
- Makes error boundaries a last resort, not a primary error strategy.

