# AGENTS.md - Coding Agent Guidelines

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

A church member registry application built with:
- **Frontend**: React 19 + TanStack Router + TanStack Query + TanStack Form
- **Backend**: Convex (real-time database + server functions)
- **Auth**: Better Auth with Convex integration
- **UI**: coss-ui components + Tailwind CSS
- **Build**: Vite + Nitro for SSR
- **Package Manager**: Bun (1.3.3)

## Critical Rules

1. **DO NOT modify files in `src/components/ui/`** - These are coss-ui components managed externally. Only modify if explicitly instructed.
2. **Always use React 19 patterns** - Use new APIs like `useActionState`, `useOptimistic`, `use()`, and form actions.
3. **Use TanStack Form for all forms** - Never use uncontrolled forms or manual state management for form data.
4. **Check `src/components/ui/` first** - Before creating UI components, check if a coss-ui component exists.
5. **NEVER use `any` type** - Always find the correct type. Use `unknown` only when truly necessary.

## Build, Lint, and Test Commands

```bash
# Development (runs Vite + Convex concurrently)
bun run dev

# Build
bun run build
bun run build:prod    # Deploy Convex + build

# Testing with Vitest
bun run test                              # Run all tests
bun vitest run path/to/file.test.ts       # Run single test file
bun vitest run -t "test name pattern"     # Run tests matching pattern

# Linting and Formatting (Biome)
bun run lint      # Run linter
bun run format    # Format code
bun run check     # Run all checks
```

## Code Style Guidelines

### Formatting (Biome)
- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Imports**: Auto-organized by Biome

### TypeScript
- Strict mode enabled
- No unused locals or parameters
- Use `type` keyword for type-only imports: `import type { Foo } from "..."`
- **NEVER use `any` type** - Always find the correct type. Use `unknown` only when truly necessary with type guards.

```typescript
// BAD - Never do this
function process(data: any) { ... }

// GOOD - Use proper types
function process(data: MemberData) { ... }

// ACCEPTABLE - When type is genuinely unknown, use unknown with narrowing
function handleResponse(data: unknown) {
  if (isApiError(data)) {
    // data is now typed as ApiError
  }
}
```

### Path Aliases
```typescript
import { Button } from "@/components/ui/button";  // src/*
import { api } from "@convex/api";                // convex/_generated/*
```

### Naming Conventions
- **Components**: PascalCase (`MemberList`, `CreateMemberForm`)
- **Hooks**: camelCase with `use` prefix (`useIsMobile`)
- **Convex Functions**: camelCase (`createMember`, `getCurrentUser`)

## React 19 Best Practices

### Use New React 19 APIs
```typescript
// useActionState for form actions
const [error, submitAction, isPending] = useActionState(async (prev, formData) => {
  const result = await saveData(formData);
  if (result.error) return result.error;
  return null;
}, null);

// useOptimistic for optimistic updates
const [optimisticItems, addOptimistic] = useOptimistic(items);

// use() for reading promises/context
const data = use(dataPromise);
```

### Form Actions
Use form `action` prop instead of `onSubmit` when possible:
```tsx
<form action={submitAction}>
  <button type="submit" disabled={isPending}>Submit</button>
</form>
```

## TanStack Form Patterns

Always use TanStack Form with Zod validation:

```typescript
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

function MemberForm() {
  const form = useForm({
    defaultValues: { fullName: "", email: "" },
    validators: {
      onChange: z.object({
        fullName: z.string().min(1, "Name is required"),
        email: z.string().email().optional(),
      }),
    },
    onSubmit: async ({ value }) => {
      await createMember(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="fullName"
        children={(field) => (
          <Input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      />
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        )}
      />
    </form>
  );
}
```

## TanStack Router Patterns

### File-Based Routes
Routes in `src/routes/` are auto-discovered. Route tree generated in `src/routeTree.gen.ts`.

```typescript
// src/routes/members.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/members")({
  component: MembersPage,
  loader: async ({ context }) => {
    // Prefetch data
  },
});
```

### Navigation
```typescript
import { Link, useNavigate } from "@tanstack/react-router";

<Link to="/members/$id" params={{ id: "123" }}>View</Link>

const navigate = useNavigate();
navigate({ to: "/members" });
```

## TanStack Query + Convex

```typescript
import { useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";

// Query
const { data, isLoading } = useQuery(convexQuery(api.members.list, {}));

// Mutation
const mutation = useConvexMutation(api.members.createMember);
```

## Convex Backend

### Schema with Validators
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  members: defineTable({
    fullName: v.string(),
    email: v.optional(v.string()),
    invitedBy: v.optional(v.id("members")),
  }).index("by_email", ["email"]),
});
```

### Mutations
```typescript
import { v } from "convex/values";
import { authedMutation } from "./utils";

export const createMember = authedMutation({
  args: { fullName: v.string(), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("members", args);
  },
});
```

## coss-ui Components (Read-Only)

Available components in `src/components/ui/`:
accordion, alert, alert-dialog, autocomplete, avatar, badge, breadcrumb, button,
card, checkbox, checkbox-group, collapsible, combobox, command, dialog, empty,
field, fieldset, form, frame, group, input, input-group, kbd, label, menu, meter,
number-field, pagination, popover, preview-card, progress, radio-group, scroll-area,
select, separator, sheet, sidebar, skeleton, slider, spinner, switch, table, tabs,
textarea, toast, toggle, toggle-group, toolbar, tooltip

Use the `cn()` utility for className merging:
```typescript
import { cn } from "@/lib/utils";
<Button className={cn("custom-class", conditional && "active")} />
```

## File Structure

```
src/
  components/ui/    # coss-ui components (DO NOT MODIFY)
  hooks/            # Custom React hooks
  lib/              # Utilities, auth helpers
  routes/           # TanStack Router file-based routes
convex/
  _generated/       # Auto-generated (DO NOT MODIFY)
  schema.ts         # Database schema
  *.ts              # Server functions
```
