# Sleep/Wake + Decay - Quick Reference

## Sleep Action

**User Action**: Click "Sleep"

**14919 Event**:
```json
{
  "tags": [
    ["action", "sleep"],
    ["action_category", "recovery"]
    // NO stat_change tags
  ]
}
```

**31124 Update**:
- `["state", "sleeping"]`
- `["last_decay_at", "<now>"]`

**Result**:
- Blobbi enters sleep state
- Energy stops decaying
- Other stats continue to decay

---

## Wake Action

**User Action**: Click "Wake"

**Energy Recovery**:
```
Sleep Duration: 60 minutes
Blocks: 60 / 12 = 5
Energy Gain: 5 * 10 = 50
```

**14919 Event**:
```json
{
  "tags": [
    ["action", "wake"],
    ["stat_change", "energy:50"],
    ["experience_gained", "2"],
    ["care_points", "1"]
  ]
}
```

**31124 Update**:
- `["state", "active"]`
- `["energy", "<oldEnergy + gain>"]`
- `["last_decay_at", "<now>"]`

**Result**:
- Blobbi wakes up
- Energy restored based on sleep duration
- Energy decay resumes

---

## Decay Rates

### Egg
- Temperature: -3/hour
- Hygiene: -2/hour
- Happiness: -3/hour
- Shell: Variable (based on stats)

### Baby
- Hunger: -5/hour
- Happiness: -3/hour
- Energy: -6/hour (active only)
- Hygiene: -4/hour
- Health: -1/hour + modifiers

### Adult
- Hunger: -4/hour
- Happiness: -3/hour
- Energy: -5/hour (active only)
- Hygiene: -4/hour
- Health: -1/hour + modifiers

---

## Health Modifiers

**Extra Decay**:
- Hunger < 30: +1.5/hour
- Hygiene < 20: +1.0/hour
- Energy < 20: +1.0/hour
- Happiness < 30: +1.0/hour

**Regeneration**:
- All stats ≥ 80: +2/hour

---

## Tag Reference

### Always Updated on Interactions
- `experience`
- `care_streak`
- `last_interaction`
- `last_decay_at`

### Sleep-Specific
- `state` → "sleeping"

### Wake-Specific
- `state` → "active"
- `energy` → updated with recovery

### Deprecated (Do Not Use)
- ❌ `is_sleeping`
- ❌ `sleep_started_at`
- ❌ `last_sleep_update`

---

## API Quick Start

### Apply Decay Manually

```typescript
import { applyDecayAndPublish } from '@/lib/nostr-pet/decay';

const result = await applyDecayAndPublish(nostr, signer, blobbi);
if (result.success) {
  console.log('Updated blobbi:', result.blobbi);
}
```

### Calculate Wake Energy

```typescript
import { calculateEnergyFromLatestSleep } from '@/lib/nostr-pet/sleep';

const sleepEvents = await nostr.query([{
  kinds: [14919],
  '#blobbi_id': [blobbiId],
  '#action': ['sleep'],
  limit: 10,
}]);

const energyGain = calculateEnergyFromLatestSleep(sleepEvents, blobbiId);
```

### Enable Automatic Decay

```typescript
import { useDecaySystem } from '@/hooks/nostr-pet/useDecaySystem';

function MyComponent() {
  useDecaySystem({
    intervalMs: 60000,
    enabled: true,
  });
}
```

---

## Common Patterns

### Check if Blobbi is Sleeping

```typescript
const isSleeping = blobbi.state === 'sleeping';
```

### Calculate Time Since Last Decay

```typescript
const lastDecay = blobbi.lastDecayAt || blobbi.createdAt;
const elapsed = now - lastDecay;
const hours = elapsed / 3600;
```

### Estimate Next Decay

```typescript
const nextDecay = lastDecayAt + 60; // Next check in 60 seconds
const timeUntil = nextDecay - now;
```

---

## Debugging

### Enable Decay Logs

Check console for:
- `[DecaySystem]` - Decay hook logs
- `[DecayManager]` - Decay publishing logs
- `[WakeCalculator]` - Wake energy logs
- `[executeInteractionFlow]` - Interaction flow logs

### Common Issues

**Decay not applying**:
- Check `enabled` flag
- Verify user is logged in
- Ensure Blobbis are loaded

**Energy not recovering**:
- Check sleep events query
- Verify latest sleep event exists
- Check sleep duration calculation

**Stats changing unexpectedly**:
- Verify decay rates
- Check for multiple decay applications
- Ensure `last_decay_at` is updating

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Tests

```bash
npx vitest run src/lib/nostr-pet/decay/
npx vitest run src/lib/nostr-pet/sleep/
npx vitest run src/lib/nostr-pet/interaction-14919-v2/
```

### Test Coverage

- Decay: 15 tests
- Wake: 17 tests
- Validation: 27 tests
- Integration: 11 tests
- **Total: 150 tests** ✅

---

## Quick Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| Decay not running | Console logs | Enable decay system |
| Energy not recovering | Sleep events | Query sleep events |
| Stats out of range | Clamping logic | Verify 0-100 clamp |
| Tags missing | Tag preservation | Check tagsToRemove |
| Sleep fails | Validation | Ensure no stat_change |
| Wake fails | Stat change | Include energy delta |

---

**Last Updated**: December 20, 2024  
**Version**: Blobbi v2  
**Status**: Production Ready ✅
