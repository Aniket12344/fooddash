import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  Package,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { OrderStatus, useMyDeliveries } from "../../hooks/useQueries";
import { formatDate } from "../../utils/format";
import { getUniqueOrderId } from "../../utils/orderUtils";
import { LoadingSpinner } from "../LoadingSpinner";

const RIDER_EARNING_PER_DELIVERY = 30; // ₹30 per delivery

export function EarningsTab() {
  const { data: orders, isLoading } = useMyDeliveries();

  const deliveredOrders = (orders ?? []).filter(
    (o) => o.status === OrderStatus.delivered,
  );

  const totalEarned = deliveredOrders.length * RIDER_EARNING_PER_DELIVERY;
  const totalDeliveries = deliveredOrders.length;

  // Calculate average per day
  const getAveragePerDay = (): string => {
    if (deliveredOrders.length === 0) return "₹0";
    const timestamps = deliveredOrders.map((o) =>
      Number(o.createdAt / 1_000_000n),
    );
    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);
    const diffMs = latest - earliest;
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const avg = (totalEarned / diffDays).toFixed(0);
    return `₹${avg}`;
  };

  // Sort delivered orders newest first
  const sortedDelivered = [...deliveredOrders].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading earnings..." />;
  }

  return (
    <div className="px-4 pt-5 pb-28">
      <div className="mb-5">
        <h2 className="font-display font-black text-2xl">My Earnings</h2>
        <p className="text-sm text-muted-foreground">
          ₹{RIDER_EARNING_PER_DELIVERY} earned per completed delivery
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Total earned */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="col-span-2"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-primary" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="font-display font-black text-4xl text-primary">
                ₹{totalEarned}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                from {totalDeliveries} completed deliveries
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total deliveries */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Card className="border-border h-full">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="font-display font-black text-3xl text-foreground">
                {totalDeliveries}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average per day */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="border-border h-full">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                Avg / Day
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="font-display font-black text-3xl text-foreground">
                {getAveragePerDay()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                per day
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Earnings history */}
      <div>
        <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          Delivery History
        </h3>

        {sortedDelivered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-ocid="earnings.empty_state"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-display font-bold text-base mb-1">
              No earnings yet
            </p>
            <p className="text-sm text-muted-foreground">
              Complete a delivery to start earning ₹{RIDER_EARNING_PER_DELIVERY}{" "}
              per order!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDelivered.map((order, idx) => {
              const uniqueId = getUniqueOrderId(order.id);
              return (
                <motion.div
                  key={order.id.toString()}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  data-ocid={`earnings.item.${idx + 1}`}
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {uniqueId}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className="bg-success/10 text-success border-success/20 text-xs font-bold"
                    >
                      +₹{RIDER_EARNING_PER_DELIVERY}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}

            {sortedDelivered.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Total ({totalDeliveries} deliveries)
                  </span>
                  <span className="font-display font-black text-primary text-lg">
                    ₹{totalEarned}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Earnings per order note */}
      <div className="mt-6 p-3 bg-muted/30 rounded-xl border border-border">
        <p className="text-xs text-muted-foreground text-center">
          <IndianRupee className="h-3 w-3 inline mr-0.5" />
          You earn{" "}
          <span className="font-bold text-foreground">
            ₹{RIDER_EARNING_PER_DELIVERY}
          </span>{" "}
          per successful delivery · Earnings are from the ₹30 delivery fee
          collected from customers
        </p>
      </div>
    </div>
  );
}
