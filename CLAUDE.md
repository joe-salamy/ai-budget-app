# Logging Guidelines

When implementing or modifying Python code, always follow the logging standards defined in [prompts/logging-guide.md](prompts/logging-guide.md). This file contains:

- Centralized logging configuration patterns
- Visual hierarchy guidelines (using `=` and `─` separators)
- Proper logging levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Parallel processing logging setup
- Best practices and anti-patterns

# Progress Tracking

Maintain project context and progress by following the protocol defined in [prompts/session-guide.md](prompts/session-guide.md). This requires:

- Maintaining a `progress.md` file as the project's "Source of Truth"
- Updating progress before and after significant implementation tasks
- Keeping progress synchronized with `plan.md`

**Operational rules:**

- Read `progress.md` and `plan.md` at the start of every session
- Keep progress.md concise (under 500 words)
- Update after completing coding tasks to reflect reality
