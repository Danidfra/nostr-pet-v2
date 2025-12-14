# Signed Event Publishing - Implementation Guide

## Problem Statement

The app was publishing Nostr events unsigned (with empty `id: ""` and `sig: ""`), causing relay publishes to hang and time out. This affected the entire app wherever events were published.

**Example of broken payload:**
```json
["EVENT", { 
  "id": "",
  "sig": "",
  "kind": 31125,
  "pubkey": "...",
  "tags": [...],
  "created_at": ...
}]
```

This must become:
```json
["EVENT", {
  "id": "a1b2c3...",  // ✅ Real event ID
  "sig": "d4e5f6...",  // ✅ Real signature
  "kind": 31125,
  "pubkey": "...",
  "tags": [...],
  "created_at": ...
}]
```

## Root Cause

Event builder functions (like `buildBlobbonautProfileEvent`) were returning events with empty `id` and `sig` fields, and these unsigned events were being passed directly to `nostr.event()` without signing.

## Solution Architecture

### 1. Centralized Signing and Publishing

Created a single, type-safe pipeline for all event publishing:

```
Unsigned Event → Sign with Signer → Validate Signed Event → Publish to Relays
```

**Key Files:**
- `src/lib/nostr/types.ts` - Type definitions
- `src/lib/nostr/publisher.ts` - Centralized publisher
- `src/hooks/useNostrPublisher.ts` - React hook for publishing

### 2. Type Safety

**Unsigned Event Type:**
```typescript
type UnsignedEvent = Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>;
```

**Signed Event Type:**
```typescript
type NostrEvent = {
  id: string;
  pubkey: string;
  sig: string;
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
};
```

**No more hacks like:**
```typescript
// ❌ BAD (old code)
const event = { ...unsigned, id: '', sig: '' } as NostrEvent;
```

## Implementation Details

### Core Publishing Function

**File:** `src/lib/nostr/publisher.ts`

```typescript
export async function publishSignedEvent(
  pool: NPool,
  signer: NostrSigner | undefined,
  event: UnsignedEvent,
  timeout = 8000
): Promise<PublishResult>
```

**Features:**
1. **Validates signer availability** - Must be logged in
2. **Validates event structure** - All required fields present
3. **Signs the event** - Using user's signer (NIP-07/bunker/nsec)
4. **Validates signed event** - Ensures id and sig are non-empty
5. **Publishes with timeout** - Prevents hanging
6. **Comprehensive logging** - Every step logged for debugging
7. **Error handling** - All errors caught and returned

**Guardrails:**
```typescript
// Step 1: Validate signer
if (!signer) {
  return { success: false, error: 'No signer available' };
}

// Step 2: Sign event
const signedEvent = await signer.signEvent(event);

// Step 3: Validate signed fields
if (!signedEvent.id || signedEvent.id === '') {
  return { success: false, error: 'Event ID is empty' };
}

if (!signedEvent.sig || signedEvent.sig === '') {
  return { success: false, error: 'Event signature is empty' };
}

// Step 4: Publish
await pool.event(signedEvent);
```

### React Hook

**File:** `src/hooks/useNostrPublisher.ts`

```typescript
export function useNostrPublisher() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  const publishSigned = async (event: UnsignedEvent): Promise<PublishResult> => {
    return publishSignedEvent(nostr, user?.signer, event);
  };

  return {
    publishSigned,
    hasSigner: !!user?.signer,
    signer: user?.signer,
  };
}
```

**Usage:**
```typescript
const { publishSigned, hasSigner } = useNostrPublisher();

if (!hasSigner) {
  // Show error: must be logged in
  return;
}

const result = await publishSigned({
  kind: 1,
  content: 'Hello, world!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});

if (result.success) {
  console.log('Published:', result.event?.id);
} else {
  console.error('Failed:', result.error);
}
```

## Files Modified

### 1. New Files Created

| File | Purpose |
|------|---------|
| `src/lib/nostr/types.ts` | Type definitions for unsigned events and publish results |
| `src/lib/nostr/publisher.ts` | Centralized signing and publishing logic |
| `src/hooks/useNostrPublisher.ts` | React hook for easy access to publisher |

### 2. Updated Files

| File | Changes | Reason |
|------|---------|--------|
| `src/lib/nostr-pet/interaction-flow.ts` | - Import `publishSignedEvent` and `NostrSigner`<br>- Add `signer` parameter to `executeInteractionFlow`<br>- Replace all 3 `nostr.event()` calls with `publishSignedEvent()`<br>- Remove `withTimeout` import | Sign all interaction events (31125, 14919, 31124) |
| `src/hooks/nostr-pet/useBlobbiInteraction.ts` | - Pass `user.signer` to `executeInteractionFlow` | Provide signer to interaction flow |
| `src/lib/nostr-pet/profile-31125/build.ts` | - Import `UnsignedEvent` type<br>- Change `buildBlobbonautProfileEvent` return type to `UnsignedEvent`<br>- Remove `id` and `sig` fields from returned event<br>- Update `createBlobbonautProfile` to not set event<br>- Update `updateBlobbonautProfile` to preserve existing event | Return unsigned events for signing |
| `src/hooks/nostr-pet/useBlobbonautProfile.ts` | - Import `useNostrPublisher`<br>- Use `publishSigned` instead of `client.publish`<br>- Set signed event on profile after publishing | Use centralized publisher |

### 3. Already Correct Files

| File | Status | Notes |
|------|--------|-------|
| `src/hooks/useNostrPublish.ts` | ✅ Already signs events | Uses `user.signer.signEvent()` before publishing |
| `src/components/DMProvider.tsx` | ✅ Already signs events | Uses `randomSigner.signEvent()` for gift wraps |
| `src/lib/nostr-pet/interaction-14919-v2/build.ts` | ✅ Already returns unsigned | Returns `Omit<NostrEvent, 'id' | 'sig'>` |

## Event Publishing Flow

### Before (Broken)

```
buildBlobbonautProfileEvent(profile)
  ↓
{ id: '', sig: '', kind: 31125, ... }  // ❌ Unsigned
  ↓
nostr.event(unsigned)  // ❌ Publishes unsigned event
  ↓
Relay rejects or times out
```

### After (Fixed)

```
buildBlobbonautProfileEvent(profile)
  ↓
{ kind: 31125, content: '', tags: [...], created_at: ... }  // ✅ UnsignedEvent
  ↓
publishSignedEvent(pool, signer, unsigned)
  ↓
signer.signEvent(unsigned)
  ↓
{ id: 'abc...', pubkey: 'xyz...', sig: 'def...', ... }  // ✅ Signed
  ↓
Validate id and sig are non-empty
  ↓
pool.event(signed)  // ✅ Publishes signed event
  ↓
Success!
```

## Interaction Flow (3-Event Sequence)

**File:** `src/lib/nostr-pet/interaction-flow.ts`

All three events are now properly signed before publishing:

```
STEP 1: Kind 31125 (Inventory Update)
  ↓
buildBlobbonautProfileEvent(updatedProfile)  // Returns UnsignedEvent
  ↓
publishSignedEvent(nostr, signer, unsigned)
  ↓
✅ Signed and published

STEP 2: Kind 14919 v2 (Interaction)
  ↓
buildInteractionV2Event(params, ownerPubkey)  // Returns UnsignedEvent
  ↓
publishSignedEvent(nostr, signer, unsigned)
  ↓
✅ Signed and published

STEP 3: Kind 31124 (Status Update)
  ↓
statusEventUnsigned = { kind, content, tags, created_at }
  ↓
publishSignedEvent(nostr, signer, unsigned)
  ↓
✅ Signed and published
```

**Critical:** If any step fails, the flow stops and rolls back optimistic updates.

## Logging and Debugging

### Console Output (Success)

```
[publishSignedEvent] START { kind: 31125, tagsCount: 15, ... }
[publishSignedEvent] Signing event...
[publishSignedEvent] Event signed successfully { id: "a1b2c3...", pubkey: "xyz...", sig: "def..." }
[publishSignedEvent] Publishing to relays...
[publishSignedEvent] SUCCESS - Event published { id: "a1b2c3...", kind: 31125 }
```

### Console Output (Failure)

```
[publishSignedEvent] START { kind: 31125, ... }
[publishSignedEvent] VALIDATION FAILED: No signer available. User must be logged in.
```

or

```
[publishSignedEvent] START { kind: 31125, ... }
[publishSignedEvent] Signing event...
[publishSignedEvent] SIGNING FAILED: Event ID is empty
```

or

```
[publishSignedEvent] START { kind: 31125, ... }
[publishSignedEvent] Signing event...
[publishSignedEvent] Event signed successfully { id: "a1b2c3...", ... }
[publishSignedEvent] Publishing to relays...
[publishSignedEvent] FAILED { error: "Publish timeout after 8000ms", kind: 31125 }
```

## Validation Checks

### Pre-Signing Validation

1. **Signer available?** - User must be logged in
2. **Event kind valid?** - Must be a number
3. **Content valid?** - Must be a string
4. **Tags valid?** - Must be an array
5. **Timestamp valid?** - Must be a number

### Post-Signing Validation

1. **ID not empty?** - `signedEvent.id !== ''`
2. **Signature not empty?** - `signedEvent.sig !== ''`

### Publishing Validation

1. **Timeout protection** - 8000ms default timeout
2. **Error handling** - All errors caught and returned

## Migration Guide

### For Developers

1. **Pull latest changes**
2. **Test interaction flow:**
   - Click Feed → select item → Use Item
   - Check console for signing logs
   - Verify events published to relays
3. **Verify all events have real id/sig**

### For New Code

**When publishing events, always use:**

```typescript
import { useNostrPublisher } from '@/hooks/useNostrPublisher';

function MyComponent() {
  const { publishSigned, hasSigner } = useNostrPublisher();

  const handlePublish = async () => {
    if (!hasSigner) {
      toast({ title: 'Error', description: 'Must be logged in' });
      return;
    }

    const result = await publishSigned({
      kind: 1,
      content: 'Hello!',
      tags: [],
      created_at: Math.floor(Date.now() / 1000),
    });

    if (result.success) {
      toast({ title: 'Success', description: 'Event published!' });
    } else {
      toast({ title: 'Error', description: result.error });
    }
  };

  return <Button onClick={handlePublish}>Publish</Button>;
}
```

**Never do:**
```typescript
// ❌ DON'T DO THIS
await nostr.event({ kind: 1, content: '', tags: [], created_at: 0 });

// ❌ DON'T DO THIS
const event = { ...unsigned, id: '', sig: '' } as NostrEvent;
await nostr.event(event);
```

## Testing Checklist

### ✅ Basic Flow

- [ ] User can log in
- [ ] User can click Feed → burger → Use Item
- [ ] Console shows signing logs
- [ ] Events have real id and sig
- [ ] Events published to relays successfully

### ✅ Error Handling

- [ ] Not logged in → Shows error toast
- [ ] Network failure → Shows specific error
- [ ] Signing failure → Shows specific error
- [ ] Timeout → Shows timeout error

### ✅ All Event Types

- [ ] Kind 31125 (Inventory) - Signed and published
- [ ] Kind 14919 v2 (Interaction) - Signed and published
- [ ] Kind 31124 (Status) - Signed and published
- [ ] Kind 1 (Notes) - Already working via useNostrPublish
- [ ] Kind 1059 (DMs) - Already working via DMProvider

## Performance Considerations

### Timeout Strategy

- **Default timeout:** 8000ms (8 seconds)
- **Configurable:** Can pass custom timeout to `publishSignedEvent`
- **Prevents hanging:** If relay doesn't respond, operation fails gracefully

### Signing Performance

- **NIP-07 Extension:** ~10-50ms per signature
- **Bunker/NIP-46:** ~100-500ms per signature (network dependent)
- **nsec:** ~10-50ms per signature

### Relay Publishing

- **Parallel publishing:** Events published to all write relays simultaneously
- **No retry logic:** Single attempt (can be added if needed)
- **Error aggregation:** AggregateError if multiple relays fail

## Future Improvements

### Short Term

1. **Add retry logic** for transient network failures
2. **Add relay confirmation** - Wait for OK from relays
3. **Add offline queue** - Queue events when offline

### Long Term

1. **Add event batching** - Publish multiple events in one batch
2. **Add relay selection** - Choose best relays for publishing
3. **Add performance monitoring** - Track signing and publishing times
4. **Add event verification** - Verify events after publishing

## Breaking Changes

**None** - All changes are internal improvements. External API remains the same.

## Rollback Plan

If issues occur:

1. **Revert commits** related to signed publishing
2. **Restore old build functions** that return events with empty id/sig
3. **Remove new publisher files**

However, this is **not recommended** as it would restore the original bug.

## Support

For issues:

1. Check console for specific error messages
2. Verify user is logged in with NIP-07 extension
3. Check relay connections
4. Verify signer is working (try signing a test event)
5. Check network connectivity

## Summary

This implementation establishes a robust, type-safe, centralized pipeline for signing and publishing Nostr events. All events are now properly signed before being sent to relays, eliminating the timeout issues and ensuring compatibility with the Nostr protocol.

**Key Benefits:**
- ✅ All events properly signed
- ✅ Type-safe (no `any` types)
- ✅ Centralized logic (single source of truth)
- ✅ Comprehensive validation
- ✅ Detailed logging for debugging
- ✅ Graceful error handling
- ✅ Timeout protection
