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
