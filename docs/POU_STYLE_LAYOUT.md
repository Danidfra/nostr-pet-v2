# Pou-Style Layout Guide

The HomeScreen now follows a clean, focused layout similar to Pou and Talking Tom style pet simulation apps.

## Visual Structure

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │
│  │ Blobbi          username      ☰   │  │ ← Header Row 1
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │     ● ● ● ● ●  Status Circles    │  │ ← Header Row 2
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              Blobbi Name                │
│              [egg] [blobbi]             │
│                                         │
│                  🥚                     │
│             (Centered)                  │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │     ←   My Blobbi   →             │  │ ← Footer Row 1
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  📷     [ ACTIONS ]     🎒        │  │ ← Footer Row 2
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ┌─────────────────────┐
         │                     │
         │  [Feed]   [Clean]   │ ← Slides up when
         │  [Sleep]  [Medicine]│   Actions clicked
         │                     │
         └─────────────────────┘
```

## Header Structure

### Row 1: Logo + Menu
```
┌─────────────────────────────────────┐
│ Blobbi          username        ☰   │
│                                     │
└─────────────────────────────────────┘
```

**Components:**
- **Left**: App title + username (stacked)
- **Right**: Hamburger menu (3 lines)

**Menu Items:**
```
☰ Menu
  ├─ Settings
  ├─ Shop
  └─ Logout (conditional)
```

### Row 2: Status Circles
```
┌─────────────────────────────────────┐
│      ● ● ● ● ●                      │
│    Health Hunger Happiness...       │
└─────────────────────────────────────┘
```

**5 Circles:**
1. Health (❤️)
2. Hunger (🍴)
3. Happiness (✨)
4. Energy (⚡)
5. Hygiene (💧)

**Each Circle:**
- Conic gradient ring (empties clockwise)
- Color thresholds: Red < 20, Yellow < 60, Green ≥ 60
- Tooltip on hover: "Health: 75/100"

## Center Area

### Clean Layout
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          Blobbi Name                │
│          [egg] [blobbi]             │
│                                     │
│              🥚                     │
│          (Scaled 1.25x)             │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Elements:**
- Blobbi name (2xl font, bold)
- Life stage badge (small)
- Evolution form badge (small, if present)
- Blobbi graphic (centered, scaled)

**No:**
- ❌ Arrows
- ❌ Selectors
- ❌ Temperature panels
- ❌ Cards
- ❌ Extra UI

## Footer Structure

### Row 1: Room Navigation
```
┌─────────────────────────────────────┐
│     ←      My Blobbi      →         │
└─────────────────────────────────────┘
```

**Components:**
- Left: Previous room button (◀)
- Center: Current room title
- Right: Next room button (▶)

**Rooms:**
1. My Blobbi / My Blobbies
2. Growth Hub
3. Playroom

### Row 2: Icon Row
```
┌─────────────────────────────────────┐
│  📷      [ ACTIONS ]      🎒        │
└─────────────────────────────────────┘
```

**Components:**
- **Camera** (left): Photo mode placeholder
- **Actions** (center): Primary control, large button
- **Backpack** (right): Inventory placeholder

**Styling:**
```tsx
// Camera & Backpack
<Button variant="outline" size="icon" className="rounded-full">
  <Icon />
</Button>

// Actions
<Button className="flex-1 max-w-[200px] h-12 bg-gradient-to-r from-purple-600 to-pink-600">
  Actions
</Button>
```

## Actions Panel

### Slide-Up Animation
```
State: Closed
┌─────────────────────────────────────┐
│  📷      [ ACTIONS ]      🎒        │
└─────────────────────────────────────┘
         (Panel hidden below)

State: Open
┌─────────────────────────────────────┐
│  📷      [ ACTIONS ]      🎒        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  [Feed]   [Clean]           │   │
│  │  [Sleep]  [Medicine]        │   │
│  │                             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Animation:**
- Duration: 300ms
- Easing: ease-in-out
- Transform: `translate-y-full` → `translate-y-0`

### Panel Styling
```tsx
className="
  bg-white/95 
  backdrop-blur-sm 
  border-t-2 
  border-purple-200 
  rounded-t-2xl 
  shadow-2xl 
  pt-6 pb-6 px-4
"
```

## Actions Per Context

### MY_BLOBBI - Egg Stage
```
┌─────────────────────────────────────┐
│  [Warm]       [Sing]                │
│  [Medicine]   [Clean]               │
└─────────────────────────────────────┘
```

**Actions:**
- Warm (🌡️): Increase temperature
- Sing (🎵): Comfort the egg
- Medicine (❤️): Health care
- Clean (✨): Keep clean

### MY_BLOBBI - Baby Stage
```
┌─────────────────────────────────────┐
│  [Feed]       [Clean]               │
│  [Sleep]      [Medicine]            │
└─────────────────────────────────────┘
```

**Actions:**
- Feed (🍴): Increase hunger
- Clean (✨): Increase hygiene
- Sleep (🛏️): Increase energy
- Medicine (❤️): Increase health

### MY_BLOBBI - Adult Stage
```
┌─────────────────────────────────────┐
│  [Feed]       [Clean]               │
│  [Sleep]      [Medicine]            │
│  [Breed - Soon]                     │
└─────────────────────────────────────┘
```

**Actions:**
- Feed (🍴): Increase hunger
- Clean (✨): Increase hygiene
- Sleep (🛏️): Increase energy
- Medicine (❤️): Increase health
- Breed (👶): **DISABLED** with "Soon" badge

**Breed Button:**
```tsx
<Button disabled className="relative">
  <Baby />
  <span>Breed</span>
  <Badge className="absolute top-1 right-1">Soon</Badge>
</Button>
```

### PLAYROOM
```
┌─────────────────────────────────────┐
│  [Toys]       [Games]               │
└─────────────────────────────────────┘
```

**Actions:**
- Toys (🎮): Play with toys
- Games (⚡): Mini-games

**Locked for eggs:**
```
┌─────────────────────────────────────┐
│  Room locked until your Blobbi      │
│  hatches                            │
└─────────────────────────────────────┘
```

### GROWTH_HUB
```
┌─────────────────────────────────────┐
│  [Start Activity]  [View Progress]  │
│  [Random Prompt]                    │
└─────────────────────────────────────┘
```

**Actions:**
- Start Activity (🎯): Begin growth task
- View Progress (📈): Check stats
- Random Prompt (💡): Reflection question

**Locked for eggs:**
```
┌─────────────────────────────────────┐
│  Room locked until your Blobbi      │
│  hatches                            │
└─────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (≥768px)
```
┌─────────────────────────────────────┐
│  Blobbi    username            ☰    │ ← Header
│  ● ● ● ● ● Status (single row)      │
├─────────────────────────────────────┤
│                                     │
│           Blobbi (centered)         │ ← Main
│                                     │
├─────────────────────────────────────┤
│  ←   Room Navigation   →            │ ← Footer
│  📷   [ ACTIONS ]   🎒              │
└─────────────────────────────────────┘
```

### Mobile (<768px)
```
┌───────────────────────┐
│ Blobbi  username  ☰   │ ← Header
│ ● ● ●                 │
│ ● ●   Status (wrap)   │
├───────────────────────┤
│                       │
│   Blobbi (centered)   │ ← Main
│                       │
├───────────────────────┤
│ ←   Room Nav   →      │ ← Footer
│ 📷 [ACTIONS] 🎒       │
└───────────────────────┘
```

**Status circles wrap gracefully on mobile while maintaining visual unity.**

## Color Scheme

### Gradients
- **App Title**: `from-purple-600 to-pink-600`
- **Actions Button**: `from-purple-600 to-pink-600`
- **Background**: `from-purple-50 via-pink-50 to-blue-50`

### Action Buttons
- **Feed**: `from-orange-500 to-red-500`
- **Clean**: `from-green-500 to-teal-500`
- **Sleep**: `from-indigo-500 to-purple-500`
- **Warm**: `from-orange-500 to-red-500`
- **Sing**: `from-purple-500 to-pink-500`
- **Toys**: `from-pink-500 to-rose-500`
- **Games**: `from-green-500 to-emerald-500`
- **Start Activity**: `from-purple-500 to-blue-500`
- **View Progress**: `from-blue-500 to-teal-500`

### Borders
- **Header**: `border-purple-100`
- **Footer**: `border-purple-200`
- **Panel**: `border-purple-200`

### Backgrounds
- **Header Row 1**: `bg-white/80 backdrop-blur-sm`
- **Header Row 2**: `bg-white/60 backdrop-blur-sm`
- **Footer**: `bg-white/80 backdrop-blur-sm`
- **Panel**: `bg-white/95 backdrop-blur-sm`

## Interaction Flow

### Opening Actions
1. User clicks "Actions" button
2. Panel slides up (300ms)
3. Actions displayed based on room + life stage
4. User selects action
5. Toast notification appears
6. Panel stays open

### Closing Actions
1. User clicks "Actions" button again
2. Panel slides down (300ms)
3. Panel hidden below viewport

### Room Navigation
1. User clicks ◀ or ▶
2. Room changes instantly
3. Actions panel closes (if open)
4. New room title displayed
5. Blobbi remains centered

### Menu Access
1. User clicks hamburger (☰)
2. Dropdown appears
3. User selects option
4. Dropdown closes
5. Action executed

## Accessibility

- **Keyboard Navigation**: All buttons focusable
- **Screen Readers**: Proper ARIA labels
- **Touch Targets**: Minimum 44px height
- **Contrast**: WCAG AA compliant
- **Focus States**: Visible outlines

## Performance

- **Smooth Animations**: 60fps transitions
- **Optimized Renders**: Conditional rendering
- **Minimal Re-renders**: Proper state management
- **Lazy Loading**: Components load as needed
