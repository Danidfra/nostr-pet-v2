# Kind 14919 v2 Consolidation & Cleanup

This document summarizes the structural, architectural, and logic improvements made to the Kind 14919 (Interaction) implementation.

## Changes Made

### 1. ✅ Consolidated Kind 14919 Structure

**Before:**
- Duplicated implementations in `interaction-14919/` and `interaction-14919-v2/`
- Multiple overlapping index.ts files
- Fragmented parse logic

**After:**
- **`interaction-14919/`** - Minimal legacy v1 parser only (read-only)
  - `parse.ts` - V1 event parsing
  - `types.ts` - V1 type definitions
  - `index.ts` - Unified entrypoint with v1→v2 conversion
- **`interaction-14919-v2/`** - Complete v2 implementation
  - `types.ts` - V2 types and constants
  - `build.ts` - V2 event builder
  - `parse.ts` - V2 event parser
  - `helpers.ts` - V2 helper functions
- **Single public entrypoint** - `interaction-14919/index.ts`
  - Exports `parseInteractionFromEvent()` - tries v2 first, falls back to v1
  - Re-exports v2 types as canonical interface

### 2. ✅ Updated Ecosystem Version

All new interaction events now use:
```json
["b", "blobbi:ecosystem:v2"]
```

V1 (`blobbi:ecosystem:v1`) exists only for parsing historical data.

### 3. ✅ Removed Unused Tags

The following tags were removed entirely from v2:
- `time_of_day` - Not used in UI or logic
- `blobbi_mood_before` - Not used in UI or logic
- `blobbi_mood_after` - Not used in UI or logic

These may be reintroduced later if needed.

### 4. ✅ Simplified Stat Change Logic

**Before:**
- `applyBlobbiInteraction()` returned absolute stat values
- Downstream code tried to re-derive deltas by subtraction
- Fragile and error-prone for multi-stat interactions

**After:**
- `applyBlobbiInteraction()` returns **pure deltas only**
  ```typescript
  { hunger: +30, happiness: +5 }
  ```
- Interaction flow:
  1. Get pure deltas from interaction logic
  2. Multiply by item quantity
  3. Apply deltas to current stats
  4. Clamp to 0-100 range
  5. Generate `stat_change` tags from deltas
  6. Generate updated Kind 31124 tags from final values

This makes:
- Multi-stat interactions safe and predictable
- Item quantity multiplication trivial
- Future parsing consistent

### 5. ✅ Normalized camelCase ↔ snake_case Mapping

**Created:** `src/lib/nostr-pet/core/stat-mapping.ts`

Centralized mapping between:
- **camelCase** - BlobbiStatus fields (e.g., `eggTemperature`)
- **snake_case** - Tag names (e.g., `egg_temperature`)

```typescript
const STAT_TAG_MAP = {
  hunger: 'hunger',
  happiness: 'happiness',
  health: 'health',
  hygiene: 'hygiene',
  energy: 'energy',
  eggTemperature: 'egg_temperature',
  shellIntegrity: 'shell_integrity',
};
```

Used consistently across:
- Skipping old tags when updating 31124
- Writing new tags
- Parsing events
- Converting deltas to tag format

### 6. ✅ Fixed v2 → v1 Parsing Behavior

**Before:**
- When parsing v2 events into legacy shape, forced `lifeStage: 'baby'`
- Incorrect and dangerous

**After:**
- V1 parser only parses actual v1 events
- V2→V1 conversion in unified entrypoint doesn't include `lifeStage`
- UI derives stage from current Blobbi state (31124), not from 14919

### 7. ✅ Action Set Cleanup

**Removed actions:**
- `check` - Not in v2 spec
- `talk` - Not in v2 spec

**Current v2 actions:**

**Universal (all stages):**
- `clean` → care
- `medicine` → care

**Egg only:**
- `warm` → care
- `sing` → social

**Baby/Adult only:**
- `feed` → nutrition
- `play` → enrichment
- `sleep` → recovery (renamed from `rest`)
- `wake` → recovery
- `breed` → general (stub)

### 8. ✅ Item Quantity Support

**Added explicit support:**
```json
["item_quantity", "3"]
```

**Implementation:**
- Inventory update (31125) subtracts correct quantity
- Stat deltas are multiplied by quantity
- Defaults to 1 if omitted
- Fully integrated into interaction flow

### 9. ✅ Interaction Flow Order

**Strict event sequence preserved:**
```
31125 (inventory) → 14919 (interaction) → 31124 (blobbi state)
```

**Rules enforced:**
- If 31125 fails → stop, don't publish 14919 or 31124
- If 14919 fails → rollback optimistic UI
- 31124 preserves all existing tags, updating only changed ones (no tag loss)

**Tag preservation:**
- Uses `getAllStatTagNames()` to identify stat tags
- Skips only tags being updated
- Preserves all other tags from original event

### 10. ✅ UI Integration

**Updated:**
- `HomeScreen.tsx` - Changed `'rest'` to `'sleep'` action
- `useBlobbiInteraction.ts` - Uses pure delta logic
- `interaction-flow.ts` - Implements correct sequence with stat mapping

**Verified:**
- Item use calls interaction hook
- Errors surface via toast/console
- No silent failures

## Files Modified

### Core Infrastructure
- `src/lib/nostr-pet/core/stat-mapping.ts` - **NEW** - Centralized stat name mapping
- `src/lib/nostr-pet/index.ts` - Added stat-mapping export

### Interaction v2 (Current)
- `src/lib/nostr-pet/interaction-14919-v2/types.ts` - Removed unused tags, cleaned actions
- `src/lib/nostr-pet/interaction-14919-v2/helpers.ts` - Removed check/talk validation
- `src/lib/nostr-pet/interaction-14919-v2/parse.ts` - No changes needed
- `src/lib/nostr-pet/interaction-14919-v2/build.ts` - No changes needed

### Interaction v1 (Legacy)
- `src/lib/nostr-pet/interaction-14919/parse.ts` - Simplified to v1-only parsing
- `src/lib/nostr-pet/interaction-14919/index.ts` - **REWRITTEN** - Unified entrypoint
- `src/lib/nostr-pet/interaction-14919/build.ts` - **DELETED** - No new v1 events
- `src/lib/nostr-pet/interaction-14919/publish.ts` - **DELETED** - No new v1 events

### Interaction Logic
- `src/lib/blobbi-interaction-logic.ts` - **REWRITTEN** - Returns pure deltas, removed check/talk
- `src/lib/nostr-pet/interaction-flow.ts` - **REWRITTEN** - Uses pure deltas, stat mapping, preserves tags

### Hooks
- `src/hooks/nostr-pet/useBlobbiInteraction.ts` - Updated to use pure delta logic

### UI
- `src/app/screens/HomeScreen.tsx` - Changed `'rest'` to `'sleep'`

### Documentation
- `NIP.md` - **REWRITTEN** - Complete v2 spec with all changes

## Testing

All changes compile successfully with TypeScript. No new test failures introduced.

Pre-existing linting warnings remain but are unrelated to these changes.

## Migration Path

**For existing apps:**
1. Update to new codebase
2. All historical v1 events continue to parse correctly
3. All new interactions automatically use v2 format
4. No database migration needed
5. No user action required

**For new apps:**
- Use v2 from the start
- V1 support is transparent (handled by unified parser)

## Benefits

1. **Reduced complexity** - Single v2 implementation, minimal v1 legacy
2. **No duplication** - One clear source of truth for each version
3. **Safer stat logic** - Pure deltas prevent calculation errors
4. **Consistent naming** - Centralized camelCase↔snake_case mapping
5. **Future-proof** - Easy to add new tags, stats, or actions
6. **Tag preservation** - No data loss when updating 31124
7. **Explicit quantities** - Multi-item usage fully supported

## Future Evolution

The architecture now supports:
- Adding new stats (update stat-mapping.ts)
- Adding new actions (update types, ACTION_CATEGORY_MAP, helpers)
- Adding new tags (update types, build, parse)
- Extending to new kinds (same pattern)

No breaking changes needed for these extensions.
