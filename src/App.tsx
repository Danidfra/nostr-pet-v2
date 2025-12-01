import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { AuthScreen } from '@/app/screens/AuthScreen';
import { ProfileSetupScreen } from '@/app/screens/ProfileSetupScreen';
import { BlobbiAdoptionScreen } from '@/app/screens/BlobbiAdoptionScreen';
import { HomeScreen } from '@/app/screens/HomeScreen';
import { mockBlobbis } from '@/data/mockBlobbis';
import { Blobbi } from '@/types/blobbi';

type AppState = 'auth' | 'profile-setup' | 'adoption' | 'home';

export function App() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [userName, setUserName] = useState('');
  const [blobbis, setBlobbis] = useState<Blobbi[]>([]);

  const handleLogin = () => {
    setAppState('profile-setup');
  };

  const handleProfileComplete = (name: string) => {
    setUserName(name);
    setAppState('adoption');
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
    setAppState('home');
  };

  const handleLogout = () => {
    setAppState('auth');
    setUserName('');
    setBlobbis([]);
  };

  // Render the appropriate screen based on app state
  switch (appState) {
    case 'auth':
      return (
        <>
          <AuthScreen onLogin={handleLogin} />
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
            userName={userName}
            onLogout={handleLogout}
          />
          <Toaster />
        </>
      );
    
    default:
      return null;
  }
}

export default App;
