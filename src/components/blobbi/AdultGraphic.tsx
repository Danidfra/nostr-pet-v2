import React from 'react';
import { cn } from '@/lib/utils';
import { Blobbi, BlobbiEvolutionForm } from '@/types/blobbi';

// Import adult SVGs - we'll import them dynamically based on evolutionForm
const adultSvgs: Record<BlobbiEvolutionForm, { base: string; sleeping: string }> = {
  blobbi: {
    base: '/src/assets/baby-stage/baby/blobbi-baby-base.svg',
    sleeping: '/src/assets/baby-stage/baby/blobbi-baby-sleeping.svg',
  },
  pandi: {
    base: '/src/assets/adult-stage/pandi/pandi-base.svg',
    sleeping: '/src/assets/adult-stage/pandi/pandi-sleeping.svg',
  },
  owli: {
    base: '/src/assets/adult-stage/owli/owli-base.svg',
    sleeping: '/src/assets/adult-stage/owli/owli-sleeping.svg',
  },
  catti: {
    base: '/src/assets/adult-stage/catti/catti-base.svg',
    sleeping: '/src/assets/adult-stage/catti/catti-sleeping.svg',
  },
  froggi: {
    base: '/src/assets/adult-stage/froggi/froggi-base.svg',
    sleeping: '/src/assets/adult-stage/froggi/froggi-sleeping.svg',
  },
  cloudi: {
    base: '/src/assets/adult-stage/cloudi/cloudi-base.svg',
    sleeping: '/src/assets/adult-stage/cloudi/cloudi-sleeping.svg',
  },
  crysti: {
    base: '/src/assets/adult-stage/crysti/crysti-base.svg',
    sleeping: '/src/assets/adult-stage/crysti/crysti-sleeping.svg',
  },
  bloomi: {
    base: '/src/assets/adult-stage/bloomi/bloomi-base.svg',
    sleeping: '/src/assets/adult-stage/bloomi/bloomi-sleeping.svg',
  },
  starri: {
    base: '/src/assets/adult-stage/starri/starri-base.svg',
    sleeping: '/src/assets/adult-stage/starri/starri-sleeping.svg',
  },
  flammi: {
    base: '/src/assets/adult-stage/flammi/flammi-base.svg',
    sleeping: '/src/assets/adult-stage/flammi/flammi-sleeping.svg',
  },
  droppi: {
    base: '/src/assets/adult-stage/droppi/droppi-base.svg',
    sleeping: '/src/assets/adult-stage/droppi/droppi-sleeping.svg',
  },
  breezy: {
    base: '/src/assets/adult-stage/breezy/breezy-base.svg',
    sleeping: '/src/assets/adult-stage/breezy/breezy-sleeping.svg',
  },
  rocky: {
    base: '/src/assets/adult-stage/rocky/rocky-base.svg',
    sleeping: '/src/assets/adult-stage/rocky/rocky-sleeping.svg',
  },
  cacti: {
    base: '/src/assets/adult-stage/cacti/cacti-base.svg',
    sleeping: '/src/assets/adult-stage/cacti/cacti-sleeping.svg',
  },
  mushie: {
    base: '/src/assets/adult-stage/mushie/mushie-base.svg',
    sleeping: '/src/assets/adult-stage/mushie/mushie-sleeping.svg',
  },
  leafy: {
    base: '/src/assets/adult-stage/leafy/leafy-base.svg',
    sleeping: '/src/assets/adult-stage/leafy/leafy-sleeping.svg',
  },
  rosey: {
    base: '/src/assets/adult-stage/rosey/rosey-base.svg',
    sleeping: '/src/assets/adult-stage/rosey/rosey-sleeping.svg',
  },
};

interface AdultGraphicProps {
  blobbi: Blobbi;
  className?: string;
  animated?: boolean;
}

export const AdultGraphic: React.FC<AdultGraphicProps> = ({
  blobbi,
  className,
  animated = false,
}) => {
  // Get the evolution form or default to 'blobbi'
  const evolutionForm = blobbi.evolutionForm || 'blobbi';
  
  // Determine which SVG to use based on blobbi state
  const isSleeping = blobbi.isSleeping || blobbi.state === 'sleeping';
  const svgPath = isSleeping 
    ? adultSvgs[evolutionForm].sleeping 
    : adultSvgs[evolutionForm].base;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-64 h-64',
        animated && !isSleeping && 'animate-bounce-subtle',
        className
      )}
    >
      <img
        src={svgPath}
        alt={`${blobbi.name} - ${evolutionForm}`}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
