# Pou/Talking Tom Style UI Update

## Summary

Complete redesign of the HomeScreen to match Pou and Talking Tom style pet simulation apps with a cleaner, more focused interface.

## Major Changes

### ✅ 1. Header Redesign (Two-Row Layout)

**Row 1: Logo + Hamburger Menu**
- **Left**: App title "Blobbi" + username
- **Right**: Hamburger menu (☰) replacing individual icons
- **Removed**: Gear icon, Shopping cart icon

**Hamburger Menu Contents:**
```tsx
<DropdownMenu>
  - Settings
  - Shop
  - Logout (only if onLogout prop provided)
</DropdownMenu>
```

**Row 2: Status Circles**
- Single row below header
- Centered horizontally
- Responsive wrapping (maintains visual unity)
- All 5 stats: Health, Hunger, Happiness, Energy, Hygiene
- Same StatusCircle behavior (conic gradient, tooltips)

### ✅ 2. Clean Central Area

**Before:**
- Cluttered with arrows, selectors, temperature panels
- Big cards wrapping content
- Multiple UI elements competing for attention

**After:**
- **ONLY** the Blobbi graphic
- Small name + badges above Blobbi
- No arrows, no panels, no cards
- Clean, minimal, focused

**Layout:**
```tsx
<main className="flex-1 flex items-center justify-center">
  <div className="flex flex-col items-center">
    <h2>{blobbi.name}</h2>
    <Badge>{lifeStage}</Badge>
    <Badge>{evolutionForm}</Badge>
    {renderBlobbiGraphic()}
  </div>
</main>
```

### ✅ 3. Footer Structure (Two-Row Layout)

**Row 1: Room Navigation**
- Left: `<` Previous room
- Center: Room title ("My Blobbi", "Growth Hub", "Playroom")
- Right: `>` Next room
- Light background, thin border

**Row 2: Icon Row**
```
📷      [ ACTIONS ]      🎒
```

- **Left**: Camera icon (photo mode - coming soon)
- **Center**: Large "Actions" button (primary control)
- **Right**: Backpack icon (inventory - coming soon)

### ✅ 4. Slide-Up Actions Panel

**Behavior:**
- Default: Closed (hidden below viewport)
- Click "Actions": Panel slides up from bottom
- Click again: Panel slides down (closes)
- Smooth 300ms transition

**Implementation:**
```tsx
const [isActionsOpen, setIsActionsOpen] = useState(false);

<div className={cn(
  "fixed bottom-0 transition-transform duration-300",
  isActionsOpen ? "translate-y-0" : "translate-y-full"
)}>
  {renderActions()}
</div>
```

**Visual:**
- Rounded top corners
- Semi-transparent white background
- Backdrop blur
- Shadow for depth

### ✅ 5. Actions Per Room + Life Stage

#### MY_BLOBBI Room

**Egg Stage:**
- Warm (🌡️)
- Sing (🎵)
- Medicine (❤️)
- Clean (✨)

**Baby Stage:**
- Feed (🍴)
- Clean (✨)
- Sleep (🛏️)
- Medicine (❤️)

**Adult Stage:**
- Feed (🍴)
- Clean (✨)
- Sleep (🛏️)
- Medicine (❤️)
- Breed (👶) - **DISABLED** with "Soon" badge

#### PLAYROOM Room

**Actions:**
- Toys (🎮)
- Games (⚡)

**Locked for eggs:**
- Shows "Room locked until your Blobbi hatches"

#### GROWTH_HUB Room

**Actions:**
- Start Activity (🎯)
- View Progress (📈)
- Random Prompt (💡)

**Locked for eggs:**
- Shows "Room locked until your Blobbi hatches"

## Layout Structure

### Before
```
┌─────────────────────────────────────┐
│  HEADER: Logo | Status | Gear Cart  │
├─────────────────────────────────────┤
│  MAIN: Blobbi + arrows + panels     │
├─────────────────────────────────────┤
│  FOOTER: Always visible actions     │
└─────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────┐
│  HEADER ROW 1: Logo | Menu          │
├─────────────────────────────────────┤
│  HEADER ROW 2: ●●●●● Status         │
├─────────────────────────────────────┤
│                                     │
│           Blobbi Name               │
│           [badges]                  │
│              🥚                     │
│                                     │
├─────────────────────────────────────┤
│  FOOTER ROW 1: ← Room →             │
├─────────────────────────────────────┤
│  FOOTER ROW 2: 📷 [Actions] 🎒      │
└─────────────────────────────────────┘
         ┌─────────────────┐
         │ Actions Panel   │ ← Slides up
         │ (when open)     │
         └─────────────────┘
```

## Technical Details

### State Management
```tsx
const [currentRoom, setCurrentRoom] = useState<Room>('MY_BLOBBI');
const [isActionsOpen, setIsActionsOpen] = useState(false);
```

### Life Stage Detection
```tsx
const isEgg = currentBlobbi.lifeStage === 'egg';
const isBaby = currentBlobbi.lifeStage === 'baby';
const isAdult = currentBlobbi.lifeStage === 'adult';
```

### Room Logic
```tsx
const isRoomLocked = () => {
  return isEgg && currentRoom !== 'MY_BLOBBI';
};
```

### Actions Rendering
```tsx
const renderActions = () => {
  if (isRoomLocked()) return <LockedMessage />;
  
  if (currentRoom === 'MY_BLOBBI') {
    if (isEgg) return <EggActions />;
    if (isBaby) return <BabyActions />;
    if (isAdult) return <AdultActions />;
  }
  
  if (currentRoom === 'PLAYROOM') return <PlayroomActions />;
  if (currentRoom === 'GROWTH_HUB') return <GrowthHubActions />;
};
```

## Removed Features

### From Header
- ❌ Gear/Settings icon button
- ❌ Shopping cart icon button
- ❌ Direct shop access

### From Center
- ❌ Blobbi selector arrows (◀ ▶)
- ❌ Index display ("1 of 3")
- ❌ Egg temperature panel
- ❌ Temperature gauge/bar
- ❌ Helper text under egg
- ❌ Large Card wrappers

### From Footer
- ❌ Always-visible action buttons
- ❌ Fixed footer actions
- ❌ "Check" and "Talk" actions

## New Features

### Added to Header
- ✅ Hamburger menu with dropdown
- ✅ Unified status row (responsive)

### Added to Center
- ✅ Clean, minimal layout
- ✅ Focus on Blobbi graphic
- ✅ Small name + badges only

### Added to Footer
- ✅ Camera placeholder
- ✅ Central Actions button
- ✅ Backpack/Inventory placeholder
- ✅ Slide-up actions panel

## Action Changes

### Renamed Actions
- "Play" → "Toys" (in Playroom)
- "Mini-Game" → "Games" (in Playroom)

### New Actions
- "Sing" (for eggs)
- "Breed" (for adults, disabled with "Soon" badge)

### Removed Actions
- "Check" (egg)
- "Talk" (egg)
- "Shake Egg"
- "Info" button

## Responsive Design

### Mobile
- Status circles wrap gracefully
- Actions panel full width
- Touch-friendly buttons
- Smooth animations

### Desktop
- Status circles in single row
- Hover states on menu
- Click interactions
- Centered layout (max-w-4xl)

## Styling Details

### Header
- Background: `bg-white/80 backdrop-blur-sm`
- Border: `border-b border-purple-100`

### Status Row
- Background: `bg-white/60 backdrop-blur-sm`
- Border: `border-b border-purple-100`
- Padding: `py-2`

### Actions Button
- Gradient: `bg-gradient-to-r from-purple-600 to-pink-600`
- Hover: `hover:from-purple-700 hover:to-pink-700`
- Size: `flex-1 max-w-[200px] h-12`

### Actions Panel
- Background: `bg-white/95 backdrop-blur-sm`
- Border: `border-t-2 border-purple-200`
- Rounded: `rounded-t-2xl`
- Shadow: `shadow-2xl`
- Transition: `transition-transform duration-300 ease-in-out`

### Breed Button (Disabled)
- Disabled state with "Soon" badge
- Position: `col-span-2` (full width)
- Badge: `absolute top-1 right-1`

## User Experience Improvements

### Before
1. Cluttered interface with too many controls
2. Status circles wrapping awkwardly
3. Actions always visible (wasting space)
4. Multiple ways to access same features
5. Unclear hierarchy

### After
1. **Clean focus** on the Blobbi
2. **Organized status** in dedicated row
3. **Hidden actions** until needed
4. **Single access point** for features
5. **Clear visual hierarchy**

## Code Quality

### Improved
- Cleaner component structure
- Better state management
- Conditional rendering for actions
- Responsive layout patterns
- Semantic HTML

### Maintained
- EggGraphic, BabyGraphic, AdultGraphic usage
- StatusCircle behavior
- Room navigation logic
- Full-height layout
- Toast notifications

## Files Modified

1. **`src/app/screens/HomeScreen.tsx`** - Complete rewrite
   - New header structure
   - Clean center layout
   - New footer structure
   - Slide-up actions panel
   - Hamburger menu
   - Life stage-specific actions

## Testing Checklist

- [x] TypeScript compilation: PASSED
- [x] Build process: SUCCESSFUL
- [x] No new ESLint errors
- [x] Header displays correctly
- [x] Hamburger menu works
- [x] Status circles responsive
- [x] Blobbi centered and clean
- [x] Room navigation works
- [x] Actions panel slides up/down
- [x] Egg actions display
- [x] Baby actions display
- [x] Adult actions display (with disabled Breed)
- [x] Playroom actions display
- [x] Growth Hub actions display
- [x] Locked rooms show message
- [x] Camera/Backpack show coming soon
- [x] All animations smooth

## Future Enhancements

1. **Camera Feature**: Implement photo capture
2. **Inventory System**: Add backpack functionality
3. **Settings Page**: Expand settings options
4. **Shop System**: Implement item purchasing
5. **Breed Feature**: Enable breeding for adults
6. **Multiple Blobbis**: Add Blobbi selector
7. **Swipe Gestures**: Add swipe to change rooms
8. **Haptic Feedback**: Add vibration on mobile
9. **Sound Effects**: Add audio feedback
10. **Achievements**: Track and display milestones
