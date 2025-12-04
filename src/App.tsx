import { useEffect, useState } from 'react';
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
import { mockBlobbis } from '@/data/mockBlobbis';
import { Blobbi } from '@/types/blobbi';
import { useNostrAuth } from '@/hooks/nostr-pet/useNostrAuth';
import { useCurrentUserBlobbonautProfile } from '@/hooks/nostr-pet/useBlobbonautProfile';
import { useBlobbisLoaded } from '@/hooks/nostr-pet/useBlobbiStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

type AppState = 'auth' | 'profile-setup' | 'adoption' | 'home';

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
  const { blobbis: realBlobbis, isLoaded: areBlobbisLoaded, hasBlobbis } = useBlobbisLoaded();

  const [appState, setAppState] = useState<AppState>('auth');
  const [blobbis, setBlobbis] = useState<Blobbi[]>([]);

  // Determine app state based on auth, profile, and Blobbis status
  useEffect(() => {
    console.log('[App Navigation] State check:', {
      isInitialized,
      isLoggedIn,
      hasProfile,
      isProfileLoading,
      areBlobbisLoaded,
      hasBlobbis,
      realBlobbisCount: realBlobbis.length,
      mockBlobbisCount: blobbis.length,
    });

    if (!isInitialized) {
      console.log('[App Navigation] Waiting for auth initialization...');
      return; // Wait for auth to initialize
    }

    if (!isLoggedIn) {
      console.log('[App Navigation] Not logged in → AuthScreen');
      setAppState('auth');
    } else if (!hasProfile && !isProfileLoading) {
      console.log('[App Navigation] Logged in but no profile → ProfileSetupScreen');
      setAppState('profile-setup');
    } else if (hasProfile && !areBlobbisLoaded) {
      console.log('[App Navigation] Profile exists, waiting for Blobbis to load...');
      // Wait for Blobbis to load before deciding
      return;
    } else if (hasProfile && areBlobbisLoaded && hasBlobbis) {
      console.log('[App Navigation] Has profile and Blobbis → HomeScreen');
      setAppState('home');
    } else if (hasProfile && areBlobbisLoaded && !hasBlobbis) {
      console.log('[App Navigation] Has profile but no Blobbis → AdoptionScreen');
      setAppState('adoption');
    }
  }, [isInitialized, isLoggedIn, hasProfile, isProfileLoading, areBlobbisLoaded, hasBlobbis, realBlobbis.length, blobbis.length]);

  const handleLoginSuccess = () => {
    // State will automatically transition via useEffect
  };

  const handleProfileComplete = () => {
    // State will automatically transition via useEffect
  };

  const handleAdoption = (blobbiName: string) => {
    // Create a new egg blobbi with the given name
    const newBlobbi: Blobbi = {
      ...mockBlobbis[0], // Use the egg template
      id: `blobbi-${Date.now()}`,
      name: blobbiName,
      birthTime: Date.now(),
      lastInteraction: Date.now(),
    };

    // Add all mock blobbis for demo purposes
    setBlobbis([newBlobbi, ...mockBlobbis.slice(1)]);
  };

  const handleLogout = async () => {
    await authLogout();
    setBlobbis([]);
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-[hsl(250,35%,8%)] dark:via-[hsl(260,40%,12%)] dark:to-[hsl(250,35%,10%)] p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="py-12 space-y-4">
            <div className="flex justify-center">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the appropriate screen based on app state
  switch (appState) {
    case 'auth':
      return (
        <>
          <AuthScreen onLoginSuccess={handleLoginSuccess} />
          <Toaster />
        </>
      );

    case 'profile-setup':
      return (
        <>
          <ProfileSetupScreen onComplete={handleProfileComplete} />
          <Toaster />
        </>
      );

    case 'adoption':
      return (
        <>
          <BlobbiAdoptionScreen onAdopt={handleAdoption} />
          <Toaster />
        </>
      );

    case 'home':
      return (
        <>
          <HomeScreen
            blobbis={blobbis}
            userName={profile?.name || 'Blobbonaut'}
            onLogout={handleLogout}
          />
          <Toaster />
        </>
      );

    default:
      return null;
  }
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
