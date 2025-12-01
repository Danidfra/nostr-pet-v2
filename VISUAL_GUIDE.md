# Blobbi v2 - Visual Guide

## 🎯 Screen Flow

### 1. Auth Screen
```
┌─────────────────────────────────┐
│     🥚                          │
│                                 │
│   Welcome to Blobbi             │
│   Your virtual pet companion    │
│   awaits!                       │
│                                 │
│   [       Log In        ]       │
│                                 │
│   Mock login - no real auth     │
└─────────────────────────────────┘
```
- Gradient background: purple → pink → blue
- Large egg emoji
- Single "Log In" button
- Clean, welcoming design

### 2. Profile Setup Screen
```
┌─────────────────────────────────┐
│     👤                          │
│                                 │
│   Create Your Profile           │
│   Let's get to know you!        │
│                                 │
│   Your Name:                    │
│   [________________]            │
│                                 │
│   [      Continue       ]       │
└─────────────────────────────────┘
```
- User icon
- Single name input field
- Continue button (disabled until name entered)
- Blue-purple gradient theme

### 3. Blobbi Adoption Screen
```
┌─────────────────────────────────┐
│   Adopt Your First Blobbi       │
│   Every Blobbi starts as a      │
│   magical egg...                │
│                                 │
│        ╭──────╮                 │
│       │  🥚   │  ← Animated     │
│        ╰──────╯    Egg Preview  │
│                                 │
│   Name Your Blobbi:             │
│   [________________]            │
│                                 │
│   [    Adopt Blobbi     ]       │
└─────────────────────────────────┘
```
- Shows animated EggGraphic preview
- Special mark visible (rune_top)
- Name input
- Pink-purple gradient button
- Magical particle effects

### 4. Home Screen (Main UI)

#### Header
```
┌─────────────────────────────────┐
│ Blobbi              [Logout]    │
│ Welcome, [Name]!                │
└─────────────────────────────────┘
```

#### Blobbi Selector (if multiple pets)
```
┌─────────────────────────────────┐
│  [<]  Blobbi 1 of 3  [>]       │
└─────────────────────────────────┘
```

#### Main Blobbi Card
```
┌─────────────────────────────────┐
│        🥚 Eggy                  │
│     [Egg] [Level 0]             │
│                                 │
│     ╭─────────────╮             │
│    │   Animated   │             │
│    │   EggGraphic │             │
│    │   (Rune Top) │             │
│     ╰─────────────╯             │
│                                 │
│  ❤️  Health    [████████░░] 85% │
│  🍴  Hunger    [██████░░░░] 60% │
│  😊  Happiness [███████░░░] 70% │
│  ⚡  Energy    [████████░░] 80% │
│  ✨  Hygiene   [█████████░] 90% │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │Feed │ │Play │ │Clean│        │
│  │ 🍴  │ │ 😊  │ │ ✨  │        │
│  └─────┘ └─────┘ └─────┘        │
│  ┌─────┐ ┌─────┐                │
│  │Sleep│ │Med  │                │
│  │ ⚡  │ │ ❤️  │                │
│  └─────┘ └─────┘                │
└─────────────────────────────────┘
```

#### Bottom Navigation
```
┌─────────────────────────────────┐
│  [Shop] [Inventory] [Camera]    │
│   🛒      📦         📷         │
└─────────────────────────────────┘
```

## 🎨 Visual Elements

### Egg Stage (EggGraphic)
- **Size:** 128x160px (w x h)
- **Shape:** Oval with rounded bottom (50% 50% 50% 50% / 60% 60% 40% 40%)
- **Colors:** 
  - Base: #99ccff (light blue)
  - Secondary: #ccffcc (light green)
- **Effects:**
  - 3D gradient with highlights and shadows
  - Glow based on temperature (65% = warm yellow glow)
  - Special mark: rune_top at top center
  - Gentle sway animation
  - Floating particles
- **Divine Variant:**
  - Green color (#55C4A2)
  - "diVine" wordmark
  - Magical shimmer

### Baby Stage (BabyGraphic)
- **Size:** 192x192px
- **Variants:**
  - Base: Standard baby blobbi
  - Neon: Glowing variant for divine
  - Sleeping: Closed eyes
- **Animation:** Gentle bounce when active
- **Source:** SVG from `src/assets/baby-stage/baby/`

### Adult Stage (AdultGraphic)
- **Size:** 256x256px
- **Forms:** 17 different evolution forms
  - bloomi (flower theme)
  - pandi (panda theme)
  - owli (owl theme)
  - catti (cat theme)
  - And 13 more...
- **Variants:** Base and sleeping for each
- **Animation:** Gentle bounce when active
- **Source:** SVG from `src/assets/adult-stage/[form]/`

## 🎯 Stat Bars

All stats use Progress component with color coding:

```
Health    ████████░░ 85%  (Red - #ef4444)
Hunger    ██████░░░░ 60%  (Orange - #f97316)
Happiness ███████░░░ 70%  (Yellow - #eab308)
Energy    ████████░░ 80%  (Blue - #3b82f6)
Hygiene   █████████░ 90%  (Purple - #a855f7)
```

## 🎨 Action Buttons

All buttons use gradient backgrounds:

1. **Feed** - Orange to Red gradient
2. **Play** - Blue to Purple gradient
3. **Clean** - Green to Teal gradient
4. **Sleep** - Indigo to Purple gradient
5. **Medicine** - Pink to Rose gradient

Each button is 64px height with icon and label.

## 📱 Responsive Design

- **Mobile First:** Optimized for phone screens
- **Max Width:** 672px (max-w-2xl)
- **Centered:** All content centered with padding
- **Cards:** Shadow-xl with rounded corners
- **Spacing:** Consistent 8px grid system

## 🌈 Color System

### Backgrounds
- Auth: Purple → Pink → Blue
- Profile: Blue → Purple → Pink
- Adoption: Pink → Purple → Blue
- Home: Purple → Pink → Blue (lighter)

### Cards
- White background
- Purple border (border-purple-100)
- Shadow-2xl
- Backdrop blur on header

### Text
- Headings: Gradient purple → pink
- Body: Default foreground
- Muted: text-muted-foreground

## ✨ Animations

### Egg Animations
- **Sway:** 3s gentle rock (-3° to +3°)
- **Warmth:** 2s brightness pulse (when warm)
- **Crack:** 0.5s shake (when cracking)
- **Particles:** Floating colored dots

### Blobbi Animations
- **Bounce:** 2s vertical movement (-10px)
- **Pulse:** For glow effects
- **Transitions:** 500ms smooth

### UI Animations
- **Hover:** Scale and brightness
- **Click:** Ripple effect
- **Progress:** Smooth fill animation
- **Toast:** Slide in from bottom

## 🎭 States

### Blobbi States
- **Active:** Animated, responsive
- **Sleeping:** Different graphic, no bounce
- **Hibernating:** (not yet implemented)

### Life Stages
- **Egg:** Shows EggGraphic with special marks
- **Baby:** Shows BabyGraphic with variants
- **Adult:** Shows AdultGraphic with evolution form

### UI States
- **Loading:** (handled by build system)
- **Empty:** (shows adoption screen)
- **Multiple:** Shows selector arrows
- **Single:** No selector needed

## 🎪 Special Features

### Divine Theme
- Green egg color (#55C4A2)
- "diVine" wordmark on egg
- Neon variant for baby stage
- Special glow effects

### Mock Interactions
- All actions show toast notifications
- Format: "Feed! You fed [name]."
- No actual stat changes (intentional)
- Ready for real logic integration

### Blobbi Switching
- Previous/Next buttons
- Shows "Blobbi X of Y"
- Smooth transitions
- Maintains state per blobbi

---

**Visual Style:** Modern, clean, playful
**Target Device:** Mobile phones (but responsive)
**Framework:** React + Tailwind + shadcn/ui
**Performance:** Optimized animations, lazy loading ready
