# Navigation and Loading Flow Fix

## Problem Summary

After a full page reload, users were experiencing:

1. **Login screen flicker**: Even though auth state was correct (`isInitialized: true`, `isLoggedIn: true`), the login screen would briefly appear
2. **Need to click "Login" again**: Users had to click the login button or refresh the page again to actually see the app
3. **Incorrect UI state**: The app logs showed correct state but the UI didn't reflect it

## Root Cause

The original `App.tsx` used **state-based navigation** with a `useEffect` hook:

```tsx
const [appState, setAppState] = useState<AppState>('auth'); // ❌ Initial state is 'auth'

useEffect(() => {
  // This runs AFTER the first render
  if (!isInitialized) return;
  
  if (!isLoggedIn) {
    setAppState('auth');
  } else if (hasProfile && areBlobbisLoaded) {
    setAppState('home'); // ✅ Correct state, but delayed
  }
}, [isInitialized, isLoggedIn, hasProfile, areBlobbisLoaded]);

// First render shows 'auth' screen even when user is logged in
switch (appState) {
  case 'auth': return <AuthScreen />; // ❌ Shows this first
  case 'home': return <HomeScreen />;  // ✅ Shows this after effect runs
}
```

### The Problem with State-Based Navigation

1. **Initial render**: `appState` starts as `'auth'` → Login screen renders
2. **useEffect runs**: Detects user is logged in → Sets `appState` to `'home'`
3. **Second render**: Now shows HomeScreen

This creates a **visual flicker** where the login screen appears briefly before the effect updates the state.

## The Solution

Replace state-based navigation with **direct conditional rendering**:

```tsx
// ✅ No state variable needed
// ✅ Decision made synchronously during render

// STEP 1: Auth still initializing
if (!isInitialized) {
  return <AuthLoadingScreen />;
}

// STEP 2: Auth initialized, but not logged in
if (!isLoggedIn) {
  return <AuthScreen />;
}

// STEP 3: Logged in, but profile loading
if (isProfileLoading) {
  return <AppLoadingScreen />;
}

// STEP 4: Has profile, but Blobbis loading
if (!areBlobbisLoaded) {
  return <AppLoadingScreen />;
}

// STEP 5: Everything loaded - show home
return <HomeScreen />;
```

### Why This Works

1. **Synchronous evaluation**: The decision happens during render, not in a delayed effect
2. **No initial state**: We don't start with a default `'auth'` state that's wrong
3. **Direct conditions**: Each render evaluates the current auth/profile/Blobbi state directly
4. **No flicker**: The correct screen is shown on the first render

## New Loading Screens

### `AuthLoadingScreen`

Shown while `isInitialized === false` (auth rehydration phase):

- Animated egg emoji with bounce effect
- "Reconnecting to your Blobbi..."
- Prevents showing login UI during session restoration

### `AppLoadingScreen`

Shown while profile/Blobbis are loading AFTER successful login:

- Animated spinner with Blobbi theme
- "Loading your Blobbi world..."
- Progress indicators showing loading steps
- Prevents flicker between login and home screens

## Navigation Decision Tree

```
┌─────────────────────────────────────┐
│ Is auth initialized?                │
│ (!isInitialized)                    │
└─────────────┬───────────────────────┘
              │
              ├─ NO → AuthLoadingScreen
              │       (rehydrating session)
              │
              └─ YES
                  │
                  ┌─────────────────────────────────────┐
                  │ Is user logged in?                  │
                  │ (!isLoggedIn)                       │
                  └─────────────┬───────────────────────┘
                                │
                                ├─ NO → AuthScreen
                                │       (show login UI)
                                │
                                └─ YES (logged in)
                                    │
                                    ┌─────────────────────────────────────┐
                                    │ Is profile loading?                 │
                                    │ (isProfileLoading)                  │
                                    └─────────────┬───────────────────────┘
                                                  │
                                                  ├─ YES → AppLoadingScreen
                                                  │        (loading profile)
                                                  │
                                                  └─ NO
                                                      │
                                                      ┌─────────────────────────────────────┐
                                                      │ Does user have profile?             │
                                                      │ (!hasProfile)                       │
                                                      └─────────────┬───────────────────────┘
                                                                    │
                                                                    ├─ NO → ProfileSetupScreen
                                                                    │       (create profile)
                                                                    │
                                                                    └─ YES
                                                                        │
                                                                        ┌─────────────────────────────────────┐
                                                                        │ Are Blobbis loaded?                 │
                                                                        │ (!areBlobbisLoaded)                 │
                                                                        └─────────────┬───────────────────────┘
                                                                                      │
                                                                                      ├─ NO → AppLoadingScreen
                                                                                      │       (loading Blobbis)
                                                                                      │
                                                                                      └─ YES
                                                                                          │
                                                                                          ┌─────────────────────────────────────┐
                                                                                          │ Does user have Blobbis?             │
                                                                                          │ (!hasBlobbis)                       │
                                                                                          └─────────────┬───────────────────────┘
                                                                                                        │
                                                                                                        ├─ NO → BlobbiAdoptionScreen
                                                                                                        │       (adopt first Blobbi)
                                                                                                        │
                                                                                                        └─ YES → HomeScreen
                                                                                                                (show app)
```

## Benefits

1. **No login flicker**: Correct screen shown immediately on page reload
2. **No extra clicks**: User never needs to click "Login" when already logged in
3. **Proper loading states**: Clear visual feedback during all loading phases
4. **Better UX**: Smooth transitions without confusing UI states
5. **Simpler code**: No state management for navigation, just direct conditionals

## Files Changed

- `src/App.tsx`: Replaced state-based navigation with direct conditional rendering
- `src/components/AuthLoadingScreen.tsx`: New loading screen for auth rehydration
- `src/components/AppLoadingScreen.tsx`: New loading screen for profile/Blobbis loading

## Testing the Fix

1. **Log in to the app**: Should work normally
2. **Refresh the page**: Should immediately show the correct screen (no login flicker)
3. **Check console logs**: Should see navigation decisions logged correctly
4. **No extra clicks**: Should never need to click "Login" when already logged in

## Technical Notes

### Why Direct Rendering > State-Based Navigation

**State-based navigation** (with `useEffect`):
- ❌ Requires initial state (often wrong)
- ❌ Effect runs after first render (causes flicker)
- ❌ More complex (state + effect + dependencies)
- ❌ Can cause race conditions with async state updates

**Direct conditional rendering**:
- ✅ No initial state needed
- ✅ Decision made synchronously during render
- ✅ Simpler code (just if statements)
- ✅ Always shows correct UI for current state

### Auth Hook Contract

The fix relies on the `useNostrAuth` hook contract:

- `isInitialized`: `false` during rehydration, `true` when ready
- `isLoggedIn`: `true` if session exists, `false` otherwise
- Session rehydration happens synchronously on mount (no NIP-07 calls)

The hook correctly implements this contract, so the navigation logic can trust these values.
