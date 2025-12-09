import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

/**
 * Loading screen shown while profile and Blobbis are loading after successful auth
 * This prevents flickering between login and home screens
 */
export const AppLoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-[hsl(250,35%,8%)] dark:via-[hsl(260,40%,12%)] dark:to-[hsl(250,35%,10%)] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="py-12 space-y-6">
          {/* Animated loader with Blobbi theme */}
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-purple-600 dark:text-purple-400 animate-spin" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-xl rounded-full animate-pulse" />
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Loading your Blobbi world...
            </h2>
            <p className="text-sm text-muted-foreground">
              Fetching your profile and Blobbis from the network
            </p>
          </div>

          {/* Progress indicators */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-400 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="flex-shrink-0 w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted" />
              <Skeleton className="h-4 flex-1 opacity-50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
