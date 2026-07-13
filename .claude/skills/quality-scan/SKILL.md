# Quality Scan Skill

> Reusable project-wide quality inspection and repair procedure for the expense-tracker codebase.
> Use this skill to detect, diagnose, and fix code quality issues across the repository.

## Purpose

Perform a full repository quality audit covering:

* Static analysis: ESLint and TypeScript
* Tests: unit and integration
* Coverage: statements, branches, functions, and lines
* Build integrity: production build verification
* Dependency health: outdated and vulnerable packages
* Logic risks: dead code, fragile patterns, missing error handling
* Accessibility: basic static a11y checks

## Default Workflow

### 1) Detect the project setup

Identify:

* package manager
* test framework
* lint config
* TypeScript configs
* coverage config
* build command

### 2) Run automated checks

Run these in order:

```bash
npm run lint
npm run build
npm run test:coverage
```

If the project does not define one of those scripts, fall back to the matching direct command:

```bash
npx eslint .
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p tests/tsconfig.json
npx vitest run --coverage
npm audit --audit-level=moderate
```

### 3) Collect issues

For every problem, record:

* file path
* line number if available
* category: test, type, lint, coverage, build, dependency, logic, or accessibility
* root cause
* minimal safe fix

### 4) Fix issues in priority order

Priority:

1. build blockers
2. test failures
3. TypeScript errors
4. ESLint errors
5. critical coverage gaps
6. medium and low-priority cleanup

### 5) Re-run checks

After each set of fixes, rerun the relevant checks until the repo is clean or remaining issues are documented as acceptable exceptions.

## What to fix

### Tests

* Fix broken assertions, stale expectations, and flaky timing.
* Add targeted tests for uncovered critical paths.

### TypeScript

* Fix missing imports, incorrect types, unsafe `any`, and configuration mismatches.

### ESLint

* Remove unused imports and variables.
* Fix missing hook dependencies.
* Replace `let` with `const` when possible.
* Remove `eslint-disable` comments unless they are justified.

### Coverage

Focus first on:

* services
* utilities
* hooks
* feature components
* pages

Coverage targets:

* utilities: 100%
* services: 100%
* hooks: 90%+
* reusable UI components: 95%+
* feature components: 80%+
* pages: 75%+
* layouts: 70%+
* context providers: 85%+

### Accessibility

Check for:

* buttons with accessible names
* inputs with labels or aria-labels
* images with alt text
* keyboard-accessible interactions
* modal focus handling

### Dependency health

Check for:

```bash
npm outdated
npm audit --audit-level=moderate
```

Treat critical or high-severity security issues as high priority.

## Reporting format

Return a final report with:

* checks run
* pass/fail status
* issues found by severity
* fixes applied
* tests added or updated
* remaining acceptable gaps

## Acceptable exceptions

Do not spend time trying to cover or “fix” these unless something changed materially:

* import-time environment guards
* entry-point files excluded from coverage
* intentionally unreachable fallback branches
* framework-specific warnings already understood and accepted

## Rules

* Do not guess.
* Do not stop after the first failure.
* Do not report the same issue twice.
* Prefer minimal safe fixes.
* Keep the report structured and concise.
