# Blobbi Ecosystem - Custom Nostr Protocol

This document defines the custom Nostr event kinds used by the Blobbi application.

## Overview

The Blobbi ecosystem uses several custom Nostr event kinds to implement a decentralized virtual pet game. This NIP documents the interaction event (Kind 14919) which has been upgraded to version 2 with improved stat tracking and action categorization.

## Kind 14919: Blobbi Interaction Event

**Kind**: `14919` (Regular Event)  
**Versions**: v1 (legacy), v2 (current)  
**Description**: Records interactions between users and their Blobbi pets

### Version Detection

Events are versioned using the `b` (namespace) tag:
- `["b", "blobbi:ecosystem:v1"]` - Version 1 (legacy, read-only)
- `["b", "blobbi:ecosystem:v2"]` - Version 2 (current, all new events)

**Important**: All new interaction events MUST use v2. V1 exists only for parsing historical data.

### Version 2 Specification

#### Mandatory Tags

| Tag | Description | Example |
|-----|-------------|---------|
| `t` | Topic identifier | `["t", "blobbi"]` |
| `b` | Ecosystem namespace | `["b", "blobbi:ecosystem:v2"]` |
| `blobbi_id` | Blobbi identifier | `["blobbi_id", "blobbi-fluffy"]` |
| `action` | Action performed | `["action", "feed"]` |
| `action_category` | Action category | `["action_category", "nutrition"]` |
| `stat_change` | Stat modification (multiple allowed) | `["stat_change", "hunger:15"]` |
| `client` | Client application | `["client", "blobbi"]` |

#### Optional Tags

| Tag | Description | Default | Example |
|-----|-------------|---------|---------|
| `item_used` | Item ID if used | - | `["item_used", "food_apple"]` |
| `item_quantity` | Quantity of items used | 1 | `["item_quantity", "3"]` |
| `experience_gained` | XP earned | 5 | `["experience_gained", "5"]` |
| `care_points` | Care points earned | 1 | `["care_points", "2"]` |
| `alt` | Human-readable description (NIP-31) | - | `["alt", "feed interaction with blobbi-fluffy using item food_apple"]` |

#### Actions and Categories

**Universal Actions (all stages):**
- `clean` → `care` - Clean the Blobbi
- `medicine` → `care` - Give medicine

**Egg Stage Actions:**
- `warm` → `care` - Warm the egg
- `sing` → `social` - Sing to the egg

**Baby/Adult Stage Actions:**
- `feed` → `nutrition` - Feed the Blobbi
- `play` → `enrichment` - Play with the Blobbi
- `sleep` → `recovery` - Put Blobbi to sleep
- `wake` → `recovery` - Wake up the Blobbi

**Future Actions:**
- `breed` → `general` - Breeding (stub)

#### Supported Stats

Stats are recorded in the `stat_change` tag using the format `stat_name:delta`:

- `hunger` - Hunger level (0-100)
- `happiness` - Happiness level (0-100)
- `health` - Health level (0-100)
- `hygiene` - Hygiene level (0-100)
- `energy` - Energy level (0-100)
- `egg_temperature` - Egg temperature (egg stage only, 0-100)
- `shell_integrity` - Shell integrity (egg stage only, 0-100)

**Important**: 
- Multiple `stat_change` tags can be included in a single event
- Delta values represent CHANGES, not absolute values
- Positive deltas increase stats, negative deltas decrease stats
- All stats are clamped to 0-100 range after application

#### Content Field

The `content` field is **empty** in v2. All data is stored in tags for efficient querying.

#### Item Quantity Support

When using items, the `item_quantity` tag specifies how many items are used:
- Inventory (Kind 31125) is decremented by the specified quantity
- Stat deltas are multiplied by the quantity
- Defaults to 1 if not specified

Example: Using 3 apples with `hunger:10` delta results in `hunger:30` total change.

#### Example v2 Event

```json
{
  "kind": 14919,
  "pubkey": "...",
  "created_at": 1702345678,
  "tags": [
    ["t", "blobbi"],
    ["b", "blobbi:ecosystem:v2"],
    ["blobbi_id", "blobbi-fluffy"],
    ["action", "feed"],
    ["action_category", "nutrition"],
    ["stat_change", "hunger:30"],
    ["stat_change", "happiness:10"],
    ["stat_change", "hygiene:-5"],
    ["item_used", "food_burger"],
    ["item_quantity", "2"],
    ["experience_gained", "5"],
    ["care_points", "1"],
    ["client", "blobbi"],
    ["alt", "feed interaction with blobbi-fluffy using item food_burger"]
  ],
  "content": "",
  "id": "...",
  "sig": "..."
}
```

### Version 1 Specification (Legacy)

Version 1 events use the namespace `["b", "blobbi:ecosystem:v1"]` and store interaction data in JSON content. These events are still supported for **reading historical data only**. New events MUST NOT use v1 format.

#### v1 Tags

- `["blobbi_id", "<id>"]` - Blobbi identifier
- `["action", "<action>"]` - Action performed
- `["life_stage", "<stage>"]` - Life stage (egg/baby/adult)
- `["item", "<item_id>"]` - Optional item used
- `["b", "blobbi:ecosystem:v1"]` - Ecosystem namespace
- `["t", "blobbi"]` - Topic identifier

#### v1 Content

```json
{
  "blobbiId": "blobbi-fluffy",
  "action": "feed",
  "itemId": "food_apple",
  "lifeStage": "baby"
}
```

## Event Flow

Blobbi interactions trigger a strict sequence of three events:

1. **Kind 31125** (Blobbonaut Profile) - Update inventory if item used
2. **Kind 14919** (Interaction v2) - Record the interaction
3. **Kind 31124** (Blobbi Status) - Update Blobbi state

**Critical Rules:**
- If 31125 fails → stop (don't publish 14919 or 31124)
- If 14919 fails → rollback optimistic UI updates
- 31124 must preserve all existing tags, updating only changed ones (no tag loss)

This sequence ensures:
- Inventory is decremented before the interaction is recorded
- The interaction is permanently recorded on the network
- The Blobbi's state reflects the interaction results
- No partial states or inconsistencies

## Stat Name Mapping

The system uses a consistent mapping between camelCase (BlobbiStatus fields) and snake_case (tag names):

| camelCase | snake_case |
|-----------|------------|
| `hunger` | `hunger` |
| `happiness` | `happiness` |
| `health` | `health` |
| `hygiene` | `hygiene` |
| `energy` | `energy` |
| `eggTemperature` | `egg_temperature` |
| `shellIntegrity` | `shell_integrity` |

This mapping is used consistently across:
- Kind 14919 `stat_change` tags
- Kind 31124 stat tags
- Interaction logic computations

## Migration from v1 to v2

Applications should:
1. Parse both v1 and v2 events for backward compatibility
2. **Publish only v2 events** for all new interactions
3. Use the `b` tag to detect event version
4. When displaying v1 events, derive life stage from current Blobbi state (Kind 31124), not from the v1 event

## Implementation Notes

### Stat Delta Logic

The interaction system uses **pure delta logic**:

1. `applyBlobbiInteraction()` returns PURE DELTAS (changes), not absolute values
2. Deltas are multiplied by `item_quantity` if using items
3. Deltas are applied to current stats and clamped to 0-100
4. Final values are written to Kind 31124
5. Deltas are written to Kind 14919 `stat_change` tags

**Example**:
```typescript
// Current stats
blobbi.hunger = 50

// Interaction returns delta
delta = { hunger: 30 }

// With quantity = 2
multipliedDelta = { hunger: 60 }

// Apply and clamp
newValue = clamp(50 + 60) = 100

// Write to 31124: ["hunger", "100"]
// Write to 14919: ["stat_change", "hunger:60"]
```

### Egg-Specific Rules

For eggs, medicine affects `shell_integrity` instead of `health`:
- Medicine action normally provides `health:20` delta
- For eggs, this is converted to `shell_integrity:20` delta
- The `health` delta is removed for eggs

### Sleep State Management

- `sleep` action: Sets `is_sleeping:true`, `state:sleeping`, records `sleep_started_at` timestamp
- `wake` action: Sets `is_sleeping:false`, `state:active`, clears sleep timestamps
- Wake happiness delta depends on energy level:
  - Energy ≥ 50: `happiness:+5`
  - Energy < 50: `happiness:-5`

### Action-Specific Timestamps

The following timestamps are updated in Kind 31124 based on action:
- `feed` → `last_meal`
- `clean` → `last_clean`
- `medicine` → `last_medicine`
- `warm` → `last_warm`
- `sing` → `last_sing`

All actions update `last_interaction`.

## Related Kinds

- **Kind 31124**: Blobbi Current State (addressable, replaceable)
- **Kind 31125**: Blobbonaut Profile (addressable, replaceable)

## References

- NIP-31: Alt Tag for Unknown Events
- NIP-65: Relay List Metadata
