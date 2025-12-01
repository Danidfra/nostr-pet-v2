import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Blobbi } from '@/types/blobbi';
import { EggGraphic } from '@/components/blobbi/EggGraphic';
import { BabyGraphic } from '@/components/blobbi/BabyGraphic';
import { AdultGraphic } from '@/components/blobbi/AdultGraphic';
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
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface HomeScreenProps {
  blobbis: Blobbi[];
  userName: string;
  onLogout: () => void;
}

type Room = 'MY_BLOBBI' | 'GROWTH_HUB' | 'PLAYROOM';

const ROOMS: Room[] = ['MY_BLOBBI', 'GROWTH_HUB', 'PLAYROOM'];

export const HomeScreen: React.FC<HomeScreenProps> = ({ blobbis, userName, onLogout }) => {
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

  // Blobbi selector
  const nextBlobbi = () => {
    setCurrentBlobbiIndex((prev) => (prev + 1) % blobbis.length);
  };

  const prevBlobbi = () => {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Blobbi
            </h1>
            <p className="text-xs text-muted-foreground">{userName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleAction('Settings')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleAction('Shop')}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN AREA - Blobbi in center */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* Room background card */}
        <Card className="w-full max-w-md shadow-2xl border-2 border-purple-100 overflow-hidden">
          <CardContent className="p-6">
            {/* Blobbi info badges */}
            <div className="flex justify-center gap-2 mb-4">
              <Badge variant="secondary" className="capitalize">
                {currentBlobbi.lifeStage}
              </Badge>
              {currentBlobbi.evolutionForm && (
                <Badge variant="outline" className="capitalize">
                  {currentBlobbi.evolutionForm}
                </Badge>
              )}
            </div>

            {/* Blobbi name */}
            <h2 className="text-2xl font-bold text-center mb-2">{currentBlobbi.name}</h2>

            {/* Multiple Blobbis selector */}
            {hasMultipleBlobbis && currentRoom === 'MY_BLOBBI' && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevBlobbi}
                  className="rounded-full h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentBlobbiIndex + 1} of {blobbis.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextBlobbi}
                  className="rounded-full h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ROOM CONTENT */}
            <div className="min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
              {isRoomLocked() ? (
                // Locked room for eggs
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold">Room Locked</h3>
                  <p className="text-muted-foreground">
                    This room will unlock when your Blobbi hatches!
                  </p>
                  {renderBlobbiGraphic()}
                </div>
              ) : (
                <>
                  {/* Blobbi graphic - always centered */}
                  <div className="mb-6">
                    {renderBlobbiGraphic()}
                  </div>

                  {/* Room-specific content */}
                  {currentRoom === 'MY_BLOBBI' && isEgg && (
                    // Egg incubation panel
                    <div className="w-full space-y-4">
                      <Card className="bg-white/50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium">Temperature</span>
                            </div>
                            <Badge variant={eggTemperature > 70 ? 'default' : 'secondary'}>
                              {eggTemperature}°
                            </Badge>
                          </div>
                          <div className="w-full bg-gradient-to-r from-blue-200 via-yellow-200 to-red-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-orange-500 h-full transition-all duration-300"
                              style={{ width: `${eggTemperature}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Keep your egg warm and cared for to help it hatch!
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {currentRoom === 'GROWTH_HUB' && !isEgg && (
                    // Growth Hub content
                    <div className="w-full space-y-3">
                      <Card className="bg-white/50 hover:bg-white/70 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Target className="h-8 w-8 text-purple-500" />
                          <div>
                            <h4 className="font-semibold">Daily Habit</h4>
                            <p className="text-xs text-muted-foreground">Build healthy routines</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/50 hover:bg-white/70 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <TrendingUp className="h-8 w-8 text-blue-500" />
                          <div>
                            <h4 className="font-semibold">Goals</h4>
                            <p className="text-xs text-muted-foreground">Track your progress</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/50 hover:bg-white/70 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Lightbulb className="h-8 w-8 text-yellow-500" />
                          <div>
                            <h4 className="font-semibold">Mini Quests</h4>
                            <p className="text-xs text-muted-foreground">Complete challenges</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {currentRoom === 'PLAYROOM' && !isEgg && (
                    // Playroom content
                    <div className="w-full space-y-3">
                      <Card className="bg-white/50 hover:bg-white/70 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Play className="h-8 w-8 text-green-500" />
                          <div>
                            <h4 className="font-semibold">Mini Games</h4>
                            <p className="text-xs text-muted-foreground">Play fun games together</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/50 hover:bg-white/70 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Dices className="h-8 w-8 text-pink-500" />
                          <div>
                            <h4 className="font-semibold">Throw a Ball</h4>
                            <p className="text-xs text-muted-foreground">Interactive play time</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/50 hover:bg-white/70 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Smile className="h-8 w-8 text-orange-500" />
                          <div>
                            <h4 className="font-semibold">Tell a Joke</h4>
                            <p className="text-xs text-muted-foreground">Make your Blobbi laugh</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ROOM NAVIGATION BAR */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-purple-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-md">
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
      <footer className="bg-white border-t-2 border-purple-200 shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-md">
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
