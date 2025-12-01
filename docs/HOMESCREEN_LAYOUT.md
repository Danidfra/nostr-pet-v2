# HomeScreen Full-Screen Layout

The HomeScreen has been redesigned as a full-screen pet room interface, similar to Pou or Talking Tom style apps.

## Layout Structure

The screen uses a full viewport height layout with three main sections:

```
┌─────────────────────────────────────┐
│  HEADER (flex-none)                 │
│  - App name & user (left)           │
│  - Status circles (center)          │
│  - Settings & Shop (right)          │
├─────────────────────────────────────┤
│                                     │
│  MAIN AREA (flex-1)                 │
│  - Blobbi name & badges             │
│  - Blobbi graphic (centered)        │
│  - Optional info panel (egg only)   │
│                                     │
├─────────────────────────────────────┤
│  ROOM NAVIGATION (flex-none)        │
│  - Previous/Next room buttons       │
│  - Current room title               │
├─────────────────────────────────────┤
│  FOOTER (flex-none)                 │
│  - Action buttons (context-based)   │
└─────────────────────────────────────┘
```

## Key Features

### 1. Full Viewport Height
- Uses `h-screen` on root container
- No scrolling or overflow
- `overflow-hidden` prevents any content from exceeding viewport
- All sections use flexbox for proper height distribution

### 2. Status Circles
Located in the header center, showing 5 core stats:
- **Health** (Heart icon)
- **Hunger** (Utensils icon)
- **Happiness** (Smile icon)
- **Energy** (Zap icon)
- **Hygiene** (Droplet icon)

Each circle:
- Uses a conic gradient that empties clockwise as value decreases
- Color-coded by threshold:
  - Red: < 20
  - Yellow: 20-59
  - Green: ≥ 60
- Shows exact value on hover/click via tooltip
- Displays only icon when not hovered

### 3. Centered Blobbi
- No Card wrapper around the Blobbi
- Blobbi graphic is the main visual focus
- Scaled up 1.5x for prominence
- Uses existing graphics components:
  - `EggGraphic` for eggs
  - `BabyGraphic` for babies
  - `AdultGraphic` for adults

### 4. Minimal Info Panels
- Only shown when necessary (e.g., egg incubation)
- Small, transparent panels that don't dominate the view
- Positioned below the Blobbi graphic

### 5. Room System
Three rooms available:
- **MY_BLOBBI**: Main pet interaction room
- **GROWTH_HUB**: Personal growth features (locked for eggs)
- **PLAYROOM**: Games and activities (locked for eggs)

Locked rooms show a lock icon and message for eggs.

## Responsive Design

The layout adapts to different screen sizes:
- Header status circles wrap on smaller screens
- Main content area uses `max-w-md` for optimal viewing
- All sections maintain proper spacing with flex layout
- Touch-friendly button sizes for mobile

## Components Used

- `StatusCircle`: Custom component for stat visualization
- `EggGraphic`, `BabyGraphic`, `AdultGraphic`: Reused from v1
- shadcn/ui components: `Button`, `Badge`, `Tooltip`

## Future Enhancements

The room navigation system is designed for easy expansion:
- Additional UI elements can be added to header (toggles, burger menu)
- Footer actions change based on current room
- More room types can be added to the `ROOMS` array
- Room-specific content can be added to the main area
