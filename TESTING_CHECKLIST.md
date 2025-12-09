# Auth Fix Testing Checklist

## Quick Testing Guide

Use this checklist to verify the authentication fixes are working correctly.

---

## ✅ Test 1: Same Tab Reload

**Steps:**
1. Log in to the app
2. Wait for HomeScreen to load
3. Press F5 (reload page)

**Expected Result:**
- ✅ AuthLoadingScreen appears briefly
- ✅ AppLoadingScreen appears (loading profile/Blobbis)
- ✅ HomeScreen appears with your data
- ✅ **NO** NIP-07 permission popup
- ✅ **NO** login screen

**Console Logs to Check:**
```
[Auth] Starting session rehydration from localStorage...
[Nostr Auth] Session rehydrated: {pubkey: '...', relays: 5}
[Auth] ✅ Session rehydrated, login already exists in provider
[Auth] Initialization complete
```

**❌ FAIL if:**
- Login screen appears
- NIP-07 permission popup appears
- Console shows "No session to rehydrate"

---

## ✅ Test 2: New Tab (Same Browser Session)

**Steps:**
1. Log in to the app (in Tab A)
2. Wait for HomeScreen to load
3. Open a new tab (Tab B)
4. Navigate to the app URL in Tab B

**Expected Result:**
- ✅ AuthLoadingScreen appears briefly
- ✅ AppLoadingScreen appears
- ✅ HomeScreen appears with your data
- ✅ **NO** NIP-07 permission popup
- ✅ **NO** login screen

**Console Logs to Check:**
```
[Auth] Starting session rehydration from localStorage...
[Nostr Auth] Session rehydrated: {pubkey: '...', relays: 5}
```

**❌ FAIL if:**
- Login screen appears
- Must click "Login" again

---

## ✅ Test 3: Close Tab and Reopen

**Steps:**
1. Log in to the app
2. Wait for HomeScreen to load
3. Close the tab completely
4. Open a new tab
5. Navigate to the app URL

**Expected Result:**
- ✅ AuthLoadingScreen appears briefly
- ✅ AppLoadingScreen appears
- ✅ HomeScreen appears with your data
- ✅ **NO** NIP-07 permission popup
- ✅ **NO** login screen

**Console Logs to Check:**
```
[Auth] Starting session rehydration from localStorage...
[Nostr Auth] Session rehydrated: {pubkey: '...', relays: 5}
```

**❌ FAIL if:**
- Login screen appears (THIS WAS THE BUG!)
- Must click "Login" again

---

## ✅ Test 4: Close Browser and Reopen

**Steps:**
1. Log in to the app
2. Wait for HomeScreen to load
3. Close the entire browser (all windows)
4. Reopen the browser
5. Navigate to the app URL

**Expected Result:**
- ✅ AuthLoadingScreen appears briefly
- ✅ AppLoadingScreen appears
- ✅ HomeScreen appears with your data
- ✅ **NO** NIP-07 permission popup
- ✅ **NO** login screen

**Console Logs to Check:**
```
[Auth] Starting session rehydration from localStorage...
[Nostr Auth] Session rehydrated: {pubkey: '...', relays: 5}
```

**❌ FAIL if:**
- Login screen appears (THIS WAS THE BUG!)
- Must click "Login" again

---

## ✅ Test 5: Logout and Reopen

**Steps:**
1. Log in to the app
2. Wait for HomeScreen to load
3. Click logout
4. Close the tab
5. Open a new tab
6. Navigate to the app URL

**Expected Result:**
- ✅ AuthLoadingScreen appears briefly
- ✅ AuthScreen appears (login required)
- ✅ **NO** automatic login

**Console Logs to Check:**
```
[Auth] Starting session rehydration from localStorage...
[Nostr Auth] No session to rehydrate
[Auth] ℹ️ No session to rehydrate (user not logged in)
[Auth] Initialization complete
[App Navigation] → AuthScreen (user not logged in)
```

**❌ FAIL if:**
- Automatically logs in after logout
- HomeScreen appears without clicking login

---

## ✅ Test 6: Metadata Parsing (No Errors)

**Steps:**
1. Log in to the app
2. Wait for HomeScreen to load
3. Open browser console
4. Look for any metadata parsing errors

**Expected Result:**
- ✅ **NO** `[Metadata Parser] Invalid event kind: 31124` errors
- ✅ Metadata loads successfully

**Console Logs to Check:**
```
[Auth Metadata] Fetching metadata for pubkey: ...
[Auth Metadata] Received events: 3
[Auth Metadata] Filtered Kind 0 events: 1
[Auth Metadata] Using newest event from: ...
[Auth Metadata] Metadata loaded successfully: YourName
```

**❌ FAIL if:**
- Console shows `[Metadata Parser] Invalid event kind: 31124`
- Metadata fails to load

---

## ✅ Test 7: Explicit Login Flow

**Steps:**
1. Open the app (not logged in)
2. Click "Log In with Nostr" button
3. Approve NIP-07 permission (if prompted)
4. Wait for login to complete

**Expected Result:**
- ✅ NIP-07 permission popup appears (expected on explicit login)
- ✅ AuthLoadingScreen → AppLoadingScreen → HomeScreen
- ✅ Session is saved to localStorage

**Console Logs to Check:**
```
[Auth] User clicked login - requesting NIP-07 permission...
[Nostr Auth] Login successful: {pubkey: '...', relays: 5}
[Session] Session saved to localStorage
[Auth] ✅ Login successful, setting up session...
[Auth] ✅ Login complete - profile and Blobbi queries invalidated
```

**❌ FAIL if:**
- Login fails
- Multiple NIP-07 popups appear
- Session not saved

---

## 🔍 Advanced Testing: localStorage Inspection

### Check if session exists

Open browser console and run:

```javascript
// Check if session exists
localStorage.getItem('nostr-pet:v1:nostr-auth-session')
```

**Expected:** JSON string with session data

### Parse session data

```javascript
// Parse and view session
JSON.parse(localStorage.getItem('nostr-pet:v1:nostr-auth-session'))
```

**Expected output:**
```javascript
{
  data: {
    pubkey: "feb88e80...",
    createdAt: 1704448800000,
    lastActivity: 1704448800000,
    relays: ["wss://relay.ditto.pub", ...],
    loginMethod: "nip07"
  },
  timestamp: 1704448800000,
  version: "v1"
}
```

### Check session age

```javascript
// Calculate session age in days
const session = JSON.parse(localStorage.getItem('nostr-pet:v1:nostr-auth-session'));
const ageMs = Date.now() - session.data.lastActivity;
const ageDays = Math.round(ageMs / 1000 / 60 / 60 / 24);
console.log('Session age:', ageDays, 'days');
```

**Expected:** Less than 30 days (or session will be expired)

### Manually clear session

```javascript
// Clear session (for testing logout)
localStorage.removeItem('nostr-pet:v1:nostr-auth-session')
```

**Then reload page** → Should show login screen

---

## 🐛 Common Issues and Solutions

### Issue: "No session to rehydrate" on reload

**Cause:** Session was not saved to localStorage

**Solution:**
1. Check if `persistentStorage` is being used (not `defaultStorage`)
2. Verify `saveSession()` is called after login
3. Check browser localStorage quota (may be full)

### Issue: NIP-07 popup on every reload

**Cause:** `NLogin.fromExtension()` being called during rehydration

**Solution:**
1. Verify rehydration only constructs `NLogin` manually: `new NLogin('extension', pubkey, null)`
2. Check that `fromExtension()` is only called in `loginMutation`

### Issue: Metadata parsing errors still appear

**Cause:** Events not being filtered before parsing

**Solution:**
1. Verify `fetchMetadata()` filters events: `events.filter(e => e.kind === METADATA_KIND)`
2. Check that filtered events are passed to `getNewestMetadataEvent()`

### Issue: Session expires immediately

**Cause:** Expiration logic is too aggressive

**Solution:**
1. Check `DEFAULT_SESSION_MAX_AGE` is set to 30 days (not hours/minutes)
2. Verify `updateSessionActivity()` is called during rehydration

---

## ✅ Success Criteria Summary

All tests pass when:

1. ✅ Same tab reload: No login required
2. ✅ New tab: No login required
3. ✅ Close tab and reopen: No login required
4. ✅ Close browser and reopen: No login required
5. ✅ Logout and reopen: Login required (as expected)
6. ✅ No metadata parsing errors in console
7. ✅ Explicit login works with NIP-07 popup
8. ✅ localStorage contains session after login
9. ✅ localStorage is empty after logout

---

## 📊 Test Results Template

Copy this template to track your test results:

```
Date: _______________
Tester: _______________
Browser: _______________

[ ] Test 1: Same Tab Reload - PASS / FAIL
[ ] Test 2: New Tab - PASS / FAIL
[ ] Test 3: Close Tab and Reopen - PASS / FAIL
[ ] Test 4: Close Browser and Reopen - PASS / FAIL
[ ] Test 5: Logout and Reopen - PASS / FAIL
[ ] Test 6: No Metadata Errors - PASS / FAIL
[ ] Test 7: Explicit Login Flow - PASS / FAIL

Issues found:
_________________________________
_________________________________
_________________________________

Overall: PASS / FAIL
```
