# Blobbi Shop - Testing Checklist

## Pre-Test Setup

- [ ] User is logged in with Nostr account
- [ ] User has a Blobbonaut profile (kind 31125)
- [ ] User has some coins available (check current balance)
- [ ] User has at least one Blobbi

## Basic Purchase Flow

### Test 1: Purchase a New Item
**Scenario**: Buy an item you don't currently own

- [ ] Open the shop
- [ ] Select an item you don't own (no badge showing quantity)
- [ ] Buy modal opens
- [ ] Verify "You own: 0 / 999" is displayed
- [ ] Set quantity to 1
- [ ] Verify cost breakdown is correct
- [ ] Click "Buy"
- [ ] Verify success toast appears
- [ ] Verify coins are deducted
- [ ] Open inventory
- [ ] Verify item appears with correct quantity

**Expected Result**: Item is added to inventory, coins deducted, event published

### Test 2: Purchase an Existing Item
**Scenario**: Buy more of an item you already own

- [ ] Open the shop
- [ ] Select an item you already own (has quantity badge)
- [ ] Buy modal opens
- [ ] Verify "You own: X / 999" shows correct current quantity
- [ ] Set quantity to 2
- [ ] Verify cost breakdown is correct
- [ ] Click "Buy"
- [ ] Verify success toast appears
- [ ] Verify coins are deducted
- [ ] Open inventory
- [ ] Verify item quantity increased by 2

**Expected Result**: Item quantity increases, coins deducted, no duplicate storage tags

### Test 3: Purchase Multiple Quantity
**Scenario**: Buy 5 items at once

- [ ] Open the shop
- [ ] Select any item
- [ ] Use +/- buttons to set quantity to 5
- [ ] Verify total cost updates (price × 5)
- [ ] Verify remaining coins calculation is correct
- [ ] Click "Buy"
- [ ] Verify success toast shows "Bought 5x [Item]"
- [ ] Verify coins deducted = price × 5
- [ ] Verify item quantity increased by 5

**Expected Result**: Bulk purchase works correctly, all calculations accurate

## Validation Tests

### Test 4: Insufficient Coins
**Scenario**: Try to buy item with insufficient coins

- [ ] Note your current coin balance
- [ ] Open shop
- [ ] Select an expensive item
- [ ] Increase quantity until total cost > current coins
- [ ] Verify error message: "Not enough coins"
- [ ] Verify "Buy" button is disabled
- [ ] Verify quantity buttons are disabled
- [ ] Click "Cancel"
- [ ] Verify modal closes

**Expected Result**: Purchase blocked, clear error message shown

### Test 5: Inventory Limit (999)
**Scenario**: Try to exceed 999-item limit

**Setup**: You'll need an item with quantity close to 999 (or modify test data)

- [ ] Open shop
- [ ] Select item you own 995+ of
- [ ] Try to purchase 10 items
- [ ] Verify error message: "This purchase would exceed the inventory limit (999)"
- [ ] Verify "Buy" button is disabled
- [ ] Verify max quantity shown is correct (999 - current)
- [ ] Reduce quantity to valid amount
- [ ] Verify error clears and buy button enables

**Expected Result**: Limit enforced, cannot exceed 999 per item

### Test 6: Already at Limit
**Scenario**: Try to buy when already at 999

**Setup**: You'll need an item at exactly 999 quantity

- [ ] Open shop
- [ ] Select item at 999 quantity
- [ ] Verify error message: "You've reached the maximum inventory limit (999)"
- [ ] Verify "Buy" button is disabled
- [ ] Verify quantity selector is disabled
- [ ] Verify "You own: 999 / 999" is displayed

**Expected Result**: Purchase completely blocked at limit

## UI/UX Tests

### Test 7: Quantity Controls
**Scenario**: Test quantity selector behavior

- [ ] Open shop, select any item
- [ ] Click "-" button
- [ ] Verify quantity doesn't go below 1
- [ ] Verify "-" button is disabled at quantity 1
- [ ] Click "+" button multiple times
- [ ] Verify quantity increases
- [ ] Verify "+" button is disabled when reaching max
- [ ] Type a number directly in the input field
- [ ] Verify number is accepted if valid
- [ ] Type 0 or negative number
- [ ] Verify it's corrected to minimum (1)
- [ ] Type a number > max
- [ ] Verify it's corrected to maximum

**Expected Result**: All controls work correctly, bounds enforced

### Test 8: Cost Breakdown Updates
**Scenario**: Verify real-time cost calculations

- [ ] Open shop, select any item
- [ ] Note the price per unit
- [ ] Increase quantity to 3
- [ ] Verify total cost = price × 3
- [ ] Verify remaining coins = current coins - total cost
- [ ] Increase quantity to 5
- [ ] Verify all values update correctly
- [ ] Verify color coding (green for positive remaining coins)

**Expected Result**: All calculations update in real-time and are accurate

### Test 9: Loading States
**Scenario**: Verify loading feedback during purchase

- [ ] Open shop, select an item
- [ ] Click "Buy"
- [ ] Verify button shows "Purchasing..." during request
- [ ] Verify button is disabled during purchase
- [ ] Verify quantity controls are disabled during purchase
- [ ] Wait for purchase to complete
- [ ] Verify modal closes on success

**Expected Result**: Clear loading feedback, no double-purchases possible

### Test 10: Category Filtering
**Scenario**: Test shop category tabs

- [ ] Open shop
- [ ] Click "Food" tab
- [ ] Verify only food items shown
- [ ] Click "Toys" tab
- [ ] Verify only toy items shown
- [ ] Click "Medicine" tab
- [ ] Verify only medicine items shown
- [ ] Click "Hygiene" tab
- [ ] Verify only hygiene items shown
- [ ] Click "Accessories" tab
- [ ] Verify only accessory items shown
- [ ] Click "All" tab
- [ ] Verify all items shown

**Expected Result**: Filtering works correctly for all categories

## Event Structure Tests

### Test 11: Tag Preservation
**Scenario**: Verify all tags are preserved during purchase

**Setup**: Use browser dev tools or Nostr client to inspect events

- [ ] Before purchase, note all tags in your profile event
- [ ] Make a purchase
- [ ] Inspect the new event published
- [ ] Verify `coins` tag updated
- [ ] Verify relevant `storage` tag updated
- [ ] Verify ALL other tags are unchanged:
  - [ ] `d` (profile ID)
  - [ ] `name`
  - [ ] `pettingLevel`
  - [ ] `has` tags (owned Blobbis)
  - [ ] Other `storage` tags
  - [ ] `b` (ecosystem tag)
  - [ ] `t` (topic tag)
  - [ ] Any other tags present

**Expected Result**: Only coins and one storage tag change, everything else preserved

### Test 12: Storage Tag Format
**Scenario**: Verify storage tags are correctly formatted

- [ ] Make a purchase
- [ ] Inspect the event
- [ ] Verify storage tag format: `["storage", "item_id", "quantity"]`
- [ ] Verify quantity is a string number
- [ ] Verify no duplicate storage tags for same item
- [ ] If buying new item, verify tag is added
- [ ] If buying existing item, verify tag is updated (not duplicated)

**Expected Result**: Storage tags follow correct format, no duplicates

### Test 13: Event Content
**Scenario**: Verify event content is empty

- [ ] Make a purchase
- [ ] Inspect the event
- [ ] Verify `content` field is empty string `""`
- [ ] Verify it's not `null` or `undefined`

**Expected Result**: Content is always empty string

## Edge Cases

### Test 14: Rapid Purchases
**Scenario**: Click buy button multiple times quickly

- [ ] Open shop, select an item
- [ ] Click "Buy" button rapidly 3-5 times
- [ ] Verify only ONE purchase executes
- [ ] Verify coins deducted only once
- [ ] Verify item quantity increases by correct amount (not multiplied)

**Expected Result**: No duplicate purchases, button disabled during processing

### Test 15: Cancel During Purchase
**Scenario**: Try to cancel while purchase is processing

- [ ] Open shop, select an item
- [ ] Click "Buy"
- [ ] Immediately click "Cancel" or X button
- [ ] Verify modal doesn't close until purchase completes
- [ ] Verify purchase still completes successfully

**Expected Result**: Cancel is disabled during purchase processing

### Test 16: Network Error Handling
**Scenario**: Simulate network failure during purchase

**Setup**: Use browser dev tools to throttle or block network

- [ ] Throttle network to slow 3G
- [ ] Open shop, select an item
- [ ] Click "Buy"
- [ ] Verify loading state shows
- [ ] Wait for timeout or error
- [ ] Verify error toast appears with clear message
- [ ] Verify modal doesn't close on error
- [ ] Verify coins were NOT deducted
- [ ] Verify inventory NOT updated

**Expected Result**: Graceful error handling, no data corruption

### Test 17: Maximum Purchasable Calculation
**Scenario**: Verify max quantity calculation is correct

- [ ] Open shop
- [ ] Select an item
- [ ] Note the "Max: X" value shown
- [ ] Verify it's the minimum of:
  - Coins available ÷ item price (rounded down)
  - 999 - current quantity
- [ ] Try different items with different prices
- [ ] Verify calculation is always correct

**Expected Result**: Max quantity always calculated correctly

## Integration Tests

### Test 18: Shop → Inventory Flow
**Scenario**: Purchase item, then use it from inventory

- [ ] Note current Blobbi stats
- [ ] Open shop, buy a food item
- [ ] Close shop
- [ ] Open inventory
- [ ] Verify item appears with correct quantity
- [ ] Click the item
- [ ] Use 1 item
- [ ] Verify Blobbi stats update
- [ ] Verify item quantity decreases by 1

**Expected Result**: Seamless flow from purchase to usage

### Test 19: Multiple Purchases Session
**Scenario**: Make several purchases in one session

- [ ] Note starting coin balance
- [ ] Purchase item A (quantity 2)
- [ ] Verify coins deducted
- [ ] Purchase item B (quantity 1)
- [ ] Verify coins deducted again
- [ ] Purchase more of item A (quantity 3)
- [ ] Verify item A quantity is now 5 total
- [ ] Verify total coins deducted = sum of all purchases
- [ ] Close and reopen shop
- [ ] Verify all quantities and coin balance persist

**Expected Result**: All purchases tracked correctly, data persists

### Test 20: Cross-Device Sync
**Scenario**: Purchase on one device, verify on another

**Setup**: Login to same account on two devices

- [ ] Device A: Note current coins and inventory
- [ ] Device A: Make a purchase
- [ ] Device B: Refresh or wait for real-time update
- [ ] Device B: Verify coins updated
- [ ] Device B: Verify inventory updated
- [ ] Device B: Make another purchase
- [ ] Device A: Verify updates appear

**Expected Result**: Real-time sync works across devices

## Performance Tests

### Test 21: Large Inventory
**Scenario**: Test with many items in inventory

**Setup**: Have 20+ different items in inventory

- [ ] Open shop
- [ ] Verify shop loads quickly
- [ ] Make a purchase
- [ ] Verify no lag or freezing
- [ ] Open inventory
- [ ] Verify inventory loads quickly
- [ ] Verify all items displayed correctly

**Expected Result**: Good performance even with large inventory

### Test 22: Rapid Shop Opening/Closing
**Scenario**: Open and close shop repeatedly

- [ ] Open shop
- [ ] Close shop
- [ ] Repeat 10 times rapidly
- [ ] Verify no errors in console
- [ ] Verify no memory leaks
- [ ] Verify shop still works correctly

**Expected Result**: Stable behavior, no crashes or errors

## Acceptance Criteria Summary

All tests should pass with these results:

✅ **Functionality**
- Purchases execute correctly
- Coins deducted accurately
- Inventory updated properly
- Events published successfully

✅ **Validation**
- Insufficient coins blocked
- Inventory limits enforced
- Invalid inputs prevented
- Clear error messages

✅ **Data Integrity**
- No duplicate storage tags
- All tags preserved
- No data loss
- Atomic updates (coins + storage)

✅ **User Experience**
- Smooth interactions
- Clear feedback
- Loading states visible
- Error recovery works

✅ **Performance**
- Fast load times
- No freezing or lag
- Efficient updates
- Real-time sync

## Bug Reporting Template

If you find any issues, report them with:

```
**Test**: [Test number and name]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:


**Actual Result**:


**Additional Info**:
- Current coins:
- Item ID:
- Quantity attempted:
- Browser:
- Console errors:
```

## Sign-Off

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Ready for production

**Tester Name**: _______________
**Date**: _______________
**Signature**: _______________
