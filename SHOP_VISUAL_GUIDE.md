# Blobbi Shop - Visual Flow Guide

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOME SCREEN                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Header: [Logo] [Shop 🛒] [Theme] [Menu]                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│                    [Blobbi Character]                            │
│                                                                  │
│              User clicks Shop button (🛒)                        │
│                         ↓                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SHOP MODAL                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Shop                                           [X]       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  [All] [Food] [Toys] [Medicine] [Hygiene] [Accessories] │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │  │
│  │  │ 💰10  5│  │ 💰25   │  │ 💰50   │  │ 💰35   │        │  │
│  │  │   🍎   │  │   🍔   │  │   🎂   │  │   🍕   │        │  │
│  │  │ Apple  │  │ Burger │  │  Cake  │  │ Pizza  │        │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘        │  │
│  │                                                           │  │
│  │  💰10 = Price    5 = Owned quantity (if > 0)            │  │
│  │                                                           │  │
│  │              User clicks an item                          │  │
│  │                      ↓                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BUY ITEM MODAL                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🍎 Apple                                        [X]     │  │
│  │  Basic healthy snack                                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  Category: food                                           │  │
│  │  Price (per unit): 💰 10                                 │  │
│  │  You own: 5 / 999                                        │  │
│  │                                                           │  │
│  │  Quantity to purchase:                                    │  │
│  │  [ - ] [ 3 ] [ + ]                                       │  │
│  │  Max: 94  (limited by coins or inventory)               │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────┐        │  │
│  │  │ Cost Breakdown                               │        │  │
│  │  │ Total cost:        💰 30                    │        │  │
│  │  │ Current coins:     💰 250                   │        │  │
│  │  │ ────────────────────────────────────────    │        │  │
│  │  │ Remaining coins:   💰 220                   │        │  │
│  │  └─────────────────────────────────────────────┘        │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────┐        │  │
│  │  │ Effects when used (per item):                │        │  │
│  │  │ Hunger:    +15                               │        │  │
│  │  │ Hygiene:   -2                                │        │  │
│  │  │ Energy:    +5                                │        │  │
│  │  └─────────────────────────────────────────────┘        │  │
│  │                                                           │  │
│  │  [Cancel]              [Buy 3 for 30 💰]                │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

                              ↓
                    User clicks "Buy"
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│                    PURCHASE PROCESSING                           │
│                                                                  │
│  1. Validate purchase constraints                               │
│     ✓ Sufficient coins (250 >= 30)                              │
│     ✓ Inventory limit (5 + 3 <= 999)                            │
│                                                                  │
│  2. Calculate new values                                        │
│     • New coins: 250 - 30 = 220                                 │
│     • New quantity: 5 + 3 = 8                                   │
│                                                                  │
│  3. Update profile (preserving all tags)                        │
│     • coins: 250 → 220                                          │
│     • storage:food_apple: 5 → 8                                 │
│     • All other tags: UNCHANGED                                 │
│                                                                  │
│  4. Publish Kind 31125 event                                    │
│     • Sign event with user's key                                │
│     • Publish to relays                                         │
│                                                                  │
│  5. Update local cache immediately                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              ↓
                         SUCCESS!
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│                      SUCCESS FEEDBACK                            │
│                                                                  │
│  ✅ Toast notification:                                          │
│     "Purchase Successful!"                                       │
│     "Bought 3x Apple! 220 coins remaining."                     │
│                                                                  │
│  • Buy modal closes                                              │
│  • Shop modal remains open (can buy more)                       │
│  • Inventory updated immediately                                │
│  • Coin balance updated in UI                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Error States

### Insufficient Coins
```
┌─────────────────────────────────────────────────────────────────┐
│  BUY ITEM MODAL                                                  │
│                                                                  │
│  🍎 Apple                                                        │
│  Price: 💰 10                                                    │
│  You own: 5 / 999                                               │
│  Current coins: 💰 8                                             │
│                                                                  │
│  Quantity: [ - ] [ 1 ] [ + ]  (disabled)                        │
│                                                                  │
│  ⚠️ Not enough coins to purchase this item.                     │
│                                                                  │
│  [Cancel]              [Buy] (disabled)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Inventory Limit Reached
```
┌─────────────────────────────────────────────────────────────────┐
│  BUY ITEM MODAL                                                  │
│                                                                  │
│  🍎 Apple                                                        │
│  Price: 💰 10                                                    │
│  You own: 999 / 999                                             │
│  Current coins: 💰 250                                           │
│                                                                  │
│  Quantity: [ - ] [ 1 ] [ + ]  (disabled)                        │
│                                                                  │
│  ⚠️ You've reached the maximum inventory limit (999) for        │
│     this item.                                                   │
│                                                                  │
│  [Cancel]              [Buy] (disabled)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Would Exceed Limit
```
┌─────────────────────────────────────────────────────────────────┐
│  BUY ITEM MODAL                                                  │
│                                                                  │
│  🍎 Apple                                                        │
│  Price: 💰 10                                                    │
│  You own: 995 / 999                                             │
│  Current coins: 💰 250                                           │
│                                                                  │
│  Quantity: [ - ] [ 5 ] [ + ]                                    │
│  Max: 4                                                          │
│                                                                  │
│  ⚠️ This purchase would exceed the inventory limit (999).       │
│                                                                  │
│  [Cancel]              [Buy] (disabled)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Kind 31125 Event Structure

### Before Purchase
```json
{
  "kind": 31125,
  "content": "",
  "tags": [
    ["d", "Blobbonaut-abc12345"],
    ["name", "Player1"],
    ["coins", "250"],
    ["pettingLevel", "10"],
    ["has", "blobbi-123"],
    ["has", "blobbi-456"],
    ["storage", "food_apple", "5"],
    ["storage", "toy_ball", "2"],
    ["b", "blobbi:ecosystem:v1"],
    ["t", "blobbi"]
  ]
}
```

### After Purchase (3x Apple for 30 coins)
```json
{
  "kind": 31125,
  "content": "",
  "tags": [
    ["d", "Blobbonaut-abc12345"],
    ["name", "Player1"],
    ["coins", "220"],                    // ← UPDATED (250 - 30)
    ["pettingLevel", "10"],              // ← UNCHANGED
    ["has", "blobbi-123"],               // ← UNCHANGED
    ["has", "blobbi-456"],               // ← UNCHANGED
    ["storage", "food_apple", "8"],      // ← UPDATED (5 + 3)
    ["storage", "toy_ball", "2"],        // ← UNCHANGED
    ["b", "blobbi:ecosystem:v1"],        // ← UNCHANGED
    ["t", "blobbi"]                      // ← UNCHANGED
  ]
}
```

### Purchasing New Item (didn't own before)
```json
{
  "kind": 31125,
  "content": "",
  "tags": [
    ["d", "Blobbonaut-abc12345"],
    ["name", "Player1"],
    ["coins", "190"],                    // ← UPDATED (220 - 30)
    ["pettingLevel", "10"],              // ← UNCHANGED
    ["has", "blobbi-123"],               // ← UNCHANGED
    ["has", "blobbi-456"],               // ← UNCHANGED
    ["storage", "food_apple", "8"],      // ← UNCHANGED
    ["storage", "toy_ball", "2"],        // ← UNCHANGED
    ["storage", "food_burger", "1"],     // ← NEW TAG ADDED
    ["b", "blobbi:ecosystem:v1"],        // ← UNCHANGED
    ["t", "blobbi"]                      // ← UNCHANGED
  ]
}
```

## Key Principles

### ✅ DO
- Preserve ALL existing tags
- Only modify `coins` and relevant `storage` tag
- Validate before publishing
- Update cache immediately
- Show clear error messages
- Use atomic operations

### ❌ DON'T
- Rebuild the entire event from scratch
- Remove unrelated tags
- Reorder tags unnecessarily
- Allow negative coins
- Exceed inventory limits
- Publish multiple events for one purchase

## Validation Flow

```
Purchase Request
      ↓
┌─────────────────┐
│ Item exists?    │ → No → Error: "Item not found"
└─────────────────┘
      ↓ Yes
┌─────────────────┐
│ Quantity > 0?   │ → No → Error: "Quantity must be > 0"
└─────────────────┘
      ↓ Yes
┌─────────────────┐
│ Enough coins?   │ → No → Error: "Not enough coins"
└─────────────────┘
      ↓ Yes
┌─────────────────┐
│ Within limit?   │ → No → Error: "Inventory limit exceeded"
└─────────────────┘
      ↓ Yes
┌─────────────────┐
│ Execute Purchase│
└─────────────────┘
      ↓
┌─────────────────┐
│ Update Profile  │
└─────────────────┘
      ↓
┌─────────────────┐
│ Publish Event   │
└─────────────────┘
      ↓
┌─────────────────┐
│ Update Cache    │
└─────────────────┘
      ↓
    SUCCESS
```

## Summary

The Blobbi Shop provides a seamless, validated purchasing experience that:
- Ensures data integrity through careful validation
- Provides immediate feedback to users
- Follows Nostr best practices (delta updates)
- Maintains a clean event structure
- Handles all edge cases gracefully
- Offers excellent UX with clear messaging
