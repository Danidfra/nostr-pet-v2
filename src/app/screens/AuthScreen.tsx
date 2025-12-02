import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNostrAuth } from '@/hooks/nostr-pet/useNostrAuth';
import { Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { login, isLoggingIn, loginError, hasNip07 } = useNostrAuth();

  const handleLogin = async () => {
    try {
      await login();
      onLoginSuccess();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-[hsl(250,35%,8%)] dark:via-[hsl(260,40%,12%)] dark:to-[hsl(250,35%,10%)] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="text-6xl mb-4">🥚</div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Welcome to Blobbi
          </CardTitle>
          <CardDescription className="text-base">
            Your virtual pet companion awaits!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Adopt, nurture, and watch your Blobbi grow from egg to adult.
          </p>

          {!hasNip07 && (
            <Alert variant="destructive">
              <AlertDescription>
                No Nostr extension detected. Please install a NIP-07 compatible extension like{' '}
                <a
                  href="https://getalby.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  Alby
                </a>
                {' '}or{' '}
                <a
                  href="https://github.com/fiatjaf/nos2x"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  nos2x
                </a>
                .
              </AlertDescription>
            </Alert>
          )}

          {loginError && (
            <Alert variant="destructive">
              <AlertDescription>
                Login failed. Please try again.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleLogin}
            disabled={!hasNip07 || isLoggingIn}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              'Log In with Nostr'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure login using your Nostr identity via NIP-07
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
