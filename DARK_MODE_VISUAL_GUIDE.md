# Dark Mode Visual Guide

## 🎨 Color Palette Reference

### Background Colors

#### Light Mode
```
Main Background:     #ffffff (white)
Card Background:     #ffffff (white)
Muted Background:    hsl(210, 40%, 96.1%) (very light gray)
Border:              hsl(214.3, 31.8%, 91.4%) (light gray)
```

#### Dark Mode
```
Main Background:     hsl(250, 35%, 8%)  → #0d0a16 (deep purple-black)
Card Background:     hsl(250, 30%, 12%) → #16121f (dark purple)
Muted Background:    hsl(250, 25%, 18%) → #221d2e (purple-gray)
Border:              hsl(250, 25%, 22%) → #2a243a (subtle purple)
```

### Text Colors

#### Light Mode
```
Primary Text:        hsl(222.2, 84%, 4.9%) (very dark blue)
Muted Text:          hsl(215.4, 16.3%, 46.9%) (medium gray)
```

#### Dark Mode
```
Primary Text:        hsl(250, 15%, 95%) → #f0eef5 (light gray-purple)
Muted Text:          hsl(250, 10%, 65%) → #a29dae (medium purple-gray)
```

### Accent Colors

#### Light Mode
```
Primary:             hsl(222.2, 47.4%, 11.2%) (dark blue)
```

#### Dark Mode
```
Primary:             hsl(270, 70%, 65%) → #b366ff (vibrant purple)
Secondary:           hsl(250, 25%, 20%) → #272133 (dark purple)
Accent:              hsl(250, 30%, 22%) → #2d263b (purple-gray)
```

### Gradient Colors

#### Light Mode Gradients
```
Purple-Pink:         from-purple-600 to-pink-600
Purple-Blue:         from-purple-50 via-pink-50 to-blue-50
Orange-Red:          from-orange-500 to-red-500
Green-Teal:          from-green-500 to-teal-500
Indigo-Purple:       from-indigo-500 to-purple-500
```

#### Dark Mode Gradients
```
Purple-Pink:         from-purple-400 to-pink-400 (slightly lighter)
Background:          from-[hsl(250,35%,8%)] via-[hsl(260,40%,12%)] to-[hsl(250,35%,10%)]
Orange-Red:          (unchanged - vibrant in dark mode)
Green-Teal:          (unchanged - vibrant in dark mode)
Indigo-Purple:       (unchanged - vibrant in dark mode)
```

## 🎯 Component-Specific Styling

### Header
```tsx
Light: bg-white/90 border-purple-100
Dark:  bg-[hsl(250,30%,12%)]/90 border-[hsl(250,25%,22%)]
```

### Status Drawer
```tsx
Light: bg-white/90 border-purple-100/50
Dark:  bg-[hsl(250,30%,12%)]/90 border-[hsl(250,25%,22%)]/50
```

### Actions Panel
```tsx
Light: bg-white/95 border-purple-200
Dark:  bg-[hsl(250,30%,12%)]/95 border-[hsl(250,25%,22%)]
```

### Footer
```tsx
Light: bg-white border-purple-200
Dark:  bg-[hsl(250,30%,12%)] border-[hsl(250,25%,22%)]
```

### Backdrop Overlay
```tsx
Light: bg-black/50
Dark:  bg-black/70 (slightly more opaque)
```

### Background Pattern Overlay
```tsx
Light: (none)
Dark:  bg-slate-950/40 (tints the repeating pattern)
```

## 📊 StatusCircle Color System

### Health/Heart (Red)
```
Light Mode:
  Ring:        #ef4444 (bright red)
  Background:  #fee2e2 (light red)

Dark Mode:
  Ring:        #ef4444 (bright red - unchanged)
  Background:  #7f1d1d (dark red)
```

### Hunger/Utensils (Yellow)
```
Light Mode:
  Ring:        #eab308 (bright yellow)
  Background:  #fef9c3 (light yellow)

Dark Mode:
  Ring:        #eab308 (bright yellow - unchanged)
  Background:  #713f12 (dark yellow/orange)
```

### Happiness/Energy/Hygiene (Green)
```
Light Mode:
  Ring:        #22c55e (bright green)
  Background:  #dcfce7 (light green)

Dark Mode:
  Ring:        #22c55e (bright green - unchanged)
  Background:  #14532d (dark green)
```

### Inner Circle
```
Light Mode:  bg-white
Dark Mode:   bg-slate-800
```

## 🔘 Button Variants

### Primary Button
```tsx
Light: bg-primary text-primary-foreground hover:bg-primary/90
Dark:  (uses CSS variables - vibrant purple)
```

### Outline Button
```tsx
Light: border border-input hover:bg-accent
Dark:  (uses CSS variables - subtle purple borders)
```

### Ghost Button
```tsx
Light: hover:bg-accent hover:text-accent-foreground
Dark:  (uses CSS variables)
```

### Gradient Buttons (Custom)
```tsx
// Feed/Orange-Red
className="bg-gradient-to-br from-orange-500 to-red-500 
           hover:from-orange-600 hover:to-red-600"
// Works in both modes - vibrant colors

// Clean/Green-Teal
className="bg-gradient-to-br from-green-500 to-teal-500 
           hover:from-green-600 hover:to-teal-600"
// Works in both modes - vibrant colors

// Sleep/Indigo-Purple
className="bg-gradient-to-br from-indigo-500 to-purple-500 
           hover:from-indigo-600 hover:to-purple-600"
// Works in both modes - vibrant colors
```

## 📑 Tab Styling

### TabsList
```tsx
Light: bg-muted text-muted-foreground
Dark:  bg-[hsl(250,25%,18%)] text-[hsl(250,10%,65%)]
```

### TabsTrigger (Active)
```tsx
Light: bg-background text-foreground shadow-sm
Dark:  (uses CSS variables - card background)
```

### TabsTrigger (Inactive)
```tsx
Light: (transparent)
Dark:  (transparent)
```

## 🏷️ Badge Variants

### Secondary Badge
```tsx
Light: bg-secondary text-secondary-foreground
Dark:  (uses CSS variables - dark purple)
```

### Outline Badge
```tsx
Light: border text-foreground
Dark:  (uses CSS variables)
```

## 💬 Dialog/Modal Styling

### Dialog Overlay
```tsx
bg-black/80 (same in both modes)
```

### Dialog Content
```tsx
Light: bg-background border shadow-lg
Dark:  (uses CSS variables - dark purple card)
```

### Dialog Header Border
```tsx
Light: border-purple-100
Dark:  border-[hsl(250,25%,22%)]
```

## 🎭 Theme Toggle Icons

### Light Mode Active
```tsx
<Sun className="h-5 w-5 rotate-0 scale-100 
                transition-all dark:-rotate-90 dark:scale-0" />
```

### Dark Mode Active
```tsx
<Moon className="absolute h-5 w-5 rotate-90 scale-0 
                 transition-all dark:rotate-0 dark:scale-100" />
```

## 🌈 Gradient Text

### Title Gradients
```tsx
Light: bg-gradient-to-r from-purple-600 to-pink-600
Dark:  bg-gradient-to-r from-purple-400 to-pink-400

// Both use:
bg-clip-text text-transparent
```

## 📐 Spacing and Layout

All spacing remains consistent between light and dark modes:
```
Header:          py-3 px-4
Status Drawer:   pt-2 pb-1 px-3 py-2
Actions Panel:   pt-10 pb-6 px-8
Footer:          py-3 px-4
```

## 🎨 Best Practices

### DO ✅
```tsx
// Use CSS variables for automatic theming
<div className="bg-background text-foreground">

// Add dark: variants for specific overrides
<h1 className="text-slate-900 dark:text-[hsl(250,15%,95%)]">

// Keep gradients vibrant in dark mode
<div className="bg-gradient-to-br from-purple-500 to-pink-500">
```

### DON'T ❌
```tsx
// Don't use pure black in dark mode
<div className="dark:bg-black">  // Use hsl(250,35%,8%) instead

// Don't make gradients too dim in dark mode
<div className="dark:from-purple-900 dark:to-pink-900">  // Too dark!

// Don't forget to test contrast
<p className="dark:text-gray-300">  // Might not have enough contrast
```

## 🔍 Debugging Tips

### Check Current Theme
```tsx
const { theme } = useTheme();
console.log('Current theme:', theme);  // 'light' | 'dark' | 'system'
```

### Check Applied Theme
```tsx
// In browser console:
document.documentElement.classList
// Should contain either 'light' or 'dark'
```

### Test Contrast
1. Open Chrome DevTools
2. Inspect element
3. Check "Contrast" in Styles panel
4. Ensure ratio is at least 4.5:1 for normal text

### Verify CSS Variables
```tsx
// In browser console:
getComputedStyle(document.documentElement)
  .getPropertyValue('--background')
// Should return HSL values
```

## 📱 Responsive Considerations

All dark mode styles work consistently across breakpoints:
```tsx
// Example: Works at all sizes
<div className="bg-white dark:bg-[hsl(250,30%,12%)] 
                sm:p-4 md:p-6 lg:p-8">
```

## 🎯 Accessibility Checklist

- ✅ All text meets 4.5:1 contrast ratio
- ✅ Focus states visible in both modes
- ✅ Hover states provide clear feedback
- ✅ Icons have proper aria-labels
- ✅ Theme toggle is keyboard accessible
- ✅ No color-only information conveyance
- ✅ Reduced motion respected (where applicable)

## 🚀 Performance Notes

- Theme switching is instant (no flash)
- CSS variables enable efficient re-painting
- No JavaScript color calculations at runtime
- localStorage reduces unnecessary re-renders
- Smooth transitions use GPU acceleration

---

**This visual guide serves as a quick reference for maintaining and extending the dark mode implementation.**
