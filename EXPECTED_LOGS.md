# Expected Console Logs - Quick Reference

This document shows the expected console logs for common auth flows. Use this to quickly verify that the authentication system is working correctly.

---

## 🟢 Scenario 1: Fresh Login (First Time)

**User Action:** Open app → Click "Log In with Nostr" → Grant permission

**Expected Console Output:**

```
[vite] connected.

[App Navigation] State check: {isInitialized: false, isLoggedIn: false, hasProfile: false, ...}
[App Navigation] → AuthLoadingScreen (waiting for auth initialization)

[Auth] Starting session rehydration from localStorage...
[Nostr Auth] No session to rehydrate
[Auth] ℹ️ No session to rehydrate (user not logged in)
[Auth] Initialization complete
[Auth] Derived auth state: {isInitialized: true, isLoggedIn: false, pubkey: null, sessionExists: false}

[App Navigation] State check: {isInitialized: true, isLoggedIn: false, hasProfile: false, ...}
[App Navigation] → AuthScreen (user not logged in)

// User clicks "Log In with Nostr" button

[AuthScreen] Login button clicked, calling login()...
[Auth] User clicked login - requesting NIP-07 permission...

// NIP-07 popup appears, user grants permission

[Nostr Auth] Login successful: {pubkey: 'feb88e80...', relays: 5}
[Session] Session saved to localStorage
[Auth] loginWithNostr returned session: {pubkey: 'feb88e80...', hasRelays: true}
[Auth] ✅ Login mutation onSuccess called
[Auth] Setting session state with: {pubkey: 'feb88e80...', createdAt: 1704448800000, relays: 5}
[Auth] setSession called - state should update now
[Auth] NLogin created from extension
[Auth] ✅ Login complete - all setup finished, queries invalidated

[Auth] Derived auth state: {isInitialized: true, isLoggedIn: true, pubkey: 'feb88e80...', sessionExists: true}
[AuthScreen] Login completed successfully

[App Navigation] State check: {isInitialized: true, isLoggedIn: true, hasProfile: false, isProfileLoading: true, ...}
[App Navigation] → AppLoadingScreen (profile loading)

[Auth Metadata] Fetching metadata for pubkey: feb88e80...
[Auth Metadata] Received events: 2
[Auth Metadata] Filtered Kind 0 events: 1
[Auth Metadata] Using newest event from: 2024-01-05T10:30:00.000Z
[Auth Metadata] Metadata loaded successfully: YourName

[Profile Hook] Fetching profile...
[Profile Hook] Querying by author pubkey: feb88e80...
[Profile Hook] Received events: 1
[Profile Hook] Filtered Blobbi events: 1
[Profile Hook] Profile loaded successfully: Blobbonaut-feb88e80

[Blobbi Status] Fetching Blobbis for user: feb88e80...
[Blobbi Status] Querying Kind 31124 by author...
[Blobbi Status] Received events: 24
[Blobbi Status] Filtered Blobbi events: 24
[Blobbi Status] Parsed Blobbis: 24
[Blobbi Status] Deduplicated Blobbis: 24

[App Navigation] State check: {isInitialized: true, isLoggedIn: true, hasProfile: true, isProfileLoading: false, areBlobbisLoaded: true, hasBlobbis: true, ...}
[App Navigation] → HomeScreen (all data loaded)
```

**✅ Success Indicators:**
- `isLoggedIn` changes from `false` to `true`
- `setSession called - state should update now`
- Navigation: AuthScreen → AppLoadingScreen → HomeScreen
- No manual reload required

---

## 🟢 Scenario 2: Page Reload (Already Logged In)

**User Action:** Press F5 or reload page while logged in

**Expected Console Output:**

```
[vite] connected.

[App Navigation] State check: {isInitialized: false, isLoggedIn: false, hasProfile: false, ...}
[App Navigation] → AuthLoadingScreen (waiting for auth initialization)

[Auth] Starting session rehydration from localStorage...
[Nostr Auth] Session rehydrated: {pubkey: 'feb88e80...', relays: 5}
[Session] Activity timestamp updated
[Auth] ✅ Session rehydrated, login already exists in provider
[Auth] Initialization complete
[Auth] Derived auth state: {isInitialized: true, isLoggedIn: true, pubkey: 'feb88e80...', sessionExists: true}

[App Navigation] State check: {isInitialized: true, isLoggedIn: true, hasProfile: false, isProfileLoading: true, ...}
[App Navigation] → AppLoadingScreen (profile loading)

[Auth Metadata] Fetching metadata for pubkey: feb88e80...
[Profile Hook] Fetching profile...
[Blobbi Status] Fetching Blobbis for user: feb88e80...

// ... metadata, profile, and Blobbis load ...

[App Navigation] State check: {isInitialized: true, isLoggedIn: true, hasProfile: true, isProfileLoading: false, areBlobbisLoaded: true, hasBlobbis: true, ...}
[App Navigation] → HomeScreen (all data loaded)
```

**✅ Success Indicators:**
- `Session rehydrated` (not "No session to rehydrate")
- `isLoggedIn: true` from the start (after initialization)
- No NIP-07 popup
- Navigation: AuthLoadingScreen → AppLoadingScreen → HomeScreen
- No login required

---

## 🟢 Scenario 3: New Tab (Already Logged In)

**User Action:** Open new tab while logged in, navigate to app URL

**Expected Console Output:**

Same as Scenario 2 (Page Reload). The session persists in localStorage across tabs.

**✅ Success Indicators:**
- Session rehydrates from localStorage
- No login required
- No NIP-07 popup

---

## 🟢 Scenario 4: Browser Restart (Already Logged In)

**User Action:** Close browser completely, reopen, navigate to app URL

**Expected Console Output:**

Same as Scenario 2 (Page Reload). The session persists in localStorage across browser sessions.

**✅ Success Indicators:**
- Session rehydrates from localStorage (session age < 30 days)
- No login required
- No NIP-07 popup

---

## 🟢 Scenario 5: Logout

**User Action:** Click logout button

**Expected Console Output:**

```
[Auth] Logging out...
[Nostr Auth] Logout successful
[Session] Session cleared from localStorage
[Auth] ✅ Logout successful - session cleared from localStorage, all queries cleared
[Auth] Derived auth state: {isInitialized: true, isLoggedIn: false, pubkey: null, sessionExists: false}

[App Navigation] State check: {isInitialized: true, isLoggedIn: false, hasProfile: false, ...}
[App Navigation] → AuthScreen (user not logged in)
```

**✅ Success Indicators:**
- `Session cleared from localStorage`
- `isLoggedIn` changes from `true` to `false`
- Navigation to AuthScreen
- Opening new tab requires login again

---

## 🟢 Scenario 6: Profile Creation (First Time User)

**User Action:** Log in → Create profile

**Expected Console Output:**

```
// ... login flow ...

[App Navigation] → ProfileSetupScreen (no profile found)

// User fills in name and clicks submit

[ProfileSetupScreen] Creating profile with name: MyName
[Profile Hook] Profile created successfully
[ProfileSetupScreen] Profile created successfully

[App Navigation] State check: {isInitialized: true, isLoggedIn: true, hasProfile: true, ...}
[App Navigation] → AppLoadingScreen (Blobbis loading)

// ... Blobbis load ...

[App Navigation] → HomeScreen (all data loaded)
```

**✅ Success Indicators:**
- Profile creation succeeds
- Navigation: ProfileSetupScreen → AppLoadingScreen → HomeScreen
- No manual reload required

---

## 🔴 Scenario 7: Login Failed (Permission Denied)

**User Action:** Click "Log In with Nostr" → Deny permission in NIP-07 popup

**Expected Console Output:**

```
[AuthScreen] Login button clicked, calling login()...
[Auth] User clicked login - requesting NIP-07 permission...

// User denies permission

[Nostr Auth] Failed to get public key
[Nostr Auth] Login failed: Error: Login failed
[Auth] ❌ Login failed: Error: Login failed
[AuthScreen] ❌ Login failed: Error: Login failed

[App Navigation] State check: {isInitialized: true, isLoggedIn: false, ...}
[App Navigation] → AuthScreen (user not logged in)
```

**✅ Expected Behavior:**
- Error logged with ❌ prefix
- App stays on AuthScreen
- User can try again
- `isLoggedIn` remains `false`

---

## 🔴 Scenario 8: Session Expired (30+ Days Old)

**User Action:** Open app after 30+ days of inactivity

**Expected Console Output:**

```
[Auth] Starting session rehydration from localStorage...
[Session] Session expired (age: 31 days)
[Session] Session cleared from localStorage
[Nostr Auth] No session to rehydrate
[Auth] ℹ️ No session to rehydrate (user not logged in)
[Auth] Derived auth state: {isInitialized: true, isLoggedIn: false, pubkey: null, sessionExists: false}

[App Navigation] → AuthScreen (user not logged in)
```

**✅ Expected Behavior:**
- Expired session is automatically cleared
- User must log in again
- Navigation to AuthScreen

---

## 🟡 Scenario 9: No Profile Found (Returning User)

**User Action:** Log in with account that has no profile

**Expected Console Output:**

```
// ... login flow ...

[Profile Hook] Fetching profile...
[Profile Hook] No profile found

[App Navigation] State check: {isInitialized: true, isLoggedIn: true, hasProfile: false, isProfileLoading: false, ...}
[App Navigation] → ProfileSetupScreen (no profile found)
```

**✅ Expected Behavior:**
- User is logged in but has no profile
- Navigation to ProfileSetupScreen
- User can create profile

---

## 🟡 Scenario 10: No Blobbis Found (New User)

**User Action:** Log in → Create profile → No Blobbis exist

**Expected Console Output:**

```
// ... login and profile creation flow ...

[Blobbi Status] Fetching Blobbis for user: feb88e80...
[Blobbi Status] Parsed Blobbis: 0

[App Navigation] State check: {isInitialized: true, isLoggedIn: true, hasProfile: true, isProfileLoading: false, areBlobbisLoaded: true, hasBlobbis: false, ...}
[App Navigation] → BlobbiAdoptionScreen (no Blobbis found)
```

**✅ Expected Behavior:**
- User has profile but no Blobbis
- Navigation to BlobbiAdoptionScreen
- User can adopt first Blobbi

---

## 🔍 Quick Diagnostic Checklist

Use this checklist to quickly diagnose auth issues:

### ✅ Is auth initializing correctly?

Look for:
```
[Auth] Starting session rehydration from localStorage...
[Auth] Initialization complete
```

### ✅ Is session being saved on login?

Look for:
```
[Session] Session saved to localStorage
[Auth] setSession called - state should update now
```

### ✅ Is session being rehydrated on reload?

Look for:
```
[Nostr Auth] Session rehydrated: {pubkey: '...', relays: 5}
```

NOT:
```
[Nostr Auth] No session to rehydrate
```

### ✅ Is `isLoggedIn` updating correctly?

Look for:
```
[Auth] Derived auth state: {isInitialized: true, isLoggedIn: true, ...}
```

### ✅ Is App.tsx re-rendering with new state?

Look for:
```
[App Navigation] State check: {isInitialized: true, isLoggedIn: true, ...}
```

### ✅ Is navigation happening automatically?

Look for sequence:
```
[App Navigation] → AuthScreen (user not logged in)
// after login
[App Navigation] → AppLoadingScreen (profile loading)
// after profile loads
[App Navigation] → HomeScreen (all data loaded)
```

---

## 🐛 Common Issues and Their Log Signatures

### Issue: Login doesn't navigate

**Missing log:**
```
[Auth] setSession called - state should update now
```

**Cause:** `onSuccess` not running or error in mutation

---

### Issue: Reload requires login again

**Missing log:**
```
[Nostr Auth] Session rehydrated: {pubkey: '...', relays: 5}
```

**Cause:** Session not saved to localStorage or expired

---

### Issue: Multiple NIP-07 popups on reload

**Present log:**
```
[Auth] NLogin created from extension
```

**During rehydration** (should only happen during explicit login)

**Cause:** `fromExtension()` being called during rehydration instead of just during login

---

### Issue: Stuck on loading screen

**Present log:**
```
[App Navigation] → AppLoadingScreen (profile loading)
```

**But never:**
```
[App Navigation] → HomeScreen (all data loaded)
```

**Cause:** Profile or Blobbis query stuck/failed. Check for query errors.

---

## 📊 Log Prefixes Reference

- `[vite]` - Vite dev server
- `[Auth]` - useNostrAuth hook
- `[Nostr Auth]` - lib/nostr-pet/auth/nostr-auth.ts
- `[Session]` - lib/nostr-pet/auth/session.ts
- `[Auth Metadata]` - Metadata fetching in useNostrAuth
- `[Profile Hook]` - useBlobbonautProfile hook
- `[Blobbi Status]` - useBlobbiStatus hook
- `[App Navigation]` - App.tsx navigation decisions
- `[AuthScreen]` - AuthScreen component
- `[ProfileSetupScreen]` - ProfileSetupScreen component

**Emoji Indicators:**
- ✅ - Success
- ❌ - Error
- ℹ️ - Info/Notice
