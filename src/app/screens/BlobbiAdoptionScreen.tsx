import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EggGraphic } from '@/components/blobbi/EggGraphic';
import { Blobbi } from '@/types/blobbi';

interface BlobbiAdoptionScreenProps {
  onAdopt: (blobbiName: string) => void;
}

export const BlobbiAdoptionScreen: React.FC<BlobbiAdoptionScreenProps> = ({ onAdopt }) => {
  const [blobbiName, setBlobbiName] = useState('');

  // Preview egg
  const previewEgg: Blobbi = {
    id: 'preview-egg',
    ownerPubkey: 'preview',
    name: 'Preview',
    birthTime: Date.now(),
    lastInteraction: Date.now(),
    lifeStage: 'egg',
    state: 'active',
    stats: {
      health: 100,
      hunger: 100,
      happiness: 100,
      energy: 100,
      hygiene: 100,
    },
    experience: 0,
    coins: 0,
    generation: 1,
    breedingReady: false,
    careStreak: 0,
    baseColor: '#99ccff',
    secondaryColor: '#ccffcc',
    specialMark: 'rune_top',
    eggTemperature: 50,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blobbiName.trim()) {
      onAdopt(blobbiName.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-[hsl(250,35%,8%)] dark:via-[hsl(260,40%,12%)] dark:to-[hsl(250,35%,10%)] p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
            Adopt Your First Blobbi
          </CardTitle>
          <CardDescription className="text-base">
            Every Blobbi starts as a magical egg. Give it a name and start your journey!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center py-4">
            <EggGraphic blobbi={previewEgg} animated={true} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="blobbiName" className="text-base">Name Your Blobbi</Label>
              <Input
                id="blobbiName"
                type="text"
                placeholder="Enter a name"
                value={blobbiName}
                onChange={(e) => setBlobbiName(e.target.value)}
                className="h-12 text-base"
                required
              />
              <p className="text-xs text-muted-foreground">
                Choose a name that represents your new companion's unique personality
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              disabled={!blobbiName.trim()}
            >
              Adopt Blobbi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
