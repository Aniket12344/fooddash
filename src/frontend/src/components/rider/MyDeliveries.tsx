import { Button } from "@/components/ui/button";
import {
  Bike,
  CheckCircle2,
  Clock,
  Hash,
  Loader2,
  Map as MapIcon,
  MapPin,
  Package,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  OrderStatus,
  useMyDeliveries,
  useUpdateDeliveryStatus,
} from "../../hooks/useQueries";
import { formatDate, formatPrice } from "../../utils/format";
import { getUniqueOrderId } from "../../utils/orderUtils";
import { DeliveryMap } from "../DeliveryMap";
import { LoadingSpinner } from "../LoadingSpinner";
import { StatusBadge } from "../StatusBadge";

export function MyDeliveries() {
  const { data: orders, isLoading } = useMyDeliveries();
  const { mutateAsync: updateStatus, isPending: isUpdating } =
    useUpdateDeliveryStatus();
  const [mapOpenFor, setMapOpenFor] = useState<string | null>(null);

  const activeOrders = (orders ?? []).filter(
    (o) =>
      o.status === OrderStatus.pickedUp ||
      o.status === OrderStatus.readyForPickup,
  );
  const completedOrders = (orders ?? []).filter(
    (o) =>
      o.status === OrderStatus.delivered || o.status === OrderStatus.cancelled,
  );

  const handlePickup = async (orderId: bigint) => {
    try {
      await updateStatus({ orderId, status: OrderStatus.pickedUp });
      toast.success("Marked as picked up! Head to the customer. 🛵");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelivered = async (orderId: bigint) => {
    try {
      await updateStatus({ orderId, status: OrderStatus.delivered });
      toast.success("Delivery completed! Great work! ⭐");
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your deliveries..." />;
  }

  return (
    <div className="px-4 pt-5 pb-28">
      <div className="mb-5">
        <h2 className="font-display font-black text-2xl">My Deliveries</h2>
        <p className="text-sm text-muted-foreground">
          Active and past deliveries
        </p>
      </div>

      {/* Active deliveries */}
      {activeOrders.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary mb-3">
            Active
          </h3>
          <div className="space-y-3">
            {activeOrders.map((order, idx) => {
              const orderIdStr = order.id.toString();
              const isMapOpen = mapOpenFor === orderIdStr;
              const uniqueId = getUniqueOrderId(order.id);

              return (
                <motion.div
                  key={orderIdStr}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  data-ocid={`delivery.item.${idx + 1}`}
                  className="bg-card border border-primary/30 rounded-2xl p-4 shadow-food"
                >
                  {/* Unique order ID */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                      <Hash className="h-2.5 w-2.5 text-primary" />
                      <span className="text-[10px] font-bold text-primary tracking-wide">
                        {uniqueId}
                      </span>
                    </span>
                  </div>

                  {/* Status header */}
                  <div className="flex items-start justify-between mb-3">
                    <StatusBadge status={order.status} />
                    <span className="font-display font-black text-primary">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>

                  {/* Time */}
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <Clock className="h-3 w-3" />
                    {formatDate(order.createdAt)}
                  </p>

                  {/* Items */}
                  <div className="mb-3 space-y-1">
                    {order.items.map((item) => (
                      <p
                        key={`${item.menuItemId.toString()}-${item.name}`}
                        className="text-xs text-muted-foreground"
                      >
                        • {item.name} ×{item.quantity.toString()}
                      </p>
                    ))}
                  </div>

                  {/* Delivery address */}
                  <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-xl mb-3">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">
                      {order.deliveryAddress}
                    </p>
                  </div>

                  {/* Map toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full mb-3 border-border gap-2 ${isMapOpen ? "bg-primary/10 border-primary/40 text-primary" : ""}`}
                    onClick={() => setMapOpenFor(isMapOpen ? null : orderIdStr)}
                    data-ocid="delivery.map_marker"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    {isMapOpen ? "Hide Map" : "View Route Map"}
                  </Button>

                  {/* Delivery map */}
                  <AnimatePresence>
                    {isMapOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mb-3 overflow-hidden"
                      >
                        <DeliveryMap
                          restaurantAddress="Restaurant Pickup"
                          deliveryAddress={order.deliveryAddress}
                          orderId={order.id}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action button */}
                  {order.status === OrderStatus.readyForPickup && (
                    <Button
                      className="w-full gradient-food border-0 text-white font-semibold"
                      onClick={() => handlePickup(order.id)}
                      disabled={isUpdating}
                      data-ocid="delivery.primary_button"
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bike className="mr-2 h-4 w-4" />
                      )}
                      Mark as Picked Up
                    </Button>
                  )}
                  {order.status === OrderStatus.pickedUp && (
                    <Button
                      className="w-full bg-success hover:bg-success/90 border-0 text-white font-semibold"
                      onClick={() => handleDelivered(order.id)}
                      disabled={isUpdating}
                      data-ocid="delivery.secondary_button"
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Mark as Delivered
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past deliveries */}
      {completedOrders.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
            History
          </h3>
          <div className="space-y-3">
            {completedOrders.map((order, idx) => {
              const uniqueId = getUniqueOrderId(order.id);
              return (
                <motion.div
                  key={order.id.toString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  data-ocid={`delivery.item.${activeOrders.length + idx + 1}`}
                  className="bg-card border border-border rounded-2xl p-4 opacity-80"
                >
                  {/* Unique order ID */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted border border-border rounded-full">
                      <Hash className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground tracking-wide">
                        {uniqueId}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={order.status} />
                    <span className="font-display font-bold text-muted-foreground">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <Clock className="h-3 w-3" />
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    📍 {order.deliveryAddress}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeOrders.length === 0 && completedOrders.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="delivery.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg mb-1">
            No deliveries yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Accept a delivery from the Available tab to get started!
          </p>
        </div>
      )}
    </div>
  );
}
