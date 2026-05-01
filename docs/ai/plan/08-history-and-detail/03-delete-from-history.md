# Step 03 — Delete from History

**Plan**: [`main.md`](./main.md)
**Depends on**: 02 (history list page exists)

## Objective

Wire the delete button on history list items: show a confirmation dialog, call `DELETE /api/measurements/[id]`, show a toast, and remove the measurement from the displayed list.

## Context

- History page: `src/app/historico/page.tsx` (built in Step 02) — delete button currently has a stub `onClick`
- API: `DELETE /api/measurements/[id]` returns 204 (`src/app/api/measurements/[id]/route.ts:71`)
- Confirmation pattern: follow `src/components/profile-switcher.tsx:120-149` — discriminated union state, fixed position overlay, `role="alertdialog"`
- Toast: `toaster.create({ title: "...", type: "success"|"error" })` from `@/components/ui/toaster`
- The detail page (Step 04) will also need delete — reuse the same pattern (extract a shared `DeleteMeasurementDialog` component if DRY is warranted)
- Text: Portuguese — "Tem certeza que deseja excluir esta medição?", "Medição excluída", "Erro ao excluir medição"

## Approach

### 1. Write failing test

In `src/app/historico/page.test.tsx`:
- Test: clicking delete button opens confirmation dialog
- Test: dialog shows correct Portuguese text
- Test: confirming delete calls `DELETE /api/measurements/[id]`
- Test: on successful delete (204), measurement is removed from list and toast appears
- Test: on delete error, error toast appears and measurement stays in list
- Test: canceling dialog closes it without deleting

### 2. Implement delete confirmation

In `src/app/historico/page.tsx`:

Add state:
```typescript
type DeleteState = { kind: "idle" } | { kind: "confirming"; measurementId: string; measurementDate: string }
const [deleteState, setDeleteState] = useState<DeleteState>({ kind: "idle" })
```

Delete handler:
```typescript
async function confirmDelete() {
  if (deleteState.kind !== "confirming") return
  try {
    const res = await fetch(`/api/measurements/${deleteState.measurementId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Delete failed")
    setMeasurements(prev => prev.filter(m => m._id !== deleteState.measurementId))
    toaster.create({ title: "Medição excluída", type: "success" })
  } catch {
    toaster.create({ title: "Erro ao excluir medição", type: "error" })
  } finally {
    setDeleteState({ kind: "idle" })
  }
}
```

Delete button `onClick`:
```typescript
onClick={() => setDeleteState({ kind: "confirming", measurementId: m._id, measurementDate: m.measuredAt })}
```

Confirmation overlay:
- Follow the pattern from `profile-switcher.tsx`:
  - `position="fixed" inset={0} bg="blackAlpha.500"` backdrop
  - Centered `Box` with "Tem certeza que deseja excluir esta medição?"
  - Show measurement date for context: "Medição de DD/MM/YYYY"
  - Confirm button: `Button colorPalette="red"` — "Excluir"
  - Cancel button: `Button variant="outline"` — "Cancelar"

### 3. Extract reusable `DeleteConfirmationDialog` (optional refactor)

If the same dialog pattern is needed for both history list and detail page (Step 04), extract after both are implemented. For now, keep it inline in the history page.

### 4. Confirm green & refactor

- Run tests, confirm all pass
- Run `npm run lint`
- Verify manually: delete a measurement, see it disappear from list, check toast

## Acceptance

- [ ] Clicking delete opens confirmation dialog
- [ ] Dialog shows "Tem certeza que deseja excluir esta medição?" in Portuguese
- [ ] Confirming sends `DELETE /api/measurements/[id]` and removes item from list
- [ ] Success toast appears after deletion
- [ ] Error toast appears on failure, item stays in list
- [ ] Canceling closes dialog without action
- [ ] Dialog shows the measurement date for context

## Verification

```bash
npm test -- src/app/historico/page.test.tsx
npm run lint
```

## Commit

```
feat(historico): add delete measurement with confirmation dialog
```
