# 🏠 Room System - Pou/Talking Tom Style

The HomeScreen now follows a **single-room pet app** layout similar to Pou and Talking Tom.

## 📐 Layout Structure

```
┌─────────────────────────────────────┐
│          HEADER                     │
│  Blobbi | User        [⚙️] [🛒]    │
├─────────────────────────────────────┤
│                                     │
│          MAIN AREA                  │
│                                     │
│     ┌─────────────────────┐         │
│     │   [Egg/Baby/Adult]  │         │
│     │                     │         │
│     │   Blobbi Graphic    │         │
│     │   (Always Centered) │         │
│     │                     │         │
│     │   Room Content      │         │
│     │   (Changes based    │         │
│     │    on current room) │         │
│     └─────────────────────┘         │
│                                     │
├─────────────────────────────────────┤
│      ROOM NAVIGATION BAR            │
│   [<]   Room Name   [>]            │
├─────────────────────────────────────┤
│          FOOTER                     │
│      Action Buttons                 │
│   (Changes based on room)           │
└─────────────────────────────────────┘
```

## 🛏️ Available Rooms

### 1. My Blobbi / My Blobbies

**When to show:**
- Single Blobbi: "My Blobbi"
- Multiple Blobbis: "My Blobbies" with selector

**Content:**

**For Eggs:**
- EggGraphic in center
- Incubation panel showing:
  - Temperature indicator (0-100°)
  - Visual temperature bar
  - Care instructions

**For Baby/Adult:**
- Baby or Adult graphic in center
- Stats visible in room content
- Info badges (life stage, evolution form)

**Footer Actions:**

**Egg:**
- 🌡️ Warm Egg (increases temperature)
- ✨ Shake Egg (interaction)
- ℹ️ Check (info)
- ❤️ Sing (care action)

**Baby/Adult:**
- 🍴 Feed
- ✨ Clean
- ⚡ Sleep/Wake
- ❤️ Medicine
- ℹ️ Blobbi Info

### 2. Growth Hub

**Purpose:** Growth, learning, self-improvement activities

**Content:**
- Blobbi graphic in center
- Three activity cards:
  - 🎯 Daily Habit - Build healthy routines
  - 📈 Goals - Track your progress
  - 💡 Mini Quests - Complete challenges

**Footer Actions:**
- 🎯 Start Activity (mock)
- 📈 View Progress (mock)
- 💡 Random Prompt (shows random growth question)

**Locked for Eggs:**
- Shows "Room Locked" message
- Displays egg graphic
- Footer shows locked state

### 3. Playroom

**Purpose:** Fun, play, mini-games

**Content:**
- Blobbi graphic in center
- Three play cards:
  - ▶️ Mini Games - Play fun games
  - 🎲 Throw a Ball - Interactive play
  - 😊 Tell a Joke - Make Blobbi laugh

**Footer Actions:**
- ▶️ Mini-Game (mock)
- 🎲 Throw Ball (mock)
- 😊 Tell Joke (shows random joke)

**Locked for Eggs:**
- Shows "Room Locked" message
- Displays egg graphic
- Footer shows locked state

## 🔄 Room Navigation

**Navigation Bar:**
- Left arrow `<` - Previous room
- Center text - Current room name
- Right arrow `>` - Next room

**Room Order:**
```
MY_BLOBBI ←→ GROWTH_HUB ←→ PLAYROOM
     ↑                           ↓
     └───────────────────────────┘
```

Cycles infinitely in both directions.

## 🥚 Egg Special Behavior

When `currentBlobbi.lifeStage === 'egg'`:

**My Blobbi Room:**
- ✅ Fully functional
- Shows incubation panel
- Egg-specific actions
- Temperature management

**Growth Hub & Playroom:**
- 🔒 Locked
- Shows lock icon and message
- Displays egg graphic (still centered)
- Footer shows "Room locked" message
- Message: "This room will unlock when your Blobbi hatches!"

## 🎮 Mock Interactions

All actions are **mock-only** and show toast notifications:

**Egg Actions:**
- Warm Egg → Increases temperature state (+10°)
- Shake Egg → Toast message
- Check → Toast message
- Sing → Toast message

**Regular Actions:**
- Feed, Clean, Sleep, Medicine → Toast messages
- Info → Toast with Blobbi details

**Growth Hub:**
- Start Activity → Toast
- View Progress → Toast
- Random Prompt → Shows random growth question

**Playroom:**
- Mini-Game → Toast
- Throw Ball → Toast
- Tell Joke → Shows random joke

## 🎨 Visual Design

### Header
- White background with backdrop blur
- App name (Blobbi) with gradient
- User name below
- Settings and Shop icon buttons

### Main Area
- Gradient background (purple → pink → blue)
- Centered card with shadow
- Blobbi always in center
- Room content below/around Blobbi

### Room Navigation Bar
- White background with backdrop blur
- Horizontal layout
- Arrow buttons on sides
- Room name centered

### Footer
- White background
- 2-4 action buttons per room
- Gradient colored buttons for primary actions
- Outline buttons for secondary actions
- Grid layout (2 or 3 columns)

## 📱 Responsive Behavior

- Mobile-first design
- Max width: 448px (max-w-md)
- Centered on larger screens
- Full-height layout (min-h-screen)
- Flex column with flex-1 main area

## 🔧 State Management

```typescript
// Room state
const [currentRoom, setCurrentRoom] = useState<Room>('MY_BLOBBI');

// Blobbi selector (for multiple pets)
const [currentBlobbiIndex, setCurrentBlobbiIndex] = useState(0);

// Egg-specific state
const [eggTemperature, setEggTemperature] = useState(65);
```

## 🎯 Key Features

1. **Always-Centered Pet**
   - Blobbi graphic always in center
   - Same visual across all rooms
   - Changes based on life stage

2. **Room-Based Content**
   - Different content per room
   - Different actions per room
   - Locked rooms for eggs

3. **Smooth Navigation**
   - Left/right arrows
   - Infinite cycling
   - Instant room switching

4. **Contextual Actions**
   - Footer changes per room
   - Different buttons per life stage
   - Visual feedback via toasts

5. **Multiple Blobbis Support**
   - Selector in "My Blobbies" room
   - Shows count (1 of 3)
   - Prev/Next buttons

## 🚀 Future Integration

When adding real logic:

1. **Replace mock actions** with real stat updates
2. **Add room unlock logic** based on life stage
3. **Implement mini-games** in Playroom
4. **Add growth tracking** in Growth Hub
5. **Persist room state** across sessions
6. **Add room-specific backgrounds** or themes
7. **Animate room transitions**

## 📊 Room Comparison

| Room | Egg Accessible | Baby/Adult Content | Footer Actions |
|------|---------------|-------------------|----------------|
| My Blobbi | ✅ Yes | Blobbi visual + stats | Care actions (4-5) |
| Growth Hub | 🔒 Locked | Activity cards | Growth actions (3) |
| Playroom | 🔒 Locked | Game cards | Play actions (3) |

---

**Design Philosophy:** Keep the pet always visible and centered, change the context around it. This creates a cohesive experience where the Blobbi is the constant focal point, similar to Pou and Talking Tom.
