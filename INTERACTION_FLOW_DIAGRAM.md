# Blobbi Interaction Flow - Visual Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER CLICKS ACTION BUTTON                        │
│                    (Feed / Medicine / Clean / Toys)                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      openInventory(tab, action)                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  setSelectedInventoryTab('food' | 'medicine' | 'hygiene' | 'toy')│   │
│  │  setPendingAction('feed' | 'medicine' | 'clean' | 'play')        │   │
│  │  setIsActionsOpen(false)                                         │   │
│  │  setIsInventoryOpen(true)                                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       INVENTORY MODAL OPENS                              │
│                    (Correct tab already active)                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  📦 Food Tab    💊 Medicine Tab    🧼 Hygiene Tab    🎮 Toys Tab │   │
│  │                                                                  │   │
│  │  [Item 1]  [Item 2]  [Item 3]  [Item 4]  [Item 5]              │   │
│  │   Qty: 5    Qty: 3    Qty: 1    Qty: 2    Qty: 10              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      USER CLICKS ON AN ITEM                              │
│                     handleItemClick(itemId)                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ITEM USE MODAL OPENS                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  🍎 Apple                                                        │   │
│  │  Category: Food                                                  │   │
│  │  You have: 5                                                     │   │
│  │                                                                  │   │
│  │  Effects:                                                        │   │
│  │  • Hunger: +30                                                   │   │
│  │  • Happiness: +5                                                 │   │
│  │                                                                  │   │
│  │  Quantity to use: [−] [1] [+]                                   │   │
│  │                                                                  │   │
│  │  [Cancel]  [Use Item]                                           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     USER CLICKS "USE ITEM"                               │
│              handleUseItemFromModal(itemId, quantity)                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DETERMINE ACTION TO USE                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  const action = pendingAction || (fallback from item category)  │   │
│  │                                                                  │   │
│  │  If pendingAction = 'feed' → use 'feed'                         │   │
│  │  If pendingAction = null → determine from item.category         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  interact({ action, itemId, itemQuantity })              │
│                      (useBlobbiInteraction hook)                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VALIDATION CHECKS                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ✓ User logged in?                                               │   │
│  │  ✓ Nostr client available?                                       │   │
│  │  ✓ Blobbi exists?                                                │   │
│  │  ✓ Action valid for life stage?                                  │   │
│  │  ✓ Item compatible with stage?                                   │   │
│  │  ✓ Sufficient inventory?                                         │   │
│  │  ✓ Blobbi not sleeping (or action is 'wake')?                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPUTE STAT DELTAS                                 │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  applyBlobbiInteraction(blobbi, stage, action, itemId)           │   │
│  │                                                                  │   │
│  │  Base deltas × quantity:                                         │   │
│  │  • hunger: +30 × 1 = +30                                         │   │
│  │  • happiness: +5 × 1 = +5                                        │   │
│  │  • experience: +10 (reward)                                      │   │
│  │  • careStreak: +1 (reward)                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      OPTIMISTIC UPDATES                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  1. Update Blobbi status in React Query cache                    │   │
│  │     • Apply stat deltas with clamping (0-100)                    │   │
│  │     • Update timestamps (lastMeal, lastInteraction, etc.)        │   │
│  │                                                                  │   │
│  │  2. Decrement inventory in React Query cache                     │   │
│  │     • Find item in storage                                       │   │
│  │     • Reduce quantity by itemQuantity                            │   │
│  │     • Remove if quantity reaches 0                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   EXECUTE 3-EVENT INTERACTION FLOW                       │
│                      executeInteractionFlow()                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   EVENT 1/3      │   │   EVENT 2/3      │   │   EVENT 3/3      │
│                  │   │                  │   │                  │
│  Kind 31125      │   │  Kind 14919 v2   │   │  Kind 31124      │
│  Inventory       │   │  Interaction     │   │  Blobbi Status   │
│  Update          │   │  Event           │   │  Update          │
│                  │   │                  │   │                  │
│  Tags:           │   │  Tags:           │   │  Tags:           │
│  • d: profile    │   │  • b: blobbi:    │   │  • d: blobbi-id  │
│  • item: apple   │   │    ecosystem:v2  │   │  • hunger: 75    │
│  • qty: 4        │   │  • blobbi_id     │   │  • happiness: 85 │
│  • item: bread   │   │  • item_used     │   │  • energy: 60    │
│  • qty: 10       │   │  • item_quantity │   │  • health: 90    │
│  • ...           │   │  • stat_change   │   │  • hygiene: 70   │
│                  │   │    (hunger: +30) │   │  • lastMeal: now │
│  (Only the used  │   │  • stat_change   │   │  • experience    │
│   item quantity  │   │    (happy: +5)   │   │  • careStreak    │
│   is changed)    │   │  • timestamp     │   │  • ...           │
└──────────────────┘   └──────────────────┘   └──────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PUBLISH TO NOSTR RELAYS                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  All 3 events signed and published to configured relays          │   │
│  │  Relays store events and broadcast to subscribers                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌──────────────────┐      ┌──────────────────┐
          │     SUCCESS      │      │      FAILURE     │
          └────────┬─────────┘      └────────┬─────────┘
                   │                         │
                   ▼                         ▼
    ┌──────────────────────────┐  ┌──────────────────────────┐
    │  Success Handling:       │  │  Failure Handling:       │
    │                          │  │                          │
    │  • Show success toast    │  │  • Rollback optimistic   │
    │  • Close item modal      │  │    updates               │
    │  • Close inventory modal │  │  • Show error toast      │
    │  • Clear pendingAction   │  │  • Keep modals open      │
    │  • UI updates via cache  │  │  • Allow user to retry   │
    └──────────────────────────┘  └──────────────────────────┘
```

## Action Button Mapping Table

| UI Button | Inventory Tab | Pending Action | Item Category | Final Action Used |
|-----------|---------------|----------------|---------------|-------------------|
| 🍽️ Feed  | `food`        | `feed`         | `food`        | `feed`            |
| 💊 Medicine | `medicine`  | `medicine`     | `medicine`    | `medicine`        |
| ✨ Clean | `hygiene`     | `clean`        | `hygiene`     | `clean`           |
| 🎮 Toys  | `toy`         | `play`         | `toy`         | `play`            |
| 🎒 Inventory | `all`      | `null`         | (any)         | (from category)   |

## State Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    INITIAL STATE                             │
│  selectedInventoryTab = 'all'                                │
│  pendingAction = null                                        │
│  isInventoryOpen = false                                     │
│  isItemModalOpen = false                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ User clicks "Feed" button
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  INVENTORY OPEN STATE                        │
│  selectedInventoryTab = 'food'                               │
│  pendingAction = 'feed'                                      │
│  isInventoryOpen = true                                      │
│  isItemModalOpen = false                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ User clicks item
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   ITEM MODAL OPEN STATE                      │
│  selectedInventoryTab = 'food'                               │
│  pendingAction = 'feed'                                      │
│  isInventoryOpen = true                                      │
│  isItemModalOpen = true                                      │
│  selectedItem = { id: 'apple', ... }                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ User clicks "Use Item"
                        │ (success)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACK TO INITIAL STATE                       │
│  selectedInventoryTab = 'all'                                │
│  pendingAction = null                                        │
│  isInventoryOpen = false                                     │
│  isItemModalOpen = false                                     │
│  selectedItem = null                                         │
└─────────────────────────────────────────────────────────────┘
```

## Error Recovery Flow

```
User clicks "Use Item"
        │
        ▼
Validation fails (e.g., insufficient inventory)
        │
        ▼
┌─────────────────────────────────────────────────┐
│  Error State (Modals Remain Open)               │
│  • Show error toast with specific message       │
│  • Keep Item Use Modal open                     │
│  • Keep Inventory Modal open                    │
│  • User can:                                    │
│    - Adjust quantity                            │
│    - Select different item                      │
│    - Cancel and close                           │
└─────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Pending Action vs Category Detection

**With Pending Action (from action button):**
```
Feed button → pendingAction = 'feed' → Always uses 'feed' action
```

**Without Pending Action (direct inventory access):**
```
Inventory button → pendingAction = null → Uses item.category to determine action
```

### 2. State Cleanup Strategy

**On Modal Close:**
- Reset `selectedInventoryTab` to `'all'`
- Clear `pendingAction` to `null`
- Prevents stale state when reopening

**On Success:**
- Close both modals
- Clear pending action
- Clear selected item
- Let optimistic updates handle UI refresh

**On Failure:**
- Keep modals open
- Keep state intact
- Allow user to retry or adjust

### 3. Atomic State Updates

```typescript
// ✅ Good: All related state set together
const openInventory = (tab, action) => {
  setSelectedInventoryTab(tab);
  setPendingAction(action);
  setIsActionsOpen(false);
  setIsInventoryOpen(true);
};

// ❌ Bad: State updates scattered
setSelectedInventoryTab(tab);
// ... other code ...
setPendingAction(action);
// ... race condition risk ...
setIsInventoryOpen(true);
```

## Integration Points

### React Query Cache

```
User Action
    ↓
Optimistic Update
    ↓
React Query Cache Modified
    ↓
UI Re-renders (instant feedback)
    ↓
Network Request
    ↓
Success → Cache stays updated
Failure → Cache rolled back
```

### Nostr Event Flow

```
Local State
    ↓
Event Creation
    ↓
Event Signing (via signer)
    ↓
Relay Publishing
    ↓
Relay Confirmation
    ↓
Other Clients Receive Updates
```

This visual representation shows the complete flow from user interaction to Nostr event publication and back to UI updates.
