import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, HelpCircle, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type UpiApp = "phonepe" | "paytm" | "gpay";

interface UpiAppConfig {
  id: UpiApp;
  name: string;
  handle: string;
  placeholder: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  selectedBg: string;
  logo: string;
  description: string;
}

const UPI_APPS: UpiAppConfig[] = [
  {
    id: "phonepe",
    name: "PhonePe",
    handle: "@ybl",
    placeholder: "yourname@ybl",
    bgColor: "rgba(95, 37, 159, 0.08)",
    borderColor: "rgba(95, 37, 159, 0.3)",
    textColor: "#5f259f",
    selectedBg: "rgba(95, 37, 159, 0.15)",
    logo: "📱",
    description: "PhonePe · @ybl",
  },
  {
    id: "paytm",
    name: "Paytm",
    handle: "@paytm",
    placeholder: "yourname@paytm",
    bgColor: "rgba(0, 100, 200, 0.08)",
    borderColor: "rgba(0, 100, 200, 0.3)",
    textColor: "#0064c8",
    selectedBg: "rgba(0, 100, 200, 0.15)",
    logo: "💳",
    description: "Paytm · @paytm",
  },
  {
    id: "gpay",
    name: "Google Pay",
    handle: "@okgoogle",
    placeholder: "yourname@okgoogle",
    bgColor: "rgba(52, 168, 83, 0.08)",
    borderColor: "rgba(52, 168, 83, 0.3)",
    textColor: "#1a73e8",
    selectedBg: "rgba(52, 168, 83, 0.12)",
    logo: "🎨",
    description: "Google Pay · @okgoogle",
  },
];

const STORAGE_KEY = "restaurant_payment_details";

interface PaymentDetails {
  upiApp: UpiApp;
  upiId: string;
  accountNumber: string;
  cifNumber: string;
}

export function RestaurantPaymentSettings() {
  const [upiApp, setUpiApp] = useState<UpiApp>("phonepe");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cifNumber, setCifNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const details: PaymentDetails = JSON.parse(saved);
        setUpiApp(details.upiApp ?? "phonepe");
        setUpiId(details.upiId ?? "");
        setAccountNumber(details.accountNumber ?? "");
        setCifNumber(details.cifNumber ?? "");
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleAppSelect = (app: UpiApp) => {
    setUpiApp(app);
    // Keep username, update handle
    const base = upiId.split("@")[0] || "";
    const newConfig = UPI_APPS.find((a) => a.id === app)!;
    if (base) {
      setUpiId(base + newConfig.handle);
    }
  };

  const handleSave = async () => {
    if (!upiId.trim() || !upiId.includes("@")) {
      toast.error("Please enter a valid UPI ID (e.g., yourname@ybl)");
      return;
    }
    if (accountNumber && !/^\d+$/.test(accountNumber)) {
      toast.error("Account number must contain only digits");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const details: PaymentDetails = {
        upiApp,
        upiId,
        accountNumber,
        cifNumber,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
      toast.success("Payment details saved successfully!");
    } catch {
      toast.error("Failed to save payment details");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedConfig = UPI_APPS.find((a) => a.id === upiApp)!;

  const hasUpiId = !!upiId.trim() && upiId.includes("@");

  return (
    <TooltipProvider>
      <div className="p-4 pb-28 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display font-black text-2xl">Payment Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your UPI and bank details to receive payments from customers
          </p>
        </div>

        {/* Warning banner if no UPI ID */}
        {!hasUpiId && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning">
                UPI ID Required
              </p>
              <p className="text-xs text-warning/80 mt-0.5">
                ⚠️ UPI ID is required to receive payments. Please add your UPI ID
                before accepting orders.
              </p>
            </div>
          </div>
        )}

        {/* UPI App Selector Card */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div>
            <h2 className="font-display font-bold text-base mb-1">
              UPI App for Receiving Payments
            </h2>
            <p className="text-xs text-muted-foreground">
              Customers will pay directly to your UPI ID
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {UPI_APPS.map((app) => {
              const isSelected = upiApp === app.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  data-ocid={`restaurant.${app.id}_tab`}
                  onClick={() => handleAppSelect(app.id)}
                  style={{
                    background: isSelected ? app.selectedBg : app.bgColor,
                    borderColor: isSelected ? app.textColor : app.borderColor,
                    borderWidth: isSelected ? "2px" : "1px",
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-xl transition-all duration-200 border hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="text-3xl leading-none">{app.logo}</span>
                  <span
                    className="text-xs font-bold leading-tight text-center"
                    style={{ color: app.textColor }}
                  >
                    {app.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {app.handle}
                  </span>
                  {isSelected && (
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: app.textColor, color: "white" }}
                    >
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* UPI ID Input */}
          <div>
            <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1">
              Your UPI ID{" "}
              <span className="text-destructive" title="Required">
                *
              </span>
            </Label>
            <Input
              placeholder={selectedConfig.placeholder}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className={`h-11 bg-background ${!upiId.trim() ? "border-warning/50 focus-visible:ring-warning/30" : "border-border"}`}
              autoComplete="off"
              data-ocid="restaurant.upi_input"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              e.g.{" "}
              <span
                className="font-semibold"
                style={{ color: selectedConfig.textColor }}
              >
                {selectedConfig.placeholder}
              </span>
              {" · "}
              <span className="text-destructive font-medium">
                Required to receive payments
              </span>
            </p>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div>
            <h2 className="font-display font-bold text-base mb-1">
              Bank Account Details
            </h2>
            <p className="text-xs text-muted-foreground">
              Optional — required for settlement and refund processing
            </p>
          </div>

          {/* Account Number */}
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">
              Bank Account Number
            </Label>
            <Input
              placeholder="Enter your account number"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, ""))
              }
              className="h-11 bg-background border-border font-mono tracking-wider"
              inputMode="numeric"
              data-ocid="restaurant.account_input"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Your savings or current account number (digits only)
            </p>
          </div>

          {/* CIF Number */}
          <div>
            <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1">
              CIF / Customer Number
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-ocid="restaurant.cif_tooltip"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[220px] text-xs text-center"
                >
                  CIF is your bank's Customer Information File number, usually
                  8–11 digits. Found in your passbook or net banking portal.
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              placeholder="e.g. 12345678"
              value={cifNumber}
              onChange={(e) =>
                setCifNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              className="h-11 bg-background border-border font-mono tracking-wider"
              inputMode="numeric"
              data-ocid="restaurant.cif_input"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              8–11 digit CIF / Customer Information File number from your bank
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          className="w-full h-12 text-base font-semibold gradient-food border-0 text-white shadow-food"
          onClick={handleSave}
          disabled={isSaving}
          data-ocid="restaurant.payment_save_button"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Payment Details
            </>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Payment details are stored locally on your device. Customers will see
          your selected UPI app during checkout.
        </p>
      </div>
    </TooltipProvider>
  );
}
