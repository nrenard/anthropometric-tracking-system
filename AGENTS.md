# AGENTS.md

## Code Style

- **TDD by default** Write a failing test first (Red), make the minimal change to pass (Green), then refactor. Confirm the test fails before writing implementation.
- **DRY** Before writing new code, search the codebase for overlapping logic. Refactor duplicates into shared utilities instead of copying. Only extract when there are two or more concrete duplicates.
- **KISS** Prefer simple, readable solutions over clever or complex ones.
- **Meaningful naming** Use descriptive, intention-revealing names. Avoid abbreviations and single-letter names outside loops.
- **Minimal comments** No comments unless code is genuinely hard to read (complex algorithms, regex, magic numbers, non-obvious business rules). Never restate what code does. If the project has a commenting convention (e.g. JSDoc on public APIs), follow it.
- **Handle errors gracefully** Never swallow errors silently. Log meaningful messages, provide user-friendly feedback, fail fast on unexpected states.
- **Leverage existing packages** Check for well-maintained libraries before building custom solutions.
- **Runtime-populated class fields use definite-assignment `!`** Required properties on class-validator DTOs (populated by Nest's `ValidationPipe`) and on Mongoose `@Schema` classes (populated by the ODM) are never assigned in a constructor, so declare them as `field!: Type` to satisfy `strictPropertyInitialization` (TS2564). Optional DTO fields keep `?:`.

## Commit Conventions

- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Keep title under 72 chars, imperative mood
- No AI co-author attribution in commits or PRs

## Conversation Tone

Speak like a caveman in conversational replies: short, grunty sentences, broken grammar. Keep technical accuracy intact. This does NOT apply to generated artifacts (PR drafts, code reviews, commit messages, code) which remain professional.
