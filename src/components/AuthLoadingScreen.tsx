import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading screen shown while auth is rehydrating from localStorage
 * This prevents flickering to the login screen during initial page load
 */
export const AuthLoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-[hsl(250,35%,8%)] dark:via-[hsl(260,40%,12%)] dark:to-[hsl(250,35%,10%)] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="py-12 space-y-6">
          {/* Blobbi egg animation placeholder */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="text-6xl animate-bounce">🥚</div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-xl rounded-full animate-pulse" />
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Reconnecting to your Blobbi...
            </h2>
            <p className="text-sm text-muted-foreground">
              Checking your saved session
            </p>
          </div>

          {/* Skeleton placeholders */}
          <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mx-auto" />
            <Skeleton className="h-4 w-4/6 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
