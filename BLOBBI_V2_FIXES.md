# Blobbi v2 Event Format Fixes

## Issue Summary

Three critical issues were identified with the migration to kind 14919 v2 format:

### A) Tag Version Compatibility (b tag: v1 vs v2)
- **Old events**: `["b","blobbi:ecosystem:v1"]`
- **New 14919 events**: `["b","blobbi:ecosystem:v2"]`
- **Problem**: Subscriptions/queries filtering on v1 won't receive v2 events

### B) Critical Bug: med_super Stat Delta Mapping
- **Expected**: `healthDelta: 50` → `health:50` (or `shell_integrity:50` for eggs)
- **Actual**: `shell_integrity:70` for eggs
- **Root Cause**: Base medicine action adds `health: 20`, item adds `healthDelta: 50`, totaling 70

### C) Event Publishing Standardization
- Ensure consistent required tags across all 14919 v2 events
- Validate events before publishing
- Standardize content field usage

## Root Cause Analysis

### Issue B: The 70 Delta Bug

**Code Flow:**
1. `applyBlobbiInteraction()` in `blobbi-interaction-logic.ts`:
   - Starts with `BASE_INTERACTION_DELTAS.medicine = { health: 20 }`
   - Adds item delta: `itemDef.healthDelta = 50`
   - Total: `deltas.health = 20 + 50 = 70`
   - For eggs, converts: `deltas.shellIntegrity = 70` (removes health)

2. `interaction-flow.ts` line 137-143:
   - Calls `applyBlobbiInteraction(blobbi, blobbi.stage, action, itemId)`
   - Gets deltas with the combined 70 value
   - Converts to stat_change tags via `statToTag()`

**The Problem:**
- Medicine items are **replacing** the base medicine action, not supplementing it
- The base action delta should only apply when NO item is used
- When using an item, only the item's deltas should apply

## Files Requiring Changes

### 1. Interaction Logic (`src/lib/blobbi-interaction-logic.ts`)
- Fix: Don't add base action deltas when an item is provided
- Rationale: Items define their complete effect, not additive bonuses

### 2. Tag Compatibility (Multiple Files)
Files using `blobbi:ecosystem:v1` filters:
- `src/hooks/nostr-pet/useBlobbiStatus.ts:97`
- `src/hooks/nostr-pet/useBlobbonautProfile.ts:127`
- `src/lib/nostr-pet/status-31124/parse.ts:83`
- `src/lib/nostr-pet/profile-31125/parse.ts:63`
- `src/lib/nostr-pet/interaction-14919/parse.ts:17`

**Strategy**: Transitional compatibility - accept both v1 and v2 for reads

### 3. Event Validation
- Create validator for 14919 v2 events before publishing
- Ensure required tags are present
- Add to `src/lib/nostr-pet/interaction-14919-v2/validate.ts` (new file)

### 4. Testing
- Add unit test for med_super delta calculation
- Test egg stage: should produce `shell_integrity:50`, not 70
- Test baby/adult stage: should produce `health:50`
- Add to `src/lib/blobbi-interaction-logic.test.ts` (new file)

## Implementation Plan

1. **Fix stat delta calculation** (blobbi-interaction-logic.ts)
2. **Update ecosystem tag filters** (all query/parse files)
3. **Create event validator** (interaction-14919-v2/validate.ts)
4. **Add tests** (blobbi-interaction-logic.test.ts)
5. **Update v2 builder** to use validator (interaction-14919-v2/build.ts)
6. **Run validation** to ensure no regressions

## Expected Outcomes

### Issue A: Tag Compatibility
- All queries/filters accept both v1 and v2 ecosystem tags
- New events publish with v2 tag
- Old events remain queryable

### Issue B: Stat Delta Fix
- med_super on egg: `shell_integrity:50` (not 70)
- med_super on baby/adult: `health:50`
- All items produce deltas matching their definitions
- Base action deltas only apply when no item is used

### Issue C: Event Validation
- All 14919 v2 events validated before publishing
- Required tags enforced:
  - `["t","blobbi"]`
  - `["b","blobbi:ecosystem:v2"]`
  - `["blobbi_id", <id>]`
  - `["action", <action>]`
  - `["action_category", <category>]`
  - `["stat_change", "<stat>:<delta>"]` (1+ required)
  - `["client","blobbi"]`
  - `["alt", <description>]`
- Optional tags validated when present:
  - `["item_used", <itemId>]`
  - `["item_quantity", <number>]`
  - `["experience_gained", <number>]`
  - `["care_points", <number>]`
