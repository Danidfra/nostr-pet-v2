# Blobbi v1 Items and Interactions - Complete Reference

## 1. Overview

This document provides a comprehensive reference of all items, interactions, and game mechanics present in **Blobbi v1**. It is intended to serve as the authoritative source for rebuilding these systems in Blobbi v2.

All data has been extracted from the v1 codebase and represents the actual implementation as of the documentation date.

---

## 2. Status / Stats Model (BlobbiStats)

### Core Stats Structure

```typescript
interface BlobbiStats {
  hunger: number;      // 0-100 (0 = starving, 100 = full)
  happiness: number;   // 0-100 (0 = sad, 100 = very happy)
  energy: number;      // 0-100 (0 = exhausted, 100 = energetic)
  hygiene: number;     // 0-100 (0 = dirty, 100 = clean)
  health: number;      // 0-100 (0 = sick, 100 = healthy)
}
```

### Egg-Specific Stats

Eggs have additional stats not present in baby/adult stages:

- **`eggTemperature`**: 0-100 (0 = very cold, 100 = very warm)
  - Also referred to as "warmth" in UI
  - Default: 100 (when created)
  - Critical threshold: Below 40 is dangerous
  
- **`shellIntegrity`**: 0-100 (0 = broken, 100 = perfect)
  - Default: 100 (when created)
  - Critical threshold: Below 50 triggers care point penalties
  - Affects hatching eligibility

### Stat Constraints

- **Range**: All stats are clamped to 0-100
- **Default Values**: Most stats initialize at 100 for new Blobbis
- **Persistence**: Stats are stored in Nostr events (kind 31124) and updated via interactions (kind 14919)

### Life Stages

```typescript
type BlobbiLifeStage = 'egg' | 'baby' | 'adult';
```

Each stage has different:
- Available interactions
- Stat decay rates
- Evolution requirements
- Visual appearance

---

## 3. Items List

All items are defined in `src/lib/shop-items.ts` and available for purchase in the Blobbi Shop.

### 3.1 Food Items

Food items increase hunger and provide various stat boosts, but most reduce hygiene due to messiness.

| ID | Display Name | Price | Effects | Icon | Stage Compatibility | Notes |
|---|---|---|---|---|---|---|
| `food_apple` | Apple | 10 coins | hunger +15, hygiene -2, energy +5 | 🍎 | baby, adult | Basic healthy snack |
| `food_burger` | Burger | 25 coins | hunger +40, happiness +10, hygiene -8, energy +8 | 🍔 | baby, adult | Filling but messy |
| `food_cake` | Cake | 50 coins | hunger +20, happiness +30, hygiene -10, energy +10 | 🎂 | baby, adult | High happiness boost, very messy |
| `food_pizza` | Pizza | 35 coins | hunger +35, happiness +15, hygiene -9, energy +10 | 🍕 | baby, adult | Popular choice, good balance |
| `food_sushi` | Sushi | 45 coins | hunger +30, health +10, hygiene -6, energy +7 | 🍣 | baby, adult | Healthiest food option |

**Key Mechanics:**
- All food items reduce hygiene (range: -2 to -10)
- Food cannot be used on eggs
- Using food triggers the `feed` interaction
- Food is consumed from inventory on use

### 3.2 Toy Items

Toys increase happiness but reduce energy through play. Some also reduce hygiene.

| ID | Display Name | Price | Effects | Icon | Stage Compatibility | Notes |
|---|---|---|---|---|---|---|
| `toy_ball` | Ball | 30 coins | happiness +25, energy -10, hygiene -5 | ⚽ | baby, adult | Active play, gets dirty |
| `toy_teddy` | Teddy Bear | 60 coins | happiness +40, energy -15 | 🧸 | baby, adult | High happiness, more tiring |
| `toy_blocks` | Building Blocks | 40 coins | happiness +30, energy -10 | 🧱 | baby, adult | Creative play |

**Key Mechanics:**
- All toys reduce energy (range: -10 to -15)
- Ball is the only toy that reduces hygiene (-5)
- Using toys triggers the `play` interaction
- Toys are consumed from inventory on use

### 3.3 Medicine Items

Medicine items boost health and sometimes other stats. For eggs, health effects automatically convert to shell_integrity effects.

| ID | Display Name | Price | Effects | Icon | Stage Compatibility | Notes |
|---|---|---|---|---|---|---|
| `med_vitamins` | Vitamins | 40 coins | health +20 | 💊 | egg, baby, adult | Basic health boost, "swallow" sound |
| `med_super` | Super Medicine | 100 coins | health +50, energy +20, happiness -10 | 💉 | egg, baby, adult | Strong healing, "ouch" sound |
| `med_bandage` | Bandage | 20 coins | health +15 | 🩹 | egg, baby, adult | Cheap healing option, "ouch" sound |
| `med_elixir` | Health Elixir | 150 coins | health +80, happiness +20, energy +10 | 🧪 | egg, baby, adult | Premium healing, "swallow" sound |
| `med_shell_repair` | Shell Repair Kit | 60 coins | health +30 | 🥚 | egg, baby, adult | Egg-themed medicine |
| `med_calcium` | Calcium Supplement | 35 coins | health +35 | 🦴 | egg, baby, adult | Good value healing |

**Key Mechanics:**
- For eggs: health effects → shell_integrity effects
- For baby/adult: health effects → health stat
- Medicine triggers the `medicine` interaction
- Some medicine has associated sound effects (swallow/ouch)
- Medicine is consumed from inventory on use

### 3.4 Hygiene Items

Hygiene items clean the Blobbi and often boost happiness.

| ID | Display Name | Price | Effects | Icon | Stage Compatibility | Notes |
|---|---|---|---|---|---|---|
| `hyg_soap` | Soap | 15 coins | hygiene +30 | 🧼 | egg, baby, adult | Basic cleaning |
| `hyg_shampoo` | Shampoo | 25 coins | hygiene +50, happiness +10 | 🧴 | egg, baby, adult | Better cleaning + mood boost |
| `hyg_bubble` | Bubble Bath | 40 coins | hygiene +60, happiness +20 | 🛁 | egg, baby, adult | Best cleaning + happiness |
| `hyg_towel` | Soft Towel | 20 coins | hygiene +25, happiness +5 | 🏖️ | egg, baby, adult | Gentle cleaning option |

**Key Mechanics:**
- All hygiene items boost hygiene (range: +25 to +60)
- Most also boost happiness (range: +5 to +20)
- Using hygiene items triggers the `clean` interaction
- Hygiene items are consumed from inventory on use

### 3.5 Accessory Items

Accessories are cosmetic items that don't affect stats (future customization feature).

| ID | Display Name | Price | Effects | Icon | Stage Compatibility | Notes |
|---|---|---|---|---|---|---|
| `acc_hat` | Party Hat | 75 coins | None | 🎩 | baby, adult | Cosmetic only |
| `acc_glasses` | Cool Glasses | 60 coins | None | 🕶️ | baby, adult | Cosmetic only |
| `acc_bow` | Bow Tie | 50 coins | None | 🎀 | baby, adult | Cosmetic only |
| `acc_crown` | Crown | 100 coins | None | 👑 | baby, adult | Cosmetic only |

**Key Mechanics:**
- Accessories currently have no gameplay effects
- Intended for future visual customization system
- Not consumed on use (persistent cosmetics)

---

## 4. Interactions (Actions)

### 4.1 Interaction System Overview

All interactions are published as Nostr events (kind 14919) and update the Blobbi's state (kind 31124).

**Core Interaction Flow:**
1. User triggers interaction (button click, item use, etc.)
2. Fake status updated immediately (optimistic UI)
3. Kind 14919 interaction event published
4. Kind 31124 state event auto-updated
5. Stats clamped to 0-100 range
6. Experience and care points awarded

### 4.2 Feed Interaction

**Action Type:** `feed`

**Where Implemented:**
- `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
- `src/components/blobbi/BlobbiFeedModal.tsx`
- `src/hooks/useBlobbiInteractionSystem.ts`

**Trigger:**
- User selects a food item from inventory
- User confirms feeding in the feed modal
- In companion mode: user places food on screen

**Conditions:**
- Blobbi must not be sleeping
- Blobbi must be baby or adult stage (not egg)
- User must have food item in inventory
- Minimum 3-second cooldown between same-type interactions

**Effects:**

*Base feed action (no item):*
- hunger +30
- happiness +5
- experience +5
- care_points +1

*With food item:*
- Applies all effects from the food item (see Food Items table)
- Example with Pizza: hunger +35, happiness +15, hygiene -9, energy +10
- experience +5 (base)
- care_points +1

**State Updates:**
- `lastMeal` timestamp updated
- `lastInteraction` timestamp updated
- Stats clamped to 0-100
- `experience` incremented
- `careStreak` may increment

**Special Rules:**
- Food items are consumed from inventory
- Hygiene reduction is intentional (eating is messy)
- Multiple stat changes applied simultaneously
- Optimistic UI update before Nostr confirmation

---

### 4.3 Clean Interaction

**Action Type:** `clean`

**Where Implemented:**
- `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
- `src/hooks/useBlobbiInteractionSystem.ts`
- Triggered by hygiene item use or companion interactions

**Trigger:**
- User uses a hygiene item from inventory
- User clicks "Clean" button (if available)
- Companion mode: bath/cleaning animations

**Conditions:**
- Blobbi can be any stage (egg, baby, adult)
- User must have hygiene item in inventory (for item-based cleaning)
- Minimum 3-second cooldown between same-type interactions

**Effects:**

*Base clean action (no item):*
- hygiene +40
- happiness +10
- experience +5
- care_points +1

*With hygiene item:*
- Applies all effects from the hygiene item (see Hygiene Items table)
- Example with Bubble Bath: hygiene +60, happiness +20
- experience +5 (base)
- care_points +1

**State Updates:**
- `lastClean` timestamp updated
- `lastInteraction` timestamp updated
- Stats clamped to 0-100
- `experience` incremented
- `careStreak` may increment

**Special Rules:**
- Hygiene items are consumed from inventory
- Can be used on eggs to clean the shell
- Most hygiene items also boost happiness
- Critical for preventing health decay in baby/adult stages

---

### 4.4 Play Interaction

**Action Type:** `play`

**Where Implemented:**
- `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
- `src/hooks/useBlobbiInteractionSystem.ts`
- `src/hooks/useBlobbiGameSystem.ts` (for mini-games)

**Trigger:**
- User uses a toy item from inventory
- User plays a mini-game with the Blobbi
- Companion mode: play animations

**Conditions:**
- Blobbi must be baby or adult stage (not egg)
- Blobbi must not be sleeping
- User must have toy item in inventory (for item-based play)
- Minimum 3-second cooldown between same-type interactions

**Effects:**

*Base play action (no item):*
- happiness +25
- energy -10
- experience +5
- care_points +1

*With toy item:*
- Applies all effects from the toy (see Toy Items table)
- Example with Teddy Bear: happiness +40, energy -15
- experience +5 (base)
- care_points +1

*Mini-game play:*
- happiness based on score/duration
- energy cost based on game type (default -10)
- experience based on performance
- care_points +1

**State Updates:**
- `lastInteraction` timestamp updated
- Stats clamped to 0-100
- `experience` incremented based on game score
- `careStreak` may increment

**Special Rules:**
- Toys are consumed from inventory
- Energy cost can make Blobbi tired
- Ball toy also reduces hygiene (-5)
- Mini-games may have custom stat changes

---

### 4.5 Rest/Sleep Interaction

**Action Type:** `rest`

**Where Implemented:**
- `src/hooks/useBlobbiSleepSystem.ts`
- `src/hooks/useBlobbiInteractionSystem.ts`

**Trigger:**
- User clicks "Put to Sleep" button
- User places Blobbi in bed (companion mode)
- Automatic at 100 energy (auto-wake)

**Conditions:**
- Blobbi must not already be sleeping
- Blobbi must be baby or adult stage (not egg)
- User must be the owner

**Effects:**

*When putting to sleep:*
- `isSleeping` set to true
- `state` set to 'sleeping'
- `sleepStartedAt` timestamp set
- `lastSleepUpdate` timestamp set
- energy +0 (initial, recovery happens over time)
- experience +0
- care_points +0

*During sleep (passive recovery):*
- energy +10 every 30 minutes
- No other stat changes during sleep
- Energy decay paused
- Other stats continue to decay normally

*Auto-wake at 100 energy:*
- `isSleeping` set to false
- `state` set to 'active'
- `sleepStartedAt` cleared
- `lastSleepUpdate` cleared

**State Updates:**
- `sleepStartedAt` timestamp set
- `lastSleepUpdate` timestamp updated every 30 minutes
- `lastInteraction` timestamp updated
- Sleep-related tags added to kind 31124 event

**Special Rules:**
- Energy regenerates at +10 per 30 minutes during sleep
- Energy decay is paused during sleep (other stats decay normally)
- Blobbi auto-wakes when energy reaches 100
- Only kind 31124 published during passive recovery (no kind 14919)
- Interactions blocked while sleeping (except wake)

---

### 4.6 Wake Interaction

**Action Type:** `wake`

**Where Implemented:**
- `src/hooks/useBlobbiSleepSystem.ts`

**Trigger:**
- User clicks "Wake Up" button
- Companion mode: wake animations

**Conditions:**
- Blobbi must be sleeping
- User must be the owner

**Effects:**
- `isSleeping` set to false
- `state` set to 'active'
- `sleepStartedAt` cleared
- `lastSleepUpdate` cleared
- happiness +5 (if energy >= 50)
- happiness -5 (if energy < 50, woken too early)
- experience +2
- care_points +1
- careStreak +1

**State Updates:**
- `sleepStartedAt` cleared (set to undefined)
- `lastSleepUpdate` cleared (set to undefined)
- `lastInteraction` timestamp updated
- Sleep-related tags removed from kind 31124 event

**Special Rules:**
- Waking with low energy causes happiness penalty
- Kind 14919 interaction published
- Kind 31124 state published (without sleep tags)
- Sleep recovery stops immediately

---

### 4.7 Medicine Interaction

**Action Type:** `medicine`

**Where Implemented:**
- `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
- `src/hooks/useBlobbiInteractionSystem.ts`

**Trigger:**
- User uses a medicine item from inventory
- User clicks "Give Medicine" button

**Conditions:**
- Blobbi can be any stage (egg, baby, adult)
- User must have medicine item in inventory
- Minimum 3-second cooldown between same-type interactions

**Effects:**

*Base medicine action (no item):*
- health +20 (or shell_integrity +20 for eggs)
- experience +5
- care_points +1

*With medicine item:*
- Applies all effects from the medicine (see Medicine Items table)
- For eggs: health effects → shell_integrity effects
- Example with Super Medicine: health +50, energy +20, happiness -10
- experience +5 (base)
- care_points +1

**State Updates:**
- `lastMedicine` timestamp updated
- `lastInteraction` timestamp updated
- Stats clamped to 0-100
- `experience` incremented
- `careStreak` may increment

**Special Rules:**
- Medicine items are consumed from inventory
- For eggs: ALL health effects convert to shell_integrity
- Some medicine has sound effects (swallow/ouch)
- Can be used preventatively (not just when sick)
- Critical for egg care (shell_integrity maintenance)

---

### 4.8 Egg-Specific Interactions

These interactions are only available for eggs (lifeStage === 'egg').

#### 4.8.1 Warm Interaction

**Action Type:** `warm`

**Where Implemented:**
- `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
- `src/components/blobbi/BlobbiLifecycleManager.tsx`

**Trigger:**
- User clicks "Warm" button in egg care interface

**Conditions:**
- Blobbi must be egg stage
- Minimum 3-second cooldown between same-type interactions

**Effects:**
- **egg_temperature +10** (warmth stat)
- **health +5**
- **shell_integrity +5** (unique: 3 stat changes!)
- experience +5
- care_points +2 (higher than most actions)

**State Updates:**
- `lastWarm` timestamp updated
- `lastInteraction` timestamp updated
- `eggTemperature` increased
- Stats clamped to 0-100

**Special Rules:**
- **CRITICAL**: This is the ONLY action that applies 3 stat changes
- Essential for egg care (prevents temperature decay)
- Higher care point value (2 instead of 1)
- Temperature below 40 is dangerous

#### 4.8.2 Check Interaction

**Action Type:** `check`

**Where Implemented:**
- `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
- `src/components/blobbi/BlobbiLifecycleManager.tsx`

**Trigger:**
- User clicks "Check" button in egg care interface

**Conditions:**
- Blobbi must be egg stage
- Minimum 3-second cooldown between same-type interactions

**Effects:**
- happiness +3
- experience +5
- care_points +1

**State Updates:**
- `lastCheck` timestamp updated
- `lastInteraction` timestamp updated

**Special Rules:**
- Small happiness boost
- Counts toward incubation task progress
- Lower impact than other egg interactions

#### 4.8.3 Sing Interaction

**Action Type:** `sing`

**Where Implemented:**
- `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
- `src/components/blobbi/BlobbiLifecycleManager.tsx`

**Trigger:**
- User clicks "Sing" button in egg care interface

**Conditions:**
- Blobbi must be egg stage
- Minimum 3-second cooldown between same-type interactions

**Effects:**
- happiness +8
- experience +5
- care_points +2

**State Updates:**
- `lastSing` timestamp updated
- `lastInteraction` timestamp updated

**Special Rules:**
- Higher happiness boost than "check"
- Higher care point value (2 instead of 1)
- Important for egg happiness maintenance

#### 4.8.4 Talk Interaction

**Action Type:** `talk`

**Where Implemented:**
- `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
- `src/components/blobbi/BlobbiLifecycleManager.tsx`

**Trigger:**
- User clicks "Talk" button in egg care interface

**Conditions:**
- Blobbi must be egg stage
- Minimum 3-second cooldown between same-type interactions

**Effects:**
- happiness +6
- experience +5
- care_points +1

**State Updates:**
- `lastTalk` timestamp updated
- `lastInteraction` timestamp updated

**Special Rules:**
- Medium happiness boost
- Counts toward incubation task progress
- Between "check" and "sing" in effectiveness

---

## 5. Stat Decay System

### 5.1 Decay Rates Overview

Stats automatically decay over time when the Blobbi is active. Decay is calculated based on hours passed since `lastInteraction`.

**Source:** `src/lib/blobbi-decay.ts`

### 5.2 Egg Stage Decay

**Decay Rates (per hour):**

| Stat | Decay Rate | Critical Threshold | Notes |
|---|---|---|---|
| egg_temperature | -3/hour | Below 40 | Warmth decays steadily |
| hygiene | -2/hour | Below 20 | Shell cleanliness |
| happiness | -3/hour | Below 40 | Egg mood |
| shell_integrity | Variable | Below 50 | Complex calculation |

**Shell Integrity Decay:**

Shell integrity has a complex decay system based on other stats:

- **Temperature-based decay:**
  - temp < 40: -4/hour
  - temp < 70: -2/hour
  - temp >= 70: no temperature decay

- **Hygiene-based decay:**
  - hygiene < 20: -3/hour
  - hygiene < 50: -1.5/hour
  - hygiene >= 50: no hygiene decay

- **Happiness-based decay:**
  - happiness < 40: -2/hour
  - happiness < 70: -1/hour
  - happiness >= 70: no happiness decay

**Shell Integrity Regeneration:**

- **Perfect care** (all stats at 100): +1/hour regeneration
- **Good care** (all stats >= 90): 0/hour (paused)
- **Any stat < 30**: Full decay applies

### 5.3 Baby Stage Decay

**Decay Rates (per hour):**

| Stat | Decay Rate | Critical Threshold | Notes |
|---|---|---|---|
| hunger | -5.0/hour | Below 30 | Faster than adult |
| happiness | -3.0/hour | Below 30 | Same as adult |
| energy | -6.0/hour (awake) | Below 20 | Faster than adult |
| energy | +4.0/hour (sleeping) | N/A | Regenerates during sleep |
| hygiene | -4.0/hour | Below 20 | Same as adult |
| health | -1.0/hour (base) | Below 30 | Can increase with modifiers |

**Health Decay Modifiers:**

Health decay increases when other stats are low:

- hunger < 30: +1.5/hour additional decay
- hygiene < 20: +1.0/hour additional decay
- energy < 20: +1.0/hour additional decay
- happiness < 30: +1.0/hour additional decay

**Health Regeneration:**

- All stats >= 80: +2/hour regeneration (instead of decay)

### 5.4 Adult Stage Decay

**Decay Rates (per hour):**

| Stat | Decay Rate | Critical Threshold | Notes |
|---|---|---|---|
| hunger | -4.0/hour | Below 30 | Slightly slower than baby |
| happiness | -3.0/hour | Below 30 | Same as baby |
| energy | -5.0/hour (awake) | Below 20 | Slightly slower than baby |
| energy | +4.0/hour (sleeping) | N/A | Same regeneration as baby |
| hygiene | -4.0/hour | Below 20 | Same as baby |
| health | -1.0/hour (base) | Below 30 | Same modifiers as baby |

**Health Decay Modifiers:** (Same as baby stage)

- hunger < 30: +1.5/hour additional decay
- hygiene < 20: +1.0/hour additional decay
- energy < 20: +1.0/hour additional decay
- happiness < 30: +1.0/hour additional decay

**Health Regeneration:** (Same as baby stage)

- All stats >= 80: +2/hour regeneration

### 5.5 Decay Application

**When Decay is Applied:**

1. **On Load:** When Blobbi data is fetched from Nostr
2. **Periodic:** Every minute while app is open (for sleeping Blobbis)
3. **Before Interaction:** Before applying interaction effects

**Decay Calculation:**

```typescript
hoursPassed = (currentTime - lastInteraction) / 3600
newStat = currentStat + (decayRate * hoursPassed)
clampedStat = Math.max(0, Math.min(100, newStat))
```

**Minimum Decay Threshold:**

- Decay only applies if > 6 minutes (0.1 hours) have passed
- This prevents excessive calculations for rapid interactions

### 5.6 Special Decay Rules

**Sleep State:**
- Energy decay is paused during sleep
- Energy regenerates at +4/hour during sleep
- All other stats continue to decay normally
- Sleep recovery happens in 30-minute blocks (+10 energy per block)

**Stat Relationships:**
- Low hunger/hygiene/energy/happiness → faster health decay
- High all stats → health regeneration
- For eggs: low temperature/hygiene/happiness → faster shell_integrity decay

**Critical Thresholds:**
- Stats below critical thresholds trigger warnings
- Egg shell_integrity < 50 triggers care point penalties
- Health < 30 is dangerous for baby/adult

---

## 6. Incubation System (Egg Hatching)

### 6.1 Incubation Tasks

**Source:** `src/hooks/useBlobbiIncubationSystem.ts`

Eggs must complete 4 tasks to be eligible for hatching:

| Task ID | Name | Description | Completion Method | Target | Notes |
|---|---|---|---|---|---|
| `first_post` | Publish first post with #Blobbi | Publish a kind:1 post with #Blobbi hashtag | Manual confirmation via Create Post modal | 1 post | Must use incubation feature |
| `post_blobbi_photo` | Post a photo of your Blobbi | Use Polaroid camera to post photo on Nostr | Manual confirmation via Polaroid modal | 1 photo | Must use "Post on Nostr" |
| `interact_6` | Interact 6 times | Perform 6 interactions with your egg | Auto-tracked via kind:14919 events | 6 interactions | Valid actions: talk, sing, warm, check, medicine, clean |
| `shell_integrity_above_50` | Keep shell strong | Maintain shell_integrity above 50 | State check (not event-based) | shell_integrity >= 50 | Checked at hatch time |

**Incubation Start:**
- User must manually start incubation via "Start Incubation" button
- Adds `start_incubation` tag to kind 31124 event (Unix timestamp)
- Only interactions AFTER this timestamp count toward tasks
- Only ONE egg can be incubating at a time

**Task Tracking:**
- Tasks are tracked via kind 31124 tags
- Confirmed tasks get `{task_id}_confirmed` tag
- Progress tasks get `{task_id}_progress` tag
- Task state persists across sessions

**Interaction Counting Rules:**
- 3-second cooldown between interactions (prevents spam)
- Only valid egg actions count: talk, sing, warm, check, medicine, clean
- Must have `start_incubation` tag for interactions to count
- Maximum 10 care points per day (prevents stat inflation)

**Hatching Process:**
1. All 4 tasks must be completed
2. User clicks "Hatch" button (manual trigger)
3. Kind 14921 hatching record published
4. Kind 31124 state updated to baby stage
5. `start_incubation` tag removed
6. Task confirmation tags removed

### 6.2 Evolution Tasks (Baby → Adult)

**Source:** `src/hooks/useBlobbiIncubationSystem.ts`

Baby Blobbis must complete 13 tasks to evolve to adult:

| Task ID | Name | Target | Event Kind | Description |
|---|---|---|---|---|
| `publish_3_posts` | Publish 3 new posts | 3 | kind:1 | Publish 3 posts after hatching |
| `repost_2_posts` | Repost 2 posts | 2 | kind:6 | Repost at least 2 posts |
| `receive_5_likes` | Receive 5 likes | 5 | kind:7 | Get 5 unique likes from different people |
| `send_or_receive_zap` | Send or receive a zap | 1 | kind:9735 | Zap activity (if supported) |
| `reply_to_post` | Reply to someone's post | 1 | kind:1 | Reply with e tag |
| `custom_reaction` | Use custom reaction | 1 | kind:7 | Non-standard emoji reaction |
| `create_long_note` | Create long note | 1 | kind:1 | Post > 280 characters |
| `use_hashtag` | Use hashtag | 1 | kind:1 | Post with t tag or # symbol |
| `mention_user` | Mention another user | 1 | kind:1 | Post with p tag |
| `react_to_5_posts` | React to 5 posts | 5 | kind:7 | React to 5 different posts |
| `follow_5_users` | Follow 5 users | 1 | kind:3 | Contact list with >= 5 p tags |
| `active_for_day` | Be active for a full day | 1 | kind:1 | Post every 6 hours for 24 hours |
| `post_blobbi_image` | Post an image of your Blobbi | 1 | kind:1 | Post with image URL (.jpg/.png/.gif) |

**Evolution Requirements:**
- All 13 tasks completed
- 24 hours passed since hatching (minimum)
- Additional stat requirements may apply [INFERRED]

**Task Tracking:**
- Same confirmation system as egg tasks
- Progress tracked in kind 31124 tags
- Unique likers/reactors tracked in memory

---

## 7. Edge Cases and Special Logic

### 7.1 Stat Clamping

All stats are always clamped to 0-100 range:

```typescript
function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}
```

**Applied:**
- After every interaction
- After decay calculation
- Before publishing to Nostr

### 7.2 Fake Status System

**Purpose:** Optimistic UI updates before Nostr confirmation

**Flow:**
1. User triggers interaction
2. Fake status updated immediately (local state)
3. UI shows new stats instantly
4. Nostr events published in background
5. Fake status synced with real data when available

**Pending Interaction Counter:**
- Tracks number of unconfirmed interactions
- Displayed to user as "pending changes"
- Cleared when real data arrives

**Source:** `src/contexts/BlobbiFakeStatusContext.tsx`

### 7.3 Interaction Cooldowns

**Global Cooldown:** 3 seconds between interactions of the SAME type

**Tracked per action type:**
- `lastMeal`, `lastClean`, `lastWarm`, `lastTalk`, `lastCheck`, `lastSing`, `lastMedicine`
- Stored as Unix timestamps (seconds)
- Prevents spam and stat inflation

**Implementation:**
```typescript
const timeSinceLastAction = currentTime - lastActionTimestamp;
if (timeSinceLastAction < 3) {
  // Block interaction
}
```

### 7.4 Sleep System Edge Cases

**Auto-Wake:**
- Blobbi automatically wakes when energy reaches 100
- Only happens once (tracked via `hasAutoWokenRef`)
- No kind 14919 published (only kind 31124)

**Sleep Recovery Blocks:**
- Energy recovers in 30-minute blocks
- +10 energy per block
- Tracked via `lastSleepUpdate` timestamp
- Passive recovery on app load (calculates missed blocks)
- Active recovery while app open (every minute check)

**Sleep Tag Management:**
- `sleepStartedAt` and `lastSleepUpdate` tags added during sleep
- Tags MUST be removed on wake (set to undefined)
- Prevents "stuck sleeping" bugs

### 7.5 Item Consumption

**All items are consumed on use:**
- Food items: consumed from inventory
- Toys: consumed from inventory
- Medicine: consumed from inventory
- Hygiene items: consumed from inventory
- Accessories: NOT consumed (persistent cosmetics)

**Inventory Management:**
- Stored in kind 31125 (Blobbonaut Profile)
- Updated via `useBlobbonautProfileWithFakeInventory` hook
- Quantity decremented on use
- Removed from storage when quantity reaches 0

### 7.6 Egg-Specific Rules

**Medicine on Eggs:**
- ALL health effects convert to shell_integrity
- Example: med_vitamins (health +20) → shell_integrity +20
- Critical for egg care

**Egg Interactions Only:**
- warm, check, sing, talk only work on eggs
- feed, play only work on baby/adult
- medicine, clean work on all stages

**Shell Integrity Penalty:**
- If shell_integrity < 50 for extended periods
- 5 care points deducted per hour below threshold
- Affects hatching eligibility

### 7.7 Experience and Care Points

**Experience Gained:**
- Base: +5 per interaction
- Games: variable based on score
- Wake action: +2

**Care Points:**
- Most actions: +1
- Egg warm/sing: +2
- Wake action: +1
- Maximum 10 per day (enforced by incubation system)

**Care Streak:**
- Increments on certain actions (wake, etc.)
- Tracks consecutive care days
- Used for evolution eligibility [INFERRED]

### 7.8 Companion Mode Integration

**Food Placement:**
- User selects food from modal
- Food placed on screen via click
- Blobbi walks to food and eats
- Food consumed from inventory on reach

**Sleep Bed:**
- Draggable bed component
- Blobbi walks to bed when placed
- Auto-sleep when reaching bed
- Bed can be moved while Blobbi sleeps

**Wake Animation:**
- Click on sleeping Blobbi to wake
- Wake interaction triggered
- Blobbi stands up and becomes active

**Source:** `src/components/blobbi/BlobbiCompanionIntegration.tsx`

---

## 8. Migration Notes for Blobbi v2

### 8.1 Unclear/Ambiguous Behaviors

1. **Evolution Stat Requirements:**
   - Current code mentions "150 care score + 50 interactions + 70% happiness + 80% health" in README
   - But incubation system only checks task completion
   - **Decision needed:** Which requirements are authoritative?

2. **Care Points Daily Cap:**
   - Maximum 10 care points per day mentioned in incubation system
   - Not enforced in interaction system
   - **Decision needed:** Enforce globally or only for incubation?

3. **Accessory Items:**
   - Currently have no gameplay effect
   - Not consumed on use
   - **Decision needed:** Implement visual customization in v2?

4. **Breeding System:**
   - Kind 14920 defined but not implemented
   - `breedingReady` field exists but unused
   - **Decision needed:** Implement breeding in v2?

5. **Decay on Load vs. Real-time:**
   - Decay calculated on load (passive)
   - Also calculated every minute (active)
   - **Decision needed:** Keep both or simplify?

### 8.2 Deprecated/Unused Features

1. **Accessories:**
   - 4 accessory items defined
   - No visual customization system
   - Not consumed on use
   - **Recommendation:** Remove or implement properly

2. **Breeding Events:**
   - Kind 14920 defined in types
   - No UI or logic implemented
   - **Recommendation:** Remove or implement in future

3. **Old Task Confirmation Format:**
   - Old format: `{task_id}_confirmed: "true"`
   - New format: `{task_id}_confirmed: "{timestamp}"`
   - Both supported for backward compatibility
   - **Recommendation:** Migrate all to new format

4. **Hibernating State:**
   - `BlobbiState = 'active' | 'sleeping' | 'hibernating'`
   - Hibernating never used
   - **Recommendation:** Remove or implement

5. **Multiple Evolution Forms:**
   - 17 evolution forms defined (pandi, owli, catti, etc.)
   - Not implemented in UI
   - **Recommendation:** Implement or reduce to fewer forms

### 8.3 Performance Considerations

1. **Fake Status System:**
   - Works well for optimistic updates
   - Can get out of sync if events fail
   - **Recommendation:** Add retry logic and better error handling

2. **Decay Calculations:**
   - Calculated on every load
   - Can be expensive for multiple Blobbis
   - **Recommendation:** Cache decay calculations

3. **Incubation Task Tracking:**
   - Subscribes to ALL user events (kind:1,3,6,7,9735,14919)
   - Can be noisy on active relays
   - **Recommendation:** Add more specific filters

4. **Multiple Blobbis:**
   - System supports multiple Blobbis per user
   - But incubation only tracks ONE egg at a time
   - **Recommendation:** Clarify multi-Blobbi UX

### 8.4 Data Integrity Issues

1. **Sleep Tag Cleanup:**
   - Sleep tags must be removed on wake
   - Easy to forget (causes stuck sleeping)
   - **Recommendation:** Add validation/auto-repair

2. **Stat Overflow:**
   - Stats can go negative without clamping
   - Clamping applied but not always enforced
   - **Recommendation:** Add validation layer

3. **Timestamp Formats:**
   - Mix of seconds (Nostr) and milliseconds (JavaScript)
   - Easy to make conversion errors
   - **Recommendation:** Standardize on one format with clear conversion utils

4. **Incubation State Sync:**
   - `start_incubation` tag can be added/removed
   - But task state persists in tags
   - **Recommendation:** Clear task tags when incubation stops

### 8.5 Feature Requests for v2

Based on code patterns and comments:

1. **Better Sound System:**
   - Only 2 medicine sounds implemented
   - **Recommendation:** Add sounds for all interactions

2. **Visual Customization:**
   - Accessory system exists but not functional
   - **Recommendation:** Implement visual customization with accessories

3. **Breeding System:**
   - Events defined but not implemented
   - **Recommendation:** Full breeding system with genetics

4. **Achievement System:**
   - `achievements` field in profile
   - Not implemented
   - **Recommendation:** Add achievement tracking and rewards

5. **Social Features:**
   - `inParty`, `visibleToOthers` fields exist
   - Not implemented
   - **Recommendation:** Add social interactions between Blobbis

---

## 9. Summary Tables

### 9.1 All Interactions Summary

| Action | Stage | Base Effects | Care Points | Experience | Cooldown | Notes |
|---|---|---|---|---|---|---|
| feed | baby, adult | hunger +30, happiness +5 | 1 | 5 | 3s | Can use food items |
| play | baby, adult | happiness +25, energy -10 | 1 | 5 | 3s | Can use toy items |
| clean | all | hygiene +40, happiness +10 | 1 | 5 | 3s | Can use hygiene items |
| rest | baby, adult | Sets sleeping state | 0 | 0 | none | Energy +10 per 30min |
| wake | baby, adult | happiness ±5 | 1 | 2 | none | Depends on energy level |
| medicine | all | health/shell +20 | 1 | 5 | 3s | Can use medicine items |
| warm | egg | temp +10, health +5, shell +5 | 2 | 5 | 3s | 3 stat changes! |
| check | egg | happiness +3 | 1 | 5 | 3s | Low impact |
| sing | egg | happiness +8 | 2 | 5 | 3s | Good happiness boost |
| talk | egg | happiness +6 | 1 | 5 | 3s | Medium happiness boost |

### 9.2 All Items Summary

| Category | Item Count | Price Range | Primary Effect | Consumed? |
|---|---|---|---|---|
| Food | 5 | 10-50 coins | hunger +15 to +40 | Yes |
| Toys | 3 | 30-60 coins | happiness +25 to +40 | Yes |
| Medicine | 6 | 20-150 coins | health +15 to +80 | Yes |
| Hygiene | 4 | 15-40 coins | hygiene +25 to +60 | Yes |
| Accessories | 4 | 50-100 coins | None (cosmetic) | No |
| **Total** | **22** | **10-150** | - | - |

### 9.3 Decay Rates Summary

| Stat | Egg | Baby | Adult | Critical Threshold |
|---|---|---|---|---|
| hunger | N/A | -5.0/h | -4.0/h | < 30 |
| happiness | -3.0/h | -3.0/h | -3.0/h | < 30-40 |
| energy | N/A | -6.0/h | -5.0/h | < 20 |
| hygiene | -2.0/h | -4.0/h | -4.0/h | < 20 |
| health | N/A | -1.0/h | -1.0/h | < 30 |
| egg_temperature | -3.0/h | N/A | N/A | < 40 |
| shell_integrity | Variable | N/A | N/A | < 50 |

**Sleep Regeneration:** energy +4.0/h (baby/adult only)

---

## Document Metadata

- **Created:** December 5, 2025
- **Source Codebase:** Blobbi v1
- **Primary Files Analyzed:**
  - `src/types/blobbi.ts`
  - `src/lib/shop-items.ts`
  - `src/lib/blobbi-decay.ts`
  - `src/hooks/useBlobbiInteractionSystem.ts`
  - `src/hooks/useBlobbiInteractionWithFakeStatus.ts`
  - `src/hooks/useBlobbiSleepSystem.ts`
  - `src/hooks/useBlobbiIncubationSystem.ts`
  - `src/components/blobbi/BlobbiFeedModal.tsx`
  - `src/components/blobbi/BlobbiShop.tsx`
  - `src/components/blobbi/BlobbiLifecycleManager.tsx`

- **Total Items Documented:** 22
- **Total Interactions Documented:** 10
- **Total Stat Types:** 7 (5 standard + 2 egg-specific)

---

**End of Document**
