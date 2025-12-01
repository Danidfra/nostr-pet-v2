import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Blobbi } from '@/types/blobbi';
import { EggGraphic } from '@/components/blobbi/EggGraphic';
import { BabyGraphic } from '@/components/blobbi/BabyGraphic';
import { AdultGraphic } from '@/components/blobbi/AdultGraphic';
import { 
  Heart, 
  Utensils, 
  Smile, 
  Zap, 
  Sparkles,
  ShoppingCart,
  Package,
  Camera,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface HomeScreenProps {
  blobbis: Blobbi[];
  userName: string;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ blobbis, userName, onLogout }) => {
  const [currentBlobbiIndex, setCurrentBlobbiIndex] = useState(0);
  const { toast } = useToast();
  
  const currentBlobbi = blobbis[currentBlobbiIndex];

  const handleAction = (action: string) => {
    toast({
      title: `${action}!`,
      description: `You ${action.toLowerCase()} ${currentBlobbi.name}. (Mock action - no real effect)`,
    });
  };

  const nextBlobbi = () => {
    setCurrentBlobbiIndex((prev) => (prev + 1) % blobbis.length);
  };

  const prevBlobbi = () => {
    setCurrentBlobbiIndex((prev) => (prev - 1 + blobbis.length) % blobbis.length);
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

  const getLifeStageEmoji = () => {
    switch (currentBlobbi.lifeStage) {
      case 'egg': return '🥚';
      case 'baby': return '🐣';
      case 'adult': return '✨';
      default: return '🌟';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Blobbi
            </h1>
            <p className="text-sm text-muted-foreground">Welcome, {userName}!</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Blobbi Selector */}
        {blobbis.length > 1 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={prevBlobbi}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Blobbi {currentBlobbiIndex + 1} of {blobbis.length}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={nextBlobbi}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Blobbi Display Card */}
        <Card className="mb-6 shadow-xl border-2 border-purple-100">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">{getLifeStageEmoji()}</span>
              <CardTitle className="text-3xl font-bold">{currentBlobbi.name}</CardTitle>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {currentBlobbi.lifeStage}
              </Badge>
              {currentBlobbi.evolutionForm && (
                <Badge variant="outline" className="capitalize">
                  {currentBlobbi.evolutionForm}
                </Badge>
              )}
              <Badge variant="outline">
                Level {Math.floor(currentBlobbi.experience / 100)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Blobbi Graphic */}
            <div className="flex justify-center py-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg mb-6">
              {renderBlobbiGraphic()}
            </div>

            {/* Stats */}
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Health</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentBlobbi.stats.health}%</span>
                </div>
                <Progress value={currentBlobbi.stats.health} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Hunger</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentBlobbi.stats.hunger}%</span>
                </div>
                <Progress value={currentBlobbi.stats.hunger} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Happiness</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentBlobbi.stats.happiness}%</span>
                </div>
                <Progress value={currentBlobbi.stats.happiness} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Energy</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentBlobbi.stats.energy}%</span>
                </div>
                <Progress value={currentBlobbi.stats.energy} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Hygiene</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentBlobbi.stats.hygiene}%</span>
                </div>
                <Progress value={currentBlobbi.stats.hygiene} className="h-2" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                onClick={() => handleAction('Feed')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Utensils className="h-5 w-5" />
                <span className="text-xs">Feed</span>
              </Button>
              <Button
                onClick={() => handleAction('Play')}
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Smile className="h-5 w-5" />
                <span className="text-xs">Play</span>
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
                className="h-16 flex flex-col gap-1 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs">Medicine</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={() => handleAction('Shop')}
            className="h-16 flex flex-col gap-1"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs">Shop</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction('Inventory')}
            className="h-16 flex flex-col gap-1"
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Inventory</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction('Camera')}
            className="h-16 flex flex-col gap-1"
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">Camera</span>
          </Button>
        </div>
      </main>
    </div>
  );
};
