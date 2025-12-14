# Blobbi v2 Fix Verification Guide

## Quick Verification Checklist

Use this guide to verify the fixes are working correctly in production.

## 1. Verify med_super Stat Delta Fix

### Test Case: med_super on Egg Stage

**Setup**:
1. Have an egg-stage Blobbi
2. Have med_super item in inventory
3. Use med_super on the egg

**Expected Event (kind 14919 v2)**:
```json
{
  "kind": 14919,
  "tags": [
    ["t", "blobbi"],
    ["b", "blobbi:ecosystem:v2"],
    ["blobbi_id", "<your-blobbi-id>"],
    ["action", "medicine"],
    ["action_category", "care"],
    ["stat_change", "shell_integrity:50"],
    ["stat_change", "energy:20"],
    ["stat_change", "happiness:-10"],
    ["item_used", "med_super"],
    ["item_quantity", "1"],
    ["experience_gained", "5"],
    ["care_points", "1"],
    ["client", "blobbi"],
    ["alt", "medicine interaction with <blobbi-id> using item med_super"]
  ],
  "content": ""
}
```

**Critical Checks**:
- ✅ `shell_integrity:50` (NOT 70)
- ✅ `energy:20`
- ✅ `happiness:-10`
- ✅ NO `health` stat_change for eggs
- ✅ All values match item definition exactly

### Test Case: med_super on Baby/Adult Stage

**Setup**:
1. Have a baby or adult Blobbi
2. Have med_super item in inventory
3. Use med_super on the Blobbi

**Expected Event (kind 14919 v2)**:
```json
{
  "kind": 14919,
  "tags": [
    ["t", "blobbi"],
    ["b", "blobbi:ecosystem:v2"],
    ["blobbi_id", "<your-blobbi-id>"],
    ["action", "medicine"],
    ["action_category", "care"],
    ["stat_change", "health:50"],
    ["stat_change", "energy:20"],
    ["stat_change", "happiness:-10"],
    ["item_used", "med_super"],
    ["item_quantity", "1"],
    ["experience_gained", "5"],
    ["care_points", "1"],
    ["client", "blobbi"],
    ["alt", "medicine interaction with <blobbi-id> using item med_super"]
  ],
  "content": ""
}
```

**Critical Checks**:
- ✅ `health:50` (NOT 70)
- ✅ `energy:20`
- ✅ `happiness:-10`
- ✅ NO `shell_integrity` stat_change for baby/adult
- ✅ All values match item definition exactly

### Test Case: Base Medicine Action (No Item)

**Setup**:
1. Have any stage Blobbi
2. Use medicine action WITHOUT an item

**Expected Event (kind 14919 v2)**:
```json
{
  "kind": 14919,
  "tags": [
    ["t", "blobbi"],
    ["b", "blobbi:ecosystem:v2"],
    ["blobbi_id", "<your-blobbi-id>"],
    ["action", "medicine"],
    ["action_category", "care"],
    ["stat_change", "health:20"],  // Base action delta
    ["experience_gained", "5"],
    ["care_points", "1"],
    ["client", "blobbi"],
    ["alt", "medicine interaction with <blobbi-id>"]
  ],
  "content": ""
}
```

**Critical Checks**:
- ✅ `health:20` (base action delta, not item delta)
- ✅ NO `item_used` tag
- ✅ For eggs, should be `shell_integrity:20`

## 2. Verify Tag Compatibility (v1 and v2)

### Query Old Events (v1)

**Setup**: Query for old interaction events with v1 ecosystem tag

**Expected Behavior**:
- ✅ Events with `["b", "blobbi:ecosystem:v1"]` are received
- ✅ Events are parsed correctly by v1 parser
- ✅ No errors in console

### Query New Events (v2)

**Setup**: Query for new interaction events with v2 ecosystem tag

**Expected Behavior**:
- ✅ Events with `["b", "blobbi:ecosystem:v2"]` are received
- ✅ Events are parsed correctly by v2 parser
- ✅ No errors in console

### Mixed Query

**Setup**: Query for all Blobbi status events (kind 31124)

**Expected Behavior**:
- ✅ Both v1 and v2 events are received
- ✅ Filter accepts both ecosystem tag versions
- ✅ All Blobbis are displayed correctly

**Code to Check**:
```typescript
// In useBlobbiStatus.ts
const blobbiEvents = allEvents.filter(event => {
  const hasEcosystem = event.tags.some(([name, value]) =>
    name === 'b' && (value === 'blobbi:ecosystem:v1' || value === 'blobbi:ecosystem:v2')
  );
  // Should accept both versions
});
```

## 3. Verify Event Validation

### Valid Event

**Setup**: Build a valid interaction event

**Expected Behavior**:
- ✅ No validation errors
- ✅ Event is published successfully
- ✅ No console errors

### Invalid Event (Missing Required Tag)

**Setup**: Try to build an event with missing required tag

**Expected Behavior**:
- ✅ Validation throws error
- ✅ Error message lists missing tag
- ✅ Event is NOT published

**Example Error**:
```
Error: Invalid 14919 v2 event:
  - Missing required tag: ["action", <action>]
```

### Check Console Logs

When using med_super, you should see logs like:

```
[executeInteractionFlow] STEP 2: Publish 14919 v2 START {
  action: 'medicine',
  statChanges: [
    { stat: 'shell_integrity', delta: 50 },
    { stat: 'energy', delta: 20 },
    { stat: 'happiness', delta: -10 }
  ],
  itemUsed: 'med_super',
  itemQuantity: 1,
  experienceGained: 5,
  carePoints: 1
}
```

**Critical**: `shell_integrity: 50` (not 70) for eggs

## 4. Verify All Item Types

### Food Items

**Test**: Use `food_burger` on baby Blobbi

**Expected stat_changes**:
- ✅ `hunger:40`
- ✅ `happiness:10`
- ✅ `hygiene:-8`
- ✅ `energy:8`

### Hygiene Items

**Test**: Use `hyg_bubble` on any Blobbi

**Expected stat_changes**:
- ✅ `hygiene:60`
- ✅ `happiness:20`

### Medicine Items (Other than med_super)

**Test**: Use `med_elixir` on baby Blobbi

**Expected stat_changes**:
- ✅ `health:80`
- ✅ `happiness:20`
- ✅ `energy:10`

## 5. Verify Egg-Specific Behavior

### Egg Actions

**Test**: Use `warm` action on egg

**Expected stat_changes**:
- ✅ `egg_temperature:10`
- ✅ `health:5`
- ✅ `shell_integrity:5`

**Test**: Use `sing` action on egg

**Expected stat_changes**:
- ✅ `happiness:8`

### Medicine on Eggs

**Test**: Use ANY medicine item on egg

**Expected Behavior**:
- ✅ `health` delta is converted to `shell_integrity` delta
- ✅ NO `health` stat_change in event
- ✅ `shell_integrity` value matches item's `healthDelta`

**Examples**:
- `med_vitamins` (healthDelta: 20) → `shell_integrity:20`
- `med_super` (healthDelta: 50) → `shell_integrity:50`
- `med_elixir` (healthDelta: 80) → `shell_integrity:80`

## 6. Browser Console Checks

### Success Indicators

When interaction succeeds, you should see:
```
[useBlobbiInteraction.interact] All validations passed
[executeInteractionFlow] START
[executeInteractionFlow] STEP 2: Publish 14919 v2 START
[executeInteractionFlow] STEP 2: Publish 14919 v2 OK
[executeInteractionFlow] STEP 3: Publish 31124 OK
[executeInteractionFlow] ALL STEPS COMPLETE - SUCCESS
[useBlobbiInteraction.interact] SUCCESS - interaction complete
```

### Error Indicators

If validation fails, you should see:
```
Error: Invalid 14919 v2 event:
  - <specific validation error>
```

If item quantity is insufficient:
```
Not enough <item-name>. Need 1, have 0
```

## 7. Network Tab Verification

### Check WebSocket Messages

1. Open DevTools → Network → WS (WebSocket)
2. Select the relay connection
3. Filter for `EVENT` messages
4. Find your interaction event (kind 14919)

**Verify**:
- ✅ Event has all required tags
- ✅ `stat_change` values are correct
- ✅ `b` tag has `blobbi:ecosystem:v2`
- ✅ `alt` tag is present

### Check Relay Response

After publishing, relay should respond:
```json
["OK", "<event-id>", true, ""]
```

If validation fails at relay level:
```json
["OK", "<event-id>", false, "error: <reason>"]
```

## 8. Regression Test Verification

### Run Tests Locally

```bash
npx vitest run src/lib/blobbi-interaction-logic.test.ts
```

**Expected Output**:
```
✓ 26 tests passed
✓ CRITICAL: med_super Regression Test > should produce shell_integrity:50 for eggs, NOT 70
✓ CRITICAL: med_super Regression Test > should produce health:50 for baby/adult, NOT 70
```

### Run Validation Tests

```bash
npx vitest run src/lib/nostr-pet/interaction-14919-v2/validate.test.ts
```

**Expected Output**:
```
✓ 22 tests passed
```

## 9. Common Issues and Solutions

### Issue: Still seeing shell_integrity:70

**Cause**: Old code cached or not deployed

**Solution**:
1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear application cache
3. Verify deployment succeeded

### Issue: Events not appearing in queries

**Cause**: Ecosystem tag filter too strict

**Solution**:
1. Check filter accepts both v1 and v2
2. Verify `blobbi:ecosystem:v2` spelling exactly
3. Check console for filter errors

### Issue: Validation errors on valid events

**Cause**: Missing required tags

**Solution**:
1. Check all required tags are present
2. Verify tag format (snake_case for stats)
3. Check console for specific validation error

## 10. Production Monitoring

### Metrics to Watch

1. **Event Publishing Success Rate**
   - Should remain at ~100%
   - Drop indicates validation issues

2. **Stat Delta Values**
   - Monitor for any values > 100
   - Watch for unexpected combinations

3. **Error Logs**
   - Filter for "Invalid 14919 v2 event"
   - Check for validation failures

### Alert Conditions

🚨 **Critical**: If any interaction produces `shell_integrity:70` or `health:70` with med_super
🚨 **Warning**: If validation error rate > 1%
🚨 **Info**: If v1 events still being published (should be v2 only)

## Summary

All fixes are verified through:
- ✅ 48 automated tests (all passing)
- ✅ Comprehensive event validation
- ✅ Backward compatibility with v1 events
- ✅ Correct stat delta calculations
- ✅ Proper egg-specific behavior

The system is production-ready.
