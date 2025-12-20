import React from 'react';
import { cn } from '@/lib/utils';
import { Blobbi, BlobbiEvolutionForm } from '@/types/blobbi';

// Import baby SVGs for fallback
import blobbiBaseSvg from '@/assets/baby-stage/baby/blobbi-baby-base.svg';
import blobbiSleepingSvg from '@/assets/baby-stage/baby/blobbi-baby-sleeping.svg';

// Import adult SVGs
import bloomiBase from '@/assets/adult-stage/bloomi/bloomi-base.svg';
import bloomiSleeping from '@/assets/adult-stage/bloomi/bloomi-sleeping.svg';
import breezyBase from '@/assets/adult-stage/breezy/breezy-base.svg';
import breezySleeping from '@/assets/adult-stage/breezy/breezy-sleeping.svg';
import cactiBase from '@/assets/adult-stage/cacti/cacti-base.svg';
import cactiSleeping from '@/assets/adult-stage/cacti/cacti-sleeping.svg';
import cattiBase from '@/assets/adult-stage/catti/catti-base.svg';
import cattiSleeping from '@/assets/adult-stage/catti/catti-sleeping.svg';
import cloudiBase from '@/assets/adult-stage/cloudi/cloudi-base.svg';
import cloudiSleeping from '@/assets/adult-stage/cloudi/cloudi-sleeping.svg';
import crystiBase from '@/assets/adult-stage/crysti/crysti-base.svg';
import crystiSleeping from '@/assets/adult-stage/crysti/crysti-sleeping.svg';
import droppiBase from '@/assets/adult-stage/droppi/droppi-base.svg';
import droppiSleeping from '@/assets/adult-stage/droppi/droppi-sleeping.svg';
import flammiBase from '@/assets/adult-stage/flammi/flammi-base.svg';
import flammiSleeping from '@/assets/adult-stage/flammi/flammi-sleeping.svg';
import froggiBase from '@/assets/adult-stage/froggi/froggi-base.svg';
import froggiSleeping from '@/assets/adult-stage/froggi/froggi-sleeping.svg';
import leafyBase from '@/assets/adult-stage/leafy/leafy-base.svg';
import leafySleeping from '@/assets/adult-stage/leafy/leafy-sleeping.svg';
import mushieBase from '@/assets/adult-stage/mushie/mushie-base.svg';
import mushieSleeping from '@/assets/adult-stage/mushie/mushie-sleeping.svg';
import owliBase from '@/assets/adult-stage/owli/owli-base.svg';
import owliSleeping from '@/assets/adult-stage/owli/owli-sleeping.svg';
import pandiBase from '@/assets/adult-stage/pandi/pandi-base.svg';
import pandiSleeping from '@/assets/adult-stage/pandi/pandi-sleeping.svg';
import rockyBase from '@/assets/adult-stage/rocky/rocky-base.svg';
import rockySleeping from '@/assets/adult-stage/rocky/rocky-sleeping.svg';
import roseyBase from '@/assets/adult-stage/rosey/rosey-base.svg';
import roseySleeping from '@/assets/adult-stage/rosey/rosey-sleeping.svg';
import starriBase from '@/assets/adult-stage/starri/starri-base.svg';
import starriSleeping from '@/assets/adult-stage/starri/starri-sleeping.svg';

const adultSvgs: Record<BlobbiEvolutionForm, { base: string; sleeping: string }> = {
  blobbi: {
    base: blobbiBaseSvg,
    sleeping: blobbiSleepingSvg,
  },
  pandi: {
    base: pandiBase,
    sleeping: pandiSleeping,
  },
  owli: {
    base: owliBase,
    sleeping: owliSleeping,
  },
  catti: {
    base: cattiBase,
    sleeping: cattiSleeping,
  },
  froggi: {
    base: froggiBase,
    sleeping: froggiSleeping,
  },
  cloudi: {
    base: cloudiBase,
    sleeping: cloudiSleeping,
  },
  crysti: {
    base: crystiBase,
    sleeping: crystiSleeping,
  },
  bloomi: {
    base: bloomiBase,
    sleeping: bloomiSleeping,
  },
  starri: {
    base: starriBase,
    sleeping: starriSleeping,
  },
  flammi: {
    base: flammiBase,
    sleeping: flammiSleeping,
  },
  droppi: {
    base: droppiBase,
    sleeping: droppiSleeping,
  },
  breezy: {
    base: breezyBase,
    sleeping: breezySleeping,
  },
  rocky: {
    base: rockyBase,
    sleeping: rockySleeping,
  },
  cacti: {
    base: cactiBase,
    sleeping: cactiSleeping,
  },
  mushie: {
    base: mushieBase,
    sleeping: mushieSleeping,
  },
  leafy: {
    base: leafyBase,
    sleeping: leafySleeping,
  },
  rosey: {
    base: roseyBase,
    sleeping: roseySleeping,
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
  // Simplified sleep state model - only check 'state' tag
  const isSleeping = blobbi.state === 'sleeping';
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
