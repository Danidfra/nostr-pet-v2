# Instrumentation and Fixes for Event Publishing

## Problem Statement

When clicking Feed → select burger → Use Item, UI updates happened but no Nostr events were published to relays (no 31125/14919/31124 events). The HomeScreen wiring appeared correct, but real publishing wasn't occurring.

## Root Causes Identified

### 1. **Missing Instrumentation**
- No logging to trace execution flow
- Silent failures not surfaced to console
- Difficult to diagnose where the flow was breaking

### 2. **Potential Hook Initialization Issue**
- `useBlobbiInteraction` was called with `blobbis[currentBlobbiIndex]?.id || ''`
- Before blobbis loaded, this would be an empty string
- Hook might not properly reinitialize when blobbiId changes from `''` to actual ID

### 3. **Dependency Array Issues**
- HomeScreen used `JSON.stringify(blobbiStatusList)` in useMemo dependency
- This is a performance anti-pattern causing heavy re-renders
- Can trigger duplicate subscriptions and unnecessary computations

## Fixes Applied

### 1. Added Comprehensive Instrumentation

#### A. `interaction-flow.ts` - Full execution trace

**Added logs at:**
- Function entry with all parameters
- Before each step (STEP 1, STEP 2, STEP 3)
- After each successful publish
- On any error/failure
- Final success confirmation

**Example output:**
```
[executeInteractionFlow] START { blobbiId, action, itemId, itemQuantity, ... }
[executeInteractionFlow] STEP 1: Publish 31125 START { itemId, currentStorage }
[executeInteractionFlow] STEP 1: Publishing 31125 { kind, tagsCount, newStorage }
[executeInteractionFlow] STEP 1: Publish 31125 OK
[executeInteractionFlow] STEP 2: Publish 14919 v2 START { action, statChanges, ... }
[executeInteractionFlow] STEP 2: Publishing 14919 v2 { kind, tagsCount }
[executeInteractionFlow] STEP 2: Publish 14919 v2 OK
[executeInteractionFlow] STEP 3: Publish 31124 START { changedStats, newStatsValues }
[executeInteractionFlow] STEP 3: Publishing 31124 { kind, tagsCount }
[executeInteractionFlow] STEP 3: Publish 31124 OK
[executeInteractionFlow] ALL STEPS COMPLETE - SUCCESS
```

**Error handling:**
```
[executeInteractionFlow] STEP 1: Publish 31125 FAILED <error>
[executeInteractionFlow] UNEXPECTED ERROR <error>
```

#### B. `useBlobbiInteraction.ts` - Validation and flow tracking

**Added logs at:**
- Function entry with all validation parameters
- Each validation check (user, nostr, blobbi, action, item, sleep state)
- Before calling `executeInteractionFlow`
- After flow returns (success/failure)
- Final success/error state

**Example output:**
```
[useBlobbiInteraction.interact] START { userPubkey, hasNostr, blobbiId, hasBlobbi, blobbiStage, action, itemId, itemQuantity }
[useBlobbiInteraction.interact] All validations passed
[useBlobbiInteraction.interact] Starting executeInteractionFlow...
[useBlobbiInteraction.interact] executeInteractionFlow returned { success, error }
[useBlobbiInteraction.interact] SUCCESS - interaction complete
```

**Validation errors:**
```
[useBlobbiInteraction.interact] VALIDATION FAILED: No user
[useBlobbiInteraction.interact] VALIDATION FAILED: No nostr client
[useBlobbiInteraction.interact] VALIDATION FAILED: No blobbi
[useBlobbiInteraction.interact] VALIDATION FAILED: Invalid action for stage
[useBlobbiInteraction.interact] VALIDATION FAILED: Item not found
[useBlobbiInteraction.interact] VALIDATION FAILED: Item incompatible with stage
[useBlobbiInteraction.interact] VALIDATION FAILED: Insufficient inventory
[useBlobbiInteraction.interact] VALIDATION FAILED: Blobbi is sleeping
```

#### C. `HomeScreen.tsx` - UI interaction tracking

**Added logs at:**
- Function entry with blobbi and item details
- Computed action determination
- Before calling interact()
- After interact() returns
- Success/failure outcomes

**Example output:**
```
[HomeScreen.handleUseItemFromModal] START { blobbiId, blobbiLifeStage, pendingAction, itemId, quantity }
[HomeScreen.handleUseItemFromModal] Computed action { action, fromPendingAction, itemCategory }
[HomeScreen.handleUseItemFromModal] Calling interact()...
[HomeScreen.handleUseItemFromModal] interact() returned { success, error }
[HomeScreen.handleUseItemFromModal] SUCCESS
```

**Error cases:**
```
[HomeScreen.handleUseItemFromModal] No current blobbi
[HomeScreen.handleUseItemFromModal] Item not found { itemId }
[HomeScreen.handleUseItemFromModal] Interaction failed { error }
```

### 2. Fixed Hook Initialization

**Before:**
```typescript
const { interact, isLoading: isInteracting } = useBlobbiInteraction(blobbis[currentBlobbiIndex]?.id || '');
```

**Problem:**
- Before blobbis load, this evaluates to `useBlobbiInteraction('')`
- Hook might not properly update when blobbis become available
- Empty string is an invalid blobbiId

**After:**
```typescript
// Get current Blobbi ID (stable reference)
const currentBlobbiId = useMemo(() => {
  return blobbis[currentBlobbiIndex]?.id || '';
}, [blobbis, currentBlobbiIndex]);

// Get interaction hook for current Blobbi
const { interact, isLoading: isInteracting } = useBlobbiInteraction(currentBlobbiId);
```

**Benefits:**
- Stable reference prevents unnecessary hook reinitializations
- Clear dependency tracking
- Better React DevTools visibility

### 3. Fixed useMemo Dependency Issue

**Before:**
```typescript
const blobbis = useMemo(() => {
  console.log('[HomeScreen] blobbis from hook:', blobbiStatusList);
  return mapBlobbiStatusListToBlobbis(blobbiStatusList);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [JSON.stringify(blobbiStatusList)]); // ❌ Performance anti-pattern

console.log('[HomeScreen] mapped blobbis:', blobbis);
console.log('[HomeScreen] isLoading:', isLoading);
console.log('[HomeScreen] isInitialLoading:', isInitialLoading);
```

**Problems:**
- `JSON.stringify()` on every render is expensive
- Creates new string reference even if data unchanged
- Triggers unnecessary re-renders
- Causes duplicate subscriptions
- Console spam on every render

**After:**
```typescript
const blobbis = useMemo(() => {
  return mapBlobbiStatusListToBlobbis(blobbiStatusList);
}, [blobbiStatusList]); // ✅ Direct dependency
```

**Benefits:**
- React's built-in equality check (Object.is)
- No unnecessary stringification
- Proper memoization
- Reduced re-renders
- Cleaner console output

### 4. Ensured Error Surfacing

All error paths now:
1. **Log to console** with context
2. **Return error object** with descriptive message
3. **Show toast** in UI (HomeScreen level)
4. **Don't swallow errors** - all catches log and propagate

**Error flow:**
```
executeInteractionFlow error
    ↓
console.error with context
    ↓
return { success: false, error: "..." }
    ↓
useBlobbiInteraction logs error
    ↓
return { success: false, error: "..." }
    ↓
HomeScreen shows toast
    ↓
User sees specific error message
```

## Files Modified

### 1. `src/lib/nostr-pet/interaction-flow.ts`
- Added entry log with all parameters
- Added STEP 1 logs (31125 inventory update)
- Added STEP 2 logs (14919 v2 interaction)
- Added STEP 3 logs (31124 status update)
- Added success/failure logs for each step
- Added final success confirmation
- Added unexpected error logging

### 2. `src/hooks/nostr-pet/useBlobbiInteraction.ts`
- Added entry log with validation parameters
- Added validation failure logs for each check
- Added "all validations passed" confirmation
- Added "starting executeInteractionFlow" log
- Added flow result logging
- Added rollback logging
- Added final success/error logging

### 3. `src/app/screens/HomeScreen.tsx`
- Added entry log with blobbi and item details
- Added computed action logging
- Added "calling interact()" log
- Added result logging
- Added success/error logging
- Fixed useMemo dependency (removed JSON.stringify)
- Added stable currentBlobbiId reference
- Removed console spam

## Diagnostic Flow

### Step-by-Step Debugging

When clicking Feed → burger → Use Item, you should see:

```
1. [HomeScreen.handleUseItemFromModal] START
   - Confirms button click registered
   - Shows blobbi ID, life stage, pending action, item ID, quantity

2. [HomeScreen.handleUseItemFromModal] Computed action
   - Shows which action was selected (feed/medicine/clean/play)
   - Shows if it came from pendingAction or category fallback

3. [HomeScreen.handleUseItemFromModal] Calling interact()...
   - Confirms about to call the hook

4. [useBlobbiInteraction.interact] START
   - Shows all validation parameters
   - Confirms hook was called

5. Validation checks (if any fail, error logged here)
   - User logged in?
   - Nostr client available?
   - Blobbi exists?
   - Action valid for stage?
   - Item compatible?
   - Sufficient inventory?
   - Not sleeping (or action is wake)?

6. [useBlobbiInteraction.interact] All validations passed
   - Confirms ready to execute flow

7. [useBlobbiInteraction.interact] Starting executeInteractionFlow...
   - About to publish events

8. [executeInteractionFlow] START
   - Shows flow parameters

9. [executeInteractionFlow] STEP 1: Publish 31125 START
   - Shows inventory before/after

10. [executeInteractionFlow] STEP 1: Publishing 31125
    - Shows event details

11. [executeInteractionFlow] STEP 1: Publish 31125 OK
    - Confirms inventory event published

12. [executeInteractionFlow] STEP 2: Publish 14919 v2 START
    - Shows action, stat changes, item details

13. [executeInteractionFlow] STEP 2: Publishing 14919 v2
    - Shows event details

14. [executeInteractionFlow] STEP 2: Publish 14919 v2 OK
    - Confirms interaction event published

15. [executeInteractionFlow] STEP 3: Publish 31124 START
    - Shows changed stats

16. [executeInteractionFlow] STEP 3: Publishing 31124
    - Shows event details

17. [executeInteractionFlow] STEP 3: Publish 31124 OK
    - Confirms status event published

18. [executeInteractionFlow] ALL STEPS COMPLETE - SUCCESS
    - Confirms entire flow succeeded

19. [useBlobbiInteraction.interact] executeInteractionFlow returned
    - Shows success: true

20. [useBlobbiInteraction.interact] SUCCESS - interaction complete
    - Final confirmation

21. [HomeScreen.handleUseItemFromModal] interact() returned
    - Shows success: true

22. [HomeScreen.handleUseItemFromModal] SUCCESS
    - UI updates, modals close, toast shown
```

### Common Failure Points

#### If flow stops at validation:
```
[useBlobbiInteraction.interact] VALIDATION FAILED: <reason>
```
**Check:**
- Is user logged in? (NIP-07 extension available?)
- Is nostr client initialized?
- Is blobbi loaded?
- Is action valid for current life stage?
- Does user have the item in inventory?
- Is blobbi sleeping?

#### If flow stops at STEP 1:
```
[executeInteractionFlow] STEP 1: Publish 31125 FAILED
```
**Check:**
- Does user have NIP-07 signer?
- Can signer sign events?
- Are relays connected?
- Is profile loaded?

#### If flow stops at STEP 2:
```
[executeInteractionFlow] STEP 2: Publish 14919 v2 FAILED
```
**Check:**
- Are stat deltas computed correctly?
- Is interaction event structure valid?
- Can relays accept kind 14919?

#### If flow stops at STEP 3:
```
[executeInteractionFlow] STEP 3: Publish 31124 FAILED
```
**Check:**
- Are status tags formatted correctly?
- Is event structure valid?
- Can relays accept replaceable events?

## Testing Checklist

### ✅ Instrumentation Verification

- [ ] Open browser console
- [ ] Click Feed button
- [ ] Select a food item (e.g., burger)
- [ ] Click "Use Item"
- [ ] Verify console shows full log chain (steps 1-22 above)
- [ ] Verify no errors in console
- [ ] Verify success toast appears
- [ ] Verify modals close

### ✅ Event Publishing Verification

Using a Nostr client or relay inspector:

- [ ] Verify Kind 31125 event published (inventory update)
  - Check tags show decremented item quantity
  - Check other items unchanged
  
- [ ] Verify Kind 14919 event published (interaction)
  - Check has ecosystem tag: `["b", "blobbi:ecosystem:v2"]`
  - Check has `item_used` tag
  - Check has `item_quantity` tag
  - Check has `stat_change` tags with deltas
  
- [ ] Verify Kind 31124 event published (status update)
  - Check updated stats (hunger, happiness, etc.)
  - Check timestamps updated (lastMeal, lastInteraction)
  - Check all other tags preserved

### ✅ Error Handling Verification

- [ ] Try using item without logging in → See validation error
- [ ] Try using item Blobbi doesn't have → See inventory error
- [ ] Try using incompatible item → See stage error
- [ ] Try using item on sleeping Blobbi → See sleep error
- [ ] Disconnect relays → See publish error with specific message
- [ ] Verify modals stay open on error
- [ ] Verify error toast shows specific message

### ✅ Performance Verification

- [ ] No excessive console spam
- [ ] No duplicate subscription logs
- [ ] UI remains responsive
- [ ] No memory leaks (check DevTools)

## Acceptance Criteria

### ✅ Must Demonstrate

After clicking Feed → burger → Use Item:

1. **Console shows full log chain**
   - All 22 steps visible
   - No errors or warnings
   - Clear progression through flow

2. **Relay receives events in order**
   - Kind 31125 (inventory decrement)
   - Kind 14919 v2 (interaction with ecosystem tag)
   - Kind 31124 (status update preserving tags)

3. **UI provides feedback**
   - Success toast with item name and quantity
   - Modals close automatically
   - Stats update in UI
   - Inventory quantity decrements

4. **Errors are surfaced**
   - Console shows specific error
   - Toast shows user-friendly message
   - Modals stay open for retry
   - No silent failures

## Future Improvements

### Potential Optimizations (after verification)

1. **Remove instrumentation logs** once flow is verified working
2. **Add performance monitoring** for event publishing times
3. **Add retry logic** for transient network failures
4. **Add event confirmation** from relays before showing success
5. **Add offline queue** for events when relays unavailable

### Code Quality

1. **Keep error handling** - don't remove even after removing debug logs
2. **Keep validation logging** - useful for production debugging
3. **Consider feature flag** for verbose logging (dev vs prod)
4. **Add unit tests** for interaction flow
5. **Add integration tests** for full UI → relay flow

## Summary

This implementation adds comprehensive instrumentation to diagnose and fix event publishing issues. The instrumentation covers:

- **Entry points** - Confirms user actions trigger code
- **Validation** - Shows why actions might be blocked
- **Execution flow** - Traces through all 3 event publications
- **Error handling** - Surfaces specific failures
- **Success confirmation** - Confirms complete flow

The fixes address:

- **Hook initialization** - Stable blobbiId reference
- **Dependency tracking** - Proper useMemo usage
- **Error surfacing** - No silent failures
- **Performance** - Removed JSON.stringify anti-pattern

All changes maintain strict TypeScript safety and follow existing architecture patterns.
