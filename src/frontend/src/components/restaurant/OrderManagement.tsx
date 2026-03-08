import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Clock, Loader2, Package, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  OrderStatus,
  useAcceptRestaurantOrder,
  useRejectRestaurantOrder,
  useRestaurantOrders,
  useUpdateOrderStatus,
} from "../../hooks/useQueries";
import type { Order, RestaurantId } from "../../hooks/useQueries";
import { formatDate, formatPrice } from "../../utils/format";
import { LoadingSpinner } from "../LoadingSpinner";
import { StatusBadge } from "../StatusBadge";

interface OrderManagementProps {
  restaurantId: RestaurantId;
}

const NEXT_STATUS: Partial<
  Record<OrderStatus, { status: OrderStatus; label: string }>
> = {
  [OrderStatus.accepted]: {
    status: OrderStatus.preparing,
    label: "Start Preparing",
  },
  [OrderStatus.preparing]: {
    status: OrderStatus.readyForPickup,
    label: "Mark Ready",
  },
};

function OrderCard({
  order,
  index,
}: {
  order: Order;
  index: number;
  restaurantId: RestaurantId;
}) {
  const { mutateAsync: accept, isPending: isAccepting } =
    useAcceptRestaurantOrder();
  const { mutateAsync: reject, isPending: isRejecting } =
    useRejectRestaurantOrder();
  const { mutateAsync: updateStatus, isPending: isUpdating } =
    useUpdateOrderStatus();

  const next = NEXT_STATUS[order.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={`order.item.${index + 1}`}
      className="bg-card border border-border rounded-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <StatusBadge status={order.status} />
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
            <Clock className="h-3 w-3" />
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span className="font-display font-black text-primary text-lg">
          {formatPrice(order.totalAmount)}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div
            key={`${item.menuItemId.toString()}-${item.name}`}
            className="flex justify-between text-sm"
          >
            <span>
              {item.name}
              <span className="text-muted-foreground text-xs ml-1">
                ×{item.quantity.toString()}
              </span>
            </span>
            <span className="text-muted-foreground text-xs">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Delivery address */}
      <p className="text-xs text-muted-foreground mb-4 p-2 bg-muted/50 rounded-lg">
        📍 {order.deliveryAddress}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        {order.status === OrderStatus.pending && (
          <>
            <Button
              size="sm"
              className="flex-1 gradient-food border-0 text-white"
              onClick={async () => {
                try {
                  await accept(order.id);
                  toast.success("Order accepted!");
                } catch {
                  toast.error("Failed to accept order");
                }
              }}
              disabled={isAccepting}
              data-ocid="order.accept_button"
            >
              {isAccepting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Accept"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={async () => {
                try {
                  await reject(order.id);
                  toast.success("Order rejected");
                } catch {
                  toast.error("Failed to reject order");
                }
              }}
              disabled={isRejecting}
              data-ocid="order.reject_button"
            >
              {isRejecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Reject"
              )}
            </Button>
          </>
        )}
        {next && (
          <Button
            size="sm"
            className="flex-1 gradient-food border-0 text-white"
            onClick={async () => {
              try {
                await updateStatus({ orderId: order.id, status: next.status });
                toast.success(`Order updated to ${next.label}`);
              } catch {
                toast.error("Failed to update order");
              }
            }}
            disabled={isUpdating}
            data-ocid="order.status_button"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ChefHat className="h-3 w-3 mr-1.5" />
            )}
            {next.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function OrderManagement({ restaurantId }: OrderManagementProps) {
  const {
    data: orders,
    isLoading,
    refetch,
    isFetching,
  } = useRestaurantOrders(restaurantId);

  const sortedOrders = [...(orders ?? [])].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  const activeOrders = sortedOrders.filter((o) =>
    [
      OrderStatus.pending,
      OrderStatus.accepted,
      OrderStatus.preparing,
      OrderStatus.readyForPickup,
    ].includes(o.status),
  );
  const completedOrders = sortedOrders.filter((o) =>
    [
      OrderStatus.delivered,
      OrderStatus.pickedUp,
      OrderStatus.cancelled,
    ].includes(o.status),
  );

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-black text-2xl">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage incoming and active orders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading orders..." />
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="w-full mb-4 bg-card border border-border">
            <TabsTrigger
              value="active"
              className="flex-1"
              data-ocid="nav.orders_tab"
            >
              Active
              {activeOrders.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full gradient-food text-white font-bold">
                  {activeOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeOrders.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-center"
                data-ocid="order.empty_state"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Package className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-display font-bold">No active orders</p>
                <p className="text-sm text-muted-foreground mt-1">
                  New orders will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order, idx) => (
                  <OrderCard
                    key={order.id.toString()}
                    order={order}
                    index={idx}
                    restaurantId={restaurantId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No completed orders yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((order, idx) => (
                  <OrderCard
                    key={order.id.toString()}
                    order={order}
                    index={idx}
                    restaurantId={restaurantId}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
