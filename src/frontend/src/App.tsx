import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeftRight,
  Bike,
  ChevronDown,
  ShieldCheck,
  ShoppingBag,
  Store,
  Utensils,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AppUserRole } from "./backend.d";
import { RoleSelector } from "./components/RoleSelector";
import { AdminApp } from "./components/admin/AdminApp";
import { CustomerApp } from "./components/customer/CustomerApp";
import { RestaurantApp } from "./components/restaurant/RestaurantApp";
import { RiderApp } from "./components/rider/RiderApp";

type ActiveRole = AppUserRole | "admin";

const ROLE_LABELS: Record<
  ActiveRole,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  [AppUserRole.customer]: { label: "Customer", icon: ShoppingBag },
  [AppUserRole.restaurantOwner]: { label: "Restaurant", icon: Store },
  [AppUserRole.rider]: { label: "Rider", icon: Bike },
  admin: { label: "Admin", icon: ShieldCheck },
};

export default function App() {
  const [activeRole, setActiveRole] = useState<ActiveRole | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Show role selector if no role set or switching
  if (!activeRole || showRoleSelector) {
    return (
      <>
        <RoleSelector
          onRoleSelected={(role) => {
            setActiveRole(role);
            setShowRoleSelector(false);
          }}
        />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  const roleInfo = ROLE_LABELS[activeRole];
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen max-w-2xl mx-auto">
      {/* Header — only shown for non-customer roles */}
      {activeRole !== AppUserRole.customer && (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-food flex items-center justify-center">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-black text-lg tracking-tight">
              Food<span className="text-primary">Dash</span>
            </span>
          </div>

          {/* Role switcher */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border bg-card h-8 text-xs"
                >
                  <RoleIcon className="h-3.5 w-3.5 text-primary" />
                  {roleInfo.label}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-card border-border"
                data-ocid="nav.dropdown_menu"
              >
                <DropdownMenuItem
                  onClick={() => setShowRoleSelector(true)}
                  className="gap-2 cursor-pointer"
                  data-ocid="nav.toggle"
                >
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  Switch Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      )}

      {/* Role-based app */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {activeRole === AppUserRole.customer && <CustomerApp />}
          {activeRole === AppUserRole.restaurantOwner && <RestaurantApp />}
          {activeRole === AppUserRole.rider && <RiderApp />}
          {activeRole === "admin" && <AdminApp />}
        </motion.div>
      </AnimatePresence>

      <Toaster richColors position="top-center" />
    </div>
  );
}
