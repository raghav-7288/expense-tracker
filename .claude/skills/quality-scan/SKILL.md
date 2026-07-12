# Quality Scan Skill

> Reusable project-wide quality inspection, diagnosis, and automated improvement procedure.
> Invoke this skill to perform a full quality audit and actively fix issues across the codebase.

## Overview

This skill performs a comprehensive quality audit of the expense-tracker codebase:

- **Static analysis** — ESLint errors/warnings, TypeScript type errors
- **Test execution** — unit/integration test pass/fail status
- **Coverage analysis** — statement, branch, function, and line coverage per file
- **Dependency health** — outdated or vulnerable packages
- **Build verification** — Vite production build integrity
- **Logic inspection** — dead code, unreachable branches, missing error handling
- **Accessibility** — detectable a11y issues via static checks
- **Pattern consistency** — anti-patterns, fragile code, inconsistent conventions

## Quick Commands

```bash
# Run everything in one pass (use this for a quick health check)
npm run lint && npm run build && npm run test:coverage

# Individual checks
npx eslint .                              # Lint
npx tsc --noEmit -p tsconfig.app.json     # Type-check app
npx tsc --noEmit -p tests/tsconfig.json   # Type-check tests
npx vitest run                            # Tests only
npx vitest run --coverage                 # Tests + coverage
npm run build                             # Production build
npm audit --audit-level=moderate          # Dependency security
```

---

## Execution Steps

### Step 1: Run All Automated Checks

Execute in order (stop on critical failures):

```bash
# 1. ESLint (errors + warnings)
npx eslint .

# 2. TypeScript type-check (app code)
npx tsc --noEmit -p tsconfig.app.json

# 3. TypeScript type-check (test code)
npx tsc --noEmit -p tests/tsconfig.json

# 4. Unit/integration tests with coverage
npx vitest run --coverage

# 5. Production build (catches import issues, tree-shaking problems)
npx vite build

# 6. Dependency audit (optional, skip if offline)
npm audit --audit-level=moderate 2>/dev/null || true
```

### Step 2: Parse and Categorize Results

From Step 1 output, extract:

| Source | What to Look For |
|--------|-----------------|
| ESLint | Errors (must fix), warnings (evaluate), rule names |
| TypeScript | Error codes (TS2304, TS6133, etc.), file locations |
| Vitest | Failed test names, assertion errors, timeout issues |
| Coverage | Files with <80% in any metric (stmts/branch/func/lines) |
| Build | Module resolution failures, circular dependencies |
| Audit | Critical/high severity CVEs |

### Step 3: Classify Issues by Severity

| Severity | Criteria | Action |
|----------|----------|--------|
| **🔴 Critical** | Test failures, type errors that block build, runtime crashes, security vulnerabilities | Fix immediately |
| **🟠 High** | ESLint errors, missing error handling in services/hooks, uncovered critical paths (auth, payments) | Fix in this pass |
| **🟡 Medium** | Coverage <60% in meaningful files, ESLint warnings, unused exports, dead code | Fix if time permits |
| **🔵 Low** | Coverage <80% in UI-only files, style warnings, minor code smells | Document, fix later |

### Step 4: Fix Issues (Priority Order)

#### 4.1 Critical — Type Errors
- Always fix. They block `npm run build`.
- Common causes: missing imports, wrong generic params, `any` leaking.

#### 4.2 Critical — Test Failures
- Read the failing assertion carefully.
- Determine root cause:
  - **Production bug?** → Fix the source code (minimal, safe change).
  - **Stale test?** → Update the test to match current correct behavior.
  - **Flaky test?** → Add `waitFor`, fix timing issues, remove non-determinism.

#### 4.3 High — ESLint Errors
- Unused imports → delete them.
- `let` that should be `const` → change to `const`.
- Missing return types → add explicit types.
- `no-unused-vars` → remove or prefix with `_`.

#### 4.4 High — Missing Error Handling
Scan these patterns in source:
```typescript
// BAD: Ignoring error from service
const { data } = await someService();

// GOOD: Handle the error
const { data, error } = await someService();
if (error) throw new Error(error.message);
```

#### 4.5 Medium — Coverage Gaps
- Read uncovered lines from the coverage report.
- Read the source to understand what those lines do.
- Write targeted tests (see Coverage Improvement Strategy below).

### Step 5: Coverage Improvement Strategy

#### Approach
1. Get the uncovered line numbers from `npx vitest run --coverage` output
2. Read the source file at those lines
3. Determine what user behavior would trigger those lines
4. Write a test that simulates that behavior

#### Priority Order for Coverage
1. **Services** → must be 100% (they're pure async functions)
2. **Utilities** → must be 100% (pure functions)
3. **Hooks** → 90%+ (mock services, test success/error/loading)
4. **UI Components** → 95%+ (render, interact, assert)
5. **Pages** → 80%+ (mock hooks, test rendering and interactions)
6. **Layouts** → 75%+ (test routing logic and navigation)

#### Test Writing Rules
- **DO** test user-visible behavior (text, roles, interactions)
- **DO** test error states and loading states
- **DO** test form validation messages
- **DO** use `renderWithProviders` from `src/test/test-utils.tsx`
- **DO** use factories from `src/test/factories.ts`
- **DON'T** test implementation details (internal state, private methods)
- **DON'T** use snapshot tests
- **DON'T** make real network calls
- **DON'T** depend on execution order between tests

#### Mock Patterns
```typescript
// Mock a hook at page level (when testing page orchestration)
vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: vi.fn(),
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Mock a service at hook level (when testing hook logic)
vi.mock('@/services/transactions', () => ({
  getTransactions: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

// Mock supabase at service level (when testing service logic)
vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn(() => chainMock) },
}));
```

### Step 6: Static Logic Inspection

Manually scan for these patterns:

#### Dead Code
```bash
# Find unused exports
grep -r "export " src/ --include="*.ts" --include="*.tsx" | \
  while read line; do
    symbol=$(echo "$line" | grep -oP 'export (function|const|class|type|interface) \K\w+')
    if [ -n "$symbol" ]; then
      count=$(grep -r "$symbol" src/ --include="*.ts" --include="*.tsx" | wc -l)
      [ "$count" -le 1 ] && echo "Possibly unused: $line"
    fi
  done
```

#### Missing Error Boundaries
- Every page should be wrapped in `<ErrorBoundary>` or have error states
- Check that TanStack Query `isError` states render `<ErrorState />`

#### Accessibility Checks
- All `<button>` elements should have accessible text or `aria-label`
- All `<input>` elements should have associated `<label>` or `aria-label`
- All `<img>` tags should have `alt` text
- All interactive elements should be keyboard-accessible
- Modal focus trapping should be present

#### Runtime Risk Areas
- Unhandled promise rejections in event handlers
- Array index access without null checks (with `noUncheckedIndexedAccess`)
- Division by zero in percentage calculations
- Date parsing without validation

### Step 7: Rerun and Verify

After all fixes:
```bash
npx eslint .
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p tests/tsconfig.json
npx vitest run --coverage
npx vite build
```

**Iterate Steps 4–7 until all gates pass:**
- ✅ 0 ESLint errors
- ✅ 0 TypeScript errors
- ✅ All tests pass
- ✅ Coverage meets targets (see table below)
- ✅ Build succeeds

### Step 8: Final Report

Output a structured report:

```markdown
## Quality Scan Report — [Date]

### Checks Passed
| Check | Status |
|-------|--------|
| ESLint | ✅ 0 errors, N warnings |
| TypeScript (app) | ✅ |
| TypeScript (tests) | ✅ |
| Tests | ✅ N passing, 0 failing |
| Coverage | ✅ X% stmts, X% branch, X% func, X% lines |
| Build | ✅ |

### Issues Found
#### 🔴 Critical
- (none / list)
#### 🟠 High
- (none / list)
#### 🟡 Medium
- (none / list)
#### 🔵 Low
- (none / list)

### Fixes Applied
- file: change description
- ...

### Tests Added/Updated
- file: N new tests (covering X)
- ...

### Coverage Delta
| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Statements | X% | Y% | +Z% |
| Branches | X% | Y% | +Z% |
| Functions | X% | Y% | +Z% |
| Lines | X% | Y% | +Z% |

### Remaining Acceptable Gaps
- file:line — reason it can't be covered
- ...
```

---

## File Locations

| Artifact | Path |
|----------|------|
| Source code | `src/**/*.{ts,tsx}` |
| Test files | `tests/**/*.test.{ts,tsx}` |
| Test setup | `src/test/setup.ts` |
| Test utilities | `src/test/test-utils.tsx` |
| Test factories | `src/test/factories.ts` |
| Supabase mocks | `src/test/mocks/supabase.ts` |
| Vitest config | `vite.config.ts` → `test` block |
| ESLint config | `eslint.config.js` |
| TS app config | `tsconfig.app.json` |
| TS test config | `tests/tsconfig.json` |
| Coverage output | `coverage/` |
| Build output | `dist/` |

---

## Test Patterns & Examples

### Component Test
```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    renderWithProviders(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<MyComponent onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Test');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test' }));
    });
  });
});
```

### Hook Test
```tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useMyHook } from '@/hooks/useMyHook';

const mockService = vi.fn();
vi.mock('@/services/myService', () => ({
  myServiceFn: (...args) => mockService(...args),
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  const authValue = createMockAuth();
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

describe('useMyHook', () => {
  it('fetches data on mount', async () => {
    mockService.mockResolvedValue({ data: [{ id: '1' }], error: null });
    const { result } = renderHook(() => useMyHook(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('handles error', async () => {
    mockService.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useMyHook(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### Service Test
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myServiceFn } from '@/services/myService';

let mockChain: Record<string, unknown>;

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn(() => mockChain) },
}));

describe('myServiceFn', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns data on success', async () => {
    mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
    };
    const result = await myServiceFn('1');
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
  });

  it('returns error on failure', async () => {
    mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    };
    const result = await myServiceFn('bad-id');
    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'Not found' });
  });
});
```

---

## Coverage Targets

| Category | Target | Rationale |
|----------|--------|-----------|
| Utilities (`src/utils/`) | 100% | Pure functions, no excuses |
| Services (`src/services/`) | 100% | Critical data layer |
| Hooks (`src/hooks/`) | 90%+ | Business logic layer |
| UI Components (`src/components/ui/`) | 95%+ | Reusable building blocks |
| Feature Components | 80%+ | Complex interactions |
| Pages | 75%+ | Thin orchestration layers |
| Layouts | 70%+ | Routing/navigation logic |
| Context Providers | 85%+ | App-wide state |

---

## Known Acceptable Gaps

These items are documented exceptions — do NOT spend time trying to cover them:

| File | Line(s) | Reason |
|------|---------|--------|
| `src/lib/supabase.ts` | 7 | Env var throw guard executes at import-time; can't be tested without module reload |
| `src/main.tsx` | all | Entry point, excluded from coverage config |
| `DashboardLayout.tsx` | 93-128 | Mobile sidebar toggle + responsive behavior requires viewport simulation |
| `CategoryForm.tsx` | 48 | React Hook Form `watch()` — ESLint `react-hooks/incompatible-library` warning is expected |
| `TransactionForm.tsx` | 53 | Same as above — RHF `watch()` pattern |
| `formatDate.ts` | 19-29 | `?? ''` fallback branch after `.split('T')[0]` — `toISOString()` always produces `T`, so the nullish branch is unreachable by design |

---

## Anti-Patterns to Flag

When inspecting code, look for and report these:

| Pattern | Problem | Fix |
|---------|---------|-----|
| `as any` | Type safety bypass | Use proper generics or `unknown` + narrowing |
| `// @ts-ignore` | Hiding type errors | Fix the underlying type issue |
| `eslint-disable` without reason | Hiding lint issues | Add explanatory comment or fix the issue |
| `useEffect` with missing deps | Stale closures | Add all dependencies or use `useCallback` |
| `console.log` in production code | Debug leak | Remove or replace with proper logging |
| Inline styles (`style={{}}`) | Inconsistent with Tailwind | Use Tailwind utility classes |
| `setTimeout` in tests | Flaky timing | Use `waitFor` or `vi.useFakeTimers()` |
| Hardcoded strings for routes | Fragile | Use constants |
| Direct `fetch()` calls | Bypasses Supabase client | Use the `supabase` client |
| Empty `catch` blocks | Swallowed errors | At minimum log, ideally handle |

---

## Dependency Health Checks

```bash
# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Check bundle size impact (requires build)
npx vite build && du -sh dist/
```

When vulnerabilities are found:
- **Critical/High CVE**: Update immediately if compatible
- **Moderate**: Update in next maintenance window
- **Low**: Document, update when convenient

---

## When to Run This Skill

| Trigger | Scope |
|---------|-------|
| Before merging PRs | Full scan |
| After adding new files | Targeted scan on new + related files |
| After major refactors | Full scan |
| Test failures in CI | Diagnose and fix |
| Periodic maintenance (weekly) | Full scan |
| Coverage drops below 85% | Coverage-focused scan |
| Dependency update | Build + test verification |
| New team member onboarding | Run as demo of quality standards |
