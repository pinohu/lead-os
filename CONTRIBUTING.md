# Contributing to Lead OS

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- PostgreSQL 15 or later (optional, only needed for database features)
- Git

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/pinohu/lead-os.git
   cd lead-os
   cd lead-os-hosted-runtime-wt-hybrid
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Copy the environment template and configure:

   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## Branch Naming

Create branches from `master` using the following prefixes:

- `feature/` -- new functionality (e.g., `feature/add-stripe-webhooks`)
- `fix/` -- bug fixes (e.g., `fix/campaign-status-update`)
- `chore/` -- maintenance, dependency updates (e.g., `chore/update-next-16`)
- `docs/` -- documentation changes (e.g., `docs/add-api-reference`)
- `refactor/` -- code restructuring without behavior changes

Keep branches short-lived. Merge within one to three days.

## Commit Message Format

Follow the Conventional Commits specification:

```
type(scope): subject

body (optional)

Closes #123
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

- Subject line: imperative mood, lowercase, no period, max 72 characters.
- Body: explain why the change was made, not what changed.

Examples:

```
feat(campaigns): add automated follow-up scheduling
fix(auth): prevent token refresh race condition
chore(deps): update next to 16.2.1
```

## Pull Request Process

1. Write a clear PR description explaining the motivation for the change.
2. Ensure all tests pass: `npm test`
3. Ensure types check: `npx tsc --noEmit`
4. Keep the diff under 400 lines when possible. Split larger changes into multiple PRs.
5. Request at least one review from a team member.
6. Address all review comments before merging.
7. Squash merge into `master`.

## Code Style

- Match existing patterns in the codebase. Read before writing.
- TypeScript strict mode is required. No `any` types.
- Use `zod` for input validation at system boundaries.
- One exported concept per file.
- Maximum function length: 40 lines. Extract helpers if longer.
- No debug prints, commented-out code, or unused imports.

## Testing Requirements

- Add tests for all new features and bug fixes.
- Use `node:test` with `assert/strict` for test files.
- Test behavior, not implementation details.
- All tests must pass before pushing: `npm test`
- Place test files in the `tests/` directory, mirroring the source structure.

## Reporting Issues

Use the GitHub issue templates:

- **Bug reports**: Include steps to reproduce, expected behavior, actual behavior, and environment details.
- **Feature requests**: Describe the use case, proposed solution, and any alternatives considered.

Search existing issues before creating a new one to avoid duplicates.
