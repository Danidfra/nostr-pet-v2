import React from 'react';
import { cn } from '@/lib/utils';
import { Blobbi } from '@/types/blobbi';

interface BabyGraphicProps {
  blobbi: Blobbi;
  className?: string;
  animated?: boolean;
}

export const BabyGraphic: React.FC<BabyGraphicProps> = ({
  blobbi,
  className,
  animated = false,
}) => {
  // Determine which SVG to use based on blobbi state
  const getSvgSrc = () => {
    if (blobbi.isSleeping || blobbi.state === 'sleeping') {
      return '/src/assets/baby-stage/baby/blobbi-baby-sleeping.svg';
    }

    // Use neon variant for divine or special blobbis
    if (blobbi.themeVariant === 'divine' || blobbi.crossoverApp === 'divine') {
      return '/src/assets/baby-stage/baby/blobbi-baby-neon.svg';
    }

    return '/src/assets/baby-stage/baby/blobbi-baby-base.svg';
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-48 h-48',
        animated && 'animate-bounce-subtle',
        className
      )}
    >
      <img
        src={getSvgSrc()}
        alt={`${blobbi.name} - Baby Blobbi`}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
