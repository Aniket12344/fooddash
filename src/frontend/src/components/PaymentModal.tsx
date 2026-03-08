import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Copy,
  IndianRupee,
  Loader2,
  Lock,
  Shield,
  Smartphone,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { formatPrice } from "../utils/format";

interface PaymentItem {
  name: string;
  quantity: number;
  price: bigint;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  items: PaymentItem[];
  subtotalAmount: bigint;
  deliveryCharge: bigint;
  totalAmount: bigint;
  deliveryAddress: string;
}

type PaymentStep = "form" | "processing" | "success";
type UpiApp = "phonepe" | "paytm" | "gpay";

interface UpiAppConfig {
  id: UpiApp;
  name: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  selectedBg: string;
  logo: string;
}

const FOODDASH_UPI = "6205850061@ybl";

const UPI_APPS: UpiAppConfig[] = [
  {
    id: "phonepe",
    name: "PhonePe",
    bgColor: "rgba(95, 37, 159, 0.08)",
    borderColor: "rgba(95, 37, 159, 0.3)",
    textColor: "#5f259f",
    selectedBg: "rgba(95, 37, 159, 0.15)",
    logo: "📱",
  },
  {
    id: "paytm",
    name: "Paytm",
    bgColor: "rgba(0, 100, 200, 0.08)",
    borderColor: "rgba(0, 100, 200, 0.3)",
    textColor: "#0064c8",
    selectedBg: "rgba(0, 100, 200, 0.15)",
    logo: "💳",
  },
  {
    id: "gpay",
    name: "Google Pay",
    bgColor: "rgba(52, 168, 83, 0.08)",
    borderColor: "rgba(52, 168, 83, 0.3)",
    textColor: "#1a73e8",
    selectedBg: "rgba(52, 168, 83, 0.12)",
    logo: "🎨",
  },
];

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  items,
  subtotalAmount,
  deliveryCharge,
  totalAmount,
  deliveryAddress,
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("form");
  const [selectedApp, setSelectedApp] = useState<UpiApp>("phonepe");

  const selectedAppConfig = UPI_APPS.find((a) => a.id === selectedApp)!;

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(FOODDASH_UPI);
      toast.success("UPI ID copied!");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleSubmit = async () => {
    setStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStep("success");
  };

  const handleSuccess = () => {
    onPaymentSuccess();
    resetState();
    onClose();
  };

  const resetState = () => {
    setStep("form");
    setSelectedApp("phonepe");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      data-ocid="payment.modal"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close payment modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        onClick={() => step === "form" && handleClose()}
      />

      {/* Modal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {step === "form" && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl gradient-food flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-lg leading-tight">
                      UPI Payment
                    </h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" />
                      Secured by NPCI
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="payment.close_button"
                >
                  ×
                </button>
              </div>

              {/* Order summary */}
              <div className="mx-5 mb-4 p-3 bg-muted/30 rounded-xl border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Order Summary
                </p>
                <div className="space-y-1 mb-2">
                  {items.slice(0, 3).map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-foreground truncate max-w-[65%]">
                        {item.name}
                        <span className="text-muted-foreground ml-1">
                          ×{item.quantity}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatPrice(item.price * BigInt(item.quantity))}
                      </span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{items.length - 3} more items
                    </p>
                  )}
                </div>
                <Separator className="my-2" />
                {/* Subtotal row */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    Items subtotal
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatPrice(subtotalAmount)}
                  </span>
                </div>
                {/* Delivery charge row */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    Delivery charge
                  </span>
                  {deliveryCharge === 0n ? (
                    <span className="text-xs font-semibold text-green-600">
                      FREE
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(deliveryCharge)}
                    </span>
                  )}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-display font-black text-primary text-lg">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  📍 {deliveryAddress}
                </p>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* QR Code section */}
                <div className="flex flex-col items-center p-4 bg-muted/20 rounded-2xl border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Scan QR to Pay
                  </p>
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-border mb-3">
                    <img
                      src="/assets/generated/upi-qr-fooddash.dim_300x300.png"
                      alt="UPI QR Code for 6205850061@ybl"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  {/* UPI ID with copy */}
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/15 border border-primary/30 rounded-full transition-all active:scale-95"
                    data-ocid="payment.toggle"
                  >
                    <span className="font-mono font-bold text-primary text-sm">
                      {FOODDASH_UPI}
                    </span>
                    <Copy className="h-3.5 w-3.5 text-primary" />
                  </button>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Tap to copy UPI ID · Open your app and scan
                  </p>
                </div>

                {/* UPI App Selector */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Pay Using
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {UPI_APPS.map((app) => {
                      const isSelected = selectedApp === app.id;
                      return (
                        <button
                          key={app.id}
                          type="button"
                          data-ocid={`payment.${app.id}_tab`}
                          onClick={() => setSelectedApp(app.id)}
                          style={{
                            background: isSelected
                              ? app.selectedBg
                              : app.bgColor,
                            borderColor: isSelected
                              ? app.textColor
                              : app.borderColor,
                            borderWidth: isSelected ? "2px" : "1px",
                          }}
                          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200 border hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="text-2xl leading-none">
                            {app.logo}
                          </span>
                          <span
                            className="text-xs font-bold leading-tight"
                            style={{ color: app.textColor }}
                          >
                            {app.name}
                          </span>
                          {isSelected && (
                            <span
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{
                                background: app.textColor,
                                color: "white",
                              }}
                            >
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-base font-semibold gradient-food border-0 text-white shadow-food"
                  onClick={handleSubmit}
                  data-ocid="payment.submit_button"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  I've Paid via {selectedAppConfig.name}
                </Button>

                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    Secured by NPCI · Instant UPI Transfer
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl gradient-food flex items-center justify-center mb-5 shadow-food">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <h3 className="font-display font-black text-xl mb-2">
                Verifying Payment
              </h3>
              <p className="text-sm text-muted-foreground">
                Confirming with {selectedAppConfig.name}...
              </p>
              <div className="flex gap-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.25,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="h-10 w-10 text-success" />
              </motion.div>
              <h3 className="font-display font-black text-2xl mb-2">
                Payment Successful! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {formatPrice(totalAmount)} paid to FoodDash
              </p>
              {/* Mini QR on success */}
              <div className="p-2 bg-white rounded-xl shadow-sm border border-border mb-3">
                <img
                  src="/assets/generated/upi-qr-fooddash.dim_300x300.png"
                  alt="Payment QR"
                  className="w-24 h-24 object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <IndianRupee className="h-3 w-3 text-success" />
                <span className="text-xs text-success font-medium">
                  Payment Sent to {FOODDASH_UPI}
                </span>
              </div>
              {deliveryCharge === 0n && (
                <div className="flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                  <span className="text-xs text-green-700 font-semibold">
                    🎉 You saved ₹30 on delivery!
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-6">
                Your order is confirmed and being prepared
              </p>
              <Button
                className="w-full h-12 gradient-food border-0 text-white font-semibold shadow-food"
                onClick={handleSuccess}
                data-ocid="payment.confirm_button"
              >
                View My Orders
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
