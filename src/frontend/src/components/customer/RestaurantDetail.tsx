import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Info, Minus, Plus, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "../../contexts/CartContext";
import type { Restaurant } from "../../hooks/useQueries";
import { useRestaurantMenu } from "../../hooks/useQueries";
import { formatPrice } from "../../utils/format";

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
}

export function RestaurantDetail({
  restaurant,
  onBack,
}: RestaurantDetailProps) {
  const { data: menuItems, isLoading } = useRestaurantMenu(restaurant.id);
  const { addItem, removeItem, items, openCart, itemCount } = useCart();
  const [addedItemId, setAddedItemId] = useState<bigint | null>(null);

  // Group by category
  const categories = Array.from(
    new Set(menuItems?.map((i) => i.category) ?? []),
  ).sort();

  const getQuantity = (menuItemId: bigint) =>
    items.find((i) => i.menuItem.id === menuItemId)?.quantity ?? 0;

  const handleAdd = (item: NonNullable<typeof menuItems>[0]) => {
    // Check if cart has items from different restaurant
    const cartItem = items[0];
    if (cartItem && cartItem.menuItem.restaurantId !== restaurant.id) {
      toast.error("Clear your cart first — items are from another restaurant");
      return;
    }
    addItem(item);
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 600);
  };

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 -ml-1 text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {itemCount > 0 && (
          <Button
            size="sm"
            className="gradient-food border-0 text-white shadow-food gap-2"
            onClick={openCart}
            data-ocid="cart.sheet"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Restaurant info */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between mb-2">
          <h1 className="font-display font-black text-2xl">
            {restaurant.name}
          </h1>
          <Badge
            className={
              restaurant.isOpen
                ? "bg-success/20 text-success-foreground border-success/30"
                : "bg-muted text-muted-foreground"
            }
          >
            {restaurant.isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground font-medium mb-1">
          {restaurant.cuisineType}
        </p>
        {restaurant.description && (
          <p className="text-sm text-muted-foreground">
            {restaurant.description}
          </p>
        )}
      </div>

      {/* Menu */}
      {isLoading ? (
        <div className="px-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (menuItems ?? []).length === 0 ? (
        <div
          className="flex flex-col items-center py-12 text-center px-4"
          data-ocid="menu.empty_state"
        >
          <Info className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-display font-bold">No menu items yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            This restaurant hasn&apos;t added their menu yet.
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-border" />
                {category}
                <span className="flex-1 h-px bg-border" />
              </h3>
              <div className="space-y-2">
                {(menuItems ?? [])
                  .filter(
                    (item) => item.category === category && item.isAvailable,
                  )
                  .map((item, idx) => {
                    const qty = getQuantity(item.id);
                    const justAdded = addedItemId === item.id;
                    return (
                      <motion.div
                        key={item.id.toString()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        data-ocid={`menu.item.${idx + 1}`}
                        className="bg-card border border-border rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <p className="font-display font-bold text-primary mt-2">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <AnimatePresence mode="wait">
                              {qty > 0 ? (
                                <motion.div
                                  key="qty-controls"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center gap-1"
                                >
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 rounded-full border-border"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="font-bold text-sm w-5 text-center">
                                    {qty}
                                  </span>
                                  <Button
                                    size="icon"
                                    className="h-8 w-8 rounded-full gradient-food border-0 text-white"
                                    onClick={() => handleAdd(item)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="add-btn"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                >
                                  <Button
                                    size="sm"
                                    className={`h-8 rounded-full px-3 border-0 text-white transition-all ${
                                      justAdded
                                        ? "bg-success"
                                        : "gradient-food shadow-food"
                                    }`}
                                    onClick={() => handleAdd(item)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
