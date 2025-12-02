# Dark Mode Implementation Guide

## Overview

This application now has a complete dark mode implementation with a vibrant purple/indigo color scheme that maintains the playful Blobbi aesthetic while providing excellent readability and accessibility.

## Features

### 🎨 Color Palette

**Light Mode:**
- Clean white backgrounds with subtle purple tints
- Vibrant gradients (purple, pink, blue)
- High contrast for readability

**Dark Mode:**
- Deep purple/indigo backgrounds (HSL 250, 35%, 8-12%)
- No pure black - uses subtle off-black shades
- Vibrant purple primary (HSL 270, 70%, 65%)
- Maintains gradient vibrancy with adjusted brightness

### 🔧 Theme Toggle

Located in the header menu, the theme toggle provides three options:
- **Light**: Force light mode
- **Dark**: Force dark mode
- **System**: Follow system preference (default)

The theme preference is persisted in localStorage and automatically applied on page reload.

### 📱 Component Coverage

All components have been updated with dark mode support:

#### Screens
- ✅ AuthScreen - Login screen with gradient backgrounds
- ✅ ProfileSetupScreen - Profile creation
- ✅ BlobbiAdoptionScreen - Egg adoption
- ✅ HomeScreen - Main game interface

#### UI Components
- ✅ Header - Logo, navigation, theme toggle
- ✅ Status Drawer - Collapsible stats with custom gradients
- ✅ Actions Panel - Slide-up drawer with backdrop
- ✅ Room Navigation - Footer buttons
- ✅ Inventory Modal - Tabbed interface
- ✅ Missions Modal - Daily tasks
- ✅ Tasks Modal - Growth tasks
- ✅ Badges - Life stage indicators
- ✅ Buttons - All variants (primary, outline, ghost)
- ✅ Tabs - Active/inactive states
- ✅ Dialogs - Modal overlays
- ✅ Dropdown Menus - Context menus

#### Special Components
- ✅ StatusCircle - Custom gradient rings with separate light/dark styles
- ✅ BlobbiBackground - Pattern overlay with dark mode tint
- ✅ Theme Toggle - Icon-based switcher with checkmarks

### 🎯 Design Principles

1. **No Pure Black**: Uses HSL(250, 35%, 8%) instead of #000000 for better visual comfort
2. **Vibrant Gradients**: Maintains colorful Blobbi aesthetic in dark mode
3. **Consistent Contrast**: All text meets WCAG AA standards (4.5:1 minimum)
4. **Smooth Transitions**: Theme changes are instant with no flash
5. **System Integration**: Respects user's OS-level dark mode preference

### 🔍 Technical Details

#### CSS Variables

The theme system uses CSS custom properties defined in `src/index.css`:

```css
.dark {
  --background: 250 35% 8%;        /* Deep purple background */
  --foreground: 250 15% 95%;       /* Light text */
  --card: 250 30% 12%;             /* Card backgrounds */
  --primary: 270 70% 65%;          /* Vibrant purple */
  --muted: 250 25% 18%;            /* Muted elements */
  --border: 250 25% 22%;           /* Subtle borders */
  /* ... and more */
}
```

#### Component Implementation

Components use Tailwind's `dark:` variant for dark mode styles:

```tsx
<div className="bg-white dark:bg-[hsl(250,30%,12%)]">
  <h1 className="text-slate-900 dark:text-[hsl(250,15%,95%)]">
    Title
  </h1>
</div>
```

#### Theme Provider

The `AppProvider` component manages theme state and applies the appropriate class to the document root:

```tsx
<AppProvider storageKey='blobbi-app-config' defaultConfig={defaultConfig}>
  <App />
</AppProvider>
```

### 🎨 StatusCircle Special Implementation

The StatusCircle component uses separate gradient styles for light and dark modes to ensure the progress rings remain vibrant:

- **Light Mode**: Pastel backgrounds (red: #fee2e2, yellow: #fef9c3, green: #dcfce7)
- **Dark Mode**: Deep colored backgrounds (red: #7f1d1d, yellow: #713f12, green: #14532d)
- Both modes use the same bright ring colors for consistency

### 🌐 Background Pattern

The repeating Blobbi background pattern includes a dark overlay in dark mode:

```tsx
<div className="absolute inset-0 bg-slate-950/40 dark:block hidden" />
```

This ensures the pattern remains visible but doesn't overpower the content.

### ♿ Accessibility

- All color combinations meet WCAG AA contrast requirements
- Focus states are clearly visible in both modes
- Hover states provide clear feedback
- Theme toggle is keyboard accessible
- Screen reader support for theme selection

### 🚀 Usage

To use the theme in your components:

```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark')}>
      Current theme: {theme}
    </button>
  );
}
```

### 📝 Adding Dark Mode to New Components

When creating new components, follow these guidelines:

1. **Use CSS Variables**: Prefer `bg-background`, `text-foreground`, etc.
2. **Add Dark Variants**: Use `dark:` prefix for specific overrides
3. **Test Both Modes**: Always verify in light and dark mode
4. **Maintain Vibrancy**: Keep gradients and colors vibrant in dark mode
5. **Check Contrast**: Ensure text is readable (use browser DevTools)

Example:
```tsx
<Card className="bg-card border-border">
  <h2 className="text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Action
  </Button>
</Card>
```

### 🔄 System Theme Detection

The app automatically detects system theme changes when set to "System" mode:

```tsx
// Listens to system preference changes
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', handleChange);
```

### 💾 Persistence

Theme preference is stored in localStorage under the key `blobbi-app-config`:

```json
{
  "theme": "dark",
  "relayMetadata": { ... }
}
```

### 🎯 Future Enhancements

Potential improvements for the dark mode system:

1. **Auto-scheduling**: Automatically switch based on time of day
2. **Custom themes**: Allow users to create custom color schemes
3. **Contrast modes**: High contrast option for accessibility
4. **Animation preferences**: Respect `prefers-reduced-motion`
5. **Per-room themes**: Different color schemes for different rooms

## Testing

To test dark mode:

1. Click the sun/moon icon in the header
2. Select "Dark", "Light", or "System"
3. Verify all screens and modals display correctly
4. Check that the preference persists after reload
5. Test system theme changes (if on "System" mode)

## Browser Support

Dark mode is supported in all modern browsers:
- Chrome 76+
- Firefox 67+
- Safari 12.1+
- Edge 79+

The theme system gracefully falls back to light mode in older browsers.
