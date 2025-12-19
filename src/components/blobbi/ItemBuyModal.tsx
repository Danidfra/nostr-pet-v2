/**
 * ItemBuyModal Component
 *
 * Modal dialog for purchasing items from the shop.
 * Allows selecting quantity and validates purchase rules.
 */

import React, { useState, useEffect, useMemo } from 'react';
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
import { Minus, Plus, AlertCircle, Coins } from 'lucide-react';
import type { BlobbiItemDefinition } from '@/lib/blobbi-items';

const MAX_INVENTORY_PER_ITEM = 999;

export interface ItemBuyModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** The item definition to display */
  item: BlobbiItemDefinition | null;
  /** Current quantity owned */
  currentQuantity: number;
  /** Current coins available */
  currentCoins: number;
  /** Callback when "Buy Item" is clicked */
  onBuyItem: (itemId: string, quantity: number) => Promise<void>;
  /** Whether the purchase action is currently loading */
  isLoading?: boolean;
}

/**
 * Modal for purchasing items with quantity selection
 *
 * Features:
 * - Displays item information (icon, name, price, quantity)
 * - Quantity stepper with +/- buttons
 * - Validates purchase rules (coins, inventory limit)
 * - Shows total cost and remaining coins
 * - Disables "Buy" button during loading or when validation fails
 *
 * @example
 * ```tsx
 * const [selectedItem, setSelectedItem] = useState<BlobbiItemDefinition | null>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <ItemBuyModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   item={selectedItem}
 *   currentQuantity={5}
 *   currentCoins={250}
 *   onBuyItem={async (itemId, qty) => {
 *     await handlePurchase(itemId, qty);
 *   }}
 *   isLoading={isPurchasing}
 * />
 * ```
 */
export const ItemBuyModal: React.FC<ItemBuyModalProps> = ({
  open,
  onOpenChange,
  item,
  currentQuantity,
  currentCoins,
  onBuyItem,
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

  // Calculate constraints
  const constraints = useMemo(() => {
    if (!item) {
      return {
        maxByCoins: 0,
        maxByInventory: 0,
        maxPurchasable: 0,
        totalCost: 0,
        remainingCoins: currentCoins,
        canPurchase: false,
        errorMessage: '',
      };
    }

    // Maximum quantity based on available coins
    const maxByCoins = Math.floor(currentCoins / item.price);

    // Maximum quantity based on inventory limit
    const maxByInventory = MAX_INVENTORY_PER_ITEM - currentQuantity;

    // Overall maximum purchasable quantity
    const maxPurchasable = Math.min(maxByCoins, maxByInventory);

    // Total cost for selected quantity
    const totalCost = item.price * selectedQuantity;

    // Remaining coins after purchase
    const remainingCoins = currentCoins - totalCost;

    // Validation
    let canPurchase = true;
    let errorMessage = '';

    if (maxPurchasable <= 0) {
      canPurchase = false;
      if (maxByCoins <= 0) {
        errorMessage = 'Not enough coins to purchase this item.';
      } else if (maxByInventory <= 0) {
        errorMessage = `You've reached the maximum inventory limit (${MAX_INVENTORY_PER_ITEM}) for this item.`;
      }
    } else if (selectedQuantity > maxPurchasable) {
      canPurchase = false;
      if (selectedQuantity > maxByCoins) {
        errorMessage = 'Not enough coins for this quantity.';
      } else if (selectedQuantity > maxByInventory) {
        errorMessage = `This purchase would exceed the inventory limit (${MAX_INVENTORY_PER_ITEM}).`;
      }
    }

    return {
      maxByCoins,
      maxByInventory,
      maxPurchasable,
      totalCost,
      remainingCoins,
      canPurchase,
      errorMessage,
    };
  }, [item, currentQuantity, currentCoins, selectedQuantity]);

  // Early return if no item
  if (!item) {
    return null;
  }

  // Handle quantity changes
  const incrementQuantity = () => {
    setSelectedQuantity(prev => Math.min(prev + 1, constraints.maxPurchasable));
  };

  const decrementQuantity = () => {
    setSelectedQuantity(prev => Math.max(prev - 1, 1));
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setSelectedQuantity(Math.max(1, Math.min(value, constraints.maxPurchasable)));
    }
  };

  // Handle purchase action
  const handleBuyItem = async () => {
    if (!constraints.canPurchase || isLoading) return;

    try {
      await onBuyItem(item.id, selectedQuantity);
      // Close modal on success (parent component should handle this via onOpenChange)
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by parent component
      console.error('[ItemBuyModal] Error purchasing item:', error);
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
              <span className="text-sm font-medium">Price (per unit)</span>
              <span className="text-sm font-semibold flex items-center gap-1">
                <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                {item.price}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">You own</span>
              <span className="text-sm font-semibold">{currentQuantity} / {MAX_INVENTORY_PER_ITEM}</span>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to purchase</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={selectedQuantity <= 1 || !constraints.canPurchase || isLoading}
                className="h-10 w-10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={constraints.maxPurchasable}
                value={selectedQuantity}
                onChange={handleQuantityInputChange}
                disabled={!constraints.canPurchase || isLoading}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                disabled={selectedQuantity >= constraints.maxPurchasable || !constraints.canPurchase || isLoading}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {constraints.maxPurchasable > 0 && (
              <p className="text-xs text-muted-foreground">
                Max: {constraints.maxPurchasable}
              </p>
            )}
          </div>

          {/* Cost breakdown */}
          {constraints.canPurchase && (
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Total cost</span>
                <span className="font-semibold flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  {constraints.totalCost}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Current coins</span>
                <span className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  {currentCoins}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-border pt-1 mt-1">
                <span className="font-medium">Remaining coins</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  constraints.remainingCoins < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  <Coins className="h-4 w-4" />
                  {constraints.remainingCoins}
                </span>
              </div>
            </div>
          )}

          {/* Error message for invalid purchases */}
          {!constraints.canPurchase && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{constraints.errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Stat effects preview - scaled by selected quantity */}
          {constraints.canPurchase && (item.hungerDelta || item.happinessDelta || item.energyDelta ||
            item.hygieneDelta || item.healthDelta) && (
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Effects when used (per item):
              </p>
              {item.hungerDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Hunger</span>
                  <span className={item.hungerDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {item.hungerDelta > 0 ? '+' : ''}{item.hungerDelta}
                  </span>
                </div>
              )}
              {item.happinessDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Happiness</span>
                  <span className={item.happinessDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {item.happinessDelta > 0 ? '+' : ''}{item.happinessDelta}
                  </span>
                </div>
              )}
              {item.energyDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Energy</span>
                  <span className={item.energyDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {item.energyDelta > 0 ? '+' : ''}{item.energyDelta}
                  </span>
                </div>
              )}
              {item.hygieneDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Hygiene</span>
                  <span className={item.hygieneDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {item.hygieneDelta > 0 ? '+' : ''}{item.hygieneDelta}
                  </span>
                </div>
              )}
              {item.healthDelta !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span>Health</span>
                  <span className={item.healthDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {item.healthDelta > 0 ? '+' : ''}{item.healthDelta}
                  </span>
                </div>
              )}
            </div>
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
            onClick={handleBuyItem}
            disabled={!constraints.canPurchase || isLoading}
          >
            {isLoading ? 'Purchasing...' : `Buy ${selectedQuantity > 1 ? `${selectedQuantity} ` : ''}for ${constraints.totalCost} 💰`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
