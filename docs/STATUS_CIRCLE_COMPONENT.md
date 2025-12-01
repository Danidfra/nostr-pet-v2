# StatusCircle Component

A circular stat gauge component that displays Blobbi stats with a radial progress ring that empties clockwise.

## Usage

```tsx
import { StatusCircle } from '@/components/blobbi/StatusCircle';
import { Heart } from 'lucide-react';

<StatusCircle
  icon={Heart}
  value={75}
  label="Health"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `LucideIcon` | Yes | Icon component from lucide-react |
| `value` | `number` | Yes | Stat value (0-100) |
| `label` | `string` | Yes | Label shown in tooltip |
| `className` | `string` | No | Additional CSS classes |

## Visual Behavior

### Radial Fill (Clockwise Depletion)
The component uses a conic-gradient to create a radial fill that empties clockwise as the value decreases:

```
100% → Full circle (360°)
 75% → 3/4 circle (270°)
 50% → Half circle (180°)
 25% → 1/4 circle (90°)
  0% → Empty circle (0°)
```

### Color Thresholds

The ring color changes based on the value:

| Value Range | Color | Meaning |
|-------------|-------|---------|
| 0-19 | 🔴 Red (`#ef4444`) | Critical |
| 20-59 | 🟡 Yellow (`#eab308`) | Warning |
| 60-100 | 🟢 Green (`#22c55e`) | Good |

### Interaction States

**Default (Not Hovered)**
- Shows only the icon in the center
- Displays the radial fill ring
- No text or numbers

**Hovered/Clicked**
- Shows a tooltip with:
  - Label (e.g., "Health")
  - Exact value (e.g., "75/100")
- Slight scale-up animation (1.1x)

## Implementation Details

### Conic Gradient
The radial fill is created using CSS conic-gradient:

```tsx
const percentage = clampedValue; // 0-100
const gradientStyle = {
  background: `conic-gradient(
    ${colors.ring} 0deg,
    ${colors.ring} ${percentage * 3.6}deg,
    ${colors.bg} ${percentage * 3.6}deg,
    ${colors.bg} 360deg
  )`
};
```

**Why multiply by 3.6?**
- 360 degrees in a circle ÷ 100 = 3.6 degrees per percentage point
- Example: 50% = 50 × 3.6 = 180° (half circle)

### Color System
Each threshold has two colors:
- **Ring color**: The filled portion (darker, saturated)
- **Background color**: The empty portion (lighter, desaturated)

```tsx
const getColor = () => {
  if (value < 20) return { ring: '#ef4444', bg: '#fee2e2' }; // red
  if (value < 60) return { ring: '#eab308', bg: '#fef9c3' }; // yellow
  return { ring: '#22c55e', bg: '#dcfce7' }; // green
};
```

### Tooltip Integration
Uses shadcn/ui's Tooltip component:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      {/* Circle component */}
    </TooltipTrigger>
    <TooltipContent>
      <p className="font-semibold">{label}</p>
      <p className="text-sm">{value}/100</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Example Configurations

### Health (High Value)
```tsx
<StatusCircle
  icon={Heart}
  value={85}
  label="Health"
/>
// Result: Green ring, 85% filled (306°)
```

### Hunger (Medium Value)
```tsx
<StatusCircle
  icon={Utensils}
  value={45}
  label="Hunger"
/>
// Result: Yellow ring, 45% filled (162°)
```

### Energy (Low Value)
```tsx
<StatusCircle
  icon={Zap}
  value={15}
  label="Energy"
/>
// Result: Red ring, 15% filled (54°)
```

## Responsive Design

The component is designed to work across all screen sizes:

- **Desktop**: Full size with hover tooltips
- **Mobile**: Touch-friendly with tap tooltips
- **Wrapping**: Circles wrap gracefully in the header on small screens

## Accessibility

- ✅ Keyboard navigable (tooltip can be triggered via keyboard)
- ✅ Screen reader friendly (ARIA labels from Radix UI)
- ✅ High contrast colors for visibility
- ✅ Clear visual indicators for all value ranges

## Performance

- **Lightweight**: Pure CSS for radial fill (no canvas or SVG)
- **Smooth**: Uses CSS transitions for hover effects
- **Optimized**: No re-renders unless value/props change
- **Efficient**: Minimal DOM nodes (2 divs + tooltip)

## Future Enhancements

Potential improvements for future versions:

1. **Animations**: Smooth transitions when values change
2. **Pulsing**: Low values could pulse to draw attention
3. **Sounds**: Audio feedback on critical thresholds
4. **Customization**: Allow custom colors and thresholds
5. **Mini Charts**: Show value history on hover
6. **Badges**: Display status icons (sick, sleeping, etc.)
