import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bike,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  useAcceptDelivery,
  useReadyOrdersWithoutRider,
} from "../../hooks/useQueries";
import { formatDate, formatPrice } from "../../utils/format";
import { LoadingSpinner } from "../LoadingSpinner";

interface AvailableDeliveriesProps {
  isProfileComplete: boolean;
  onGoToProfile: () => void;
}

export function AvailableDeliveries({
  isProfileComplete,
  onGoToProfile,
}: AvailableDeliveriesProps) {
  const {
    data: orders,
    isLoading,
    refetch,
    isFetching,
  } = useReadyOrdersWithoutRider();
  const { mutateAsync: acceptDelivery, isPending: isAccepting } =
    useAcceptDelivery();

  const handleAccept = async (orderId: bigint) => {
    try {
      await acceptDelivery(orderId);
      toast.success("Delivery accepted! Head to the restaurant. 🚴");
    } catch {
      toast.error("Failed to accept delivery");
    }
  };

  return (
    <div className="px-4 pt-5 pb-28">
      {/* Profile incomplete banner */}
      {!isProfileComplete && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 mb-4">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warning">
              Complete your profile
            </p>
            <p className="text-xs text-warning/80 mt-0.5">
              Upload your selfie to complete verification and start accepting
              deliveries
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-warning/40 text-warning hover:bg-warning/10 text-xs h-7 flex-shrink-0"
            onClick={onGoToProfile}
            data-ocid="delivery.goto_profile_button"
          >
            Go to Profile
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-black text-2xl">
            Available Deliveries
          </h2>
          <p className="text-sm text-muted-foreground">
            Orders ready for pickup
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

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        Auto-refreshes every 10 seconds
      </div>

      {isLoading ? (
        <LoadingSpinner message="Finding available deliveries..." />
      ) : (orders ?? []).length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="delivery.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bike className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg mb-1">
            No deliveries available
          </h3>
          <p className="text-sm text-muted-foreground">
            Check back in a moment — orders are coming in!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(orders ?? []).map((order, idx) => (
            <motion.div
              key={order.id.toString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              data-ocid={`delivery.item.${idx + 1}`}
              className="bg-card border border-border rounded-2xl p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-food flex items-center justify-center">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        Order #{order.id.toString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <span className="font-display font-black text-primary text-lg">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>

              {/* Items summary */}
              <div className="mb-3 space-y-1">
                {order.items.slice(0, 3).map((item) => (
                  <p
                    key={`${item.menuItemId.toString()}-${item.name}`}
                    className="text-xs text-muted-foreground"
                  >
                    • {item.name} ×{item.quantity.toString()}
                  </p>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    + {order.items.length - 3} more item
                    {order.items.length - 3 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Delivery address */}
              <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-xl mb-4">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{order.deliveryAddress}</p>
              </div>

              <Button
                className="w-full gradient-food border-0 text-white shadow-food font-semibold"
                onClick={() => handleAccept(order.id)}
                disabled={isAccepting || !isProfileComplete}
                title={
                  !isProfileComplete
                    ? "Complete your profile to accept deliveries"
                    : undefined
                }
                data-ocid="delivery.accept_button"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <Bike className="mr-2 h-4 w-4" />
                    Accept Delivery
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
