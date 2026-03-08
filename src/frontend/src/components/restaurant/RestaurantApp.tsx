import {
  CreditCard,
  LayoutDashboard,
  Package,
  UserCircle,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useOpenRestaurants } from "../../hooks/useQueries";
import type { Restaurant } from "../../hooks/useQueries";
import { LoadingSpinner } from "../LoadingSpinner";
import { MenuManagement } from "./MenuManagement";
import { OrderManagement } from "./OrderManagement";
import { RestaurantDashboard } from "./RestaurantDashboard";
import { RestaurantPaymentSettings } from "./RestaurantPaymentSettings";
import { RestaurantProfile } from "./RestaurantProfile";

type RestaurantTab = "dashboard" | "orders" | "menu" | "profile" | "payments";

export function RestaurantApp() {
  const [tab, setTab] = useState<RestaurantTab>("dashboard");
  const { identity } = useInternetIdentity();
  const { data: restaurants, isLoading, refetch } = useOpenRestaurants();
  const [myRestaurant, setMyRestaurant] = useState<Restaurant | null>(null);

  // Find the restaurant owned by the current user
  useEffect(() => {
    if (restaurants && identity) {
      const principal = identity.getPrincipal().toString();
      const found = restaurants.find((r) => r.owner.toString() === principal);
      setMyRestaurant(found ?? null);
    }
  }, [restaurants, identity]);

  const handleRestaurantSaved = (restaurant: Restaurant) => {
    setMyRestaurant(restaurant);
    setTab("dashboard");
    refetch();
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your restaurant..." />;
  }

  // If no restaurant, show profile creation first
  if (!myRestaurant && tab !== "profile") {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <RestaurantProfile
            restaurant={null}
            onSaved={handleRestaurantSaved}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 overflow-y-auto">
        {tab === "dashboard" && myRestaurant && (
          <RestaurantDashboard
            restaurant={myRestaurant}
            onRestaurantChange={refetch}
            onGoToPayments={() => setTab("payments")}
          />
        )}
        {tab === "orders" && myRestaurant && (
          <OrderManagement restaurantId={myRestaurant.id} />
        )}
        {tab === "menu" && myRestaurant && (
          <MenuManagement restaurantId={myRestaurant.id} />
        )}
        {tab === "profile" && (
          <RestaurantProfile
            restaurant={myRestaurant}
            onSaved={handleRestaurantSaved}
          />
        )}
        {tab === "payments" && <RestaurantPaymentSettings />}
      </main>

      {/* Bottom tab bar */}
      <nav className="tab-bar fixed bottom-0 left-0 right-0 z-20 max-w-2xl mx-auto">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            {
              id: "dashboard" as const,
              icon: LayoutDashboard,
              label: "Dashboard",
              ocid: "nav.home_tab",
            },
            {
              id: "orders" as const,
              icon: Package,
              label: "Orders",
              ocid: "nav.orders_tab",
            },
            {
              id: "menu" as const,
              icon: UtensilsCrossed,
              label: "Menu",
              ocid: "nav.menu_tab",
            },
            {
              id: "profile" as const,
              icon: UserCircle,
              label: "Profile",
              ocid: "nav.profile_tab",
            },
            {
              id: "payments" as const,
              icon: CreditCard,
              label: "Payments",
              ocid: "nav.payments_tab",
            },
          ].map(({ id, icon: Icon, label, ocid }) => (
            <button
              type="button"
              key={id}
              onClick={() => setTab(id)}
              data-ocid={ocid}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                tab === id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${tab === id ? "fill-primary/20" : ""}`}
              />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
