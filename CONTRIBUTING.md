# Contributing to ExpenseTracker

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

Be respectful and constructive. We welcome contributors of all experience levels.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/expense-tracker.git
   cd expense-tracker
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Set up** the environment — see [INSTALLATION.md](INSTALLATION.md)
5. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Locally

```bash
npm run dev          # Start dev server at localhost:5173
npm run lint         # Check for lint errors
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run build        # Verify production build
```

### Before Submitting

Ensure all checks pass:

```bash
npx tsc --noEmit     # 0 TypeScript errors
npx eslint .         # 0 ESLint errors
npm test             # All tests pass
npm run build        # Build succeeds
```

## Coding Standards

### TypeScript

- **Strict mode** is enabled — no `any` types
- Use `@/` path alias for imports from `src/`
- Derive types from Zod schemas with `z.infer<>`

### React Components

- Use **function declarations**, not arrow functions
- Place components in the appropriate directory:
  - `src/components/ui/` — reusable UI primitives
  - `src/components/pages/` — page-specific components
  - `src/pages/` — top-level page components

### Styling

- Use **Tailwind CSS v4** utility classes
- Use `clsx()` for conditional classes (imported from `@/utils/cn`)
- No inline styles or CSS modules

### State Management

- **React Query** for server state (data from Supabase)
- **Zustand** for client-side global state (one store per domain in `src/stores/`)
- **React context** for auth and theme only

### Services

- Services in `src/services/` return `{ data, error }` tuples — never throw
- Always pass `userId` for authorization checks
- Validate inputs before sending to Supabase

### Icons

- Use **Lucide React** for all icons
- Import individually: `import { Plus } from 'lucide-react'`

### Notifications

- Use **react-hot-toast** for transient user feedback
- `toast.success()` for success, `toast.error()` for errors

## Testing

- Tests live in `tests/` mirroring the `src/` structure
- Use `renderWithProviders()` from `@/test/test-utils` for component tests
- Use `buildTransaction()`, `buildCategory()`, etc. from `@/test/factories` for test data
- Mock Supabase calls — never hit a real database in tests

### Writing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## File You Must Not Modify

- **`vercel.json`** — This file must remain exactly as-is. Do not change install or build commands.

## Pull Request Process

1. Update or add tests for your changes
2. Ensure all checks pass (TypeScript, ESLint, tests, build)
3. Write a clear PR description explaining **what** and **why**
4. Link to any related issues
5. Request a review

### PR Title Format

```
feat: add budget goals feature
fix: correct transaction sorting by timestamp
docs: update deployment guide
test: add analytics hook tests
refactor: simplify category service
```

## Project Structure

| Directory | Purpose |
|---|---|
| `src/components/ui/` | Reusable UI primitives |
| `src/components/` | Feature-specific components |
| `src/hooks/` | Custom React hooks |
| `src/services/` | Supabase data access layer |
| `src/engines/` | Business logic (analytics) |
| `src/utils/` | Pure utility functions |
| `src/types/` | TypeScript type definitions |
| `src/stores/` | Zustand stores |
| `src/pages/` | Page components |
| `src/layouts/` | Layout components |
| `src/lib/` | Library configuration |
| `tests/` | Test files |

## Questions?

Open an issue with the **question** label if you need help or clarification.

