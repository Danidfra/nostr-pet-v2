import React from 'react';
import { cn } from '@/lib/utils';
import { Blobbi } from '@/types/blobbi';
import blobbiBaseSvg from '@/assets/baby-stage/baby/blobbi-baby-base.svg';
import blobbiNeonSvg from '@/assets/baby-stage/baby/blobbi-baby-neon.svg';
import blobbiSleepingSvg from '@/assets/baby-stage/baby/blobbi-baby-sleeping.svg';

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
    // Simplified sleep state model - only check 'state' tag
    if (blobbi.state === 'sleeping') {
      return blobbiSleepingSvg;
    }

    // Use neon variant for divine or special blobbis
    if (blobbi.themeVariant === 'divine' || blobbi.crossoverApp === 'divine') {
      return blobbiNeonSvg;
    }

    return blobbiBaseSvg;
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
