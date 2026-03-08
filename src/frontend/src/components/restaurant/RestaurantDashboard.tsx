import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  CheckCircle,
  ChefHat,
  Clock,
  Package,
  Store,
  ToggleLeft,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Restaurant } from "../../hooks/useQueries";
import {
  OrderStatus,
  useRestaurantOrders,
  useSetRestaurantOpenStatus,
} from "../../hooks/useQueries";

interface RestaurantDashboardProps {
  restaurant: Restaurant;
  onRestaurantChange: () => void;
  onGoToPayments?: () => void;
}

export function RestaurantDashboard({
  restaurant,
  onRestaurantChange,
  onGoToPayments,
}: RestaurantDashboardProps) {
  const { data: orders, isLoading } = useRestaurantOrders(restaurant.id);
  const { mutateAsync: setOpenStatus, isPending } =
    useSetRestaurantOpenStatus();

  const handleToggle = async (open: boolean) => {
    try {
      await setOpenStatus(open);
      onRestaurantChange();
      toast.success(
        open ? "Restaurant is now open! 🟢" : "Restaurant is now closed 🔴",
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const todayOrders = (orders ?? []).filter((o) => {
    const orderDay = new Date(Number(o.createdAt / 1_000_000n)).toDateString();
    const today = new Date().toDateString();
    return orderDay === today;
  });

  const stats = [
    {
      label: "Pending",
      count: todayOrders.filter((o) => o.status === OrderStatus.pending).length,
      icon: Clock,
      colorClass: "text-warning",
      bgClass: "bg-warning/15",
    },
    {
      label: "Accepted",
      count: todayOrders.filter((o) => o.status === OrderStatus.accepted)
        .length,
      icon: CheckCircle,
      colorClass: "text-[oklch(0.62_0.2_210)]",
      bgClass: "bg-[oklch(0.62_0.2_210)]/15",
    },
    {
      label: "Preparing",
      count: todayOrders.filter((o) => o.status === OrderStatus.preparing)
        .length,
      icon: ChefHat,
      colorClass: "text-primary",
      bgClass: "bg-primary/15",
    },
    {
      label: "Ready",
      count: todayOrders.filter((o) => o.status === OrderStatus.readyForPickup)
        .length,
      icon: Truck,
      colorClass: "text-success",
      bgClass: "bg-success/15",
    },
  ];

  // Check if UPI ID is configured
  const paymentDetails = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("restaurant_payment_details") ?? "{}",
      );
    } catch {
      return {};
    }
  })();
  const hasUpiId = !!(
    paymentDetails?.upiId?.trim() && paymentDetails.upiId.includes("@")
  );

  return (
    <div className="px-4 pt-5 pb-6">
      {/* UPI warning banner */}
      {!hasUpiId && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 mb-4">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warning">UPI ID Not Set</p>
            <p className="text-xs text-warning/80 mt-0.5">
              Your UPI ID is not set. Set it up before accepting orders so
              customers can pay you.
            </p>
          </div>
          {onGoToPayments && (
            <Button
              size="sm"
              variant="outline"
              className="border-warning/40 text-warning hover:bg-warning/10 text-xs h-7 flex-shrink-0"
              onClick={onGoToPayments}
              data-ocid="restaurant.setup_payments_button"
            >
              Set Up Payments
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="font-display font-black text-2xl truncate">
            {restaurant.name}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {restaurant.cuisineType}
        </p>
      </div>

      {/* Open/Closed toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <Label
              htmlFor="open-toggle"
              className="font-display font-bold text-base cursor-pointer"
            >
              Restaurant Status
            </Label>
            <p className="text-sm text-muted-foreground mt-0.5">
              {restaurant.isOpen
                ? "Accepting orders now"
                : "Not accepting orders"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold ${
                restaurant.isOpen ? "text-success" : "text-muted-foreground"
              }`}
            >
              {restaurant.isOpen ? "Open" : "Closed"}
            </span>
            <Switch
              id="open-toggle"
              checked={restaurant.isOpen}
              onCheckedChange={handleToggle}
              disabled={isPending}
              data-ocid="restaurant.toggle_open_switch"
              className="data-[state=checked]:bg-success"
            />
          </div>
        </div>
        {restaurant.isOpen && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">
              Live — customers can order
            </span>
          </div>
        )}
      </motion.div>

      {/* Today's stats */}
      <div className="mb-4">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Today&apos;s Overview
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, count, icon: Icon, colorClass, bgClass }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center mb-3`}
                >
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                </div>
                <p className={`font-display font-black text-3xl ${colorClass}`}>
                  {count}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Today total */}
      {!isLoading && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Total orders today</span>
          </div>
          <span className="font-display font-black text-primary text-xl">
            {todayOrders.length}
          </span>
        </div>
      )}
    </div>
  );
}
