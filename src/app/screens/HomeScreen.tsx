import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Blobbi } from '@/types/blobbi';
import { EggGraphic } from '@/components/blobbi/EggGraphic';
import { BabyGraphic } from '@/components/blobbi/BabyGraphic';
import { AdultGraphic } from '@/components/blobbi/AdultGraphic';
import { StatusCircle } from '@/components/blobbi/StatusCircle';
import {
  Heart,
  Utensils,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  Settings,
  ShoppingCart,
  Info,
  Thermometer,
  Play,
  Target,
  TrendingUp,
  Lightbulb,
  Smile,
  Dices,
  Droplet,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface HomeScreenProps {
  blobbis: Blobbi[];
  userName: string;
  onLogout?: () => void;
}

type Room = 'MY_BLOBBI' | 'GROWTH_HUB' | 'PLAYROOM';

const ROOMS: Room[] = ['MY_BLOBBI', 'GROWTH_HUB', 'PLAYROOM'];

export const HomeScreen: React.FC<HomeScreenProps> = ({ blobbis, userName }) => {
  const [currentRoom, setCurrentRoom] = useState<Room>('MY_BLOBBI');
  const [currentBlobbiIndex, setCurrentBlobbiIndex] = useState(0);
  const [eggTemperature, setEggTemperature] = useState(65);
  const { toast } = useToast();

  const currentBlobbi = blobbis[currentBlobbiIndex];
  const isEgg = currentBlobbi.lifeStage === 'egg';
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

  // Blobbi selector (currently not shown in UI, but kept for future use)
  const _nextBlobbi = () => {
    setCurrentBlobbiIndex((prev) => (prev + 1) % blobbis.length);
  };

  const _prevBlobbi = () => {
    setCurrentBlobbiIndex((prev) => (prev - 1 + blobbis.length) % blobbis.length);
  };

  // Actions
  const handleAction = (action: string, effect?: () => void) => {
    if (effect) effect();
    toast({
      title: `${action}!`,
      description: `You ${action.toLowerCase()} ${currentBlobbi.name}.`,
    });
  };

  const warmEgg = () => {
    setEggTemperature((prev) => Math.min(100, prev + 10));
    handleAction('Warmed the egg');
  };

  const shakeEgg = () => {
    handleAction('Shook the egg');
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
        return <EggGraphic blobbi={{ ...currentBlobbi, eggTemperature }} animated={true} />;
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-hidden">
      {/* HEADER */}
      <header className="flex-none bg-white/80 backdrop-blur-sm border-b border-purple-100">
        <div className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: App name and user */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Blobbi
            </h1>
            <p className="text-xs text-muted-foreground">{userName}</p>
          </div>

          {/* Center: Status circles - DESKTOP ONLY */}
          <div className="hidden md:flex items-center gap-2 justify-center">
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
              icon={Smile}
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

          {/* Right: Settings and Shop */}
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => handleAction('Settings')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleAction('Shop')}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* STATUS ROW - MOBILE ONLY */}
      <div className="flex-none md:hidden bg-white/60 backdrop-blur-sm border-b border-purple-100 py-2">
        <div className="w-full px-4 flex items-center justify-center gap-2">
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
            icon={Smile}
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
      </div>

      {/* MAIN AREA - ONLY Blobbi graphic centered */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        {isRoomLocked() ? (
          // Locked room for eggs
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold">Room Locked</h3>
            <p className="text-muted-foreground">
              This room will unlock when your Blobbi hatches!
            </p>
          </div>
        ) : (
          <div className="scale-125">
            {renderBlobbiGraphic()}
          </div>
        )}
      </main>

      {/* ROOM NAVIGATION BAR */}
      <div className="flex-none bg-white/80 backdrop-blur-sm border-t border-purple-100">
        <div className="w-full max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousRoom}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-semibold text-lg">{getRoomTitle()}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextRoom}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* FOOTER - ACTIONS (changes based on room) */}
      <footer className="flex-none bg-white border-t-2 border-purple-200 shadow-lg">
        <div className="w-full max-w-md mx-auto px-4 py-4">
          {currentRoom === 'MY_BLOBBI' && isEgg && (
            // Egg actions
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={warmEgg}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Thermometer className="h-5 w-5" />
                <span className="text-xs">Warm Egg</span>
              </Button>
              <Button
                onClick={shakeEgg}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-xs">Shake Egg</span>
              </Button>
              <Button
                onClick={() => handleAction('Check Egg')}
                variant="outline"
                className="h-16 flex flex-col gap-1"
              >
                <Info className="h-5 w-5" />
                <span className="text-xs">Check</span>
              </Button>
              <Button
                onClick={() => handleAction('Sing to Egg')}
                variant="outline"
                className="h-16 flex flex-col gap-1"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs">Sing</span>
              </Button>
            </div>
          )}

          {currentRoom === 'MY_BLOBBI' && !isEgg && (
            // Regular Blobbi actions
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleAction('Feed')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Utensils className="h-5 w-5" />
                <span className="text-xs">Feed</span>
              </Button>
              <Button
                onClick={() => handleAction('Clean')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-xs">Clean</span>
              </Button>
              <Button
                onClick={() => handleAction(currentBlobbi.isSleeping ? 'Wake' : 'Sleep')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Zap className="h-5 w-5" />
                <span className="text-xs">{currentBlobbi.isSleeping ? 'Wake' : 'Sleep'}</span>
              </Button>
              <Button
                onClick={() => handleAction('Medicine')}
                variant="outline"
                className="h-16 flex flex-col gap-1"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs">Medicine</span>
              </Button>
              <Button
                onClick={() => handleAction('Info')}
                variant="outline"
                className="h-16 flex flex-col gap-1 col-span-2"
              >
                <Info className="h-5 w-5" />
                <span className="text-xs">Blobbi Info</span>
              </Button>
            </div>
          )}

          {currentRoom === 'GROWTH_HUB' && !isRoomLocked() && (
            // Growth Hub actions
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleAction('Start Growth Activity')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Target className="h-5 w-5" />
                <span className="text-xs">Start Activity</span>
              </Button>
              <Button
                onClick={() => handleAction('View Progress')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">View Progress</span>
              </Button>
              <Button
                onClick={() => handleAction('Random Prompt', () => {
                  const prompts = [
                    'What made you smile today?',
                    'Name one thing you\'re grateful for',
                    'What\'s your goal for tomorrow?'
                  ];
                  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                  toast({
                    title: '💭 Growth Prompt',
                    description: randomPrompt,
                  });
                })}
                variant="outline"
                className="h-16 flex flex-col gap-1 col-span-2"
              >
                <Lightbulb className="h-5 w-5" />
                <span className="text-xs">Random Prompt</span>
              </Button>
            </div>
          )}

          {currentRoom === 'PLAYROOM' && !isRoomLocked() && (
            // Playroom actions
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleAction('Play Mini-Game')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Play className="h-5 w-5" />
                <span className="text-xs">Mini-Game</span>
              </Button>
              <Button
                onClick={() => handleAction('Throw Ball')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                <Dices className="h-5 w-5" />
                <span className="text-xs">Throw Ball</span>
              </Button>
              <Button
                onClick={() => handleAction('Tell Joke', () => {
                  const jokes = [
                    '🤣 Why don\'t eggs tell jokes? They\'d crack up!',
                    '😄 What do you call a Blobbi with a crown? Royal-ty!',
                    '😂 Why did the Blobbi cross the road? To get to the other slide!'
                  ];
                  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                  toast({
                    title: 'Joke Time!',
                    description: randomJoke,
                  });
                })}
                variant="outline"
                className="h-16 flex flex-col gap-1 col-span-2"
              >
                <Smile className="h-5 w-5" />
                <span className="text-xs">Tell Joke</span>
              </Button>
            </div>
          )}

          {isRoomLocked() && (
            // Locked room footer
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Room locked until your Blobbi hatches
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
