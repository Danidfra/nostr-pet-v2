import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentUserBlobbonautProfile } from '@/hooks/nostr-pet/useBlobbonautProfile';
import { useNostrAuth } from '@/hooks/nostr-pet/useNostrAuth';
import { selectDisplayName } from '@/lib/nostr-pet/metadata-kind0';
import { Loader2 } from 'lucide-react';

interface ProfileSetupScreenProps {
  onComplete?: () => void; // Optional callback (not needed with direct rendering)
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
  const { pubkey, metadata, isLoadingMetadata } = useNostrAuth();
  const { createProfile, isCreating, hasProfile, profile } = useCurrentUserBlobbonautProfile();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-populate name from Kind 0 metadata
  useEffect(() => {
    if (metadata && !name) {
      const displayName = selectDisplayName(metadata, pubkey || '');
      setName(displayName);
    }
  }, [metadata, pubkey, name]);

  // If profile already exists, skip to next screen
  useEffect(() => {
    if (hasProfile && profile) {
      console.log('[ProfileSetupScreen] Profile already exists, navigation will update automatically');
      onComplete?.(); // Call optional callback if provided
    }
  }, [hasProfile, profile, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      console.log('[ProfileSetupScreen] Creating profile with name:', name.trim());
      await createProfile({ name: name.trim() });
      console.log('[ProfileSetupScreen] Profile created successfully');
      onComplete?.(); // Call optional callback if provided
    } catch (err) {
      console.error('[ProfileSetupScreen] ❌ Profile creation failed:', err);
      setError('Failed to create profile. Please try again.');
    }
  };

  if (isLoadingMetadata) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-[hsl(250,35%,8%)] dark:via-[hsl(260,40%,12%)] dark:to-[hsl(250,35%,10%)] p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="py-12 flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            <p className="text-muted-foreground">Loading your Nostr profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-[hsl(250,35%,8%)] dark:via-[hsl(260,40%,12%)] dark:to-[hsl(250,35%,10%)] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="text-6xl mb-4">👤</div>
          <CardTitle className="text-2xl font-bold">Create Your Blobbonaut Profile</CardTitle>
          <CardDescription>
            Set up your profile to start your Blobbi journey!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base"
                required
              />
              <p className="text-xs text-muted-foreground">
                {metadata ? 'Pre-filled from your Nostr profile' : 'This will be your display name'}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Create Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
