# Members Workflow Refactor PRD

## Goal
Simplify members workflow by moving data and UI logic into hooks, reducing file size, and improving pagination efficiency in Convex while keeping UI behavior unchanged.

## Non-Goals
- No design changes.
- No new member fields or schema changes.
- No changes to auth or routing.

## Constraints
- Keep React 19 and TanStack Form patterns.
- Do not modify files in `src/components/ui/`.
- Avoid `any` types.

## Task List
- [ ] Task 1: Create `useMembersList` hook to encapsulate search, debounced input, pagination, and flattening logic; update `src/components/members/members-table.tsx` to consume hook output; keep query keys stable and return `members`, `totalCount`, `isLoading`, `isFetchingNextPage`, `hasNextPage`, `fetchNextPage`, and `error`.
- [ ] Task 2: Create `useMemberMutations` hook to centralize create/update/delete mutations and query invalidations; update `members-table.tsx` and `bulk-add-members-dialog.tsx` to use shared mutation helpers; ensure invalidation includes list and count queries.
- [ ] Task 3: Extract draft persistence into `useBulkMembersDraft` hook; move `loadDraft`, `saveDraft`, `clearDraft` orchestration out of `bulk-add-members-dialog.tsx`; keep `member-schema.ts` as single source for empty row and validation.
- [ ] Task 4: Extract `EditMemberDialog` and `DeleteMemberDialog` into dedicated components under `src/components/members/`; keep props minimal and reuse `useMemberMutations` for side effects; ensure dialog open state remains in row.
- [ ] Task 5: Consolidate member payload normalization in a helper (e.g. `toMemberPayload`) to convert optional string fields to `undefined`; reuse across single create, batch create, and update paths.
- [ ] Task 6: Refactor `convex/members.ts` list query to use Convex pagination per docs (use `paginationOptsValidator`, `order("desc")`, and `paginate`); add optional `search` filtering before pagination where supported; update client query signatures accordingly.
- [ ] Task 7: Update API types and query keys to align with new paginated result shape (use `page`, `isDone`, `continueCursor` from Convex pagination); keep UI behavior and translations identical.
- [ ] Task 8: TanStack Form typing cleanup in members: replace `form: any` with a typed form API (derive from `useForm`), remove `AnyFieldApi` annotations where inference works, and delete the biome ignore for `noExplicitAny`.
- [ ] Task 9: Align members form validation with TanStack Form docs: keep schema-level `validators.onChange` for bulk add, use field-level validators only for rules not covered by schema, and ensure array fields remain `mode="array"` with nested names like `members[${index}].fullName`.
- [ ] Task 10: Run checks: `bun run lint` and focused tests (if any) for members; fix regressions before merging.

## Reference (Convex Docs)
- Pagination queries: use `paginationOptsValidator` and `ctx.db.query("table").order("desc").paginate(args.paginationOpts)`; `paginate` returns `{ page, isDone, continueCursor }`.
- Filtering can be added with `.filter(...)` before `paginate`.

## Reference (TanStack Form Docs)
- Field rendering: use `form.Field` render-props with `field.state.value`, `field.handleChange`, and `field.handleBlur` for input bindings.
- Array fields: use `form.Field name="arrayField" mode="array"` and nested field names like `items[${index}].name`.
- Validation: prefer schema-level `validators.onChange` (e.g. Zod) and add field-level validators only when needed.

## Success Criteria
- Members list behavior unchanged for search, load more, and totals.
- Members CRUD still works and invalidations remain correct.
- `members-table.tsx` and `bulk-add-members-dialog.tsx` are materially smaller and focused on rendering.
