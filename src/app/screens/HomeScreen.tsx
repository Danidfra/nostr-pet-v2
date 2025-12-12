import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Blobbi } from '@/types/blobbi';
import { EggGraphic } from '@/components/blobbi/EggGraphic';
import { BabyGraphic } from '@/components/blobbi/BabyGraphic';
import { AdultGraphic } from '@/components/blobbi/AdultGraphic';
import { StatusCircle } from '@/components/blobbi/StatusCircle';
import { ItemCard } from '@/components/blobbi/ItemCard';
import { ItemUseModal } from '@/components/blobbi/ItemUseModal';
import { useMyBlobbis } from '@/hooks/nostr-pet/useBlobbiStatus';
import { mapBlobbiStatusListToBlobbis } from '@/lib/nostr-pet/status-31124';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Heart,
  Utensils,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Menu,
  Backpack,
  Thermometer,
  Music,
  Bed,
  Gamepad2,
  Baby,
  Target,
  Droplet,
  LogOut,
  Settings,
  ShoppingCart,
  X,
  ClipboardList,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/useToast';
import BlobbiBackground from '@/assets/blobbi-background.png';
import BlobbiLogo from '@/assets/blobbilogo.svg';
import { useBlobbonautInventory } from '@/hooks/nostr-pet/useBlobbonautInventory';
import { useBlobbiInteraction } from '@/hooks/nostr-pet/useBlobbiInteraction';
import { getItemDefinition, getAllItems, type BlobbiItemCategory, type BlobbiItemDefinition } from '@/lib/blobbi-items';
import type { BlobbiAction } from '@/lib/blobbi-interaction-logic';

// MiniBlobbiAvatar component - Reusable mini Blobbi graphic for avatars
interface MiniBlobbiAvatarProps {
  blobbi: Blobbi;
}

const MiniBlobbiAvatar: React.FC<MiniBlobbiAvatarProps> = ({ blobbi }) => {
  const renderMiniGraphic = () => {
    switch (blobbi.lifeStage) {
      case 'egg':
        return <EggGraphic blobbi={blobbi} animated={false} />;
      case 'baby':
        return <BabyGraphic blobbi={blobbi} animated={false} />;
      case 'adult':
        return <AdultGraphic blobbi={blobbi} animated={false} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
      {/* Smaller inner box + stronger scale reduction for proper padding */}
      <div className="w-8 h-8 flex items-center justify-center">
        <div className="scale-[0.20] origin-center pointer-events-none">
          {renderMiniGraphic()}
        </div>
      </div>
    </div>
  );
};

// CurrentBlobbiButton component - Circular orb with mini Blobbi graphic
interface CurrentBlobbiButtonProps {
  blobbi: Blobbi;
  onClick?: () => void;
}

const CurrentBlobbiButton: React.FC<CurrentBlobbiButtonProps> = ({ blobbi, onClick }) => {
  if (!blobbi) return null;

  const handleClick = () => {
    console.log('[CurrentBlobbiButton] Clicked, current Blobbi:', blobbi.name);
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="pointer-events-none">
      <Button
        variant="secondary"
        size="icon"
        title={`Current Blobbi: ${blobbi.name} (${blobbi.lifeStage})`}
        className="pointer-events-auto rounded-full w-16 h-16 shadow-lg
                    bg-white/95 dark:bg-[hsl(250,30%,12%)]/95
                    backdrop-blur-sm border-2 border-purple-200
                    dark:border-[hsl(250,25%,22%)]
                   flex items-center justify-center overflow-hidden p-0
                   transition-transform hover:scale-105"
        onClick={handleClick}
      >
        <MiniBlobbiAvatar blobbi={blobbi} />
      </Button>
    </div>
  );
};

interface HomeScreenProps {
  blobbis?: Blobbi[]; // Now optional, will use hook data
  userName?: string;
  onLogout?: () => void;
}

type Room = 'MY_BLOBBI' | 'GROWTH_HUB' | 'PLAYROOM';

const ROOMS: Room[] = ['MY_BLOBBI', 'GROWTH_HUB', 'PLAYROOM'];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  // Use the Kind 31124 hook to get real Blobbis
  const { blobbis: blobbiStatusList, isLoading, isInitialLoading, error } = useMyBlobbis();

  // Convert BlobbiStatus to legacy Blobbi type for compatibility
  // Use JSON.stringify for stable dependency comparison to prevent infinite re-renders
  const blobbis = useMemo(() => {
    console.log('[HomeScreen] blobbis from hook:', blobbiStatusList);
    return mapBlobbiStatusListToBlobbis(blobbiStatusList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(blobbiStatusList)]); // Use stringified version for stable comparison

  console.log('[HomeScreen] mapped blobbis:', blobbis);
  console.log('[HomeScreen] isLoading:', isLoading);
  console.log('[HomeScreen] isInitialLoading:', isInitialLoading);
  const [currentRoom, setCurrentRoom] = useState<Room>('MY_BLOBBI');
  const [currentBlobbiIndex, setCurrentBlobbiIndex] = useState(0);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isBlobbiSelectorOpen, setIsBlobbiSelectorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BlobbiItemDefinition | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const { toast } = useToast();

  // Get inventory data
  const { availableItems, isLoading: inventoryLoading } = useBlobbonautInventory();

  // Get all items for shop
  const allItems = useMemo(() => getAllItems(), []);

  // Get interaction hook for current Blobbi
  const { interact, isLoading: isInteracting } = useBlobbiInteraction(blobbis[currentBlobbiIndex]?.id || '');

  // Loading state
  if (isInitialLoading) {
    return (
      <div
        className="h-screen w-full overflow-hidden relative flex items-center justify-center"
        style={{
          backgroundImage: `url(${BlobbiBackground})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '120px 120px',
        }}
      >
        <div className="absolute inset-0 bg-slate-950/40 dark:block hidden pointer-events-none" />
        <Card className="w-full max-w-md shadow-2xl z-10">
          <CardContent className="py-12 space-y-4">
            <div className="flex justify-center">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mx-auto" />
            <p className="text-center text-sm text-muted-foreground mt-4">
              Loading your Blobbis...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="h-screen w-full overflow-hidden relative flex items-center justify-center"
        style={{
          backgroundImage: `url(${BlobbiBackground})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '120px 120px',
        }}
      >
        <div className="absolute inset-0 bg-slate-950/40 dark:block hidden pointer-events-none" />
        <Card className="w-full max-w-md shadow-2xl z-10">
          <CardContent className="py-12 space-y-4 text-center">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-xl font-bold">Error Loading Blobbis</h2>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Failed to load your Blobbis'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - no Blobbis (should not happen if navigation logic works correctly)
  const hasBlobbis = Array.isArray(blobbis) && blobbis.length > 0;
  if (!hasBlobbis) {
    return (
      <div
        className="h-screen w-full overflow-hidden relative flex items-center justify-center"
        style={{
          backgroundImage: `url(${BlobbiBackground})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '120px 120px',
        }}
      >
        <div className="absolute inset-0 bg-slate-950/40 dark:block hidden pointer-events-none" />
        <Card className="w-full max-w-md shadow-2xl z-10">
          <CardContent className="py-12 space-y-4 text-center">
            <div className="text-6xl mb-4">🥚</div>
            <h2 className="text-xl font-bold">No Blobbis Yet</h2>
            <p className="text-sm text-muted-foreground">
              You don't have any Blobbis yet. Adopt your first one!
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Adoption
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safe access to current Blobbi
  const currentBlobbi = blobbis[currentBlobbiIndex];
  if (!currentBlobbi) {
    console.error('[HomeScreen] currentBlobbi is undefined!', { currentBlobbiIndex, blobbisLength: blobbis.length });
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="py-12 space-y-4 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold">Blobbi Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The selected Blobbi could not be loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('[HomeScreen] currentBlobbi:', currentBlobbi);
  console.log('[HomeScreen] lifeStage:', currentBlobbi.lifeStage);

  const isEgg = currentBlobbi.lifeStage === 'egg';
  const isBaby = currentBlobbi.lifeStage === 'baby';
  const isAdult = currentBlobbi.lifeStage === 'adult';
  const hasMultipleBlobbis = blobbis.length > 1;

  // Room navigation
  const goToPreviousRoom = () => {
    const currentIndex = ROOMS.indexOf(currentRoom);
    const previousIndex = (currentIndex - 1 + ROOMS.length) % ROOMS.length;
    setCurrentRoom(ROOMS[previousIndex]);
  };

  const goToNextRoom = () => {
    const currentIndex = ROOMS.indexOf(currentRoom);
    const nextIndex = (currentIndex + 1) % ROOMS.length;
    setCurrentRoom(ROOMS[nextIndex]);
  };

  // Actions - Updated to use real interaction system
  const handleInteraction = async (action: BlobbiAction, itemId?: string) => {
    if (!currentBlobbi) return;

    const result = await interact({ action, itemId });

    if (result.success) {
      const itemName = itemId ? getItemDefinition(itemId)?.displayName : '';

      toast({
        title: 'Success!',
        description: `${currentBlobbi.name} ${action === 'feed' ? 'ate' : action === 'play' ? 'played with' : 'used'} ${itemName || 'interaction'}!`,
      });

      // Close actions panel after successful interaction
      setIsActionsOpen(false);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to perform interaction',
        variant: 'destructive',
      });
    }
  };

  // Handle opening item modal
  const handleItemClick = (itemId: string) => {
    const itemDef = getItemDefinition(itemId);
    if (itemDef) {
      setSelectedItem(itemDef);
      setIsItemModalOpen(true);
    }
  };

  // Handle using item from modal (with quantity support)
  const handleUseItemFromModal = async (itemId: string, quantity: number) => {
    if (!currentBlobbi) return;

    const itemDef = getItemDefinition(itemId);
    if (!itemDef) {
      toast({
        title: 'Error',
        description: 'Item not found',
        variant: 'destructive',
      });
      return;
    }

    // Determine action from item category
    const action: BlobbiAction =
      itemDef.category === 'food' ? 'feed' :
      itemDef.category === 'toy' ? 'play' :
      itemDef.category === 'medicine' ? 'medicine' :
      itemDef.category === 'hygiene' ? 'clean' : 'feed';

    // Use the new v2 system with quantity support
    const result = await interact({ action, itemId, itemQuantity: quantity });

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to use item',
        variant: 'destructive',
      });
      return;
    }

    // Success! Show toast
    toast({
      title: 'Success!',
      description: `${currentBlobbi.name} used ${quantity}x ${itemDef.displayName}!`,
    });

    // Close both modals
    setIsItemModalOpen(false);
    setIsInventoryOpen(false);
  };

  // Legacy action handler for non-item interactions
  const handleAction = (action: string, effect?: () => void) => {
    if (effect) effect();
    toast({
      title: `${action}!`,
      description: `You ${action.toLowerCase()} ${currentBlobbi.name}.`,
    });
  };

  // Helper functions for Growth Hub
  const getGrowthActionLabel = () => {
    if (isEgg) return 'Start Incubation';
    if (isBaby) return 'Start Evolution';
    return 'Already Evolved';
  };

  const handleGrowthAction = () => {
    if (isEgg) {
      handleAction('Started incubation');
    } else if (isBaby) {
      handleAction('Started evolution');
    } else {
      toast({
        title: 'Already Evolved',
        description: `${currentBlobbi.name} is already fully evolved!`,
      });
    }
  };

  const openTasksModal = () => {
    setIsActionsOpen(false);
    setIsTasksModalOpen(true);
  };



  // Get room title
  const getRoomTitle = () => {
    switch (currentRoom) {
      case 'MY_BLOBBI':
        return hasMultipleBlobbis ? 'My Blobbies' : 'My Blobbi';
      case 'GROWTH_HUB':
        return 'Growth Hub';
      case 'PLAYROOM':
        return 'Playroom';
      default:
        return '';
    }
  };

  // Render the appropriate graphic based on life stage
  const renderBlobbiGraphic = () => {
    switch (currentBlobbi.lifeStage) {
      case 'egg':
        return <EggGraphic blobbi={currentBlobbi} animated={true} />;
      case 'baby':
        return <BabyGraphic blobbi={currentBlobbi} animated={true} />;
      case 'adult':
        return <AdultGraphic blobbi={currentBlobbi} animated={true} />;
      default:
        return null;
    }
  };

  // Check if room is locked for eggs
  const isRoomLocked = () => {
    return isEgg && currentRoom !== 'MY_BLOBBI';
  };

  // Render actions based on room and life stage
  const renderActions = () => {
    if (isRoomLocked()) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground dark:text-[hsl(250,10%,65%)]">
            Room locked until your Blobbi hatches
          </p>
        </div>
      );
    }

    // MY_BLOBBI room
    if (currentRoom === 'MY_BLOBBI') {
      if (isEgg) {
        return (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleInteraction('warm')}
              disabled={isInteracting}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Thermometer className="h-5 w-5" />
              <span className="text-xs">Warm</span>
            </Button>
            <Button
              onClick={() => handleInteraction('sing')}
              disabled={isInteracting}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Music className="h-5 w-5" />
              <span className="text-xs">Sing</span>
            </Button>
            <Button
              onClick={() => setIsInventoryOpen(true)}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">Medicine</span>
            </Button>
            <Button
              onClick={() => setIsInventoryOpen(true)}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs">Clean</span>
            </Button>
          </div>
        );
      }

      if (isBaby) {
        return (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setIsInventoryOpen(true)}
              disabled={isInteracting}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Utensils className="h-5 w-5" />
              <span className="text-xs">Feed</span>
            </Button>
            <Button
              onClick={() => setIsInventoryOpen(true)}
              disabled={isInteracting}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs">Clean</span>
            </Button>
            <Button
              onClick={() => handleInteraction(currentBlobbi.isSleeping ? 'wake' : 'sleep')}
              disabled={isInteracting}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <Bed className="h-5 w-5" />
              <span className="text-xs">{currentBlobbi.isSleeping ? 'Wake' : 'Sleep'}</span>
            </Button>
            <Button
              onClick={() => setIsInventoryOpen(true)}
              disabled={isInteracting}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">Medicine</span>
            </Button>
          </div>
        );
      }

      if (isAdult) {
        return (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setIsInventoryOpen(true)}
              disabled={isInteracting}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Utensils className="h-5 w-5" />
              <span className="text-xs">Feed</span>
            </Button>
            <Button
              onClick={() => setIsInventoryOpen(true)}
              disabled={isInteracting}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs">Clean</span>
            </Button>
            <Button
              onClick={() => handleInteraction(currentBlobbi.isSleeping ? 'wake' : 'sleep')}
              disabled={isInteracting}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <Bed className="h-5 w-5" />
              <span className="text-xs">{currentBlobbi.isSleeping ? 'Wake' : 'Sleep'}</span>
            </Button>
            <Button
              onClick={() => setIsInventoryOpen(true)}
              disabled={isInteracting}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">Medicine</span>
            </Button>
            <Button
              disabled
              variant="outline"
              className="h-16 flex flex-col gap-1 col-span-2 relative"
            >
              <Baby className="h-5 w-5" />
              <span className="text-xs">Breed</span>
              <Badge variant="secondary" className="absolute top-1 right-1 text-[10px] px-1 py-0">
                Soon
              </Badge>
            </Button>
          </div>
        );
      }
    }

    // PLAYROOM
    if (currentRoom === 'PLAYROOM') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setIsInventoryOpen(true)}
            disabled={isInteracting}
            className="h-16 flex flex-col gap-1 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          >
            <Gamepad2 className="h-5 w-5" />
            <span className="text-xs">Toys</span>
          </Button>
          <Button
            onClick={() => handleAction('Started a game')}
            className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Zap className="h-5 w-5" />
            <span className="text-xs">Games</span>
          </Button>
        </div>
      );
    }

    // GROWTH_HUB - Only used if Actions panel is opened from My Blobbies room
    if (currentRoom === 'GROWTH_HUB') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleGrowthAction}
            className="h-16 flex flex-col gap-1 bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Target className="h-5 w-5" />
            <span className="text-xs">{getGrowthActionLabel()}</span>
          </Button>
          <Button
            onClick={openTasksModal}
            className="h-16 flex flex-col gap-1 bg-gradient-to-br from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs">Tasks</span>
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="h-screen w-full overflow-hidden relative"
      style={{
        backgroundImage: `url(${BlobbiBackground})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '120px 120px',
      }}
    >
      {/* Dark mode overlay for background pattern */}
      <div className="absolute inset-0 bg-slate-950/40 dark:block hidden pointer-events-none" />

      {/* Centered app shell */}
      <div className="h-full w-full max-w-4xl mx-auto flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-[hsl(250,35%,8%)] dark:via-[hsl(260,40%,12%)] dark:to-[hsl(250,35%,10%)] relative z-10">
        {/* HEADER - Row 1: Logo + Navigation */}
        <header className="flex-none bg-white/90 dark:bg-[hsl(250,30%,12%)]/90 backdrop-blur-sm border-b border-purple-100 dark:border-[hsl(250,25%,22%)]">
          <div className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">

            {/* Center: Blobbi logo */}
            <div className="flex-shrink-0">
              <img
                src={BlobbiLogo}
                alt="Blobbi"
                className="h-10 sm:h-16 w-auto"
              />
            </div>

            {/* Right: Shop, Theme Toggle + Menu */}
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsShopOpen(true)}
                      aria-label="Shop"
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shop</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast({ title: 'Settings', description: 'Settings coming soon' })}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {onLogout && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

      {/* STATUS DRAWER - Collapsible status row */}
      <div className="flex-none">
        {isStatusOpen ? (
          // Open state: compact floating strip with tab
          <div className="flex justify-center pt-2 pb-1">
            <div className="inline-flex flex-col items-center gap-1 bg-white/90 dark:bg-[hsl(250,30%,12%)]/90 backdrop-blur-sm rounded-2xl shadow-sm px-3 py-2 border border-purple-100/50 dark:border-[hsl(250,25%,22%)]/50">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <StatusCircle
                  icon={Heart}
                  value={currentBlobbi.stats.health}
                  label="Health"
                />
                <StatusCircle
                  icon={Utensils}
                  value={currentBlobbi.stats.hunger}
                  label="Hunger"
                />
                <StatusCircle
                  icon={Sparkles}
                  value={currentBlobbi.stats.happiness}
                  label="Happiness"
                />
                <StatusCircle
                  icon={Zap}
                  value={currentBlobbi.stats.energy}
                  label="Energy"
                />
                <StatusCircle
                  icon={Droplet}
                  value={currentBlobbi.stats.hygiene}
                  label="Hygiene"
                />
              </div>
              {/* Small tab handle */}
              <button
                type="button"
                onClick={() => setIsStatusOpen(false)}
                className="mt-1 inline-flex items-center gap-1 h-5 px-3 rounded-full bg-muted/80 dark:bg-[hsl(250,25%,18%)]/80 text-muted-foreground dark:text-[hsl(250,10%,65%)] hover:bg-muted dark:hover:bg-[hsl(250,25%,18%)] transition-colors text-[10px]"
              >
                <ChevronUp className="h-3 w-3" />
                <span>Hide status</span>
              </button>
            </div>
          </div>
        ) : (
          // Closed state: small tab only
          <div className="flex justify-center pt-1 pb-1">
            <button
              type="button"
              onClick={() => setIsStatusOpen(true)}
              className="inline-flex items-center gap-1 h-5 px-3 rounded-full bg-white/90 dark:bg-[hsl(250,30%,12%)]/90 backdrop-blur-sm shadow-sm border border-purple-100/50 dark:border-[hsl(250,25%,22%)]/50 text-muted-foreground dark:text-[hsl(250,10%,65%)] hover:bg-muted/80 dark:hover:bg-[hsl(250,25%,18%)]/80 transition-colors text-[10px]"
            >
              <ChevronDown className="h-3 w-3" />
              <span>Show status</span>
            </button>
          </div>
        )}
      </div>

      {/* Blobbi name and small badges */}
      <div className="flex-none mb-2 text-center px-4">
        <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-[hsl(250,15%,95%)]">{currentBlobbi.name}</h2>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="capitalize text-xs">
            {currentBlobbi.lifeStage}
          </Badge>
          {currentBlobbi.evolutionForm && (
            <Badge variant="outline" className="capitalize text-xs">
              {currentBlobbi.evolutionForm}
            </Badge>
          )}
        </div>
      </div>

      {/* MAIN AREA - Blobbi graphic + room-specific content */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        {isRoomLocked() ? (
          // Locked room for eggs
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-[hsl(250,15%,95%)]">Room Locked</h3>
            <p className="text-muted-foreground dark:text-[hsl(250,10%,65%)]">
              This room will unlock when your Blobbi hatches!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-md px-4">
            {/* Blobbi graphic */}
            <div className="scale-125">
              {renderBlobbiGraphic()}
            </div>
          </div>
        )}
      </main>

      {/* ROOM TITLE ROW */}
      <div className="flex-none">
        <div className="w-full max-w-4xl mx-auto px-4 py-2">
          <h2 className="text-lg font-semibold text-center text-slate-900 dark:text-[hsl(250,15%,95%)]">
            {getRoomTitle()}
          </h2>
        </div>
      </div>

      {/* FOOTER - Fixed 3-button navigation with arrows */}
      <div className="flex-none bg-white dark:bg-[hsl(250,30%,12%)] border-t-2 border-purple-200 dark:border-[hsl(250,25%,22%)]">
        <div className="w-full max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousRoom}
            className="rounded-full h-12 w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Fixed 3-button center layout */}
          <div className="flex items-center justify-around flex-1 gap-2">
            {/* Missions */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMissionsModalOpen(true)}
                className="rounded-full h-12 w-12"
              >
                <ClipboardList className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground">Missions</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="rounded-full h-12 w-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground">Actions</span>
            </div>

            {/* Inventory */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsActionsOpen(false);
                  setIsInventoryOpen(true);
                }}
                className="rounded-full h-12 w-12"
              >
                <Backpack className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground">Inventory</span>
            </div>
          </div>

          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextRoom}
            className="rounded-full h-12 w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* BACKDROP - Semi-transparent overlay for Actions drawer */}
      {isActionsOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-30 transition-opacity duration-300 ease-in-out"
          onClick={() => setIsActionsOpen(false)}
        />
      )}

      {/* ACTIONS PANEL - Slide up drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 transition-transform duration-300 ease-in-out",
          isActionsOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-white/95 dark:bg-[hsl(250,30%,12%)]/95 backdrop-blur-sm border-t-2 border-purple-200 dark:border-[hsl(250,25%,22%)] rounded-t-2xl shadow-2xl pt-10 pb-6 px-8 relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsActionsOpen(false)}
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>

          {renderActions()}
        </div>
      </div>

      {/* INVENTORY MODAL */}
      <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <DialogContent className="w-[94vw] max-w-2xl max-h-[80vh] flex flex-col p-0 rounded-2xl gap-0">
          {/* Fixed header */}
          <DialogHeader className="flex-none px-6 py-4 border-b border-purple-100 dark:border-[hsl(250,25%,22%)]">
            <DialogTitle>Inventory</DialogTitle>
          </DialogHeader>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="all" className="flex flex-col h-full">
              {/* Fixed tabs - 2 rows on mobile, single row on desktop */}
              <div className="flex-none px-4 pt-4 pb-3 border-b border-purple-100/50 dark:border-[hsl(250,25%,22%)]/50">
                <TabsList className="grid grid-cols-3 gap-2 h-auto bg-transparent p-0 sm:flex sm:flex-wrap sm:justify-center">
                  <TabsTrigger value="all" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="food" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Food
                  </TabsTrigger>
                  <TabsTrigger value="toy" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Toys
                  </TabsTrigger>
                  <TabsTrigger value="medicine" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Medicine
                  </TabsTrigger>
                  <TabsTrigger value="hygiene" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Hygiene
                  </TabsTrigger>
                  <TabsTrigger value="accessory" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Accessories
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* All Items Tab */}
              <TabsContent value="all" className="px-4 py-4 mt-0 data-[state=inactive]:hidden">
                {inventoryLoading ? (
                  <p className="text-sm text-muted-foreground">Loading inventory...</p>
                ) : availableItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You don&apos;t have any items yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableItems.map((item) => {
                      const itemDef = getItemDefinition(item.id);
                      if (!itemDef) return null;

                      return (
                        <ItemCard
                          key={item.id}
                          item={itemDef}
                          quantity={item.quantity}
                          blobbiStage={currentBlobbi.lifeStage}
                          onClick={() => handleItemClick(item.id)}
                          disabled={isInteracting}
                        />
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Category-specific tabs */}
              {(['food', 'toy', 'medicine', 'hygiene', 'accessory'] as BlobbiItemCategory[]).map((category) => (
                <TabsContent key={category} value={category} className="px-4 py-4 mt-0 data-[state=inactive]:hidden">
                  {inventoryLoading ? (
                    <p className="text-sm text-muted-foreground">Loading inventory...</p>
                  ) : (() => {
                    const categoryItems = availableItems.filter((item) => {
                      const itemDef = getItemDefinition(item.id);
                      return itemDef?.category === category;
                    });

                    if (categoryItems.length === 0) {
                      return <p className="text-sm text-muted-foreground">No {category} items yet.</p>;
                    }

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {categoryItems.map((item) => {
                          const itemDef = getItemDefinition(item.id);
                          if (!itemDef) return null;

                          return (
                            <ItemCard
                              key={item.id}
                              item={itemDef}
                              quantity={item.quantity}
                              blobbiStage={currentBlobbi.lifeStage}
                              onClick={() => handleItemClick(item.id)}
                              disabled={isInteracting}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* MISSIONS MODAL */}
      <Dialog open={isMissionsModalOpen} onOpenChange={setIsMissionsModalOpen}>
        <DialogContent className="sm:max-w-md w-[90vw]">
          <DialogHeader>
            <DialogTitle>Daily Missions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Placeholder content for now */}
            <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
              <span className="text-sm font-medium">Feed your Blobbi 3 times</span>
              <span className="text-xs text-muted-foreground">0 / 3</span>
            </div>
            <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
              <span className="text-sm font-medium">Play in the Playroom</span>
              <span className="text-xs text-muted-foreground">Not started</span>
            </div>
            <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
              <span className="text-sm font-medium">Keep your Blobbi happy</span>
              <span className="text-xs text-muted-foreground">In progress</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TASKS MODAL */}
      <Dialog open={isTasksModalOpen} onOpenChange={setIsTasksModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Growth Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isAdult ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  Your Blobbi is already fully evolved! No more growth tasks for now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {isEgg ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Keep egg warm</span>
                      <span className="text-sm text-muted-foreground">50%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Sing to your egg</span>
                      <span className="text-sm text-muted-foreground">20%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Check egg health</span>
                      <span className="text-sm text-muted-foreground">75%</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Feed your Blobbi</span>
                      <span className="text-sm text-muted-foreground">80%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Play together</span>
                      <span className="text-sm text-muted-foreground">60%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Teach new tricks</span>
                      <span className="text-sm text-muted-foreground">30%</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

        {/* CURRENT BLOBBI BUTTON - Only shown in MY_BLOBBI room */}
        {currentRoom === 'MY_BLOBBI' && currentBlobbi && (
          <div className="pointer-events-none absolute bottom-24 inset-x-0 flex justify-end px-4">
            <CurrentBlobbiButton
              blobbi={currentBlobbi}
              onClick={() => setIsBlobbiSelectorOpen(true)}
            />
          </div>
        )}

        {/* BLOBBI SELECTOR MODAL */}
        <Dialog open={isBlobbiSelectorOpen} onOpenChange={setIsBlobbiSelectorOpen}>
          <DialogContent className="w-[94vw] max-w-md max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>My Blobbies</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {blobbis.map((blobbi, index) => (
                <Button
                  key={blobbi.id}
                  variant={index === currentBlobbiIndex ? 'default' : 'outline'}
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => {
                    setCurrentBlobbiIndex(index);
                    setIsBlobbiSelectorOpen(false);
                  }}
                >
                  <div className="flex-shrink-0">
                    <MiniBlobbiAvatar blobbi={blobbi} />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium truncate max-w-[160px]">
                      {blobbi.name}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {blobbi.lifeStage}
                      {blobbi.evolutionForm && ` • ${blobbi.evolutionForm}`}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* ITEM USE MODAL */}
        <ItemUseModal
          open={isItemModalOpen}
          onOpenChange={setIsItemModalOpen}
          item={selectedItem}
          quantity={selectedItem ? (availableItems.find(i => i.id === selectedItem.id)?.quantity || 0) : 0}
          blobbiStage={currentBlobbi.lifeStage}
          onUseItem={handleUseItemFromModal}
          isLoading={isInteracting}
        />

        {/* SHOP MODAL */}
        <Dialog open={isShopOpen} onOpenChange={setIsShopOpen}>
          <DialogContent className="w-[94vw] max-w-2xl max-h-[80vh] flex flex-col p-0 rounded-2xl gap-0">
            {/* Fixed header */}
            <DialogHeader className="flex-none px-6 py-4 border-b border-purple-100 dark:border-[hsl(250,25%,22%)]">
              <DialogTitle>Shop</DialogTitle>
            </DialogHeader>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="all" className="flex flex-col h-full">
                {/* Fixed tabs - 2 rows on mobile, single row on desktop */}
                <div className="flex-none px-4 pt-4 pb-3 border-b border-purple-100/50 dark:border-[hsl(250,25%,22%)]/50">
                  <TabsList className="grid grid-cols-3 gap-2 h-auto bg-transparent p-0 sm:flex sm:flex-wrap sm:justify-center">
                    <TabsTrigger value="all" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="food" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Food
                    </TabsTrigger>
                    <TabsTrigger value="toy" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Toys
                    </TabsTrigger>
                    <TabsTrigger value="medicine" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Medicine
                    </TabsTrigger>
                    <TabsTrigger value="hygiene" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Hygiene
                    </TabsTrigger>
                    <TabsTrigger value="accessory" className="text-xs px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Accessories
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* All Items Tab */}
                <TabsContent value="all" className="px-4 py-4 mt-0 data-[state=inactive]:hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {allItems.map((item) => {
                      const ownedQuantity = availableItems.find(i => i.id === item.id)?.quantity || 0;

                      return (
                        <Button
                          key={item.id}
                          onClick={() => {
                            toast({
                              title: 'Shop',
                              description: `Buying ${item.displayName} is not implemented yet.`,
                            });
                          }}
                          variant="outline"
                          className="h-20 flex flex-col gap-1 relative"
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <span className="text-xs truncate max-w-full px-1">{item.displayName}</span>

                          {/* Price badge (left-top) */}
                          <Badge variant="secondary" className="absolute top-1 left-1 text-[10px] px-1 py-0">
                            💰 {item.price}
                          </Badge>

                          {/* Owned quantity badge (right-top) - only if owned */}
                          {ownedQuantity > 0 && (
                            <Badge variant="default" className="absolute top-1 right-1 text-[10px] px-1 py-0">
                              {ownedQuantity}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Category-specific tabs */}
                {(['food', 'toy', 'medicine', 'hygiene', 'accessory'] as BlobbiItemCategory[]).map((category) => (
                  <TabsContent key={category} value={category} className="px-4 py-4 mt-0 data-[state=inactive]:hidden">
                    {(() => {
                      const categoryItems = allItems.filter(item => item.category === category);

                      if (categoryItems.length === 0) {
                        return <p className="text-sm text-muted-foreground">No {category} items available.</p>;
                      }

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {categoryItems.map((item) => {
                            const ownedQuantity = availableItems.find(i => i.id === item.id)?.quantity || 0;

                            return (
                              <Button
                                key={item.id}
                                onClick={() => {
                                  toast({
                                    title: 'Shop',
                                    description: `Buying ${item.displayName} is not implemented yet.`,
                                  });
                                }}
                                variant="outline"
                                className="h-20 flex flex-col gap-1 relative"
                              >
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-xs truncate max-w-full px-1">{item.displayName}</span>

                                {/* Price badge (left-top) */}
                                <Badge variant="secondary" className="absolute top-1 left-1 text-[10px] px-1 py-0">
                                  💰 {item.price}
                                </Badge>

                                {/* Owned quantity badge (right-top) - only if owned */}
                                {ownedQuantity > 0 && (
                                  <Badge variant="default" className="absolute top-1 right-1 text-[10px] px-1 py-0">
                                    {ownedQuantity}
                                  </Badge>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
