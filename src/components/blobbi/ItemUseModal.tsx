/**
 * ItemUseModal Component
 *
 * Modal dialog for using items from the inventory.
 * Allows selecting quantity and validates item usage rules.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Minus, Plus, AlertCircle } from 'lucide-react';
import type { BlobbiItemDefinition } from '@/lib/blobbi-items';
import { isItemUsableByStage, getItemUsabilityMessage } from '@/lib/blobbi-item-helpers';
import type { BlobbiLifeStage } from '@/types/blobbi';

export interface ItemUseModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** The item definition to display */
  item: BlobbiItemDefinition | null;
  /** Current quantity owned */
  quantity: number;
  /** Current Blobbi's life stage */
  blobbiStage: BlobbiLifeStage;
  /** Callback when "Use Item" is clicked */
  onUseItem: (itemId: string, quantity: number) => Promise<void>;
  /** Whether the use action is currently loading */
  isLoading?: boolean;
}

/**
 * Modal for using items with quantity selection
 *
 * Features:
 * - Displays item information (icon, name, description, quantity)
 * - Quantity stepper with +/- buttons
 * - Validates item usage rules (stage compatibility)
 * - Shows error messages for unusable items
 * - Disables "Use" button during loading
 *
 * @example
 * ```tsx
 * const [selectedItem, setSelectedItem] = useState<BlobbiItemDefinition | null>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <ItemUseModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   item={selectedItem}
 *   quantity={5}
 *   blobbiStage={currentBlobbi.lifeStage}
 *   onUseItem={async (itemId, qty) => {
 *     await handleInteraction('feed', itemId);
 *   }}
 *   isLoading={isInteracting}
 * />
 * ```
 */
export const ItemUseModal: React.FC<ItemUseModalProps> = ({
  open,
  onOpenChange,
  item,
  quantity,
  blobbiStage,
  onUseItem,
  isLoading = false,
}) => {
  // Local state for selected quantity
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Reset quantity when modal opens or item changes
  useEffect(() => {
    if (open && item) {
      setSelectedQuantity(1);
    }
  }, [open, item]);

  // Early return if no item
  if (!item) {
    return null;
  }

  // Check if item is usable by current Blobbi stage
  const isUsable = isItemUsableByStage(item.id, blobbiStage);
  const errorMessage = !isUsable ? getItemUsabilityMessage(item, blobbiStage) : '';

  // Handle quantity changes
  const incrementQuantity = () => {
    setSelectedQuantity(prev => Math.min(prev + 1, quantity));
  };

  const decrementQuantity = () => {
    setSelectedQuantity(prev => Math.max(prev - 1, 1));
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setSelectedQuantity(Math.max(1, Math.min(value, quantity)));
    }
  };

  // Handle use item action
  const handleUseItem = async () => {
    if (!isUsable || isLoading) return;

    try {
      await onUseItem(item.id, selectedQuantity);
      // Close modal on success (parent component should handle this via onOpenChange)
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by parent component
      console.error('[ItemUseModal] Error using item:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{item.icon}</span>
            <span>{item.displayName}</span>
          </DialogTitle>
          {item.notes && (
            <DialogDescription>{item.notes}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Category</span>
              <Badge variant="secondary" className="capitalize">
                {item.category}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">You have</span>
              <span className="text-sm font-semibold">{quantity}</span>
            </div>
          </div>

          {/* Stat effects preview - scaled by selected quantity */}
          {(item.hungerDelta || item.happinessDelta || item.energyDelta ||
            item.hygieneDelta || item.healthDelta) && (
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Effects (for {selectedQuantity} {selectedQuantity === 1 ? 'item' : 'items'}):
              </p>
              {item.hungerDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Hunger</span>
                  <span className={(item.hungerDelta * selectedQuantity) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {(item.hungerDelta * selectedQuantity) > 0 ? '+' : ''}{item.hungerDelta * selectedQuantity}
                  </span>
                </div>
              )}
              {item.happinessDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Happiness</span>
                  <span className={(item.happinessDelta * selectedQuantity) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {(item.happinessDelta * selectedQuantity) > 0 ? '+' : ''}{item.happinessDelta * selectedQuantity}
                  </span>
                </div>
              )}
              {item.energyDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Energy</span>
                  <span className={(item.energyDelta * selectedQuantity) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {(item.energyDelta * selectedQuantity) > 0 ? '+' : ''}{item.energyDelta * selectedQuantity}
                  </span>
                </div>
              )}
              {item.hygieneDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Hygiene</span>
                  <span className={(item.hygieneDelta * selectedQuantity) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {(item.hygieneDelta * selectedQuantity) > 0 ? '+' : ''}{item.hygieneDelta * selectedQuantity}
                  </span>
                </div>
              )}
              {item.healthDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Health</span>
                  <span className={(item.healthDelta * selectedQuantity) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {(item.healthDelta * selectedQuantity) > 0 ? '+' : ''}{item.healthDelta * selectedQuantity}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quantity selector */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to use</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={selectedQuantity <= 1 || !isUsable || isLoading}
                className="h-10 w-10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={quantity}
                value={selectedQuantity}
                onChange={handleQuantityInputChange}
                disabled={!isUsable || isLoading}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                disabled={selectedQuantity >= quantity || !isUsable || isLoading}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error message for unusable items */}
          {!isUsable && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUseItem}
            disabled={!isUsable || isLoading}
          >
            {isLoading ? 'Using...' : `Use Item${selectedQuantity > 1 ? ` (${selectedQuantity})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
