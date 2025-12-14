# Tag Preservation Fix - Implementation Summary

## Problem

The `executeInteractionFlow` function in Step 3 (Blobbi state update – kind 31124) was removing a broad set of tags using `getAllStatTagNames()` and multiple state/timestamp fields, then only re-adding fields present in `newStats`. Since `newStats` only contained stats with deltas (changed values), this caused unchanged tags to be removed and lost in the new event.

For example:
- If a "feed" action only changed `hunger`, tags like `happiness`, `health`, `hygiene`, `energy`, `egg_temperature`, `is_sleeping`, `state`, etc. would be removed
- Metadata tags and egg-specific fields would disappear
- Each interaction would progressively lose more data

## Solution: Option A - Dynamic Tag Removal

Implemented a targeted approach that only removes tags that are actually being updated:

### 1. New Helper Function: `getTagsToUpdateForAction()`

Created a centralized function that determines which tags should be removed based on:

**a) Stats that actually changed** (keys in `multipliedDeltas`):
- Dynamically converts camelCase stat names to snake_case tag names
- Only includes stats that have non-zero deltas

**b) Universal tags** (always updated on any interaction):
- `experience` - Always updated with rewards
- `care_streak` - Always updated with care points
- `last_interaction` - Always updated to current timestamp

**c) Action-specific timestamp/state tags**:
- `feed` → adds `last_meal`
- `clean` → adds `last_clean`
- `medicine` → adds `last_medicine`
- `warm` → adds `last_warm`
- `sing` → adds `last_sing`
- `sleep` → updates `is_sleeping`, `state`, `sleep_started_at`, `last_sleep_update`
- `wake` → updates `is_sleeping`, `state`, `sleep_started_at`, `last_sleep_update`

### 2. Updated Tag Removal Logic

**Before:**
```typescript
// Removed ALL stat tags and state tags
const statTagNames = getAllStatTagNames();
const tagsToRemove = [
  ...statTagNames,  // ALL stats removed
  'experience',
  'care_streak',
  'last_interaction',
  'last_meal',
  'last_clean',
  // ... etc (removed even if not changed)
];
```

**After:**
```typescript
// Only remove tags that are actually being updated
const tagsToRemove = getTagsToUpdateForAction(action, multipliedDeltas);
```

### 3. Preserved Tag Behavior

The `updateAndNormalizeTags()` function now:
- Removes only the tags specified in `tagsToRemove`
- Preserves all other tags from the previous event
- Normalizes to prevent duplicates (singleton tags)
- Maintains tag order stability

## Results

### ✅ Acceptance Criteria Met

1. **Tag equivalence**: After publishing the new 31124, the tag set is equivalent to the previous one, except for explicitly updated fields
2. **No tag loss**: No stat or state tag disappears unless it was intentionally updated
3. **Singleton uniqueness**: Singleton tags remain unique through normalization
4. **Multi-value preservation**: Multi-value tags remain intact
5. **Cross-stage support**: Works correctly for egg, baby, and adult stages

### ✅ Test Coverage

Added comprehensive tests in `src/lib/nostr-pet/interaction-flow.test.ts`:

1. **Feed action (baby stage)**:
   - Only `hunger` changes → other stats preserved
   - Metadata tags preserved (`name`, `stage`, `generation`, etc.)
   - State tags preserved (`is_sleeping`, `state`)
   - Universal tags updated (`experience`, `care_streak`, `last_interaction`)
   - Action-specific timestamp added (`last_meal`)

2. **Sleep action (adult stage)**:
   - `energy` increases → other stats preserved
   - Sleep state tags updated (`is_sleeping`, `state`, `sleep_started_at`, `last_sleep_update`)
   - All other metadata preserved

3. **Warm action (egg stage)**:
   - Only `egg_temperature` changes → `shell_integrity` preserved
   - Egg metadata preserved (`incubation_time`, `egg_status`)
   - Action-specific timestamp added (`last_warm`)

All 101 tests passing (including 3 new tests for tag preservation).

## Code Changes

### Modified Files

1. **`src/lib/nostr-pet/interaction-flow.ts`**:
   - Added `getTagsToUpdateForAction()` helper function
   - Updated Step 3 to use dynamic tag removal
   - Removed unused `getAllStatTagNames` import
   - Added detailed comments explaining the Option A approach

2. **`src/lib/nostr-pet/interaction-flow.test.ts`** (new file):
   - Comprehensive test suite for tag preservation
   - Tests for egg, baby, and adult stages
   - Tests for different action types
   - Verifies unchanged tags are preserved
   - Verifies only updated tags are modified

## Benefits

1. **Data integrity**: Blobbi state is fully preserved across interactions
2. **Extensibility**: Easy to add new actions by extending the switch statement
3. **Maintainability**: Centralized logic in `getTagsToUpdateForAction()`
4. **Performance**: No unnecessary tag removal/re-addition
5. **Debugging**: Clear logs show exactly which tags are being updated

## Future Enhancements

The helper function makes it easy to extend with new actions:

```typescript
case 'new_action':
  tagsToRemove.push('action_specific_tag');
  break;
```

This pattern ensures that as new interactions are added, the tag preservation logic remains correct and maintainable.
