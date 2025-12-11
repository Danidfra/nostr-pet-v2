# Inventory UX Implementation

This document describes the implementation of the enhanced inventory UI/UX system for the Blobbi app, including visual indicators for item usability and the item use modal.

## Overview

The inventory system has been enhanced with:

1. **Visual indicators** showing which items cannot be used by the currently selected Blobbi
2. **Item use modal** allowing users to select quantity before using items
3. **Centralized validation logic** to avoid code duplication

## Architecture

### 1. Helper Functions (`src/lib/blobbi-item-helpers.ts`)

This file contains the **single source of truth** for item usability logic:

#### `isItemUsableByStage(itemId, stage)`

Checks if an item can be used by a Blobbi at a specific life stage.

```typescript
// Check if an egg can use a ball
const canUse = isItemUsableByStage('toy_ball', 'egg'); // false

// Check if a baby can use vitamins
const canUse = isItemUsableByStage('med_vitamins', 'baby'); // true
```

#### `isItemUsableByBlobbi(itemId, blobbi)`

Convenience wrapper that accepts a Blobbi object instead of just the stage.

```typescript
const canUse = isItemUsableByBlobbi('toy_ball', currentBlobbi);
```

#### `getItemUsabilityMessage(itemDef, stage)`

Returns a user-friendly error message explaining why an item cannot be used.

```typescript
const item = getItemDefinition('toy_ball');
const message = getItemUsabilityMessage(item, 'egg');
// Returns: "Eggs can't use this item"
```

#### `getUnusableItemTag(stage)`

Returns a short text suitable for displaying in a badge/pill on item cards.

```typescript
const tagText = getUnusableItemTag('egg');
// Returns: "Eggs can't use this item"
```

### 2. ItemCard Component (`src/components/blobbi/ItemCard.tsx`)

Displays an inventory item card with automatic visual dimming for unusable items.

#### Features

- **Automatic dimming**: Items that cannot be used by the current Blobbi stage are displayed with 60% opacity
- **Visual tag**: Unusable items show a small badge explaining why they can't be used
- **Still clickable**: Even dimmed items can be clicked to open the modal (where the full validation message is shown)
- **Quantity badge**: Shows how many of the item the user owns

#### Props

```typescript
interface ItemCardProps {
  item: BlobbiItemDefinition;      // The item definition
  quantity: number;                 // Quantity owned
  blobbiStage: BlobbiLifeStage;    // Current Blobbi's life stage
  onClick: () => void;              // Click handler
  disabled?: boolean;               // Whether the card is disabled
  className?: string;               // Additional CSS classes
}
```

#### Example Usage

```tsx
<ItemCard
  item={itemDef}
  quantity={5}
  blobbiStage={currentBlobbi.lifeStage}
  onClick={() => setSelectedItem(itemDef)}
  disabled={isInteracting}
/>
```

#### Visual States

**Usable item:**
- Full opacity
- No tag/pill
- Normal appearance

**Unusable item (e.g., egg trying to use a toy):**
- 60% opacity (dimmed)
- Shows tag: "Eggs can't use this item"
- Still clickable to view details

### 3. ItemUseModal Component (`src/components/blobbi/ItemUseModal.tsx`)

Modal dialog for using items with quantity selection and validation.

#### Features

- **Item information display**: Shows icon, name, description, and quantity owned
- **Stat effects preview**: Displays the effects the item will have on the Blobbi
- **Quantity selector**: Stepper with +/- buttons and direct input
- **Validation**: Checks if the item can be used by the current Blobbi
- **Error messages**: Shows clear error messages for unusable items
- **Loading state**: Disables controls during item usage

#### Props

```typescript
interface ItemUseModalProps {
  open: boolean;                                      // Whether modal is open
  onOpenChange: (open: boolean) => void;             // Open state change callback
  item: BlobbiItemDefinition | null;                 // Item to display
  quantity: number;                                   // Current quantity owned
  blobbiStage: BlobbiLifeStage;                      // Current Blobbi's life stage
  onUseItem: (itemId: string, quantity: number) => Promise<void>;  // Use item callback
  isLoading?: boolean;                                // Loading state
}
```

#### Example Usage

```tsx
const [selectedItem, setSelectedItem] = useState<BlobbiItemDefinition | null>(null);
const [isOpen, setIsOpen] = useState(false);

<ItemUseModal
  open={isOpen}
  onOpenChange={setIsOpen}
  item={selectedItem}
  quantity={5}
  blobbiStage={currentBlobbi.lifeStage}
  onUseItem={async (itemId, qty) => {
    await handleInteraction('feed', itemId);
  }}
  isLoading={isInteracting}
/>
```

#### Modal Sections

1. **Header**: Item icon and name
2. **Description**: Optional item notes/description
3. **Details**: Category badge and quantity owned
4. **Stat effects**: Preview of stat changes (hunger, happiness, etc.)
5. **Quantity selector**: Input with +/- buttons
6. **Error alert**: Shows validation errors for unusable items
7. **Footer**: Cancel and Use buttons

### 4. HomeScreen Integration

The inventory modal in `HomeScreen.tsx` has been updated to use the new components:

#### New State Variables

```typescript
const [selectedItem, setSelectedItem] = useState<BlobbiItemDefinition | null>(null);
const [isItemModalOpen, setIsItemModalOpen] = useState(false);
```

#### New Handlers

**`handleItemClick(itemId)`**
Opens the item use modal when an inventory item is clicked.

```typescript
const handleItemClick = (itemId: string) => {
  const itemDef = getItemDefinition(itemId);
  if (itemDef) {
    setSelectedItem(itemDef);
    setIsItemModalOpen(true);
  }
};
```

**`handleUseItemFromModal(itemId, quantity)`**
Handles using items with quantity support. Currently uses items one at a time in a loop.

```typescript
const handleUseItemFromModal = async (itemId: string, quantity: number) => {
  // Uses items one at a time
  for (let i = 0; i < quantity; i++) {
    const result = await interact({ action, itemId });
    if (!result.success) {
      // Show error and stop
      return;
    }
  }
  // Show success toast and close modals
};
```

#### Inventory Rendering

All inventory tabs now use the `ItemCard` component:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
  {availableItems.map((item) => {
    const itemDef = getItemDefinition(item.id);
    if (!itemDef) return null;

    return (
      <ItemCard
        key={item.id}
        item={itemDef}
        quantity={item.quantity}
        blobbiStage={currentBlobbi.lifeStage}
        onClick={() => handleItemClick(item.id)}
        disabled={isInteracting}
      />
    );
  })}
</div>
```

## User Flow

### Opening Inventory

1. User clicks "Inventory" button in footer
2. Inventory modal opens showing all items

### Viewing Items

1. Items are displayed in a grid layout
2. **Usable items**: Full opacity, normal appearance
3. **Unusable items**: Dimmed (60% opacity) with tag "Eggs can't use this item"
4. Each item shows its icon, name, and quantity badge

### Using an Item

1. User clicks on an item card (even if dimmed)
2. Item use modal opens showing:
   - Item details (icon, name, description)
   - Category and quantity owned
   - Stat effects preview
   - Quantity selector
3. If item is **usable**:
   - User can adjust quantity with +/- buttons
   - User clicks "Use Item" button
   - Items are used one at a time
   - Success toast is shown
   - Both modals close
4. If item is **not usable**:
   - Error alert is shown: "Eggs can't use this item"
   - Quantity selector is disabled
   - "Use Item" button is disabled
   - User can only cancel/close

## Dynamic Updates

The system automatically updates when:

1. **Blobbi changes**: Selecting a different Blobbi updates which items are dimmed
2. **Life stage changes**: When a Blobbi hatches/evolves, item usability updates
3. **Inventory changes**: Using items updates quantities in real-time

## Validation Layers

The system has **three layers of validation** for robustness:

### 1. UI Layer (Visual Indicators)
- ItemCard shows dimming and tags
- Helps users understand before clicking

### 2. Modal Layer (Pre-submission)
- ItemUseModal disables controls for unusable items
- Shows error messages
- Prevents submission

### 3. Backend Layer (Server/Hook)
- `useBlobbiInteraction` hook validates stage compatibility
- Returns error messages if validation fails
- Final safety check

## Customization Points

### Changing Visual Styles

**Dimming intensity:**
Edit `ItemCard.tsx`, line with `opacity-60`:
```tsx
!isUsable && 'opacity-60'  // Change to opacity-40, opacity-50, etc.
```

**Tag appearance:**
Edit `ItemCard.tsx`, Badge component:
```tsx
<Badge 
  variant="secondary"
  className="text-[9px] px-1.5 py-0.5 bg-muted/90 text-muted-foreground"
>
```

**Tag text:**
Edit `src/lib/blobbi-item-helpers.ts`, `getUnusableItemTag()` function.

### Adding New Validation Rules

To add new item usage rules:

1. Update item definitions in `src/lib/blobbi-items.ts`
2. Update validation logic in `isItemUsableByStage()` if needed
3. Update error messages in `getItemUsabilityMessage()` and `getUnusableItemTag()`

### Supporting Batch Item Usage

Currently, items are used one at a time. To support batch usage:

1. Update the interaction system to accept quantity parameter
2. Modify `handleUseItemFromModal` to pass quantity to a single interaction call
3. Update backend validation to handle batch operations

## Files Modified/Created

### Created Files
- `src/lib/blobbi-item-helpers.ts` - Helper functions for item validation
- `src/components/blobbi/ItemCard.tsx` - Item card component with dimming
- `src/components/blobbi/ItemUseModal.tsx` - Item use modal component
- `docs/INVENTORY_UX_IMPLEMENTATION.md` - This documentation

### Modified Files
- `src/app/screens/HomeScreen.tsx` - Integrated new components and handlers

## Testing Checklist

- [ ] Egg cannot use food items (should be dimmed)
- [ ] Egg cannot use toy items (should be dimmed)
- [ ] Egg CAN use medicine items (should NOT be dimmed)
- [ ] Egg CAN use hygiene items (should NOT be dimmed)
- [ ] Baby/Adult can use all items (nothing dimmed)
- [ ] Clicking dimmed item opens modal with error message
- [ ] Clicking usable item opens modal with quantity selector
- [ ] Quantity selector min/max bounds work correctly
- [ ] Using multiple items decrements inventory correctly
- [ ] Switching Blobbis updates dimming state
- [ ] Hatching an egg updates dimming state

## Future Enhancements

1. **Batch item usage**: Support using multiple items in a single transaction
2. **Item previews**: Show animated preview of stat changes
3. **Favorite items**: Pin frequently used items to top
4. **Search/filter**: Add search bar for large inventories
5. **Item sorting**: Sort by category, name, or usability
6. **Usage history**: Track which items were used recently
