/**
 * ItemCard Component
 * 
 * Displays an inventory item card with visual indicators for usability.
 * Automatically dims items that cannot be used by the current Blobbi stage.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BlobbiItemDefinition } from '@/lib/blobbi-items';
import type { BlobbiLifeStage } from '@/types/blobbi';
import { isItemUsableByStage, getUnusableItemTag } from '@/lib/blobbi-item-helpers';

export interface ItemCardProps {
  /** The item definition */
  item: BlobbiItemDefinition;
  /** Quantity owned */
  quantity: number;
  /** Current Blobbi's life stage */
  blobbiStage: BlobbiLifeStage;
  /** Click handler */
  onClick: () => void;
  /** Whether the card is disabled (e.g., during loading) */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Item card with automatic dimming for unusable items
 * 
 * Visual behavior:
 * - When item is usable: Full opacity, normal appearance
 * - When item is NOT usable: Reduced opacity (60%), shows tag/pill
 * 
 * The card remains clickable even when dimmed, allowing the user to
 * open the modal and see why the item cannot be used.
 * 
 * @example
 * ```tsx
 * <ItemCard
 *   item={itemDef}
 *   quantity={5}
 *   blobbiStage={currentBlobbi.lifeStage}
 *   onClick={() => setSelectedItem(itemDef)}
 *   disabled={isInteracting}
 * />
 * ```
 */
export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  quantity,
  blobbiStage,
  onClick,
  disabled = false,
  className,
}) => {
  // Check if item is usable by current Blobbi stage
  const isUsable = isItemUsableByStage(item.id, blobbiStage);

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className={cn(
        'h-20 flex flex-col gap-1 relative',
        // Dimming effect for unusable items
        !isUsable && 'opacity-60',
        className
      )}
    >
      {/* Item icon */}
      <span className="text-2xl">{item.icon}</span>
      
      {/* Item name */}
      <span className="text-xs">{item.displayName}</span>
      
      {/* Quantity badge (top-right) */}
      <Badge 
        variant="secondary" 
        className="absolute top-1 right-1 text-[10px] px-1 py-0"
      >
        {quantity}
      </Badge>
      
      {/* Unusable tag/pill (bottom, centered) */}
      {!isUsable && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[calc(100%-8px)]">
          <Badge 
            variant="secondary"
            className="text-[9px] px-1.5 py-0.5 bg-muted/90 text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis w-full justify-center"
          >
            {getUnusableItemTag(blobbiStage)}
          </Badge>
        </div>
      )}
    </Button>
  );
};
