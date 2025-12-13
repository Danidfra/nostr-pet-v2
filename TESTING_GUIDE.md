# Testing Guide - Event Publishing Flow

## Quick Start

1. **Open browser console** (F12 or Cmd+Option+I)
2. **Navigate to Blobbi app**
3. **Ensure you're logged in** (NIP-07 extension required)
4. **Click Feed button** (or Medicine/Clean/Toys)
5. **Select an item** (e.g., burger)
6. **Click "Use Item"**
7. **Watch console output**

## Expected Console Output

### ✅ Success Flow (Complete)

```
[HomeScreen.handleUseItemFromModal] START {
  blobbiId: "blobbi-abc123...",
  blobbiLifeStage: "baby",
  pendingAction: "feed",
  itemId: "burger",
  quantity: 1
}

[HomeScreen.handleUseItemFromModal] Computed action {
  action: "feed",
  fromPendingAction: true,
  itemCategory: "food"
}

[HomeScreen.handleUseItemFromModal] Calling interact()...

[useBlobbiInteraction.interact] START {
  userPubkey: "npub1abc...",
  hasNostr: true,
  blobbiId: "blobbi-abc123...",
  hasBlobbi: true,
  blobbiStage: "baby",
  action: "feed",
  itemId: "burger",
  itemQuantity: 1
}

[useBlobbiInteraction.interact] All validations passed

[useBlobbiInteraction.interact] Starting executeInteractionFlow...

[executeInteractionFlow] START {
  blobbiId: "blobbi-abc123...",
  action: "feed",
  itemId: "burger",
  itemQuantity: 1,
  hasProfile: true,
  ownerPubkey: "npub1abc..."
}

[executeInteractionFlow] STEP 1: Publish 31125 START {
  itemId: "burger",
  currentStorage: [
    { itemId: "burger", qty: 5 },
    { itemId: "apple", qty: 3 }
  ]
}

[executeInteractionFlow] STEP 1: Publishing 31125 {
  kind: 31125,
  tagsCount: 15,
  newStorage: [
    { itemId: "burger", qty: 4 },
    { itemId: "apple", qty: 3 }
  ]
}

[executeInteractionFlow] STEP 1: Publish 31125 OK

[executeInteractionFlow] STEP 2: Publish 14919 v2 START {
  action: "feed",
  statChanges: [
    { stat: "hunger", delta: 30 },
    { stat: "happiness", delta: 5 }
  ],
  itemUsed: "burger",
  itemQuantity: 1,
  experienceGained: 10,
  carePoints: 1
}

[executeInteractionFlow] STEP 2: Publishing 14919 v2 {
  kind: 14919,
  tagsCount: 12
}

[executeInteractionFlow] STEP 2: Publish 14919 v2 OK

[executeInteractionFlow] STEP 3: Publish 31124 START {
  changedStats: ["hunger", "happiness", "experience", "careStreak", "lastInteraction", "lastMeal"],
  newStatsValues: {
    hunger: 75,
    happiness: 85,
    experience: 110,
    careStreak: 5,
    lastInteraction: 1702500000,
    lastMeal: 1702500000
  }
}

[executeInteractionFlow] STEP 3: Publishing 31124 {
  kind: 31124,
  tagsCount: 25
}

[executeInteractionFlow] STEP 3: Publish 31124 OK

[executeInteractionFlow] ALL STEPS COMPLETE - SUCCESS

[useBlobbiInteraction.interact] executeInteractionFlow returned {
  success: true,
  error: undefined
}

[useBlobbiInteraction.interact] SUCCESS - interaction complete

[HomeScreen.handleUseItemFromModal] interact() returned {
  success: true,
  error: undefined
}

[HomeScreen.handleUseItemFromModal] SUCCESS
```

**UI Behavior:**
- ✅ Success toast appears: "Blobbi used 1x Burger!"
- ✅ Item Use Modal closes
- ✅ Inventory Modal closes
- ✅ Burger quantity decreases from 5 to 4
- ✅ Blobbi stats update (hunger increases)

### ❌ Validation Failures

#### Not Logged In
```
[useBlobbiInteraction.interact] VALIDATION FAILED: No user
```
**Toast:** "Must be logged in to interact"

#### No Nostr Client
```
[useBlobbiInteraction.interact] VALIDATION FAILED: No nostr client
```
**Toast:** "Nostr client not available"

#### Invalid Action for Stage
```
[useBlobbiInteraction.interact] VALIDATION FAILED: Invalid action for stage {
  action: "feed",
  stage: "egg"
}
```
**Toast:** "Action 'feed' is not valid for egg stage"

#### Item Not Found
```
[useBlobbiInteraction.interact] VALIDATION FAILED: Item not found { itemId: "xyz" }
```
**Toast:** "Item 'xyz' not found"

#### Insufficient Inventory
```
[useBlobbiInteraction.interact] VALIDATION FAILED: Insufficient inventory {
  itemId: "burger",
  need: 5,
  have: 2
}
```
**Toast:** "You don't have enough Burger. Need 5, have 2"

#### Blobbi Sleeping
```
[useBlobbiInteraction.interact] VALIDATION FAILED: Blobbi is sleeping {
  action: "feed",
  isSleeping: true
}
```
**Toast:** "Blobbi is sleeping. Wake them up first!"

### ❌ Publishing Failures

#### Step 1 Failed (Inventory)
```
[executeInteractionFlow] STEP 1: Publish 31125 FAILED <error details>
```
**Toast:** "Failed to update inventory: <error message>"
**Behavior:** Modals stay open, can retry

#### Step 2 Failed (Interaction)
```
[executeInteractionFlow] STEP 2: Publish 14919 v2 FAILED <error details>
```
**Toast:** "Failed to publish interaction: <error message>"
**Behavior:** Modals stay open, inventory rolled back

#### Step 3 Failed (Status)
```
[executeInteractionFlow] STEP 3: Publish 31124 FAILED <error details>
```
**Toast:** "Failed to update Blobbi state: <error message>"
**Behavior:** Modals stay open, all changes rolled back

## Relay Verification

### Using Nostr Client (e.g., nos.today, coracle.social)

1. **Check Kind 31125 (Inventory)**
   - Filter: `kind:31125 author:<your-pubkey>`
   - Look for most recent event
   - Verify tags show updated item quantities
   - Verify other items unchanged

2. **Check Kind 14919 (Interaction)**
   - Filter: `kind:14919 author:<your-pubkey>`
   - Look for most recent event
   - Verify has tag: `["b", "blobbi:ecosystem:v2"]`
   - Verify has tag: `["item_used", "burger"]`
   - Verify has tag: `["item_quantity", "1"]`
   - Verify has tags: `["stat_change", "hunger", "30"]`, etc.

3. **Check Kind 31124 (Status)**
   - Filter: `kind:31124 author:<your-pubkey>`
   - Look for most recent event
   - Verify updated stats (hunger, happiness)
   - Verify updated timestamps (lastMeal, lastInteraction)
   - Verify all other tags preserved

### Using Browser DevTools Network Tab

1. **Open Network tab**
2. **Filter by WS (WebSocket)**
3. **Perform interaction**
4. **Look for messages containing:**
   - `["EVENT", {..., "kind": 31125, ...}]`
   - `["EVENT", {..., "kind": 14919, ...}]`
   - `["EVENT", {..., "kind": 31124, ...}]`

## Troubleshooting

### No Console Output at All

**Possible causes:**
- JavaScript error preventing execution
- Console filters hiding logs
- Wrong browser tab

**Solutions:**
- Check browser console for errors
- Clear all console filters
- Ensure you're on the correct tab
- Refresh page and try again

### Stops at Validation

**Check console for specific validation error:**
- `No user` → Log in with NIP-07 extension
- `No nostr client` → Check extension is enabled
- `No blobbi` → Wait for blobbis to load
- `Invalid action` → Check blobbi life stage
- `Item not found` → Check item ID is correct
- `Insufficient inventory` → Get more items first
- `Blobbi sleeping` → Wake blobbi first

### Stops at STEP 1 (31125)

**Possible causes:**
- NIP-07 signer not responding
- Relay connection issues
- Invalid event structure

**Solutions:**
- Check signer extension is working
- Try refreshing signer permissions
- Check relay connections in settings
- Look for specific error in console

### Stops at STEP 2 (14919)

**Possible causes:**
- Relay doesn't accept kind 14919
- Invalid stat changes
- Event structure error

**Solutions:**
- Check relay supports custom kinds
- Verify stat deltas are computed correctly
- Check console error for details

### Stops at STEP 3 (31124)

**Possible causes:**
- Relay doesn't accept replaceable events
- Invalid tag structure
- Event too large

**Solutions:**
- Check relay supports kind 31124
- Verify tag format is correct
- Check event size limits

### Events Published but UI Doesn't Update

**Possible causes:**
- React Query cache not updating
- Subscription not receiving updates
- Component not re-rendering

**Solutions:**
- Check React Query DevTools
- Verify subscription is active
- Force refresh data
- Check for React errors

## Performance Checks

### Normal Behavior

- Console logs appear immediately
- No duplicate logs
- No excessive re-renders
- UI remains responsive
- Modals close smoothly

### Warning Signs

- Delayed console output
- Duplicate subscription logs
- Multiple identical logs
- UI freezes or lags
- Memory usage increases

**If you see warning signs:**
1. Check React DevTools Profiler
2. Look for infinite loops
3. Check for memory leaks
4. Verify dependency arrays
5. Check for unnecessary re-renders

## Test Scenarios

### Basic Flow
- [ ] Feed with food item (burger)
- [ ] Clean with hygiene item (soap)
- [ ] Medicine with medicine item (bandage)
- [ ] Play with toy item (ball)

### Quantity Variations
- [ ] Use 1 item
- [ ] Use 5 items at once
- [ ] Use last item (quantity becomes 0)

### Life Stages
- [ ] Egg stage (warm, sing, medicine, clean)
- [ ] Baby stage (feed, play, sleep, medicine, clean)
- [ ] Adult stage (feed, play, sleep, medicine, clean)

### Edge Cases
- [ ] Use item with insufficient quantity
- [ ] Use incompatible item for stage
- [ ] Use item while blobbi sleeping
- [ ] Use item without logging in
- [ ] Use item with no internet connection

### Error Recovery
- [ ] Disconnect internet → try use → see error
- [ ] Reconnect → retry → should work
- [ ] Close modal → reopen → state reset
- [ ] Use different item after error

## Success Criteria

### ✅ Complete Success

1. **Console shows full log chain** (22 steps)
2. **All 3 events published** (31125 → 14919 → 31124)
3. **UI updates correctly** (stats, inventory, modals)
4. **Success toast appears** with item name and quantity
5. **No errors in console**
6. **Modals close automatically**

### ✅ Proper Error Handling

1. **Specific error logged** to console
2. **User-friendly toast** with error message
3. **Modals stay open** for retry
4. **No silent failures**
5. **Can retry after fixing issue**

## Cleanup (After Verification)

Once flow is verified working in production:

1. **Consider removing verbose logs** (keep error logging)
2. **Add feature flag** for debug mode
3. **Keep validation logging** for production debugging
4. **Monitor relay publishing metrics**
5. **Set up error tracking** (e.g., Sentry)

## Notes

- Logs are prefixed with component/function name for easy filtering
- All objects are logged with context for debugging
- Errors include full stack traces
- Success/failure clearly indicated
- Timestamps can be added if needed for performance profiling
