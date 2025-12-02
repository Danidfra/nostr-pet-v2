import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Blobbi } from '@/types/blobbi';
import { EggGraphic } from '@/components/blobbi/EggGraphic';
import { BabyGraphic } from '@/components/blobbi/BabyGraphic';
import { AdultGraphic } from '@/components/blobbi/AdultGraphic';
import { StatusCircle } from '@/components/blobbi/StatusCircle';
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
import { useToast } from '@/hooks/useToast';
import BlobbiBackground from '@/assets/blobbi-background.png';
import BlobbiLogo from '@/assets/blobbilogo.svg';

interface HomeScreenProps {
  blobbis: Blobbi[];
  userName: string;
  onLogout?: () => void;
}

type Room = 'MY_BLOBBI' | 'GROWTH_HUB' | 'PLAYROOM';

const ROOMS: Room[] = ['MY_BLOBBI', 'GROWTH_HUB', 'PLAYROOM'];

export const HomeScreen: React.FC<HomeScreenProps> = ({ blobbis, onLogout }) => {
  const [currentRoom, setCurrentRoom] = useState<Room>('MY_BLOBBI');
  const [currentBlobbiIndex] = useState(0);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const { toast } = useToast();

  const currentBlobbi = blobbis[currentBlobbiIndex];
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

  // Actions
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
              onClick={() => handleAction('Warmed the egg')}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Thermometer className="h-5 w-5" />
              <span className="text-xs">Warm</span>
            </Button>
            <Button
              onClick={() => handleAction('Sang to the egg')}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Music className="h-5 w-5" />
              <span className="text-xs">Sing</span>
            </Button>
            <Button
              onClick={() => handleAction('Gave medicine')}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">Medicine</span>
            </Button>
            <Button
              onClick={() => handleAction('Cleaned')}
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
              onClick={() => handleAction('Fed')}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Utensils className="h-5 w-5" />
              <span className="text-xs">Feed</span>
            </Button>
            <Button
              onClick={() => handleAction('Cleaned')}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs">Clean</span>
            </Button>
            <Button
              onClick={() => handleAction(currentBlobbi.isSleeping ? 'Woke up' : 'Put to sleep')}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <Bed className="h-5 w-5" />
              <span className="text-xs">Sleep</span>
            </Button>
            <Button
              onClick={() => handleAction('Gave medicine')}
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
              onClick={() => handleAction('Fed')}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Utensils className="h-5 w-5" />
              <span className="text-xs">Feed</span>
            </Button>
            <Button
              onClick={() => handleAction('Cleaned')}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs">Clean</span>
            </Button>
            <Button
              onClick={() => handleAction(currentBlobbi.isSleeping ? 'Woke up' : 'Put to sleep')}
              className="h-16 flex flex-col gap-1 bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <Bed className="h-5 w-5" />
              <span className="text-xs">Sleep</span>
            </Button>
            <Button
              onClick={() => handleAction('Gave medicine')}
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
            onClick={() => handleAction('Played with toys')}
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

            {/* Right: Theme Toggle + Menu */}
            <div className="flex items-center gap-1">
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
                  <DropdownMenuItem onClick={() => toast({ title: 'Shop', description: 'Shop coming soon' })}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Shop
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
        <DialogContent className="w-[94vw] max-w-2xl max-h-[85vh] h-auto flex flex-col p-0 rounded-2xl sm:w-full sm:max-w-3xl sm:max-h-[80vh]">
          {/* Inventory header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-100 dark:border-[hsl(250,25%,22%)]">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[hsl(250,15%,95%)]">Inventory</h2>
          </div>

          {/* Inventory content */}
          <div className="flex-1 flex flex-col overflow-hidden pb-10">
            <Tabs defaultValue="all" className="flex-1 flex flex-col">
              <TabsList className="flex flex-wrap gap-2 px-4 pt-3">
                <TabsTrigger value="all" className="text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  All Items
                </TabsTrigger>
                <TabsTrigger value="food" className="text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  Food
                </TabsTrigger>
                <TabsTrigger value="toys" className="text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  Toys
                </TabsTrigger>
                <TabsTrigger value="medicine" className="text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  Medicine
                </TabsTrigger>
                <TabsTrigger value="hygiene" className="text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  Hygiene
                </TabsTrigger>
                <TabsTrigger value="accessories" className="text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  Accessories
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 overflow-y-auto px-4 py-3 mt-0 min-h-[180px] sm:min-h-[220px]">
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any items yet.
                </p>
              </TabsContent>
              <TabsContent value="food" className="flex-1 overflow-y-auto px-4 py-3 mt-0 min-h-[180px] sm:min-h-[220px]">
                <p className="text-sm text-muted-foreground">
                  No food items yet.
                </p>
              </TabsContent>
              <TabsContent value="toys" className="flex-1 overflow-y-auto px-4 py-3 mt-0 min-h-[180px] sm:min-h-[220px]">
                <p className="text-sm text-muted-foreground">
                  No toys yet.
                </p>
              </TabsContent>
              <TabsContent value="medicine" className="flex-1 overflow-y-auto px-4 py-3 mt-0 min-h-[180px] sm:min-h-[220px]">
                <p className="text-sm text-muted-foreground">
                  No medicine items yet.
                </p>
              </TabsContent>
              <TabsContent value="hygiene" className="flex-1 overflow-y-auto px-4 py-3 mt-0 min-h-[180px] sm:min-h-[220px]">
                <p className="text-sm text-muted-foreground">
                  No hygiene items yet.
                </p>
              </TabsContent>
              <TabsContent value="accessories" className="flex-1 overflow-y-auto px-4 py-3 mt-0 min-h-[180px] sm:min-h-[220px]">
                <p className="text-sm text-muted-foreground">
                  No accessories yet.
                </p>
              </TabsContent>
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
      </div>
    </div>
  );
};
