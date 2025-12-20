# Sleep Interaction Fix & State Model Simplification

## Overview

Fixed the broken Sleep interaction flow and simplified the sleep state model to use a single source of truth.

## Problems Fixed

### 1. Invalid 14919 v2 Event (Sleep Interaction)

**Problem**: The validation required at least one `stat_change` tag, but sleep actions don't produce stat changes.

**Solution**: Updated validation to allow zero stat changes for state-only actions (`sleep` and `wake`).

**Files Changed**:
- `src/lib/nostr-pet/interaction-14919-v2/validate.ts`
- `src/lib/nostr-pet/interaction-14919-v2/validate.test.ts` (added tests)

### 2. Over-Complex Sleep State Model

**Problem**: Multiple redundant fields were being used to track sleep state:
- `is_sleeping` (boolean)
- `state` (string: 'active' | 'sleeping' | 'hibernating')
- `sleep_started_at` (timestamp)
- `last_sleep_update` (timestamp)

**Solution**: Simplified to use ONLY the `state` tag as the single source of truth. All timing/decay logic should rely on the `created_at` field of the 31124 event.

**Deprecated Fields** (kept for backward compatibility):
- `isSleeping` - Use `state` instead
- `sleepStartedAt` - Use event `created_at` for timing
- `lastSleepUpdate` - Use event `created_at` for timing

### 3. Interaction Flow Updates

**Changes Made**:
- Updated `getTagsToUpdateForAction()` to only update `state` tag for sleep/wake
- Removed logic that added deprecated sleep tags to new events
- Explicitly set deprecated fields to `undefined` to ensure they're removed

**Files Changed**:
- `src/lib/nostr-pet/interaction-flow.ts`
- `src/hooks/nostr-pet/useBlobbiInteraction.ts`

### 4. Type System Updates

**Changes Made**:
- Marked deprecated fields with `@deprecated` JSDoc comments
- Updated defaults to only use `state` field
- Added documentation explaining the simplified model

**Files Changed**:
- `src/lib/nostr-pet/status-31124/types.ts`
- `src/lib/nostr-pet/status-31124/parse.ts` (added comments)
- `src/types/blobbi.ts`

### 5. UI Component Updates

**Changes Made**:
- Updated all components to check `state === 'sleeping'` instead of `isSleeping`
- Removed redundant checks (e.g., `isSleeping || state === 'sleeping'`)

**Files Changed**:
- `src/app/screens/HomeScreen.tsx`
- `src/components/blobbi/BabyGraphic.tsx`
- `src/components/blobbi/AdultGraphic.tsx`
- `src/components/blobbi/AdultGraphic.OPTIMIZED.tsx`

## Validation Logic Changes

### Before
```typescript
// Required at least one stat_change tag for ALL actions
if (statChangeTags.length === 0) {
  errors.push('Missing required tag: at least one ["stat_change", "<stat>:<delta>"]');
}
```

### After
```typescript
// State-only actions (sleep, wake) don't require stat changes
const stateOnlyActions = ['sleep', 'wake'];
const isStateOnlyAction = actionTag && stateOnlyActions.includes(actionTag[1]);

if (statChangeTags.length === 0 && !isStateOnlyAction) {
  errors.push('Missing required tag: at least one ["stat_change", "<stat>:<delta>"]');
}
```

## Sleep State Model

### Before (Complex)
```typescript
// Multiple fields tracking the same concept
{
  isSleeping: true,
  state: 'sleeping',
  sleepStartedAt: 1734700000,
  lastSleepUpdate: 1734700000
}
```

### After (Simplified)
```typescript
// Single source of truth
{
  state: 'sleeping'
}
// Timing derived from event.created_at
```

## Event Flow

### Sleep Action
1. Publishes valid kind 14919 with:
   - `action = "sleep"`
   - `action_category = "recovery"`
   - NO `stat_change` tags (allowed for state-only actions)
   - `experience_gained = 0`
   - `care_points = 0`

2. Updates 31124 with:
   - `["state", "sleeping"]` (NEW)
   - Removes deprecated tags: `is_sleeping`, `sleep_started_at`, `last_sleep_update`
   - Preserves ALL other tags

### Wake Action
1. Publishes valid kind 14919 with:
   - `action = "wake"`
   - `action_category = "recovery"`
   - `stat_change` tags ONLY if energy affects happiness
   - `experience_gained = 2`
   - `care_points = 1`

2. Updates 31124 with:
   - `["state", "active"]` (NEW)
   - Removes deprecated tags: `is_sleeping`, `sleep_started_at`, `last_sleep_update`
   - Preserves ALL other tags

## Backward Compatibility

- Old events with deprecated fields will still parse correctly
- The `parse.ts` file reads both old and new fields
- New events will ONLY write the simplified `state` field
- Deprecated fields are marked with `@deprecated` JSDoc comments

## Testing

Added comprehensive tests in `validate.test.ts`:
- ✅ Sleep action with zero stat changes validates successfully
- ✅ Wake action with zero stat changes validates successfully
- ✅ Non-state-only actions still require stat changes

## Migration Path

1. **Phase 1** (Current): New events use only `state` tag
2. **Phase 2** (Future): Remove deprecated fields from type system
3. **Phase 3** (Future): Remove parsing logic for deprecated fields

## Benefits

1. **Simpler Mental Model**: One field to check (`state`) instead of four
2. **Cleaner Events**: Fewer tags in 31124 events
3. **Better Timing**: Use `created_at` for accurate timing instead of stored timestamps
4. **Fixed Validation**: Sleep/wake actions now publish successfully
5. **Maintainability**: Less code to maintain, fewer edge cases
