# Blobbi v2 - UI Skeleton

This is the UI-only skeleton for the Blobbi virtual pet application. **No Nostr logic or backend is implemented yet.**

## What's Included

### ✅ Complete Screen Flow
1. **AuthScreen** - Mock login screen
2. **ProfileSetupScreen** - User name input
3. **BlobbiAdoptionScreen** - Adopt your first Blobbi egg
4. **HomeScreen** - Main pet interaction interface

### ✅ Blobbi Graphics System
- **EggGraphic** - Fully functional egg renderer copied from v1 with all dependencies
  - Special marks support (rune_top, sigil_eye, shimmer_band, etc.)
  - Divine theme support
  - Temperature-based glow effects
  - Cracking animations
  
- **BabyGraphic** - Uses SVGs from `src/assets/baby-stage/`
  - Base variant
  - Neon variant (for divine/special blobbis)
  - Sleeping variant
  
- **AdultGraphic** - Uses SVGs from `src/assets/adult-stage/`
  - 17 evolution forms supported (bloomi, pandi, owli, catti, etc.)
  - Base and sleeping variants for each form

### ✅ Mock Data
Located in `src/data/mockBlobbis.ts`:
- 1 egg Blobbi with special mark
- 1 baby Blobbi
- 1 adult Blobbi (bloomi form)

### ✅ UI Components
- Stats display with progress bars (Health, Hunger, Happiness, Energy, Hygiene)
- Action buttons (Feed, Play, Clean, Sleep/Wake, Medicine)
- Bottom navigation (Shop, Inventory, Camera) - placeholders
- Blobbi selector (switch between multiple pets)
- Responsive mobile-friendly layout

## File Structure

```
src/
├── app/
│   └── screens/
│       ├── AuthScreen.tsx
│       ├── ProfileSetupScreen.tsx
│       ├── BlobbiAdoptionScreen.tsx
│       └── HomeScreen.tsx
├── components/
│   ├── blobbi/
│   │   ├── EggGraphic.tsx (copied from v1)
│   │   ├── BabyGraphic.tsx
│   │   └── AdultGraphic.tsx
│   └── special-marks/
│       └── SpecialMarkRenderer.tsx (copied from v1)
├── data/
│   └── mockBlobbis.ts
├── hooks/
│   └── useSpecialMark.ts (copied from v1)
├── lib/
│   ├── blobbi-egg-validation.ts (copied from v1)
│   ├── blobbi-divine-utils.ts (copied from v1)
│   └── special-marks-utils.ts (copied from v1)
├── types/
│   └── blobbi.ts
└── App.tsx (simple state machine)
```

## How It Works

The app uses a simple state machine in `App.tsx`:

1. `auth` → Shows login screen
2. `profile-setup` → Asks for user name
3. `adoption` → Let user name their first Blobbi
4. `home` → Main pet interface with all mock blobbis

All state is managed with React `useState`. No backend, no Nostr, no real persistence.

## Mock Interactions

All action buttons (Feed, Play, Clean, etc.) show toast notifications but don't actually modify state. This is intentional - the UI skeleton is ready for you to plug in real logic later.

## Dependencies from v1

The following files were copied from v1 to support EggGraphic:

- `components/blobbi/EggGraphic.tsx` - Complete egg rendering engine
- `components/special-marks/SpecialMarkRenderer.tsx` - Special mark SVG system
- `hooks/useSpecialMark.ts` - Special mark animation hook
- `lib/blobbi-egg-validation.ts` - Color and property validation
- `lib/blobbi-divine-utils.ts` - Divine theme detection
- `lib/special-marks-utils.ts` - Special mark utilities
- `types/blobbi.ts` - Blobbi type definitions

All dependencies are working 100% as they did in v1.

## Next Steps

To add real functionality:

1. **Replace mock state with real hooks** - Connect to Nostr events
2. **Implement action handlers** - Make Feed, Play, etc. actually update stats
3. **Add persistence** - Save/load from Nostr relays
4. **Add shop/inventory** - Implement item system
5. **Add breeding/evolution** - Implement lifecycle logic

## Running the App

```bash
npm install
npm run dev
```

Open http://localhost:8080 and click through the flow:
1. Click "Log In"
2. Enter your name
3. Name your Blobbi
4. Interact with your pets!

## Design

- Clean, modern gradient backgrounds
- Mobile-first responsive layout
- Smooth animations for egg sway and bounce
- Progress bars for all stats
- Color-coded action buttons
- Support for multiple pets with selector

All UI is production-ready and polished using shadcn/ui components and Tailwind CSS.
