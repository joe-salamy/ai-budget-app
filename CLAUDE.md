# TypeScript Import Rules

This project uses `verbatimModuleSyntax: true` in tsconfig.app.json. This requires strict separation of type and value imports:

**Always use `import type` for type-only imports:**

```typescript
// CORRECT
import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";

// INCORRECT - will cause build errors
import { useState, ReactNode } from "react"; // ReactNode is a type!
import { Button, ButtonProps } from "./Button"; // ButtonProps is a type!
```

**Key rules:**

- Interfaces and type aliases must use `import type`
- React types like `ReactNode`, `FC`, `HTMLAttributes`, etc. must use `import type`
- If importing both values and types from same module, use separate import statements
- Use `ReturnType<typeof setTimeout>` instead of `NodeJS.Timeout` for timer types (browser compatibility)

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
