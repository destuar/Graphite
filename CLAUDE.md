## Development Best Practices from Cursor Rules

### Code Quality Principles

- Write clean, simple, readable code with clear reasoning
- Implement features in the simplest possible way possible
- Keep files small and focused (<200 lines)
- Test after every meaningful change
- Use clear, consistent naming conventions
- ALWAYS ask follow-up questions to clarify requirements before coding
- Write modular, well-documented code with explanatory comments
- One abstraction layer per file - controllers call services, services call utils/db

### Error Handling Best Practices

- DO NOT JUMP TO CONCLUSIONS when debugging - consider multiple possible causes
- Make only minimal necessary changes when fixing issues
- Use structured logging with appropriate log levels (debug/info/warn/error)
- Implement proper error boundaries in React components
- Prefer async/await + try/catch patterns over promises

### Project-Specific Conventions

- Use explicit TypeScript types everywhere - `any` is banned
- Include LOTS of explanatory comments - document the "why" not just the "what"
- Follow feature-based directory structure in both backend and frontend
- All new code must include unit tests and pass lint checks

### File Organization Rules

- Backend services: Pure, reusable business logic (unit test these directly)
- Controllers: Thin request/response orchestration (keep business-logic free)
- Frontend: Feature-based structure for components/pages/contexts/hooks

## Additional Important Guidelines

### Code Quality Standards

- Backend: Jest with 70% coverage requirement
- Frontend: Vitest + React Testing Library with 70% coverage requirement
- Use ESLint and TypeScript strict mode
- Follow existing import patterns and project conventions
- Input validation should use Zod schemas

### Python Environment Management

- Python virtual environment is located at `backend/venv/`
- Requirements managed via `backend/requirements.txt`
- PydanticAI agents require proper Python environment setup
- Use `npm run ops:health` to check agent status

### Security Requirements

- JWT-based authentication with access/refresh tokens
- Company-level data isolation enforced at database level
- Rate limiting on all public endpoints
- Helmet.js for security headers
- Never commit API keys or secrets
- AWS Secrets Manager integration for database credentials

# Critical Behavior Guidelines

These are non-negotiable rules for working in this codebase:

## Task Execution Rules
- **Scope Discipline**: Do exactly what has been asked; nothing more, nothing less
- **File Creation**: NEVER create files unless absolutely necessary for your goal
- **File Preference**: ALWAYS prefer editing existing files over creating new ones
- **Documentation**: NEVER proactively create documentation files (*.md) or README files unless explicitly requested

## Safety-Critical Database Rules
- **NEVER run migrations** on shared/live databases - use SQL patches via AWS Secrets wrapper
- **ALWAYS validate** database changes with idempotent SQL statements
- **ALWAYS run** `npm run generate` after schema changes
- **Local development exception**: You MAY use `migrate:dev` only on disposable local databases

## Code Quality Requirements  
- **Always run tests** before considering work complete (`npm test` for full suite)
- **Always check linting** with `npm run lint:all` (covers TypeScript + Python)
- **Always use Python environment** via `./start.sh` for backend development
- **Always validate Docker builds** after major changes using BuildKit no-cache builds

# Working Style Guidelines

When working with this codebase:

### Code Quality & Architecture
- **Think like a senior/"10x" engineer**: design-first, simplify, and prove correctness with tests
- **Work step-by-step and validate** each step (build/tests/lints) before moving on
- **Prefer the smallest viable, composable change** - keep edits tight and focused
- **Controllers are thin** - business logic lives in services; utilities are pure and reusable
- **Keep files focused (≤200 LOC)** - extract helpers early, no massive "god" files
- **Use explicit TypeScript types everywhere** - `any` is banned

### Database Change Policy (CRITICAL)
- **Do NOT run Prisma migrations** on shared/live databases - this can drop or rewrite data
- **Apply idempotent SQL patches instead**, executed via the AWS Secrets wrapper:
  ```bash
  ts-node src/scripts/run-with-secrets.ts npx prisma db execute --file /absolute/path/to.sql --schema prisma/schema.prisma
  ```
- **Prefer safe statements** like `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
- **Keep `prisma/schema.prisma` authoritative** and run `npm run generate` after changes
- **You MAY use `npm run migrate:dev`** only against local, disposable dev databases

### Quality Gates & Validation
- **Every change ships with tests** as appropriate and passes lint/typecheck
- **Before completing**: run build, tests, and linters relevant to the change; fix what you broke
- **After major edits**, perform Docker BuildKit no-cache builds for backend and frontend to catch container-only failures
- **Respect multi-tenant boundaries**: enforce auth, rate limits, and validation

### Error Handling & Debugging
- **DO NOT JUMP TO CONCLUSIONS** when debugging - consider multiple possible causes
- **Make only minimal necessary changes** when fixing issues
- **Use structured logging** with appropriate log levels (debug/info/warn/error)
- **Implement proper error boundaries** in React components
- **Prefer async/await + try/catch** patterns over promises

### Security & Compliance
- **Never commit secrets** - prefer AWS Secrets Manager as source of truth
- **JWT auth, company isolation, rate limiting, Helmet, and Zod input validation** must remain intact
- **Avoid dynamic code execution** in hot paths; keep control-flow predictable