import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createHead, UnheadProvider } from '@unhead/react/client';
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import NostrProvider from '@/components/NostrProvider';
import { AppConfig } from '@/contexts/AppContext';
import { Toaster } from "@/components/ui/toaster";
import { AuthScreen } from '@/app/screens/AuthScreen';
import { ProfileSetupScreen } from '@/app/screens/ProfileSetupScreen';
import { BlobbiAdoptionScreen } from '@/app/screens/BlobbiAdoptionScreen';
import { HomeScreen } from '@/app/screens/HomeScreen';
import { AuthLoadingScreen } from '@/components/AuthLoadingScreen';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { useNostrAuth } from '@/hooks/nostr-pet/useNostrAuth';
import { useCurrentUserBlobbonautProfile } from '@/hooks/nostr-pet/useBlobbonautProfile';
import { useBlobbisLoaded } from '@/hooks/nostr-pet/useBlobbiStatus';
import { useDecaySystem } from '@/hooks/nostr-pet/useDecaySystem';

const head = createHead();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

const defaultConfig: AppConfig = {
  theme: 'system',
  relayMetadata: {
    relays: [
      { url: 'wss://relay.ditto.pub', read: true, write: true },
      { url: 'wss://relay.nostr.band', read: true, write: true },
      { url: 'wss://relay.damus.io', read: true, write: true },
    ],
    updatedAt: 0,
  },
};

function BlobbiAppInner() {
  const { isLoggedIn, isInitialized, logout: authLogout } = useNostrAuth();
  const { hasProfile, profile, isInitialLoading: isProfileLoading } = useCurrentUserBlobbonautProfile();
  const { isLoaded: areBlobbisLoaded, hasBlobbis, count: blobbisCount } = useBlobbisLoaded();

  // Initialize decay system (applies decay on load and every 60s)
  // Only enable when user is logged in AND blobbis are loaded AND at least one blobbi exists
  useDecaySystem({
    intervalMs: 60000, // Check every 60 seconds
    enabled: isLoggedIn && areBlobbisLoaded && hasBlobbis, // Only run when blobbis exist
  });

  // Log navigation state for debugging
  console.log('[App Navigation] State check:', {
    isInitialized,
    isLoggedIn,
    hasProfile,
    isProfileLoading,
    areBlobbisLoaded,
    hasBlobbis,
    blobbisCount,
  });

  const handleAdoption = (_blobbiName: string) => {
    // Adoption flow should trigger real Nostr adoption
    // For now, just navigate - real blobbis will appear when adoption completes
    console.log('[App] Adoption triggered - waiting for real Nostr blobbi creation');
  };

  const handleLogout = async () => {
    await authLogout();
  };

  // ============================================================
  // NAVIGATION DECISION TREE
  // ============================================================
  // This uses direct conditional rendering instead of state-based
  // navigation to prevent flickering during auth rehydration
  // ============================================================

  // STEP 1: Auth is still initializing (rehydrating from localStorage)
  if (!isInitialized) {
    console.log('[App Navigation] → AuthLoadingScreen (waiting for auth initialization)');
    return (
      <>
        <AuthLoadingScreen />
        <Toaster />
      </>
    );
  }

  // STEP 2: Auth initialized, but user is not logged in
  if (!isLoggedIn) {
    console.log('[App Navigation] → AuthScreen (user not logged in)');
    return (
      <>
        <AuthScreen />
        <Toaster />
      </>
    );
  }

  // From here on, user IS logged in
  // Now we need to check profile and Blobbis status

  // STEP 3: User is logged in, but profile is still loading
  if (isProfileLoading) {
    console.log('[App Navigation] → AppLoadingScreen (profile loading)');
    return (
      <>
        <AppLoadingScreen />
        <Toaster />
      </>
    );
  }

  // STEP 4: User is logged in, profile loaded, but no profile exists
  if (!hasProfile) {
    console.log('[App Navigation] → ProfileSetupScreen (no profile found)');
    return (
      <>
        <ProfileSetupScreen />
        <Toaster />
      </>
    );
  }

  // STEP 5: User has profile, but Blobbis are still loading
  if (!areBlobbisLoaded) {
    console.log('[App Navigation] → AppLoadingScreen (Blobbis loading)');
    return (
      <>
        <AppLoadingScreen />
        <Toaster />
      </>
    );
  }

  // STEP 6: User has profile, Blobbis loaded, but no Blobbis exist
  if (!hasBlobbis) {
    console.log('[App Navigation] → BlobbiAdoptionScreen (no Blobbis found)');
    return (
      <>
        <BlobbiAdoptionScreen onAdopt={handleAdoption} />
        <Toaster />
      </>
    );
  }

  // STEP 7: User has profile and Blobbis - show home screen
  console.log('[App Navigation] → HomeScreen (all data loaded)');
  return (
    <>
      <HomeScreen
        userName={profile?.name || 'Blobbonaut'}
        onLogout={handleLogout}
      />
      <Toaster />
    </>
  );
}

export function App() {
  return (
    <UnheadProvider head={head}>
      <AppProvider storageKey='blobbi-app-config' defaultConfig={defaultConfig}>
        <QueryClientProvider client={queryClient}>
          <NostrLoginProvider storageKey='blobbi-login'>
            <NostrProvider>
              <BlobbiAppInner />
            </NostrProvider>
          </NostrLoginProvider>
        </QueryClientProvider>
      </AppProvider>
    </UnheadProvider>
  );
}

export default App;
