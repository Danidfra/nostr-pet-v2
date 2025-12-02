# Nostr Event Kinds – nostr-pet v1

**Complete Technical Reference**  
Generated: December 1, 2025  
Purpose: Data layer migration to nostr-pet-v2

---

## Overview

nostr-pet v1 implements **5 custom Nostr event kinds** following NIP-BB (Blobbi Virtual Pet Lifecycle Events). This document catalogs every kind, tag, content format, usage pattern, and implementation detail as they exist in v1.

**Event Kinds Summary:**

| Kind | Type | Name | Mutability | Purpose |
|------|------|------|------------|---------|
| `31124` | Addressable | Blobbi Current State | Replaceable | Real-time pet status |
| `14919` | Regular | Blobbi Interaction | Immutable | Care action records |
| `14920` | Regular | Blobbi Breeding | Immutable | Cross-breeding events |
| `14921` | Regular | Blobbi Record | Immutable | Lifecycle milestones |
| `31125` | Addressable | Blobbonaut Profile | Replaceable | Owner profile data |

---

## Kind 31124: Blobbi Current State

**Type:** Addressable (Parameterized Replaceable)  
**Replaceability:** Latest event per `(pubkey, kind, d)` combination  
**Purpose:** Tracks real-time status of a single Blobbi pet

### Tags

#### Required Tags

| Tag | Format | Description | Example |
|-----|--------|-------------|---------|
| `d` | `blobbi-{name}` | Unique Blobbi identifier | `blobbi-fluffy` |
| `stage` | `egg` \| `baby` \| `adult` | Current life stage | `baby` |
| `breeding_ready` | `true` \| `false` | Breeding eligibility | `false` |
| `generation` | Integer | Generation number | `1` |
| `hunger` | 0-100 | Hunger stat | `75` |
| `happiness` | 0-100 | Happiness stat | `85` |
| `health` | 0-100 | Health stat | `90` |
| `hygiene` | 0-100 | Hygiene stat | `60` |
| `energy` | 0-100 | Energy stat | `70` |
| `experience` | Integer ≥ 0 | Total XP earned | `150` |
| `care_streak` | Integer ≥ 0 | Consecutive care days | `3` |
| `last_interaction` | Unix timestamp (seconds) | Last care action time | `1703123456` |

**Validation Notes:**
- All stats are clamped to 0-100 range
- Missing stats trigger auto-repair system (see Special Rules)
- `d` tag must match pattern `^blobbi-[a-z0-9_-]+$`

#### Optional Core Tags

| Tag | Format | Description | Stage Availability |
|-----|--------|-------------|-------------------|
| `base_color` | Hex color | Primary color | All |
| `secondary_color` | Hex color | Secondary color | All (except divine) |
| `pattern` | String | Visual pattern | All |
| `eye_color` | String | Eye color | All |
| `special_mark` | String | Special marking | All |
| `adult_type` | Evolution form | Adult evolution | Adult only |
| `manifestation` | String | Divine manifestation | Divine only |
| `visual_effect` | String | Visual effects | All |
| `blessing` | String | Divine blessing | Divine only |

**Evolution Forms:**
`blobbi` | `pandi` | `owli` | `catti` | `froggi` | `cloudi` | `crysti` | `bloomi` | `starri` | `flammi` | `droppi` | `breezy` | `rocky` | `cacti` | `mushie` | `leafy` | `rosey`

#### Optional Personality Tags (Multi-value)

| Tag | Format | Description | Multi-value |
|-----|--------|-------------|-------------|
| `personality` | String | Personality traits | ✅ Yes |
| `trait` | String | Character traits | ✅ Yes |
| `mood` | String | Current mood | No |
| `favorite_food` | String | Preferred food | No |
| `voice_type` | String | Voice characteristics | No |
| `size` | String | Physical size | No |
| `title` | String | Special title | No |
| `skill` | String | Special skills | No |

**Mood Values:**
`happy` | `sad` | `sleepy` | `hungry` | `dirty` | `sick` | `neutral` | `playful`

#### Optional Egg-Specific Tags (stage="egg" only)

| Tag | Format | Description | Required for Egg |
|-----|--------|-------------|------------------|
| `incubation_time` | Unix timestamp | Time spent incubating | No |
| `incubation_progress` | 0-100 | Hatching progress % | No |
| `egg_temperature` | 0-100 | Temperature level | No |
| `egg_status` | String | Current egg status | No |
| `shell_integrity` | 0-100 | Shell condition | No |

**Egg-Only Tag Removal:**
When transitioning from `egg` → `baby`, these tags are **automatically removed** by `filterEggTagsForBaby()`:
- All tags listed above
- All tags matching patterns: `_progress`, `_confirmed`, `quest_`, `task_`, `incubation_`

#### Optional Behavior Tags

| Tag | Format | Description | Notes |
|-----|--------|-------------|-------|
| `is_sleeping` | `true` \| `false` | Sleep state | Always present |
| `state` | `active` \| `sleeping` \| `hibernating` | Current state | Derived from sleep |
| `sleep_started_at` | Unix timestamp | Sleep start time | Only when sleeping |
| `last_sleep_update` | Unix timestamp | Last energy update during sleep | Only when sleeping |
| `is_dirty` | `true` \| `false` | Cleanliness flag | Deprecated |
| `has_buff` | String | Active buff | Rare |
| `has_debuff` | String | Active debuff | Rare |

**Critical Sleep Logic:**
- `is_sleeping` is **always** set (even when `false`)
- `sleep_started_at` and `last_sleep_update` are **only** present when `is_sleeping=true`
- When waking up, sleep tags are **omitted** (not set to empty/null)

#### Optional Care Tracking Tags (Unix timestamps)

| Tag | Description | Stage Availability |
|-----|-------------|-------------------|
| `last_meal` | Last feeding time | Baby, Adult |
| `last_clean` | Last cleaning time | Baby, Adult |
| `last_warm` | Last warming time | Egg |
| `last_check` | Last check time | Egg |
| `last_sing` | Last singing time | Egg |
| `last_talk` | Last talking time | Egg |
| `last_medicine` | Last medicine time | All |

**Timestamp Format:** Unix seconds (same as Nostr `created_at`)

#### Optional Social Tags

| Tag | Format | Description |
|-----|--------|-------------|
| `adopted_by` | npub/hex | Adopter pubkey |
| `adopted_from` | npub/hex | Previous owner |
| `current_location` | String | Current location |
| `in_party` | `true` \| `false` | Party participation |
| `visible_to_others` | `true` \| `false` | Visibility setting |

#### Optional Special Tags

| Tag | Format | Description | Usage |
|-----|--------|-------------|-------|
| `fees` | Integer | Adoption fees | Adoption events |
| `penalty` | String | Penalty type | Shell integrity breach |
| `value` | String | Penalty value | With penalty tag |
| `care_points_deducted` | Integer | Care points lost | With penalty tag |

#### Divine Theme Tags

| Tag | Format | Description | Required for Divine |
|-----|--------|-------------|---------------------|
| `theme` | `divine` | Divine theme identifier | ✅ Yes |
| `crossover_app` | `divine` | Crossover app identifier | ✅ Yes |
| `manifestation` | String | Special manifestation | No |
| `blessing` | String | Special blessing | No |

**Divine Rules:**
- `secondary_color` is **always removed** for divine Blobbis
- `theme` and `crossover_app` must both be `"divine"`

#### Preserved Tags (Long-running Processes)

These tags are **preserved** across state updates:
- `start_incubation` - Incubation start timestamp
- `start_evolution` - Evolution start timestamp
- `hatch_time` - Hatching timestamp
- Any tag ending with `_progress` or `_confirmed`
- Any tag starting with `quest_`, `task_`, or `incubation_`

#### Meta Tags (Auto-added)

| Tag | Format | Description | Auto-added |
|-----|--------|-------------|------------|
| `b` | `blobbi:ecosystem:v1` | Blobbi ecosystem identifier | ✅ Yes |
| `t` | `blobbi` | Topic tag | ✅ Yes |
| `source` | `user` \| `auto` \| `system` | Update source | ✅ Yes |

**Source Values:**
- `user` - Direct user action (prevents auto-reaction)
- `auto` - System-triggered update
- `system` - Internal process

### Content Format

**Type:** Plain text  
**Format:** `{name} is a {stage} Blobbi.`

**Examples:**
```
Fluffy is a baby Blobbi.
Sparkle is an egg Blobbi.
Thunder is an adult Blobbi.
```

### Event Replaceability

**Addressable Event:** Only the **latest** event per `(pubkey, kind, d)` is stored by relays.

**Query Pattern:**
```javascript
const events = await nostr.query([{
  kinds: [31124],
  authors: [pubkey],
  '#d': ['blobbi-fluffy'],
  limit: 1
}]);
```

**Update Pattern:**
```javascript
// Publishing a new 31124 event replaces the previous one
await publishEvent({
  kind: 31124,
  content: "Fluffy is a baby Blobbi.",
  tags: [
    ['d', 'blobbi-fluffy'],
    ['stage', 'baby'],
    // ... all other tags
  ]
});
```

### Usage in v1

#### Creating State Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `createBlobbiStateEvent(blobbi: Blobbi, adoptionFees?: number)`

**Process:**
1. Validates all stats are 0-100
2. Preserves divine tags via `ensureDivineTags()`
3. Filters egg tags for baby stage via `filterEggTagsForBaby()`
4. Builds tags using `buildBlobbiStateTags()`
5. Ensures ecosystem tags via `ensureBlobbiTagsWithDebug()`

**Tag Builder:** `src/lib/blobbi-state-builder.ts`  
**Function:** `buildBlobbiStateTags(blobbi, previousTags?, source?)`

**Build Process:**
1. Add source tracking tag
2. Add core required tags
3. Add stats (from current Blobbi object)
4. Add sleep state (explicit logic)
5. Add appearance tags
6. Add personality/traits (multi-value)
7. Add egg-specific tags (if stage=egg)
8. Add evolution tags (if evolved)
9. Add divine theme tags (if divine)
10. Add social tags
11. Preserve long-running process tags
12. Ensure ecosystem tags

**Critical:** Tags are **always built from scratch**, never merged/patched.

#### Fetching State Events

**Hook:** `src/hooks/useBlobbiEvents.ts`  
**Function:** `useBlobbiState(blobbiId?, pubkey?)`

**Query:**
```javascript
const events = await nostr.query([{
  kinds: [31124],
  authors: [targetPubkey],
  '#d': [targetBlobbiId],
  limit: 1
}], { signal });
```

**Settings:**
- `staleTime: 0` - Always consider data stale
- `refetchInterval: 30000` - Refetch every 30 seconds
- `refetchOnMount: true` - Refetch when component mounts
- `refetchOnWindowFocus: true` - Refetch when window gains focus

#### Parsing State Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `parseBlobbiFromStateEvent(event: NostrEvent)`

**Process:**
1. Validate event kind is 31124
2. Extract `d` and `stage` tags
3. Recover missing stats from timestamps (if needed)
4. Parse all tags into Blobbi object
5. Handle divine Blobbi special rules
6. Validate stats are in range
7. Sync divine model fields
8. Return complete Blobbi object

**Stat Recovery:** If stat tags are missing, reconstructs them from:
- `last_meal`, `last_clean`, `last_warm`, etc.
- Applies decay rates: hunger -5/hr, happiness -3/hr, hygiene -4/hr, energy -5/hr, health -1/hr
- Uses safe defaults (80) if no timestamps found

#### Updating State Events

**Hook:** `useBlobbiState()`  
**Method:** `updateState(blobbi: Blobbi, fees?: number)`

**Process:**
1. Fetch current state event
2. Build new tags using `buildBlobbiStateTags(blobbi, currentEvent?.tags, 'user')`
3. Add fees tag if provided
4. Publish new 31124 event
5. Invalidate queries

**Files Using This:**
- `src/hooks/useBlobbi.ts` - Main Blobbi management
- `src/hooks/useBlobbiLifecycle.ts` - Lifecycle management
- `src/hooks/useBlobbiInteractionSystem.ts` - Interaction system
- `src/hooks/useBlobbiSleepSystem.ts` - Sleep system
- `src/hooks/useBlobbiDecayManager.ts` - Stat decay
- `src/hooks/useBlobbiAutoRepair.ts` - Auto-repair system

#### Caching

**Query Key:** `['blobbi-state', blobbiId, pubkey]`

**Invalidation Triggers:**
- After state update
- After interaction
- After evolution
- After sleep/wake
- After decay update
- After auto-repair

### Dependencies

**Depends On:**
- Kind 14921 (birth record must exist before state)
- Kind 31125 (owner profile for validation)

**Used By:**
- Kind 14919 (interactions reference state)
- Kind 14921 (evolution records reference state)
- Kind 14920 (breeding uses parent states)

### Special Rules

#### Auto-Repair System

**File:** `src/lib/blobbi-events.ts`  
**Functions:**
- `eventNeedsRepair(event)` - Checks if stat tags are missing
- `repairEventIfNeeded(event)` - Publishes corrected event
- `registerAutoRepairCallback(callback)` - Registers publish function

**Trigger:** When fetching a 31124 event with missing stat tags

**Process:**
1. Parse event to get Blobbi object
2. Recover missing stats from timestamps
3. Mark event as repaired (prevent loops)
4. Publish corrected 31124 event
5. Cache repaired event ID

**Deduplication:**
- `repairedEventIds` - Track by event ID
- `repairedBlobbis` - Track by Blobbi ID for session

**Integration:**
- `src/components/BlobbiAutoRepairIntegration.tsx` - Registers callback
- `src/hooks/useBlobbiAutoRepair.ts` - Hook implementation

#### Divine Blobbi Consistency

**File:** `src/lib/blobbi-divine-utils.ts`

**Functions:**
- `isDivineBlobbi(blobbi)` - Check if divine
- `ensureDivineTags(blobbi)` - Add divine tags
- `syncDivineModelFields(blobbi)` - Sync model fields
- `validateDivineConsistency(blobbi)` - Validate consistency

**Rules:**
- `theme` must be `"divine"`
- `crossover_app` must be `"divine"`
- `secondaryColor` must be removed
- Tags and model fields must match

#### Stat Degradation

**File:** `src/lib/blobbi-decay.ts`  
**Hook:** `src/hooks/useBlobbiDecayManager.ts`

**Decay Rates (per hour):**
- Hunger: -5 points
- Happiness: -3 points
- Hygiene: -4 points
- Energy: -5 points (paused during sleep)
- Health: -1 point (affected by other stats)

**Health Penalties:**
- Hunger < 30: -2 health
- Hygiene < 20: -1 health
- Energy < 20: -1 health
- Happiness < 30: -1 health

**Application:**
- On-load decay: `src/hooks/useBlobbiOnLoadDecayManager.ts`
- Periodic decay: `src/hooks/useBlobbiDecayManager.ts`
- Query-time decay: Applied in `useBlobbi()` hook

#### Sleep System

**File:** `src/lib/blobbi-events.ts`  
**Hook:** `src/hooks/useBlobbiSleepSystem.ts`

**Sleep Tags:**
- `is_sleeping` - Always present
- `state` - Derived from sleep state
- `sleep_started_at` - Only when sleeping
- `last_sleep_update` - Only when sleeping

**Critical Logic:**
```typescript
// ALWAYS set is_sleeping
tags.push(['is_sleeping', blobbi.isSleeping ? 'true' : 'false']);

// ONLY add sleep timestamps when actually sleeping
if (blobbi.isSleeping) {
  if (blobbi.sleepStartedAt !== undefined) {
    tags.push(['sleep_started_at', blobbi.sleepStartedAt.toString()]);
  }
  if (blobbi.lastSleepUpdate !== undefined) {
    tags.push(['last_sleep_update', blobbi.lastSleepUpdate.toString()]);
  }
}
// When NOT sleeping, sleep_started_at and last_sleep_update are OMITTED
```

**Energy Recovery:**
- +35 energy per rest action
- Gradual energy gain during sleep
- Energy decay paused while sleeping

### React Hooks Using Kind 31124

| Hook | File | Purpose |
|------|------|---------|
| `useBlobbiState` | `useBlobbiEvents.ts` | Fetch/update state |
| `useBlobbi` | `useBlobbi.ts` | Main Blobbi management |
| `useBlobbiLifecycle` | `useBlobbiLifecycle.ts` | Lifecycle management |
| `useBlobbiWithFakeStatus` | `useBlobbiWithFakeStatus.ts` | Fake status overlay |
| `useBlobbiInteractionSystem` | `useBlobbiInteractionSystem.ts` | Interaction system |
| `useBlobbiSleepSystem` | `useBlobbiSleepSystem.ts` | Sleep management |
| `useBlobbiDecayManager` | `useBlobbiDecayManager.ts` | Stat decay |
| `useBlobbiAutoRepair` | `useBlobbiAutoRepair.ts` | Auto-repair |
| `useUserBlobbi` | `useUserBlobbi.ts` | Current user's Blobbi |
| `useUserBlobbis` | `useUserBlobbis.ts` | All user's Blobbis |
| `useBlobbiCommunityFeed` | `useBlobbiCommunityFeed.ts` | Community feed |

### Components Using Kind 31124

| Component | File | Purpose |
|-----------|------|---------|
| `BlobbiLayout` | `BlobbiLayout.tsx` | Main Blobbi display |
| `BlobbiAutoRepairIntegration` | `BlobbiAutoRepairIntegration.tsx` | Auto-repair callback |
| `BlobbiOnLoadDecayIntegration` | `BlobbiOnLoadDecayIntegration.tsx` | On-load decay |
| `BlobbiCompanion` | `BlobbiCompanion.tsx` | Companion display |
| `BlobbiEvolution` | `BlobbiEvolution.tsx` | Evolution UI |

### Validation

**File:** `src/lib/blobbi-validation.ts`  
**Function:** `validateBlobbiEvent(event: NostrEvent)`

**Checks:**
1. Event kind is in BLOBBI_EVENT_KINDS
2. Required tags present
3. Stat values 0-100
4. Stage is valid
5. Timestamp in reasonable range

**Required Tags for 31124:**
```typescript
const REQUIRED_STATE_TAGS = [
  'd', 'stage', 'breeding_ready', 
  'generation', 'experience', 'care_streak'
];
```

**Note:** Stat tags (hunger, happiness, etc.) are **optional** in validation but **required** for normal operation. Missing stats trigger auto-repair.

---

## Kind 14919: Blobbi Interaction

**Type:** Regular (Immutable)  
**Replaceability:** Never replaced (permanent record)  
**Purpose:** Records individual care actions and their effects

### Tags

#### Required Tags

| Tag | Format | Description | Example |
|-----|--------|-------------|---------|
| `blobbi_id` | `blobbi-{name}` | Target Blobbi ID | `blobbi-fluffy` |
| `action` | Action type | Care action performed | `feed` |
| `action_category` | String | Action category | `nutrition` |
| `stat_change` | `stat:±value` | Stat modification | `hunger:+30` |

**Valid Actions:**
`feed` | `play` | `clean` | `rest` | `warm` | `check` | `sing` | `talk` | `medicine` | `cruzar`

**Action Categories:**
`nutrition` | `entertainment` | `hygiene` | `recovery` | `care` | `social` | `special`

**Stat Change Format:**
- Pattern: `{stat_name}:{+/-}{value}`
- Multiple allowed (for items with multiple effects)
- Valid stat names: `hunger`, `happiness`, `health`, `hygiene`, `energy`, `egg_temperature`, `shell_integrity`

#### Optional Item Tags

| Tag | Format | Description |
|-----|--------|-------------|
| `item_used` | String | Item identifier |
| `item_quality` | String | Item quality level |
| `time_of_day` | String | Time when action occurred |

#### Optional Mood Tags

| Tag | Format | Description |
|-----|--------|-------------|
| `blobbi_mood_before` | Mood value | Mood before interaction |
| `blobbi_mood_after` | Mood value | Mood after interaction |

#### Optional Effect Tags

| Tag | Format | Description |
|-----|--------|-------------|
| `animation_played` | String | Animation identifier |
| `sound_played` | String | Sound identifier |
| `bonus_applied` | String | Bonus type |
| `experience_gained` | Integer | XP gained |
| `care_streak` | Integer | Current care streak |
| `care_points` | Integer | Care points earned |
| `achievement_progress` | `achievement:progress` | Achievement progress |
| `achievement_unlocked` | String | Achievement identifier |
| `special_event` | String | Special event triggered |
| `memory_created` | String | Memory identifier |

#### Optional Play-Specific Tags

| Tag | Format | Description |
|-----|--------|-------------|
| `game_type` | String | Type of game played |
| `toy_used` | String | Toy identifier |
| `play_duration` | Integer | Duration in minutes |
| `location` | String | Play location |
| `play_partner` | String | Partner identifier |
| `skill_improved` | `skill:amount` | Skill improvement |
| `bond_increased` | `bond_type:amount` | Bond increase |
| `new_move_learned` | String | New move learned |

#### Optional Clean-Specific Tags

| Tag | Format | Description |
|-----|--------|-------------|
| `cleaning_type` | String | Type of cleaning |
| `water_temperature` | String | Water temperature |
| `soap_used` | String | Soap type |
| `grooming_tool` | String | Tool used |
| `special_effect` | String | Special effect |
| `scent_applied` | String | Scent applied |
| `mood_boost` | String | Mood improvement |

#### Optional Rest-Specific Tags

| Tag | Format | Description |
|-----|--------|-------------|
| `rest_type` | String | Type of rest |
| `bed_type` | String | Bed type used |
| `lullaby_played` | String | Lullaby identifier |
| `sleep_duration` | Integer | Sleep duration |
| `dream_type` | String | Dream type |
| `growth_bonus` | String | Growth bonus |
| `dream_memory` | String | Dream memory |

#### Optional Social Tags

| Tag | Format | Description |
|-----|--------|-------------|
| `social_role` | `role:value` | Social role |
| `interaction_quality` | String | Quality rating |
| `emotion_triggered` | String | Emotion type |
| `shared_memory` | String | Shared memory |
| `interaction_context` | String | Context information |

### Content Format

**Type:** Plain text  
**Format:** Free-form description of the interaction

**Examples:**
```
Fed Fluffy some starberries
Played with Sparkle using a ball
Cleaned Thunder with warm water
Blobbi feed interaction
```

### Event Immutability

**Regular Event:** Never replaced, stored permanently by relays.

**Query Pattern:**
```javascript
const events = await nostr.query([{
  kinds: [14919],
  '#blobbi_id': ['blobbi-fluffy'],
  limit: 50
}]);
```

### Usage in v1

#### Creating Interaction Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `createBlobbiInteractionEvent(blobbiId, interactionData)`

**Process:**
1. Build base tags (blobbi_id, action, action_category)
2. Add all stat_change tags (supports multiple)
3. Add optional tags based on interactionData
4. Ensure ecosystem tags
5. Return event template

**Critical Fix (v1):**
```typescript
// 🔥 FIX: Add ALL stat changes as separate tags
if (interactionData.statChanges && interactionData.statChanges.length > 0) {
  interactionData.statChanges.forEach(([stat, value]) => {
    tags.push(['stat_change', `${stat}:${value}`]);
  });
}
```

#### Fetching Interaction Events

**Hook:** `src/hooks/useBlobbiEvents.ts`  
**Function:** `useBlobbiInteractions(blobbiId, limit)`

**Query:**
```javascript
const events = await nostr.query([{
  kinds: [14919],
  '#blobbi_id': [blobbiId],
  limit
}], { signal });
```

**Process:**
1. Filter events through `validateBlobbiEvent()`
2. Parse each event with `parseInteractionFromEvent()`
3. Sort by `created_at` (descending)
4. Return array of `{ event, interaction }` objects

#### Parsing Interaction Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `parseInteractionFromEvent(event: NostrEvent)`

**Process:**
1. Validate event kind is 14919
2. Check required tags present
3. Parse stat_change tag(s)
4. Parse optional tags
5. Handle special tuple tags (achievement_progress, skill_improved, etc.)
6. Return BlobbiInteractionData object

#### Publishing Interactions

**Hook:** `useBlobbiInteractions()`  
**Method:** `createInteraction(interactionData)`

**Used By:**
- `src/hooks/useBlobbiInteractionSystem.ts` - Main interaction system
- `src/hooks/useBlobbiLifecycle.ts` - Lifecycle management
- `src/hooks/useBlobbiCare.ts` - Care management

**Flow:**
1. User performs action
2. Calculate stat changes
3. Create interaction event
4. Publish to Nostr
5. Update local state
6. Invalidate queries

#### Caching

**Query Key:** `['blobbi-interactions', blobbiId, limit]`

**Invalidation Triggers:**
- After creating new interaction
- After evolution (to refresh timeline)

### Dependencies

**Depends On:**
- Kind 31124 (Blobbi must exist)

**Used By:**
- Kind 14921 (memories reference interactions)
- Timeline queries (combined with records)

### Special Rules

#### Cooldown System

**File:** `src/lib/cooldown-storage.ts`

**Functions:**
- `isOnCooldown(blobbiId, action, stage)` - Check cooldown
- `setCooldown(blobbiId, action, timestamp, stage)` - Set cooldown
- `getRemainingCooldown(blobbiId, action, stage)` - Get remaining time

**Storage:** LocalStorage per Blobbi/action/stage

**Cooldown Periods (by stage):**

**Egg Stage:**
- `warm`: 30 minutes
- `check`: 1 hour
- `sing`: 1 hour
- `talk`: 1 hour
- `medicine`: 2 hours

**Baby/Adult Stage:**
- `feed`: 30 minutes
- `play`: 45 minutes
- `clean`: 1 hour
- `rest`: 2 hours
- `medicine`: 3 hours

**Enforcement:**
```typescript
const isOnCooldown = await cooldownStorage.isOnCooldown(
  blobbiId, action, lifeStage
);
if (isOnCooldown) {
  const remaining = await cooldownStorage.getRemainingCooldown(
    blobbiId, action, lifeStage
  );
  throw new Error(`Action is on cooldown. Time remaining: ${formatCooldownTime(remaining)}`);
}
```

#### Interaction Logging

**File:** `src/lib/interaction-logger.ts`

**Functions:**
- `logInteractionTriggered()` - Log successful interaction
- `logInteractionBlockedByCooldown()` - Log cooldown block
- `logInteractionBlockedUnavailable()` - Log unavailable action
- `logInteractionError()` - Log error

**Console Output:**
```
[Interaction] ✅ TRIGGERED: feed for blobbi-fluffy (baby)
  📊 Stat Changes: { hunger: +30 }
  ⭐ Experience: +5
  🎁 Item: starberries
```

#### Action Availability by Stage

**File:** `src/lib/cooldown-storage.ts`  
**Function:** `isActionAvailableForStage(action, stage)`

**Egg Stage:**
- ✅ `warm`, `check`, `sing`, `talk`, `medicine`
- ❌ `feed`, `play`, `clean`, `rest`, `cruzar`

**Baby/Adult Stage:**
- ✅ `feed`, `play`, `clean`, `rest`, `medicine`, `cruzar`
- ❌ `warm`, `check`, `sing`, `talk`

#### Stat Change Calculation

**File:** `src/hooks/useBlobbi.ts`  
**Function:** `calculateStatChanges(action, currentStats, itemEffect?, lifeStage?)`

**Process:**
1. If item used, return item effects directly
2. If static action, use predefined values
3. Otherwise, use fallback (+5 happiness)

**Static Changes:**
```typescript
const staticChanges = {
  rest: ['energy', Math.min(35, 100 - currentStats.energy)],
  warm: ['egg_temperature', 5],
  check: ['happiness', 3],
  sing: ['happiness', 8],
  talk: ['happiness', 6],
  cruzar: ['happiness', Math.min(20, 100 - currentStats.happiness)],
};
```

**Item Effects:**
Items can have multiple stat effects (e.g., `{ hunger: +30, happiness: +5 }`). All effects are added as separate `stat_change` tags.

### React Hooks Using Kind 14919

| Hook | File | Purpose |
|------|------|---------|
| `useBlobbiInteractions` | `useBlobbiEvents.ts` | Fetch/create interactions |
| `useBlobbiInteractionSystem` | `useBlobbiInteractionSystem.ts` | Main interaction system |
| `useBlobbiCare` | `useBlobbiEvents.ts` | Care management |
| `useBlobbi` | `useBlobbi.ts` | Perform actions |
| `useBlobbiTimeline` | `useBlobbiEvents.ts` | Combined timeline |

### Components Using Kind 14919

| Component | File | Purpose |
|-----------|------|---------|
| `BlobbiFloatingActionMenu` | `BlobbiFloatingActionMenu.tsx` | Action buttons |
| `BlobbiLayout` | `BlobbiLayout.tsx` | Main UI |
| `BlobbiDetail` | `BlobbiDetail.tsx` | Detail view |

### Validation

**File:** `src/lib/blobbi-validation.ts`

**Checks:**
1. Required tags present
2. Action is valid
3. Stat change format valid
4. Stat change value ≤ 100

**Required Tags:**
```typescript
const REQUIRED_INTERACTION_TAGS = [
  'blobbi_id', 'action', 'action_category', 'stat_change'
];
```

---

## Kind 14920: Blobbi Breeding

**Type:** Regular (Immutable)  
**Replaceability:** Never replaced (permanent record)  
**Purpose:** Cross-breeding between adult Blobbis

### Tags

#### Required Tags

| Tag | Format | Description | Example |
|-----|--------|-------------|---------|
| `parent_a` | `blobbi-{name}` | First parent Blobbi ID | `blobbi-fluffy` |
| `parent_b` | `blobbi-{name}` | Second parent Blobbi ID | `blobbi-sparkle` |
| `owner_a` | npub/hex | First parent owner | `npub1abc...` |
| `owner_b` | npub/hex | Second parent owner | `npub2xyz...` |
| `breed_time` | ISO 8601 | Breeding timestamp | `2024-01-15T10:30:00Z` |
| `success` | `true` \| `false` | Breeding success | `true` |

#### Optional Tags

| Tag | Format | Description | When Present |
|-----|--------|-------------|--------------|
| `offspring_id` | `blobbi-{name}` | New Blobbi ID | If success=true |
| `generation` | Integer | Offspring generation | If success=true |
| `location` | String | Breeding location | Optional |

### Content Format

**Type:** Plain text

**Examples:**
```
New life is forming ✨
New Blobbi born from Fluffy and Sparkle
Breeding attempt was unsuccessful
```

### Event Immutability

**Regular Event:** Never replaced, stored permanently by relays.

**Query Pattern:**
```javascript
const events = await nostr.query([
  {
    kinds: [14920],
    '#owner_a': [userPubkey]
  },
  {
    kinds: [14920],
    '#owner_b': [userPubkey]
  }
], { signal });
```

### Usage in v1

#### Creating Breeding Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `createBlobbiBreedingEvent(parentA, parentB, ownerA, ownerB, success, offspringId?, additionalData?)`

**Process:**
1. Build required tags
2. Add offspring_id if successful
3. Add additional data tags
4. Ensure ecosystem tags
5. Return event template

#### Fetching Breeding Events

**Hook:** `src/hooks/useBlobbiEvents.ts`  
**Function:** `useBlobbiBreeding()`

**Query:**
```javascript
const events = await nostr.query([
  { kinds: [14920], '#owner_a': [user.pubkey] },
  { kinds: [14920], '#owner_b': [user.pubkey] }
], { signal });
```

**Process:**
1. Fetch events where user is owner_a OR owner_b
2. Filter through `validateBlobbiEvent()`
3. Sort by `created_at` (descending)
4. Return array of events

#### Publishing Breeding Events

**Hook:** `useBlobbiBreeding()`  
**Method:** `createBreeding(params)`

**Used By:**
- Breeding UI (not implemented in v1)

**Flow:**
1. Validate both parents are adult
2. Check breeding_ready status
3. Calculate offspring traits
4. Create breeding event
5. Create offspring birth record (Kind 14921)
6. Create offspring state (Kind 31124)

### Dependencies

**Depends On:**
- Kind 31124 (both parent Blobbis must exist and be adults)

**Creates:**
- Kind 14921 (birth record for offspring)
- Kind 31124 (state for offspring)

### Special Rules

#### Breeding Requirements

**Both parents must:**
- Be in `adult` stage
- Have `breeding_ready=true`
- Have health > 70%
- Have happiness > 70%

#### Offspring Generation

**Calculation:**
```typescript
const offspringGeneration = Math.max(parentA.generation, parentB.generation) + 1;
```

#### Cooldown Period

**After successful breeding:**
- Both parents set `breeding_ready=false`
- Cooldown period: 7 days
- After cooldown, `breeding_ready=true` again

### React Hooks Using Kind 14920

| Hook | File | Purpose |
|------|------|---------|
| `useBlobbiBreeding` | `useBlobbiEvents.ts` | Fetch/create breeding events |

### Components Using Kind 14920

**None in v1** (breeding UI not implemented)

### Validation

**File:** `src/lib/blobbi-validation.ts`

**Checks:**
1. Required tags present
2. Timestamp is valid ISO 8601
3. Success is 'true' or 'false'

**Required Tags:**
```typescript
const REQUIRED_BREEDING_TAGS = [
  'parent_a', 'parent_b', 'owner_a', 
  'owner_b', 'breed_time', 'success'
];
```

---

## Kind 14921: Blobbi Record

**Type:** Regular (Immutable)  
**Replaceability:** Never replaced (permanent record)  
**Purpose:** Permanent lifecycle milestones and biographical events

### Tags

#### Required Tags

| Tag | Format | Description | Example |
|-----|--------|-------------|---------|
| `blobbi_id` | `blobbi-{name}` | Target Blobbi ID | `blobbi-fluffy` |
| `record_type` | Record type | Type of record | `birth` |

**Valid Record Types:**
`birth` | `hatched` | `evolution` | `memory` | `adoption`

#### Common Optional Tags

| Tag | Format | Description | All Record Types |
|-----|--------|-------------|------------------|
| `generation` | Integer | Generation number | ✅ Yes |

#### Birth Record Tags

| Tag | Format | Description | Required |
|-----|--------|-------------|----------|
| `origin` | String | Origin type | No |
| `birth_location` | String | Birth location | No |
| `weather_at_birth` | String | Weather conditions | No |
| `shell_color` | Hex color | Shell color | No |
| `shell_pattern` | String | Shell pattern | No |
| `initial_trait` | String | Initial traits | No (multi) |
| `rarity` | String | Rarity level | No |
| `parent_1` | `blobbi-{name}` | First parent ID | No |
| `parent_2` | `blobbi-{name}` | Second parent ID | No |
| `lineage_depth` | Integer | Lineage depth | No |
| `genetic_marker` | String | Genetic markers | No |
| `birth_season` | String | Birth season | No |
| `birth_moon_phase` | String | Moon phase | No |
| `creator` | npub/hex | Creator pubkey | No |
| `design_url` | URL | Design URL | No |
| `adoption_fee` | Integer | Adoption fee | No |
| `legacy_trait` | String | Legacy traits | No (multi) |
| `passive_trait` | String | Passive traits | No (multi) |
| `evolved_from` | `blobbi-{name}` | Evolution source | No |
| `hatch_fee` | Integer | Hatching fee | No |
| `evolution_stage` | Stage | Evolution stage | No |

**Origin Values:**
`wild` | `bred` | `special` | `divine` | `event`

**Rarity Values:**
`common` | `uncommon` | `rare` | `epic` | `legendary` | `mythic`

#### Hatched Record Tags

| Tag | Format | Description | Required |
|-----|--------|-------------|----------|
| `hatched_at` | ISO 8601 | Hatching timestamp | No |
| `hatched_by` | npub/hex | Hatcher pubkey | No |
| `egg_type` | String | Egg type | No |
| `incubation_time` | String | Incubation duration | No |
| `eye_color` | String | Eye color | No |
| `base_color` | Hex color | Base color | No |
| `pattern` | String | Pattern | No |
| `secondary_color` | Hex color | Secondary color | No |
| `manifestation` | String | Manifestation | No |
| `title` | String | Title | No |
| `title_reason` | String | Title reason | No |
| `blessing` | String | Blessing | No |
| `memory_title` | String | Memory title | No |
| `memory_description` | String | Memory description | No |
| `memory_date` | YYYY-MM-DD | Memory date | No |
| `passive_trait` | String | Passive traits | No (multi) |
| `evolved_from` | `blobbi-{name}` | Evolution source | No |
| `hatch_fee` | Integer | Hatching fee | No |
| `evolution_stage` | Stage | Evolution stage | No |

#### Adoption Record Tags

| Tag | Format | Description | Required |
|-----|--------|-------------|----------|
| `adopted_by` | npub/hex | Adopter pubkey | No |
| `adopted_on` | ISO 8601 | Adoption timestamp | No |
| `adoption_method` | String | Adoption method | No |
| `title` | String | Title | No |
| `title_reason` | String | Title reason | No |

**Adoption Methods:**
`wild_capture` | `breeding` | `gift` | `purchase` | `event_reward`

#### Evolution Record Tags

| Tag | Format | Description | Required |
|-----|--------|-------------|----------|
| `evolution_stage` | Stage | New stage | No |
| `evolution_reason` | String | Evolution reason | No |
| `evolved_from` | `blobbi-{name}` | Previous form | No |

**Evolution Stages:**
`baby` | `adult`

**Evolution Reasons:**
- `"Hatching requirements met"` (egg → baby)
- `"Evolution requirements met"` (baby → adult)
- `"Manual hatching triggered"`
- `"Manual evolution triggered"`

#### Memory Record Tags

| Tag | Format | Description | Required |
|-----|--------|-------------|----------|
| `memory_title` | String | Memory title | No |
| `memory_description` | String | Memory description | No |
| `memory_date` | YYYY-MM-DD | Memory date | No |
| `discovered_trait` | String | Discovered trait | No |
| `achievement` | String | Achievement | No |
| `milestone` | String | Milestone | No |

### Content Format

**Type:** Plain text  
**Format:** Free-form description of the record

**Examples:**
```
Fluffy was adopted from the wild
Fluffy has hatched! 🐣
Fluffy has evolved to adult! ✨
Achievement Unlocked
A special memory was created
```

### Event Immutability

**Regular Event:** Never replaced, stored permanently by relays.

**Query Pattern:**
```javascript
const events = await nostr.query([{
  kinds: [14921],
  '#blobbi_id': ['blobbi-fluffy'],
  '#record_type': ['birth', 'hatched', 'evolution']
}]);
```

### Usage in v1

#### Creating Record Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `createBlobbiRecordEvent(blobbiId, recordData, content?)`

**Process:**
1. Build base tags (blobbi_id, record_type)
2. Add tags based on record_type
3. Handle multi-value tags (initial_trait, legacy_trait, passive_trait)
4. Ensure ecosystem tags
5. Return event template

**Record Type Branching:**
```typescript
switch (recordData.recordType) {
  case 'birth': // Add birth-specific tags
  case 'hatched': // Add hatching-specific tags
  case 'adoption': // Add adoption-specific tags
  case 'evolution': // Add evolution-specific tags
  case 'memory': // Add memory-specific tags
}
```

#### Fetching Record Events

**Hook:** `src/hooks/useBlobbiEvents.ts`  
**Function:** `useBlobbiRecords(blobbiId, recordType?)`

**Query:**
```javascript
const queryFilter = {
  kinds: [14921],
  '#blobbi_id': [blobbiId],
};
if (recordType) {
  queryFilter['#record_type'] = [recordType];
}

const events = await nostr.query([queryFilter], { signal });
```

**Process:**
1. Filter through `validateBlobbiEvent()`
2. Parse each event with `parseRecordFromEvent()`
3. Sort by `created_at` (ascending - chronological order)
4. Return array of `{ event, record }` objects

#### Parsing Record Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `parseRecordFromEvent(event: NostrEvent)`

**Process:**
1. Validate event kind is 14921
2. Check required tags present
3. Parse record_type
4. Branch based on record_type
5. Parse type-specific tags
6. Handle multi-value tags
7. Return BlobbiRecordData object

#### Publishing Record Events

**Hook:** `useBlobbiRecords()`  
**Method:** `createRecord({ recordData, content })`

**Used By:**
- `src/hooks/useBlobbiLifecycle.ts` - Lifecycle management
- `src/hooks/useBlobbiEvolution.ts` - Evolution
- `src/hooks/useBlobbiMemory.ts` - Memory creation
- `src/hooks/useBlobbiAdoption.ts` - Adoption

**Flow:**
1. Create record event
2. Publish to Nostr
3. Invalidate queries
4. Update UI

#### Caching

**Query Key:** `['blobbi-records', blobbiId, recordType?]`

**Invalidation Triggers:**
- After creating new record
- After evolution
- After adoption

### Dependencies

**Depends On:**
- Kind 31124 (Blobbi must exist)

**Used By:**
- Timeline queries
- Evolution system
- Adoption system

### Special Rules

#### Birth Record Creation

**File:** `src/lib/blobbi-adoption.ts`  
**Function:** `createBlobbiWithAdoption(params)`

**Process:**
1. Generate random traits
2. Create Blobbi object
3. Create birth record data
4. Return both

**Default Birth Data:**
```typescript
{
  recordType: 'birth',
  origin: 'wild',
  rarity: 'common',
  birthLocation: 'enchanted_grove',
  weatherAtBirth: 'clear_sky',
  generation: 1,
  initialTrait: ['curious', 'playful'],
  shellColor: randomColor,
}
```

#### Hatching Record Creation

**File:** `src/lib/blobbi-evolution.ts`  
**Function:** `processHatching(blobbi)`

**Process:**
1. Validate egg stage
2. Generate baby traits
3. Create hatching record
4. Update Blobbi to baby stage
5. Return both

**Hatching Record Data:**
```typescript
{
  recordType: 'hatched',
  hatchedAt: Date.now(),
  hatchedBy: blobbi.ownerPubkey,
  eggType: 'standard',
  incubationTime: calculateIncubationTime(blobbi),
  generation: blobbi.generation,
  eyeColor: randomEyeColor,
  baseColor: blobbi.baseColor,
  pattern: blobbi.pattern,
  // ... visual traits
}
```

#### Evolution Record Creation

**File:** `src/lib/blobbi-evolution.ts`  
**Function:** `processEvolution(blobbi, newStage, reason?)`

**Process:**
1. Validate current stage
2. Update Blobbi to new stage
3. Create evolution record
4. Return both

**Evolution Record Data:**
```typescript
{
  recordType: 'evolution',
  evolutionStage: newStage,
  evolutionReason: reason || 'Evolution requirements met',
  evolvedFrom: blobbi.id,
}
```

#### Memory Record Creation

**Hook:** `src/hooks/useBlobbiMemory.ts`  
**Function:** `createMemory(params)`

**Process:**
1. Build memory record data
2. Create record event
3. Publish to Nostr
4. Invalidate queries

**Memory Record Data:**
```typescript
{
  recordType: 'memory',
  memoryTitle: params.memoryTitle,
  memoryDescription: params.memoryDescription,
  memoryDate: new Date().toISOString().split('T')[0],
  achievement: params.achievement,
  milestone: params.milestone,
  discoveredTrait: params.discoveredTrait,
}
```

#### Timeline Integration

**Hook:** `src/hooks/useBlobbiEvents.ts`  
**Function:** `useBlobbiTimeline(blobbiId)`

**Process:**
1. Fetch records (Kind 14921)
2. Fetch interactions (Kind 14919)
3. Combine and sort chronologically
4. Return unified timeline

**Timeline Item:**
```typescript
{
  type: 'record' | 'interaction',
  timestamp: number, // milliseconds
  event: NostrEvent,
  data: BlobbiRecordData | BlobbiInteractionData,
}
```

### React Hooks Using Kind 14921

| Hook | File | Purpose |
|------|------|---------|
| `useBlobbiRecords` | `useBlobbiEvents.ts` | Fetch/create records |
| `useBlobbiEvolution` | `useBlobbiEvents.ts` | Evolution records |
| `useBlobbiMemory` | `useBlobbiEvents.ts` | Memory records |
| `useBlobbiTimeline` | `useBlobbiEvents.ts` | Combined timeline |
| `useBlobbiLifecycle` | `useBlobbiLifecycle.ts` | Lifecycle management |

### Components Using Kind 14921

| Component | File | Purpose |
|-----------|------|---------|
| `BlobbiEvolution` | `BlobbiEvolution.tsx` | Evolution UI |
| `BlobbiDetail` | `BlobbiDetail.tsx` | Detail view (timeline) |

### Validation

**File:** `src/lib/blobbi-validation.ts`  
**Function:** `validateRecordTypeSpecificTags(tags, recordType)`

**Checks by Record Type:**
- `birth`: Must have `generation` tag
- `hatched`: Must have `hatched_at` OR `hatched_by`
- `evolution`: Must have `evolution_stage`
- `memory`: Must have `memory_title` OR `achievement` OR `milestone`
- `adoption`: Must have `adopted_by` OR `title`

**Required Tags:**
```typescript
const REQUIRED_RECORD_TAGS = ['blobbi_id', 'record_type'];
```

---

## Kind 31125: Blobbonaut Profile

**Type:** Addressable (Parameterized Replaceable)  
**Replaceability:** Latest event per `(pubkey, kind, d)` combination  
**Purpose:** Owner profile data (inventory, coins, achievements)

### Tags

#### Required Tags

| Tag | Format | Description | Example |
|-----|--------|-------------|---------|
| `d` | Profile ID | Unique profile identifier | `Blobbonaut-abc12345` |
| `name` | String | Display name | `BlobbiMaster` |

**Profile ID Format:** `Blobbonaut-{pubkey_prefix}`
- Old format: `Blobbanaut-{random}` (auto-migrated)
- New format: `Blobbonaut-{first_8_chars_of_pubkey}`

#### Optional Core Tags

| Tag | Format | Description | Default |
|-----|--------|-------------|---------|
| `coins` | Integer ≥ 0 | Currency amount | `0` |
| `pettingLevel` | Integer ≥ 0 | Interaction level | `0` |
| `lifetimeBlobbis` | Integer ≥ 0 | Total Blobbis owned | `0` |
| `favoriteBlobbi` | `blobbi-{name}` | Favorite Blobbi ID | - |
| `starterBlobbi` | `blobbi-{name}` | First Blobbi ID | - |
| `current_companion` | `blobbi-{name}` | Currently selected companion | - |
| `style` | String | Aesthetic style | - |
| `background` | String | Background theme | - |
| `title` | String | Custom title | - |

#### Optional Multi-value Tags

| Tag | Format | Description | Multi-value |
|-----|--------|-------------|-------------|
| `has` | `blobbi-{name}` | Owned Blobbi IDs | ✅ Yes |
| `achievements` | String | Achievement IDs | ✅ Yes |
| `storage` | `item_id:quantity` | Item storage | ✅ Yes |

**Storage Format:**
- Pattern: `{item_id}:{quantity}`
- Example: `starberries:5`
- Multiple tags for different items

#### Optional Boolean Tags

| Tag | Format | Description | Default |
|-----|--------|-------------|---------|
| `onboarding_done` | `true` \| `false` | Onboarding completion | `false` |

#### Meta Tags (Auto-added)

| Tag | Format | Description | Auto-added |
|-----|--------|-------------|------------|
| `b` | `blobbi:ecosystem:v1` | Blobbi ecosystem identifier | ✅ Yes |
| `t` | `blobbi` | Topic tag | ✅ Yes |

### Content Format

**Type:** Empty string  
**Format:** `""`

**Critical:** Content must always be empty string for Kind 31125.

### Event Replaceability

**Addressable Event:** Only the **latest** event per `(pubkey, kind, d)` is stored by relays.

**Query Pattern:**
```javascript
// By specific profile ID
const events = await nostr.query([{
  kinds: [31125],
  '#d': ['Blobbonaut-abc12345'],
  limit: 1
}]);

// By author (supports multiple profiles per user)
const events = await nostr.query([{
  kinds: [31125],
  authors: [userPubkey],
  limit: 10
}]);
```

**Filter for Blobbi Ecosystem:**
```javascript
// Only get Blobbi-related profiles
events = events.filter(event => {
  const hasBlobbiTag = event.tags.some(([name, value]) =>
    name === 'b' && value === 'blobbi:ecosystem:v1'
  );
  const hasTopicTag = event.tags.some(([name, value]) =>
    name === 't' && (value === 'blobbi' || value === 'Blobbi')
  );
  return hasBlobbiTag || hasTopicTag;
});
```

### Usage in v1

#### Creating Profile Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `createBlobbonautProfileEvent(profile: BlobbonautProfile)`

**Process:**
1. Build base tags (d, b, t, name)
2. Add numeric tags (coins, pettingLevel, lifetimeBlobbis)
3. Add string tags (favoriteBlobbi, starterBlobbi, etc.)
4. Add onboarding_done tag
5. Add multi-value tags (has, achievements, storage)
6. Add additional tags from `additionalTags`
7. Ensure ecosystem tags
8. Return event template with empty content

**Critical:**
```typescript
// Content MUST be empty
return {
  kind: 31125,
  content: '', // Always empty
  tags: finalTags,
};
```

#### Fetching Profile Events

**Hook:** `src/hooks/useBlobbonautProfile.ts`  
**Function:** `useBlobbonautProfile(profileId?)`

**Query (by profile ID):**
```javascript
const events = await nostr.query([{
  kinds: [31125],
  '#d': [profileId],
  limit: 1
}], { signal });
```

**Query (by author):**
```javascript
const events = await nostr.query([{
  kinds: [31125],
  authors: [user.pubkey],
  limit: 10
}], { signal });

// Filter to Blobbi ecosystem
events = events.filter(event => {
  const hasBlobbiTag = event.tags.some(([name, value]) =>
    name === 'b' && value === 'blobbi:ecosystem:v1'
  );
  const hasTopicTag = event.tags.some(([name, value]) =>
    name === 't' && (value === 'blobbi' || value === 'Blobbi')
  );
  return hasBlobbiTag || hasTopicTag;
});

// Sort by created_at to get latest
events.sort((a, b) => b.created_at - a.created_at);
```

**Settings:**
- `staleTime: 30000` - 30 seconds
- `enabled: (!!profileId || !!user) && !!nostr`

#### Parsing Profile Events

**File:** `src/lib/blobbi-events.ts`  
**Function:** `parseBlobbonautProfileFromEvent(event: NostrEvent)`

**Process:**
1. Validate event kind is 31125
2. Extract `d` tag (required)
3. Parse storage tags (format: `item_id:quantity`)
4. Parse onboarding_done (default: false)
5. Parse all known tags
6. Collect unknown tags into `additionalTags`
7. Build BlobbonautProfile object

**Storage Parsing:**
```typescript
const storageTagValues = getTagValues(tags, 'storage');
const storage = storageTagValues
  .map(storageValue => {
    const parts = storageValue.split(':');
    if (parts.length === 2) {
      const itemId = parts[0];
      const quantity = parseInt(parts[1]);
      if (!isNaN(quantity) && quantity > 0) {
        return { itemId, quantity };
      }
    }
    return null;
  })
  .filter((item): item is BlobbonautStorageItem => item !== null);
```

**Additional Tags:**
```typescript
const additionalTags: Record<string, string | string[]> = {};
tags.forEach(([tagName, tagValue]) => {
  if (tagName && tagValue && !knownTagNames.includes(tagName)) {
    if (additionalTags[tagName]) {
      // Convert to array or append
      if (Array.isArray(additionalTags[tagName])) {
        (additionalTags[tagName] as string[]).push(tagValue);
      } else {
        additionalTags[tagName] = [additionalTags[tagName] as string, tagValue];
      }
    } else {
      additionalTags[tagName] = tagValue;
    }
  }
});
```

#### Updating Profile Events

**Hook:** `useBlobbonautProfile()`  
**Method:** `useUpdateBlobbonautProfile()`

**Process:**
1. Fetch current profile
2. Check for ID migration (Blobbanaut → Blobbonaut)
3. Merge partial update with current profile
4. Update lastModified timestamp
5. Create complete event
6. Publish to Nostr
7. Invalidate queries

**ID Migration:**
```typescript
let profileId = currentProfile.id;

// Check if this is an old format ID (Blobbanaut-xxx)
if (profileId.startsWith('Blobbanaut-') && user) {
  // Migrate to new format (Blobbonaut-xxx)
  const newProfileId = `Blobbonaut-${user.pubkey.slice(0, 8)}`;
  console.log('[Blobbonaut Migration] Migrating profile ID:', profileId, '→', newProfileId);
  profileId = newProfileId;
}
```

**Partial Update:**
```typescript
const updatedProfile: BlobbonautProfile = {
  ...currentProfile,
  ...partialUpdate,
  id: profileId,                            // Use migrated ID
  ownerPubkey: currentProfile.ownerPubkey,  // Never lose the owner
  lastModified: Math.floor(Date.now() / 1000),
};
```

#### Creating Initial Profile

**Hook:** `useCreateInitialProfile()`

**Process:**
1. Generate profile ID: `Blobbonaut-{pubkey_prefix}`
2. Fetch user's Nostr metadata for default name
3. Build initial profile with defaults
4. Publish event
5. Invalidate queries

**Default Profile:**
```typescript
const initialProfile: BlobbonautProfile = {
  id: `Blobbonaut-${user.pubkey.slice(0, 8)}`,
  ownerPubkey: user.pubkey,
  name: defaultName, // From kind 0 metadata
  coins: 500,
  ownedBlobbis: [],
  pettingLevel: 0,
  lifetimeBlobbis: 0,
  achievements: [],
  storage: [],
  onboardingDone: false,
  lastModified: Math.floor(Date.now() / 1000),
};
```

#### Caching

**Query Key:** `['blobbonaut-profile', profileId | pubkey]`

**Invalidation Triggers:**
- After profile update
- After ID migration
- After adding coins
- After spending coins
- After adding Blobbi
- After removing Blobbi
- After adding achievement
- After adding to storage
- After setting onboarding done

### Dependencies

**Depends On:**
- None (can be created independently)

**Used By:**
- Kind 31124 (validates ownership)
- Coin system
- Inventory system
- Achievement system

### Special Rules

#### Profile ID Migration

**Old Format:** `Blobbanaut-{random}`  
**New Format:** `Blobbonaut-{pubkey_prefix}`

**Migration Trigger:** Any profile update

**Migration Process:**
1. Detect old format ID
2. Generate new ID from pubkey
3. Update profile with new ID
4. Publish event with new ID
5. Invalidate old ID queries
6. Invalidate new ID queries

**Backwards Compatibility:**
- Old events remain in relays
- New events use new ID
- Queries by author find both

#### Coin Management

**Add Coins Hook:** `useAddCoins()`

**Process:**
1. Fetch current profile
2. Validate coins to add > 0
3. Update profile with new coin balance
4. Publish event
5. Invalidate queries

**Spend Coins Hook:** `useSpendCoins()`

**Process:**
1. Fetch current profile
2. Validate coins to spend > 0
3. Check sufficient balance
4. Update profile with new coin balance
5. Publish event
6. Invalidate queries

**Error Handling:**
```typescript
if (currentProfile.coins < coinsToSpend) {
  throw new Error('Insufficient coins');
}
```

#### Blobbi Collection Management

**Add Blobbi Hook:** `useAddBlobbi()`

**Process:**
1. Fetch current profile
2. Check if already owned
3. Add to ownedBlobbis array
4. Increment lifetimeBlobbis
5. Set starterBlobbi if first Blobbi
6. Publish event
7. Invalidate queries

**Remove Blobbi Hook:** `useRemoveBlobbi()`

**Process:**
1. Fetch current profile
2. Remove from ownedBlobbis array
3. Clear favoriteBlobbi if removed
4. Publish event
5. Invalidate queries

#### Achievement System

**Add Achievement Hook:** `useAddAchievement()`

**Process:**
1. Fetch current profile
2. Check if already achieved
3. Add to achievements array
4. Publish event
5. Invalidate queries

**Deduplication:**
```typescript
if (currentProfile.achievements.includes(achievementId)) {
  return; // Already achieved
}
```

#### Storage/Inventory System

**Add to Storage Hook:** `useAddToStorage()`

**Process:**
1. Fetch current profile
2. Validate quantity > 0
3. Find existing item
4. If exists, increment quantity
5. If new, add to storage array
6. Publish event
7. Invalidate queries

**Storage Item Structure:**
```typescript
interface BlobbonautStorageItem {
  itemId: string;
  quantity: number;
}
```

**Storage Tag Format:**
```typescript
['storage', `${itemId}:${quantity}`]
```

#### Onboarding System

**Set Onboarding Done Hook:** `useSetOnboardingDone()`

**Process:**
1. Fetch current profile
2. Update onboarding_done flag
3. Publish event
4. Invalidate queries

**Usage:**
- Called after tutorial completion
- Prevents showing tutorial again
- Unlocks certain features

#### Additional Tags System

**Purpose:** Store unmapped tags for future compatibility

**Structure:**
```typescript
additionalTags?: Record<string, string | string[]>
```

**Behavior:**
- Single-value tags: `{ tagName: 'value' }`
- Multi-value tags: `{ tagName: ['value1', 'value2'] }`

**Preservation:**
```typescript
if (profile.additionalTags) {
  Object.entries(profile.additionalTags).forEach(([tagName, tagValue]) => {
    if (Array.isArray(tagValue)) {
      tagValue.forEach(value => {
        if (typeof value === 'string' && value.trim() !== '') {
          tags.push([tagName, value]);
        }
      });
    } else if (typeof tagValue === 'string' && tagValue.trim() !== '') {
      tags.push([tagName, tagValue]);
    }
  });
}
```

### React Hooks Using Kind 31125

| Hook | File | Purpose |
|------|------|---------|
| `useBlobbonautProfile` | `useBlobbonautProfile.ts` | Fetch profile |
| `useBlobbonautProfiles` | `useBlobbonautProfile.ts` | Fetch multiple profiles |
| `useUpdateBlobbonautProfile` | `useBlobbonautProfile.ts` | Update profile |
| `useAddCoins` | `useBlobbonautProfile.ts` | Add coins |
| `useSpendCoins` | `useBlobbonautProfile.ts` | Spend coins |
| `useAddBlobbi` | `useBlobbonautProfile.ts` | Add Blobbi to collection |
| `useRemoveBlobbi` | `useBlobbonautProfile.ts` | Remove Blobbi |
| `useUpdatePettingLevel` | `useBlobbonautProfile.ts` | Update petting level |
| `useAddAchievement` | `useBlobbonautProfile.ts` | Add achievement |
| `useAddToStorage` | `useBlobbonautProfile.ts` | Add item to storage |
| `useSetOnboardingDone` | `useBlobbonautProfile.ts` | Set onboarding done |
| `useCreateInitialProfile` | `useBlobbonautProfile.ts` | Create initial profile |
| `useStorageItemQuantity` | `useBlobbonautProfile.ts` | Get item quantity |
| `useCoinBalance` | `useCoinBalance.ts` | Get coin balance |
| `useBlobbonautProfileWithFakeInventory` | `useBlobbonautProfileWithFakeInventory.ts` | Fake inventory overlay |

### Components Using Kind 31125

| Component | File | Purpose |
|-----------|------|---------|
| `BlobbiLayout` | `BlobbiLayout.tsx` | Display coins |
| `BlobbiDashboard` | `BlobbiDashboard.tsx` | Display profile |
| `BlobbiProfile` | `BlobbiProfile.tsx` | Profile page |

### Validation

**File:** `src/lib/blobbi-validation.ts`

**Checks:**
1. Required tags present
2. Content is empty string
3. Numeric fields are valid integers ≥ 0

**Required Tags:**
```typescript
const REQUIRED_BLOBBONAUT_TAGS = ['d'];
```

**Content Validation:**
```typescript
if (event.content !== '') return false;
```

**Numeric Validation:**
```typescript
const numericFields = ['coins', 'pettingLevel', 'lifetimeBlobbis'];
for (const field of numericFields) {
  const value = getTagValue(event.tags, field);
  if (value) {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) return false;
  }
}
```

---

## Cross-Kind Dependencies

### Event Creation Order

**Adoption Flow:**
1. Create Kind 14921 (birth record)
2. Create Kind 31124 (initial state with fees)
3. Create Kind 31125 (update profile with new Blobbi)

**Hatching Flow:**
1. Create Kind 14921 (hatched record)
2. Update Kind 31124 (baby state)

**Evolution Flow:**
1. Create Kind 14921 (evolution record)
2. Update Kind 31124 (adult state)

**Interaction Flow:**
1. Create Kind 14919 (interaction record)
2. Update Kind 31124 (updated stats)

**Breeding Flow:**
1. Create Kind 14920 (breeding event)
2. Create Kind 14921 (offspring birth record)
3. Create Kind 31124 (offspring initial state)

### Query Patterns

**Get Complete Blobbi Data:**
```javascript
// 1. Fetch state
const stateEvents = await nostr.query([{
  kinds: [31124],
  authors: [pubkey],
  '#d': [blobbiId],
  limit: 1
}]);

// 2. Fetch records
const recordEvents = await nostr.query([{
  kinds: [14921],
  '#blobbi_id': [blobbiId]
}]);

// 3. Fetch interactions (optional)
const interactionEvents = await nostr.query([{
  kinds: [14919],
  '#blobbi_id': [blobbiId],
  limit: 50
}]);

// 4. Combine data
const blobbi = parseBlobbiFromStateEvent(stateEvents[0]);
const records = recordEvents.map(parseRecordFromEvent);
const interactions = interactionEvents.map(parseInteractionFromEvent);
```

**Get User's Collection:**
```javascript
// 1. Fetch profile
const profileEvents = await nostr.query([{
  kinds: [31125],
  authors: [pubkey],
  limit: 10
}]);

// Filter to Blobbi ecosystem
const blobbiProfiles = profileEvents.filter(event =>
  event.tags.some(([name, value]) => name === 'b' && value === 'blobbi:ecosystem:v1')
);

// Get latest profile
const latestProfile = blobbiProfiles.sort((a, b) => b.created_at - a.created_at)[0];
const profile = parseBlobbonautProfileFromEvent(latestProfile);

// 2. Fetch all owned Blobbis
const blobbiIds = profile.ownedBlobbis;
const stateEvents = await Promise.all(
  blobbiIds.map(id =>
    nostr.query([{
      kinds: [31124],
      authors: [pubkey],
      '#d': [id],
      limit: 1
    }])
  )
);

const blobbis = stateEvents
  .flat()
  .map(parseBlobbiFromStateEvent)
  .filter(Boolean);
```

**Get Community Feed:**
```javascript
// Fetch recent state events from different users
const stateEvents = await nostr.query([{
  kinds: [31124],
  limit: 50
}]);

// Parse and deduplicate by user
const blobbis = stateEvents
  .map(parseBlobbiFromStateEvent)
  .filter(Boolean)
  .reduce((unique, blobbi) => {
    if (!unique.find(b => b.ownerPubkey === blobbi.ownerPubkey)) {
      unique.push(blobbi);
    }
    return unique;
  }, []);
```

### State Consistency Rules

**Rule 1: State Before Interactions**
- Kind 31124 must exist before Kind 14919
- Interactions reference existing Blobbi

**Rule 2: Birth Before State**
- Kind 14921 (birth) must exist before Kind 31124
- State references birth record

**Rule 3: Evolution Before Adult**
- Kind 14921 (evolution) must exist for adult Blobbis
- Evolution record proves legitimacy

**Rule 4: Profile Before Ownership**
- Kind 31125 should exist before owning Blobbis
- Profile tracks owned Blobbis

**Rule 5: Breeding Requires Adults**
- Both parents must have Kind 31124 with stage=adult
- Both parents must have breeding_ready=true

---

## Utility Functions

### Event Creation

| Function | File | Purpose |
|----------|------|---------|
| `createBlobbiStateEvent` | `blobbi-events.ts` | Create Kind 31124 |
| `createBlobbiInteractionEvent` | `blobbi-events.ts` | Create Kind 14919 |
| `createBlobbiRecordEvent` | `blobbi-events.ts` | Create Kind 14921 |
| `createBlobbiBreedingEvent` | `blobbi-events.ts` | Create Kind 14920 |
| `createBlobbonautProfileEvent` | `blobbi-events.ts` | Create Kind 31125 |

### Event Parsing

| Function | File | Purpose |
|----------|------|---------|
| `parseBlobbiFromStateEvent` | `blobbi-events.ts` | Parse Kind 31124 |
| `parseInteractionFromEvent` | `blobbi-events.ts` | Parse Kind 14919 |
| `parseRecordFromEvent` | `blobbi-events.ts` | Parse Kind 14921 |
| `parseBlobbonautProfileFromEvent` | `blobbi-events.ts` | Parse Kind 31125 |

### Event Validation

| Function | File | Purpose |
|----------|------|---------|
| `validateBlobbiEvent` | `blobbi-events.ts` | Validate any Blobbi event |
| `validateRequiredTags` | `blobbi-events.ts` | Check required tags |
| `validateStatChange` | `blobbi-events.ts` | Validate stat change format |
| `validateTimestamp` | `blobbi-events.ts` | Validate timestamp format |
| `validateRecordTypeSpecificTags` | `blobbi-events.ts` | Validate record-specific tags |

### Tag Helpers

| Function | File | Purpose |
|----------|------|---------|
| `getTagValue` | `blobbi-events.ts` | Get single tag value |
| `getTagValues` | `blobbi-events.ts` | Get multi-value tag values |
| `ensureBlobbiTagsWithDebug` | `blobbi-tags.ts` | Ensure ecosystem tags |
| `buildBlobbiStateTags` | `blobbi-state-builder.ts` | Build state tags |
| `filterEggTagsForBaby` | `blobbi-evolution.ts` | Filter egg tags |

### Stat Helpers

| Function | File | Purpose |
|----------|------|---------|
| `clampStat` | `blobbi-events.ts` | Clamp stat to 0-100 |
| `validateStat` | `blobbi-events.ts` | Validate and clamp stat |
| `validateBlobbiStats` | `blobbi-events.ts` | Validate all stats |
| `calculateStatDegradation` | `blobbi-events.ts` | Calculate decay |
| `recoverMissingStatsFromTimestamps` | `blobbi-events.ts` | Recover stats |

### ID Helpers

| Function | File | Purpose |
|----------|------|---------|
| `validateBlobbiId` | `blobbi-events.ts` | Validate Blobbi ID format |
| `createBlobbiId` | `blobbi-events.ts` | Create Blobbi ID from name |
| `extractBlobbiName` | `blobbi-events.ts` | Extract name from ID |
| `normalizeBlobbiName` | `blobbi-events.ts` | Normalize name |
| `isValidBlobbiName` | `blobbi-events.ts` | Validate name |

### Divine Helpers

| Function | File | Purpose |
|----------|------|---------|
| `isDivineBlobbi` | `blobbi-divine-utils.ts` | Check if divine |
| `ensureDivineTags` | `blobbi-divine-utils.ts` | Add divine tags |
| `syncDivineModelFields` | `blobbi-divine-utils.ts` | Sync model fields |
| `validateDivineConsistency` | `blobbi-divine-utils.ts` | Validate consistency |

### Evolution Helpers

| Function | File | Purpose |
|----------|------|---------|
| `processHatching` | `blobbi-evolution.ts` | Process egg → baby |
| `processEvolution` | `blobbi-evolution.ts` | Process baby → adult |
| `checkEggHatchingReadiness` | `blobbi-evolution.ts` | Check hatching eligibility |
| `checkBabyEvolutionReadiness` | `blobbi-evolution.ts` | Check evolution eligibility |
| `updateEvolutionProgress` | `blobbi-evolution.ts` | Update progress |
| `filterEggTagsForBaby` | `blobbi-evolution.ts` | Remove egg tags |

### Adoption Helpers

| Function | File | Purpose |
|----------|------|---------|
| `createBlobbiWithAdoption` | `blobbi-adoption.ts` | Create new Blobbi |
| `generateRandomTraits` | `blobbi-adoption.ts` | Generate traits |
| `generateRandomColor` | `blobbi-adoption.ts` | Generate color |

---

## Constants

### Event Kinds

**File:** `src/lib/blobbi-events.ts`

```typescript
export const BLOBBI_EVENT_KINDS = {
  STATE: 31124,              // Addressable - current state
  INTERACTION: 14919,        // Regular - individual interactions
  BREEDING: 14920,           // Regular - breeding events
  RECORD: 14921,             // Regular - immutable records
  BLOBBONAUT_PROFILE: 31125, // Addressable - owner profile
} as const;
```

### Valid Values

**File:** `src/lib/blobbi-events.ts`

```typescript
const VALID_ACTIONS = [
  'feed', 'play', 'clean', 'rest', 'warm', 
  'check', 'sing', 'talk', 'medicine', 'cruzar'
] as const;

const VALID_STAGES: BlobbiLifeStage[] = ['egg', 'baby', 'adult'];

const VALID_STAT_NAMES = [
  'hunger', 'happiness', 'health', 'hygiene', 
  'energy', 'egg_temperature', 'shell_integrity'
] as const;
```

### Required Tags

**File:** `src/lib/blobbi-events.ts`

```typescript
const REQUIRED_STATE_TAGS = [
  'd', 'stage', 'breeding_ready', 
  'generation', 'experience', 'care_streak'
];

const REQUIRED_INTERACTION_TAGS = [
  'blobbi_id', 'action', 'action_category', 'stat_change'
];

const REQUIRED_RECORD_TAGS = ['blobbi_id', 'record_type'];

const REQUIRED_BREEDING_TAGS = [
  'parent_a', 'parent_b', 'owner_a', 
  'owner_b', 'breed_time', 'success'
];

const REQUIRED_BLOBBONAUT_TAGS = ['d'];
```

### Egg-Only Tags

**File:** `src/lib/blobbi-events.ts`

```typescript
const EGG_ONLY_TAGS = new Set([
  'egg_temperature', 'egg_status', 'shell_integrity', 'hatch_time',
  'start_incubation', 'incubation_time', 'start_evolution',
  'last_warm', 'last_check', 'last_talk', 'last_medicine', 'last_sing'
]);

const TASK_TAG_PATTERNS = ['_progress', '_confirmed', 'quest_', 'task_', 'incubation_'];
```

### Preserved Tags

**File:** `src/lib/blobbi-state-builder.ts`

```typescript
const PRESERVED_TAG_NAMES = new Set([
  'start_incubation',
  'start_evolution',
  'hatch_time',
]);
```

### Divine Constants

**File:** `src/lib/blobbi-divine-utils.ts`

```typescript
export const DIVINE_THEME = 'divine';
export const DIVINE_CROSSOVER_APP = 'divine';
```

### Decay Rates

**File:** `src/lib/blobbi-decay.ts`

```typescript
const DECAY_RATES = {
  hunger: -5,      // per hour
  happiness: -3,   // per hour
  hygiene: -4,     // per hour
  energy: -5,      // per hour (paused during sleep)
  health: -1,      // per hour (affected by other stats)
};
```

---

## Error Handling

### Common Errors

**Missing User:**
```typescript
if (!user) throw new Error('Must be logged in');
```

**Missing Blobbi:**
```typescript
if (!blobbi) throw new Error('Blobbi not found');
```

**Not Owner:**
```typescript
if (user.pubkey !== blobbi.ownerPubkey) {
  throw new Error('You can only interact with your own Blobbi');
}
```

**Invalid Stage:**
```typescript
if (blobbi.lifeStage !== 'egg') {
  throw new Error('This action is only available for eggs');
}
```

**On Cooldown:**
```typescript
if (isOnCooldown) {
  throw new Error(`Action is on cooldown. Time remaining: ${formatCooldownTime(remaining)}`);
}
```

**Insufficient Coins:**
```typescript
if (currentProfile.coins < coinsToSpend) {
  throw new Error('Insufficient coins');
}
```

**Invalid Stat Value:**
```typescript
if (isNaN(numValue) || numValue < 0 || numValue > 100) {
  throw new Error('Invalid stat value');
}
```

### Validation Errors

**Invalid Event Kind:**
```typescript
if (!Object.values(BLOBBI_EVENT_KINDS).includes(event.kind)) {
  return false; // Silent validation failure
}
```

**Missing Required Tags:**
```typescript
if (!validateRequiredTags(event.tags, REQUIRED_STATE_TAGS)) {
  return false;
}
```

**Invalid Timestamp:**
```typescript
if (event.created_at < minTimestamp || event.created_at > maxTimestamp) {
  return false;
}
```

### Auto-Repair Errors

**Missing Stats:**
```typescript
if (!hungerStr || !happinessStr || !healthStr || !hygieneStr || !energyStr) {
  console.warn('[AutoRepair] Missing stat tags, triggering recovery');
  // Trigger auto-repair
}
```

**Publish Failed:**
```typescript
catch (error) {
  console.error(`[AutoRepair] Failed to publish repair for ${blobbiId}:`, error);
  // Remove from repaired sets so it can be retried
  repairedEventIds.delete(originalEvent.id);
  repairedBlobbis.delete(blobbiId);
}
```

---

## Migration Notes for v2

### Breaking Changes to Avoid

1. **Event Kind Numbers:** Do NOT change kind numbers (31124, 14919, 14920, 14921, 31125)
2. **Required Tags:** Do NOT remove or rename required tags
3. **Tag Formats:** Do NOT change tag value formats (e.g., `blobbi-{name}`)
4. **Content Format:** Do NOT change content format for Kind 31125 (must be empty)
5. **Addressable Event IDs:** Do NOT change `d` tag format

### Safe Improvements

1. **Add Optional Tags:** Safe to add new optional tags
2. **Add Validation:** Safe to add stricter validation
3. **Improve Parsing:** Safe to improve parsing logic
4. **Add Indexes:** Safe to add more query indexes
5. **Optimize Queries:** Safe to optimize query patterns

### Data Migration Checklist

- [ ] Preserve all existing event kinds
- [ ] Maintain tag compatibility
- [ ] Support old and new profile IDs
- [ ] Handle missing stat tags (auto-repair)
- [ ] Preserve divine Blobbi rules
- [ ] Maintain egg tag filtering
- [ ] Keep sleep tag logic
- [ ] Support additional tags
- [ ] Maintain multi-value tags
- [ ] Preserve timestamp formats

### Testing Requirements

- [ ] Query all event kinds
- [ ] Parse all event types
- [ ] Validate all tag formats
- [ ] Test stat recovery
- [ ] Test divine consistency
- [ ] Test egg → baby transition
- [ ] Test baby → adult evolution
- [ ] Test sleep system
- [ ] Test profile migration
- [ ] Test multi-value tags

---

## End of Document

**Total Event Kinds:** 5  
**Total Tags Documented:** 150+  
**Total Functions Documented:** 50+  
**Total Hooks Documented:** 30+  
**Total Components Documented:** 10+

This document represents the **complete** data layer specification of nostr-pet v1 as of December 1, 2025.
