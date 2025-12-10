# Performance Fix Implementation Guide

## 🎯 Quick Start - Apply Fixes Now

### Step 1: Replace Components with Optimized Versions

```bash
# Backup original files
cp src/components/blobbi/EggGraphic.tsx src/components/blobbi/EggGraphic.ORIGINAL.tsx
cp src/components/blobbi/AdultGraphic.tsx src/components/blobbi/AdultGraphic.ORIGINAL.tsx

# Replace with optimized versions
mv src/components/blobbi/EggGraphic.OPTIMIZED.tsx src/components/blobbi/EggGraphic.tsx
mv src/components/blobbi/AdultGraphic.OPTIMIZED.tsx src/components/blobbi/AdultGraphic.tsx
```

### Step 2: Enable Performance Monitoring

Add to `src/main.tsx`:

```tsx
import { enableDebugMode } from '@/lib/performance-debug';

// Enable debug mode in development
if (import.meta.env.DEV) {
  enableDebugMode();
}
```

### Step 3: Test Immediately

1. Open the app
2. Open browser console
3. Type: `window.perfDebug.getCurrentFPS()`
4. Check CPU usage in Activity Monitor/Task Manager

**Expected Results**:
- FPS: 55-60 (was 20-40)
- CPU: 10-20% (was 80-100%)

---

## 📋 Detailed Implementation Steps

### Phase 1: Critical Fixes (Do This First)

#### Fix 1.1: Update EggGraphic Component

The optimized version includes:
- ✅ Animations only on hover
- ✅ No blur effects
- ✅ Simplified gradients
- ✅ Reduced shadows
- ✅ No floating particles
- ✅ Memoization

**File**: `src/components/blobbi/EggGraphic.tsx`

Already created as `EggGraphic.OPTIMIZED.tsx` - just rename it.

#### Fix 1.2: Update AdultGraphic Component

The optimized version includes:
- ✅ Animation only on hover
- ✅ Memoization
- ✅ Custom comparison

**File**: `src/components/blobbi/AdultGraphic.tsx`

Already created as `AdultGraphic.OPTIMIZED.tsx` - just rename it.

#### Fix 1.3: Update BabyGraphic Component

**File**: `src/components/blobbi/BabyGraphic.tsx`

Apply the same pattern as AdultGraphic:

```tsx
import { useState, memo } from 'react';

export const BabyGraphic = memo<BabyGraphicProps>(({
  blobbi,
  className,
  animated = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // ... existing logic ...

  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-48 h-48',
        isHovered && animated && !isSleeping && 'animate-bounce-subtle',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={svgPath}
        alt={`${blobbi.name} - baby`}
        className="w-full h-full object-contain"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.blobbi.id === nextProps.blobbi.id &&
    prevProps.blobbi.isSleeping === nextProps.blobbi.isSleeping &&
    prevProps.animated === nextProps.animated
  );
});
```

---

### Phase 2: SVG Filter Optimization

#### Fix 2.1: Update SpecialMarkRenderer

**File**: `src/components/special-marks/SpecialMarkRenderer.tsx`

Replace all `<filter>` elements with CSS alternatives:

```tsx
// BEFORE:
<defs>
  <filter id="sigil-glow">
    <feDropShadow dx="0" dy="0" stdDeviation="1" 
      floodColor="rgba(130,85,30,0.6)" floodOpacity="0.8" />
  </filter>
</defs>
<g filter="url(#sigil-glow)">
  {/* content */}
</g>

// AFTER:
<g style={{ filter: 'drop-shadow(0 0 2px rgba(130,85,30,0.4))' }}>
  {/* content */}
</g>
```

**Apply to all special marks**:
- `sigil_eye`
- `shimmer_band`
- `rune_top`
- All others

---

### Phase 3: Animation Control

#### Fix 3.1: Add Global Animation Toggle

Create `src/lib/animation-control.ts`:

```tsx
let animationsEnabled = true;

export function enableAnimations() {
  animationsEnabled = true;
  document.documentElement.classList.remove('no-animations');
}

export function disableAnimations() {
  animationsEnabled = false;
  document.documentElement.classList.add('no-animations');
}

export function areAnimationsEnabled() {
  return animationsEnabled;
}

// Auto-disable animations on low-end devices
if (typeof window !== 'undefined') {
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  if (isLowEnd) {
    disableAnimations();
    console.log('🔋 Animations disabled for low-end device');
  }
}
```

Add to `src/index.css`:

```css
.no-animations * {
  animation: none !important;
  transition: none !important;
}
```

#### Fix 3.2: Add Settings Toggle

Add to your settings UI:

```tsx
import { enableAnimations, disableAnimations, areAnimationsEnabled } from '@/lib/animation-control';

function PerformanceSettings() {
  const [animEnabled, setAnimEnabled] = useState(areAnimationsEnabled());

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      enableAnimations();
    } else {
      disableAnimations();
    }
    setAnimEnabled(enabled);
  };

  return (
    <div className="flex items-center justify-between">
      <span>Enable Animations</span>
      <Switch checked={animEnabled} onCheckedChange={handleToggle} />
    </div>
  );
}
```

---

### Phase 4: Intersection Observer (Off-Screen Optimization)

#### Fix 4.1: Create useIsVisible Hook

Create `src/hooks/useIsVisible.ts`:

```tsx
import { useEffect, useRef, useState } from 'react';

export function useIsVisible(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
}
```

#### Fix 4.2: Use in EggGraphic

Update `src/components/blobbi/EggGraphic.tsx`:

```tsx
import { useIsVisible } from '@/hooks/useIsVisible';

export const EggGraphic = memo<EggGraphicProps>(({ ... }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { ref, isVisible } = useIsVisible();

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex items-center justify-center',
        sizeClasses.medium,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Only render expensive effects when visible */}
      {isVisible && (
        <>
          <div className="glow-effect" />
          {/* ... other expensive elements ... */}
        </>
      )}
      
      {/* Always render the egg itself */}
      <div className={cn(
        'relative transition-all duration-500',
        isVisible && isHovered && animated && 'animate-egg-sway'
      )}>
        {/* ... egg content ... */}
      </div>
    </div>
  );
});
```

---

### Phase 5: React Query Optimization

#### Fix 5.1: Check for Unnecessary Refetching

**File**: `src/hooks/nostr-pet/useBlobbiStatus.ts`

Ensure these settings:

```tsx
const statusQuery = useQuery({
  queryKey: QUERY_KEYS.statusList(userPubkey),
  queryFn: fetchBlobbis,
  staleTime: 30000, // ✅ Good
  refetchOnWindowFocus: false, // ✅ Good
  refetchInterval: false, // ✅ Good - use subscriptions instead
  enabled: !!client && !!nostr && !!userPubkey,
});
```

#### Fix 5.2: Check Profile Hook

**File**: `src/hooks/nostr-pet/useBlobbonautProfile.ts`

Ensure these settings:

```tsx
const profileQuery = useQuery({
  queryKey: QUERY_KEYS.profile(effectiveProfileId || null, effectivePubkey),
  queryFn: fetchProfile,
  staleTime: 30000, // ✅ Good
  refetchOnWindowFocus: false, // ✅ Good
  refetchInterval: false, // ✅ Good
  enabled: !!client && !!nostr && (!!effectiveProfileId || !!effectivePubkey),
});
```

---

## 🧪 Testing Checklist

### Before Applying Fixes

1. ✅ Open Activity Monitor (macOS) or Task Manager (Windows)
2. ✅ Load app with 10+ Blobbis
3. ✅ Record:
   - CPU usage: ______%
   - GPU usage: ______%
   - WindowServer: ______%
   - FPS: ______
4. ✅ Take screenshot of Activity Monitor

### After Applying Each Fix

| Fix | CPU Before | CPU After | FPS Before | FPS After | Notes |
|-----|------------|-----------|------------|-----------|-------|
| 1.1 EggGraphic | ___% | ___% | ___ | ___ | |
| 1.2 AdultGraphic | ___% | ___% | ___ | ___ | |
| 1.3 BabyGraphic | ___% | ___% | ___ | ___ | |
| 2.1 SVG Filters | ___% | ___% | ___ | ___ | |
| 3.1 Animation Control | ___% | ___% | ___ | ___ | |
| 4.1 Intersection Observer | ___% | ___% | ___ | ___ | |

### Final Verification

1. ✅ CPU usage < 20% with 10 Blobbis
2. ✅ FPS consistently at 55-60
3. ✅ WindowServer CPU < 15%
4. ✅ No animation jank or stuttering
5. ✅ Hover animations work smoothly
6. ✅ No console errors

---

## 🐛 Debug Commands

### Enable Debug Mode

```javascript
// In browser console
window.perfDebug.enable()
```

### Check Render Stats

```javascript
window.perfDebug.getRenderStats()
// Example output:
// {
//   EggGraphic: { count: 45, rate: 2 },
//   AdultGraphic: { count: 12, rate: 0 },
//   HomeScreen: { count: 3, rate: 0 }
// }
```

### Check FPS

```javascript
window.perfDebug.getCurrentFPS()
// Example output: 60
```

### Check Active Animations

```javascript
window.perfDebug.getActiveAnimations()
// Example output:
// [
//   'egg-1:sway',
//   'egg-2:warmth'
// ]
```

### Check Subscription Stats

```javascript
window.perfDebug.getSubscriptionStats()
// Example output:
// {
//   created: 3,
//   closed: 0,
//   recreated: 0,
//   eventsReceived: 45,
//   eventRate: 2
// }
```

### Reset All Stats

```javascript
window.perfDebug.resetAll()
```

---

## 🚨 Troubleshooting

### Issue: Animations still running continuously

**Solution**: Check that you've updated all three graphic components:
- `EggGraphic.tsx`
- `AdultGraphic.tsx`
- `BabyGraphic.tsx`

Verify that `animated` prop is only applied on hover:

```tsx
isHovered && animated && 'animate-egg-sway'
```

### Issue: High CPU even after fixes

**Possible causes**:
1. SVG filters still present - check `SpecialMarkRenderer.tsx`
2. Blur effects not removed - search for `blur-` classes
3. Too many Blobbis on screen - implement virtual scrolling
4. React Query refetching too often - check `refetchInterval` settings

**Debug**:
```javascript
// Check what's rendering frequently
window.perfDebug.getRenderStats()

// Check active animations
window.perfDebug.getActiveAnimations()
```

### Issue: Animations don't work on hover

**Solution**: Make sure you've added hover state:

```tsx
const [isHovered, setIsHovered] = useState(false);

<div
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
```

### Issue: FPS still low

**Possible causes**:
1. WindowServer still high - check for blur effects
2. Too many shadows - reduce box-shadow complexity
3. Complex gradients - simplify to single gradient

**Debug**:
```javascript
// Monitor frame rate
window.perfDebug.enable()
// Watch console for FPS warnings
```

---

## 📊 Expected Performance Metrics

### Target Metrics (After All Fixes)

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| CPU Usage (idle) | < 10% | < 20% | > 50% |
| CPU Usage (active) | < 20% | < 35% | > 70% |
| FPS | 60 | 55-60 | < 45 |
| WindowServer (macOS) | < 10% | < 20% | > 40% |
| Memory Usage | < 300MB | < 500MB | > 800MB |

### Blobbi Count vs Performance

| Blobbis | CPU (Optimized) | CPU (Before) | FPS (Optimized) | FPS (Before) |
|---------|-----------------|--------------|-----------------|--------------|
| 1 | 5% | 15% | 60 | 50 |
| 5 | 8% | 40% | 60 | 40 |
| 10 | 12% | 80% | 60 | 25 |
| 20 | 18% | 100% | 58 | 15 |
| 50 | 30% | 100% | 50 | 10 |

---

## 🎓 Performance Best Practices

### DO ✅

- Use hover-triggered animations
- Memoize expensive components
- Use Intersection Observer for off-screen elements
- Simplify gradients (1-2 max)
- Use CSS drop-shadow instead of SVG filters
- Disable animations on low-end devices
- Monitor performance in development

### DON'T ❌

- Run continuous animations on all elements
- Use `blur()` filter excessively
- Use `feDropShadow` or `feGaussianBlur` in SVG
- Create 3+ layered gradients
- Animate elements off-screen
- Use `transition: all`
- Ignore performance warnings

---

## 📞 Support

If you encounter issues after applying these fixes:

1. Check the `PERFORMANCE_INVESTIGATION.md` document
2. Run debug commands to identify bottlenecks
3. Verify all components are updated
4. Check browser console for errors
5. Test with animations disabled globally

---

**Last Updated**: 2025-12-10
**Status**: ✅ Ready for implementation
**Priority**: P0 - Critical performance fix
