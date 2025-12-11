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
- `["b", "blobbi:ecosystem:v1"]` - Version 1 (legacy)
- `["b", "blobbi:ecosystem:v2"]` - Version 2 (current)

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

**Egg Stage Actions:**
- `warm` → `care` - Warm the egg
- `sing` → `social` - Sing to the egg
- `clean` → `care` - Clean the egg
- `medicine` → `care` - Apply medicine

**Baby/Adult Stage Actions:**
- `feed` → `nutrition` - Feed the Blobbi
- `play` → `enrichment` - Play with the Blobbi
- `rest` → `recovery` - Put Blobbi to sleep
- `wake` → `recovery` - Wake up the Blobbi
- `clean` → `care` - Clean the Blobbi
- `medicine` → `care` - Give medicine

**Future Actions:**
- `breed` → `general` - Breeding (stub)

#### Supported Stats

Stats are recorded in the `stat_change` tag using the format `stat_name:delta`:

- `hunger` - Hunger level (0-100)
- `happiness` - Happiness level (0-100)
- `health` - Health level (0-100)
- `hygiene` - Hygiene level (0-100)
- `energy` - Energy level (0-100)
- `egg_temperature` - Egg temperature (egg stage only)
- `shell_integrity` - Shell integrity (egg stage only)

Multiple `stat_change` tags can be included in a single event.

#### Content Field

The `content` field is **empty** in v2. All data is stored in tags for efficient querying.

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

Version 1 events use the namespace `["b", "blobbi:ecosystem:v1"]` and store interaction data in JSON content. These events are still supported for backward compatibility.

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

Blobbi interactions trigger a sequence of three events:

1. **Kind 31125** (Blobbonaut Profile) - Update inventory if item used
2. **Kind 14919** (Interaction v2) - Record the interaction
3. **Kind 31124** (Blobbi Status) - Update Blobbi state

This sequence ensures:
- Inventory is decremented before the interaction
- The interaction is permanently recorded
- The Blobbi's state reflects the interaction results

## Migration from v1 to v2

Applications should:
1. Parse both v1 and v2 events for backward compatibility
2. Publish only v2 events for new interactions
3. Use the `b` tag to detect event version
4. Fall back to v1 parsing if v2 parsing fails

## Implementation Notes

- **Stat Changes**: When using items with quantity > 1, multiply stat deltas by the quantity
- **Clamping**: All stats are clamped to 0-100 range after application
- **Timestamps**: Action-specific timestamps (e.g., `last_meal`) are updated in Kind 31124
- **Sleep States**: `rest` and `wake` actions modify the `is_sleeping` and `state` fields
- **Egg-Specific**: Medicine affects `shell_integrity` instead of `health` for eggs

## Related Kinds

- **Kind 31124**: Blobbi Current State (addressable, replaceable)
- **Kind 31125**: Blobbonaut Profile (addressable, replaceable)

## References

- NIP-31: Alt Tag for Unknown Events
- NIP-65: Relay List Metadata
