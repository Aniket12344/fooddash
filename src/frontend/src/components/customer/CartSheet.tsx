import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CreditCard,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "../../contexts/CartContext";
import { usePlaceOrder } from "../../hooks/useQueries";
import { formatPrice } from "../../utils/format";
import { PaymentModal } from "../PaymentModal";

const DELIVERY_CHARGE = 3000n; // ₹30 in paise
const FREE_DELIVERY_THRESHOLD = 19900n; // ₹199 in paise

export function CartSheet() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    clearCart,
    totalAmount,
    restaurantId,
  } = useCart();
  const [address, setAddress] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { mutateAsync: placeOrder, isPending } = usePlaceOrder();

  const effectiveDeliveryCharge =
    totalAmount >= FREE_DELIVERY_THRESHOLD ? 0n : DELIVERY_CHARGE;
  const grandTotal = totalAmount + effectiveDeliveryCharge;

  const handleProceedToPayment = async () => {
    if (!address.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }
    if (!restaurantId) {
      toast.error("No restaurant selected");
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    if (!restaurantId) return;
    try {
      await placeOrder({
        restaurantId,
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          name: i.menuItem.name,
          quantity: BigInt(i.quantity),
          price: i.menuItem.price,
        })),
        deliveryAddress: address.trim(),
      });
      clearCart();
      closeCart();
      setAddress("");
      toast.success("Order placed successfully! 🎉");
    } catch {
      toast.error("Failed to record order. Please contact support.");
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const addr = data.address;
          const formatted = [
            addr?.road,
            addr?.suburb ?? addr?.city_district,
            addr?.city ?? addr?.town ?? addr?.village,
          ]
            .filter(Boolean)
            .join(", ");
          setAddress(formatted || data.display_name || `${lat}, ${lon}`);
          toast.success("Location found!");
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => {
        toast.error("Could not get location. Please enter address manually.");
        setIsGettingLocation(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-card border-border flex flex-col"
          data-ocid="cart.sheet"
        >
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="font-display font-black text-xl flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Your Cart
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center text-center py-8"
              data-ocid="cart.empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-display font-bold text-lg">Cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add items from a restaurant to start your order
              </p>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {items.map((cartItem) => (
                  <div
                    key={cartItem.menuItem.id.toString()}
                    className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {cartItem.menuItem.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(cartItem.menuItem.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() =>
                          updateQuantity(
                            cartItem.menuItem.id,
                            cartItem.quantity - 1,
                          )
                        }
                      >
                        {cartItem.quantity === 1 ? (
                          <Trash2 className="h-3 w-3 text-destructive" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </Button>
                      <span className="font-bold text-sm w-5 text-center">
                        {cartItem.quantity}
                      </span>
                      <Button
                        size="icon"
                        className="h-7 w-7 rounded-full gradient-food border-0 text-white"
                        onClick={() =>
                          updateQuantity(
                            cartItem.menuItem.id,
                            cartItem.quantity + 1,
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-display font-bold text-sm text-primary w-14 text-right">
                      {formatPrice(
                        cartItem.menuItem.price * BigInt(cartItem.quantity),
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-border space-y-3">
                <Separator />

                {/* Free delivery banner */}
                {effectiveDeliveryCharge === 0n && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700">
                    <span className="text-base">🎉</span>
                    <span className="text-xs font-semibold">
                      FREE DELIVERY applied!
                    </span>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-sm font-semibold">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                {/* Free delivery nudge */}
                {totalAmount > 0n && effectiveDeliveryCharge > 0n && (
                  <p className="text-xs text-muted-foreground -mt-1">
                    Add{" "}
                    <span className="font-semibold text-primary">
                      {formatPrice(FREE_DELIVERY_THRESHOLD - totalAmount)}
                    </span>{" "}
                    more for free delivery on orders ₹199+
                  </p>
                )}

                {/* Delivery Charge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Delivery Charge
                  </span>
                  <span
                    className={`text-sm font-semibold ${effectiveDeliveryCharge === 0n ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {effectiveDeliveryCharge === 0n
                      ? "FREE"
                      : formatPrice(DELIVERY_CHARGE)}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-sm">Total</span>
                  <span className="font-display font-black text-lg text-primary">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                {/* Address */}
                <div>
                  <Label
                    htmlFor="delivery-address"
                    className="text-sm font-medium mb-2 flex items-center gap-1.5"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Delivery Address
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="delivery-address"
                      placeholder="Enter your delivery address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-11 bg-background border-border flex-1"
                      data-ocid="cart.input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11 px-3 shrink-0 gap-1.5 text-xs font-medium border-border"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      data-ocid="cart.location_button"
                    >
                      {isGettingLocation ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                      )}
                      {isGettingLocation ? "Locating..." : "Use Location"}
                    </Button>
                  </div>
                </div>

                {/* Pay button */}
                <Button
                  className="w-full h-12 text-base font-semibold gradient-food border-0 text-white shadow-food"
                  onClick={handleProceedToPayment}
                  disabled={isPending || !address.trim()}
                  data-ocid="cart.primary_button"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay & Place Order · {formatPrice(grandTotal)}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onPaymentSuccess={handlePaymentSuccess}
        items={items.map((i) => ({
          name: i.menuItem.name,
          quantity: i.quantity,
          price: i.menuItem.price,
        }))}
        subtotalAmount={totalAmount}
        deliveryCharge={effectiveDeliveryCharge}
        totalAmount={grandTotal}
        deliveryAddress={address}
      />
    </>
  );
}
