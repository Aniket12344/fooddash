import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Clock,
  Hash,
  Loader2,
  Map as MapIcon,
  Package,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  OrderStatus,
  useCancelOrder,
  useMyOrders,
} from "../../hooks/useQueries";
import { formatDate, formatPrice } from "../../utils/format";
import { getUniqueOrderId } from "../../utils/orderUtils";
import { DeliveryMap } from "../DeliveryMap";
import { LoadingSpinner } from "../LoadingSpinner";
import { StatusBadge } from "../StatusBadge";

const ACTIVE_STATUSES = new Set<OrderStatus>([
  OrderStatus.accepted,
  OrderStatus.preparing,
  OrderStatus.readyForPickup,
  OrderStatus.pickedUp,
]);

const DELIVERY_CHARGE = 3000n;

export function MyOrders() {
  const { data: orders, isLoading } = useMyOrders();
  const { mutateAsync: cancelOrder, isPending: isCancelling } =
    useCancelOrder();
  const [mapOpenFor, setMapOpenFor] = useState<string | null>(null);

  const handleCancel = async (orderId: bigint) => {
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
    }
  };

  const sortedOrders = [...(orders ?? [])].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="mb-5">
        <h2 className="font-display font-black text-2xl">My Orders</h2>
        <p className="text-sm text-muted-foreground">
          Track your current and past orders
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading your orders..." />
      ) : sortedOrders.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="order.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg mb-1">No orders yet</h3>
          <p className="text-sm text-muted-foreground">
            Browse restaurants and place your first order!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOrders.map((order, idx) => {
            const orderIdStr = order.id.toString();
            const uniqueId = getUniqueOrderId(order.id);
            const isActive = ACTIVE_STATUSES.has(order.status);
            const isMapOpen = mapOpenFor === orderIdStr;

            return (
              <motion.div
                key={orderIdStr}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                data-ocid={`order.item.${idx + 1}`}
                className="bg-card border border-border rounded-2xl p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {/* Unique order ID badge */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                        <Hash className="h-2.5 w-2.5 text-primary" />
                        <span className="text-[10px] font-bold text-primary tracking-wide">
                          {uniqueId}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={order.status} />
                    </div>
                    {/* Billing time */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-primary/60" />
                      <span className="font-medium">
                        {formatDate(order.createdAt)}
                      </span>
                    </p>
                  </div>
                  <span className="font-display font-black text-primary text-lg">
                    {formatPrice(order.totalAmount + DELIVERY_CHARGE)}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-2">
                  {order.items.map((item) => (
                    <div
                      key={`${item.menuItemId.toString()}-${item.name}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">
                        {item.name}
                        <span className="text-muted-foreground ml-1">
                          ×{item.quantity.toString()}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery charge line */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Delivery
                  </span>
                  <span>{formatPrice(DELIVERY_CHARGE)}</span>
                </div>

                {/* Address */}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{order.deliveryAddress}</span>
                </p>

                {/* Map toggle for active orders */}
                {isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full mb-2 border-border gap-2 ${isMapOpen ? "bg-primary/10 border-primary/40 text-primary" : ""}`}
                    onClick={() => setMapOpenFor(isMapOpen ? null : orderIdStr)}
                    data-ocid="order.map_marker"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    {isMapOpen ? "Hide Map" : "View Delivery Map"}
                  </Button>
                )}

                {/* Delivery map */}
                <AnimatePresence>
                  {isActive && isMapOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mb-3 overflow-hidden"
                    >
                      <DeliveryMap
                        restaurantAddress="Restaurant Location"
                        deliveryAddress={order.deliveryAddress}
                        orderId={order.id}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Cancel button for pending orders */}
                {order.status === OrderStatus.pending && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                        data-ocid="order.delete_button"
                      >
                        Cancel Order
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display font-black">
                          Cancel this order?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Your order will be
                          cancelled.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="order.cancel_button">
                          Keep Order
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleCancel(order.id)}
                          disabled={isCancelling}
                          data-ocid="order.confirm_button"
                        >
                          {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Yes, Cancel"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
