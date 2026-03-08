import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bike,
  Loader2,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppUserRole } from "../backend.d";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface RoleSelectorProps {
  onRoleSelected: (role: AppUserRole | "admin") => void;
}

const isAdminMode = () =>
  typeof window !== "undefined" &&
  window.location.search.includes("adminMode=true");

const ROLES = [
  {
    role: AppUserRole.customer,
    icon: ShoppingBag,
    title: "Customer",
    description: "Browse restaurants, order food, and track your deliveries",
    gradient: "from-amber-500 to-orange-500",
    ocid: "role.customer_button",
    showPhone: false,
  },
  {
    role: AppUserRole.restaurantOwner,
    icon: Store,
    title: "Restaurant Owner",
    description: "Manage your menu, accept orders, and grow your business",
    gradient: "from-rose-500 to-pink-500",
    ocid: "role.restaurant_button",
    showPhone: false,
  },
  {
    role: AppUserRole.rider,
    icon: Bike,
    title: "Rider",
    description: "Pick up orders and deliver them to customers",
    gradient: "from-teal-500 to-cyan-500",
    ocid: "role.rider_button",
    showPhone: true,
  },
];

const ADMIN_ROLE = {
  role: "admin" as const,
  icon: ShieldCheck,
  title: "Admin",
  description: "Manage users, restaurants, and riders across the platform",
  gradient: "from-violet-500 to-purple-500",
  ocid: "role.admin_button",
  showPhone: false,
};

export function RoleSelector({ onRoleSelected }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<
    AppUserRole | "admin" | null
  >(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { mutateAsync: saveProfile, isPending } = useSaveCallerUserProfile();

  const showAdmin = isAdminMode();
  const allRoles = showAdmin ? [...ROLES, ADMIN_ROLE] : ROLES;

  const selectedRoleConfig = allRoles.find((r) => r.role === selectedRole);
  const needsPhone =
    selectedRoleConfig?.showPhone && selectedRole === AppUserRole.rider;

  const handleConfirm = async () => {
    if (!selectedRole || !name.trim()) {
      toast.error("Please enter your name and select a role");
      return;
    }
    if (needsPhone && !phone.trim()) {
      toast.error("Please enter your phone number to sign up as a Rider");
      return;
    }

    try {
      // For admin, save as customer in backend but track admin in localStorage
      const backendRole =
        selectedRole === "admin" ? AppUserRole.customer : selectedRole;
      await saveProfile({ name: name.trim(), role: backendRole });

      // Save user info to localStorage
      const users = JSON.parse(
        localStorage.getItem("fooddash_users") ?? "[]",
      ) as Array<{
        principal: string;
        name: string;
        role: string;
        isActive: boolean;
        phone?: string;
        isAdmin?: boolean;
      }>;

      const userData = {
        principal: `demo_${Date.now()}`,
        name: name.trim(),
        role: selectedRole,
        isActive: true,
        phone: phone.trim() || undefined,
        isAdmin: selectedRole === "admin",
      };
      users.push(userData);
      localStorage.setItem("fooddash_users", JSON.stringify(users));

      if (selectedRole === "admin") {
        localStorage.setItem("fooddash_is_admin", "true");
      }

      onRoleSelected(selectedRole);
      toast.success(`Welcome, ${name.trim()}!`);
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.72 0.19 55 / 0.1), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-black tracking-tight mb-2">
            How will you use <span className="text-primary">FoodDash</span>?
          </h1>
          <p className="text-muted-foreground text-sm">
            Choose your role to get started
          </p>
        </div>

        {/* Name input */}
        <div className="mb-4">
          <Label
            htmlFor="name-input"
            className="text-sm font-medium mb-2 block"
          >
            Your Name
          </Label>
          <Input
            id="name-input"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 bg-card border-border"
            data-ocid="role.name_input"
          />
        </div>

        {/* Phone number (for rider) */}
        {needsPhone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Label
              htmlFor="phone-input"
              className="text-sm font-medium mb-2 flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              Mobile Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone-input"
              type="tel"
              placeholder="Enter your mobile number..."
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="h-11 bg-card border-border"
              inputMode="numeric"
              data-ocid="role.phone_input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required for delivery coordination
            </p>
          </motion.div>
        )}

        {/* Role cards */}
        <div className="grid gap-3 mb-6">
          {allRoles.map(
            ({ role, icon: Icon, title, description, gradient, ocid }, i) => {
              const isSelected = selectedRole === role;
              return (
                <motion.button
                  key={role}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  onClick={() => setSelectedRole(role)}
                  data-ocid={ocid}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-food"
                      : "border-border bg-card hover:border-border/80 hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-base">
                        {title}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 rounded-full gradient-food flex-shrink-0" />
                    )}
                  </div>
                </motion.button>
              );
            },
          )}
        </div>

        <Button
          className="w-full h-12 text-base font-semibold gradient-food border-0 text-white shadow-food"
          onClick={handleConfirm}
          disabled={!selectedRole || !name.trim() || isPending}
          data-ocid="role.submit_button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            "Get Started"
          )}
        </Button>
      </motion.div>
    </div>
  );
}
