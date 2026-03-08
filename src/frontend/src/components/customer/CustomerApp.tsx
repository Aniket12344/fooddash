import { Home, Package, Search, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { CartProvider, useCart } from "../../contexts/CartContext";
import type { Restaurant } from "../../hooks/useQueries";
import { CartSheet } from "./CartSheet";
import { MyOrders } from "./MyOrders";
import { ProfileTab } from "./ProfileTab";
import { RestaurantDetail } from "./RestaurantDetail";
import { RestaurantList } from "./RestaurantList";

type CustomerTab = "home" | "search" | "cart" | "orders" | "profile";

function CustomerAppInner() {
  const [tab, setTab] = useState<CustomerTab>("home");
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const { itemCount, openCart } = useCart();

  const handleTabChange = (newTab: CustomerTab) => {
    if (newTab === "cart") {
      openCart();
      return;
    }
    if (newTab === "home") {
      setSelectedRestaurant(null);
    }
    if (newTab === "search") {
      setSearchFocused(true);
    } else {
      setSearchFocused(false);
    }
    setTab(newTab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {tab === "home" || tab === "search" ? (
          selectedRestaurant ? (
            <RestaurantDetail
              restaurant={selectedRestaurant}
              onBack={() => setSelectedRestaurant(null)}
            />
          ) : (
            <RestaurantList
              onSelectRestaurant={setSelectedRestaurant}
              autoFocusSearch={tab === "search" && searchFocused}
              onSearchFocused={() => setSearchFocused(false)}
            />
          )
        ) : tab === "orders" ? (
          <MyOrders />
        ) : tab === "profile" ? (
          <ProfileTab />
        ) : null}
      </main>

      {/* Bottom tab bar — 5 tabs */}
      <nav className="tab-bar fixed bottom-0 left-0 right-0 z-20 max-w-2xl mx-auto">
        <div className="flex items-center justify-around px-1 py-1">
          {/* Home */}
          <button
            type="button"
            onClick={() => handleTabChange("home")}
            data-ocid="nav.home_tab"
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[60px] ${
              tab === "home"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home
              className={`h-5 w-5 transition-all ${
                tab === "home" ? "fill-primary/20 stroke-primary" : ""
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                tab === "home" ? "text-primary" : ""
              }`}
            >
              Home
            </span>
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={() => handleTabChange("search")}
            data-ocid="nav.search_tab"
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[60px] ${
              tab === "search"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search
              className={`h-5 w-5 transition-all ${
                tab === "search" ? "stroke-primary" : ""
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                tab === "search" ? "text-primary" : ""
              }`}
            >
              Search
            </span>
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={() => handleTabChange("cart")}
            data-ocid="cart.sheet"
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[60px] text-muted-foreground hover:text-foreground relative"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full gradient-food text-white text-[9px] font-bold flex items-center justify-center shadow-food">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Cart</span>
          </button>

          {/* Orders */}
          <button
            type="button"
            onClick={() => handleTabChange("orders")}
            data-ocid="nav.orders_tab"
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[60px] ${
              tab === "orders"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package
              className={`h-5 w-5 transition-all ${
                tab === "orders" ? "fill-primary/20 stroke-primary" : ""
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                tab === "orders" ? "text-primary" : ""
              }`}
            >
              Orders
            </span>
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => handleTabChange("profile")}
            data-ocid="nav.profile_tab"
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[60px] ${
              tab === "profile"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User
              className={`h-5 w-5 transition-all ${
                tab === "profile" ? "fill-primary/20 stroke-primary" : ""
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                tab === "profile" ? "text-primary" : ""
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* Cart Sheet */}
      <CartSheet />
    </div>
  );
}

export function CustomerApp() {
  return (
    <CartProvider>
      <CustomerAppInner />
    </CartProvider>
  );
}
