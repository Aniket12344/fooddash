import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Filter,
  MapPin,
  Percent,
  Search,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "../../hooks/useQueries";
import { useOpenRestaurants } from "../../hooks/useQueries";
import { LoadingSpinner } from "../LoadingSpinner";

interface RestaurantListProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  autoFocusSearch?: boolean;
  onSearchFocused?: () => void;
}

const CATEGORIES = [
  { label: "All", emoji: "🍽️", color: "bg-red-50 text-red-600 border-red-100" },
  {
    label: "Pizza",
    emoji: "🍕",
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    label: "Burgers",
    emoji: "🍔",
    color: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  {
    label: "Chinese",
    emoji: "🥡",
    color: "bg-red-50 text-red-700 border-red-100",
  },
  {
    label: "Indian",
    emoji: "🍛",
    color: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    label: "Salad",
    emoji: "🥗",
    color: "bg-green-50 text-green-700 border-green-100",
  },
  {
    label: "Breakfast",
    emoji: "🥐",
    color: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    label: "Desserts",
    emoji: "🍰",
    color: "bg-pink-50 text-pink-700 border-pink-100",
  },
];

const PROMO_BANNERS = [
  {
    id: 1,
    title: "50% OFF",
    subtitle: "On Your First Order",
    cta: "Order Now",
    emoji: "🍕",
    bg: "from-red-500 to-red-700",
  },
  {
    id: 2,
    title: "Free Delivery",
    subtitle: "On Orders Above ₹199",
    cta: "Explore",
    emoji: "🛵",
    bg: "from-orange-500 to-red-500",
  },
  {
    id: 3,
    title: "₹30 OFF",
    subtitle: "Use Code FOODDASH",
    cta: "Claim Now",
    emoji: "🎉",
    bg: "from-rose-500 to-pink-600",
  },
];

const DISCOUNT_LABELS = [
  "34% off on all items",
  "Up to 40% off",
  "20% off on first order",
  "Buy 2 Get 1 Free",
  "Flat ₹50 off",
  "Up to 30% off",
];

const DELIVERY_TIMES = [
  "20-30 Mins",
  "25-40 Mins",
  "30-45 Mins",
  "15-25 Mins",
  "35-50 Mins",
];

const RATINGS = [4.1, 4.3, 4.5, 4.6, 4.7, 4.8, 3.9, 4.2];

function getSeededItem<T>(arr: T[], id: bigint): T {
  return arr[Number(id) % arr.length];
}

function RestaurantCard({
  restaurant,
  onClick,
  index,
}: {
  restaurant: Restaurant;
  onClick: () => void;
  index: number;
}) {
  const discount = getSeededItem(DISCOUNT_LABELS, restaurant.id);
  const deliveryTime = getSeededItem(DELIVERY_TIMES, restaurant.id);
  const rating = getSeededItem(RATINGS, restaurant.id);

  // Generate a colorful placeholder image based on cuisine
  const cuisineColors: Record<string, string> = {
    Italian: "from-red-400 to-orange-400",
    Japanese: "from-pink-400 to-rose-500",
    Mexican: "from-orange-400 to-amber-500",
    Indian: "from-amber-400 to-yellow-500",
    Chinese: "from-red-500 to-red-600",
    American: "from-blue-400 to-indigo-500",
    Thai: "from-green-400 to-emerald-500",
    Mediterranean: "from-teal-400 to-cyan-500",
  };
  const gradientClass =
    cuisineColors[restaurant.cuisineType] ?? "from-primary to-red-700";

  const cuisineEmojis: Record<string, string> = {
    Italian: "🍝",
    Japanese: "🍱",
    Mexican: "🌮",
    Indian: "🍛",
    Chinese: "🥡",
    American: "🍔",
    Thai: "🍜",
    Mediterranean: "🫒",
  };
  const emoji = cuisineEmojis[restaurant.cuisineType] ?? "🍽️";

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      data-ocid={`restaurant.item.${index + 1}`}
      className="w-full text-left"
      type="button"
    >
      <div className="bg-card rounded-2xl overflow-hidden shadow-card card-hover border border-border/60">
        {/* Food image area */}
        <div className="relative h-40 overflow-hidden">
          <div
            className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
          >
            <span className="text-6xl opacity-80">{emoji}</span>
          </div>

          {/* Discount badge (bottom-left) */}
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-food">
              <Percent className="h-2.5 w-2.5" />
              {discount}
            </span>
          </div>

          {/* Delivery time badge (bottom-right) */}
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center gap-1 bg-foreground/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
              {deliveryTime}
            </span>
          </div>
        </div>

        {/* Info area */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-base text-foreground truncate leading-tight">
                {restaurant.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {restaurant.cuisineType} · Fast Food
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
              <Star className="h-3 w-3 fill-green-600 text-green-600" />
              <span className="text-xs font-bold text-green-700">{rating}</span>
            </div>
          </div>

          {/* Price + distance row */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">₹200 for two</span>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              1.2 km
            </span>
            {!restaurant.isOpen && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs font-medium text-destructive">
                  Closed
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export function RestaurantList({
  onSelectRestaurant,
  autoFocusSearch,
  onSearchFocused,
}: RestaurantListProps) {
  const { data: restaurants, isLoading } = useOpenRestaurants();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [promoBanner, setPromoBanner] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusSearch && searchRef.current) {
      searchRef.current.focus();
      onSearchFocused?.();
    }
  }, [autoFocusSearch, onSearchFocused]);

  // Auto-advance promo banner
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoBanner((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const filtered = (restaurants ?? []).filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisineType.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      r.cuisineType.toLowerCase().includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-28 bg-background">
      {/* Top header bar */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Delivery to
            </p>
            <button
              type="button"
              className="flex items-center gap-1 mt-0.5"
              data-ocid="home.location_button"
            >
              <span className="font-display font-black text-base text-primary leading-tight">
                India
              </span>
              <ChevronDown className="h-4 w-4 text-primary" />
            </button>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 border border-primary/30 bg-primary/5 text-primary rounded-full px-3 py-1.5 text-xs font-bold hover:bg-primary/10 transition-colors"
            data-ocid="home.offers_button"
          >
            <Percent className="h-3 w-3" />
            Offers
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search for restaurants, cuisines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-muted/60 border-transparent focus:border-primary/40 focus:bg-white rounded-xl text-sm"
            data-ocid="nav.search_input"
          />
        </div>
      </div>

      {/* Promo banner carousel */}
      {!search && (
        <div className="px-4 pt-4 pb-2">
          <div className="relative overflow-hidden rounded-2xl">
            {PROMO_BANNERS.map((banner, idx) => (
              <div
                key={banner.id}
                className={`transition-all duration-500 ${
                  idx === promoBanner ? "block" : "hidden"
                }`}
              >
                <div
                  className={`bg-gradient-to-r ${banner.bg} rounded-2xl p-5 flex items-center justify-between min-h-[120px] relative overflow-hidden`}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white" />
                    <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-white" />
                  </div>

                  {/* Text */}
                  <div className="relative z-10">
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-1">
                      Limited Time
                    </p>
                    <h3 className="font-display font-black text-white text-2xl leading-tight">
                      {banner.title}
                    </h3>
                    <p className="text-white/90 text-sm font-medium mt-1">
                      {banner.subtitle}
                    </p>
                    <button
                      type="button"
                      className="mt-3 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
                    >
                      {banner.cta} →
                    </button>
                  </div>

                  {/* Emoji */}
                  <div className="relative z-10 text-5xl">{banner.emoji}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {PROMO_BANNERS.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setPromoBanner(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === promoBanner
                    ? "w-5 h-1.5 bg-primary"
                    : "w-1.5 h-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categories section */}
      {!search && (
        <div className="pt-4 pb-2">
          <div className="px-4 mb-3">
            <h3 className="font-display font-bold text-base text-foreground">
              Categories
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse stores by category
            </p>
          </div>

          <div className="flex gap-2.5 px-4 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCategory(cat.label)}
                data-ocid="category.tab"
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                  activeCategory === cat.label
                    ? "border-primary bg-primary/5 shadow-sm scale-[1.03]"
                    : `${cat.color} border`
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span
                  className={`text-[10px] font-bold whitespace-nowrap ${
                    activeCategory === cat.label
                      ? "text-primary"
                      : "text-foreground/70"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Restaurants section */}
      <div className="px-4 pt-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-foreground">
              {search
                ? "Search Results"
                : activeCategory === "All"
                  ? "All Restaurants Nearby"
                  : `${activeCategory} Restaurants`}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}{" "}
              {search ? "found" : "nearby"}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 border border-border rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            data-ocid="restaurant.filter.button"
          >
            <Filter className="h-3 w-3" />
            Sort/Filter
          </button>
        </div>
      </div>

      {/* Restaurant list */}
      {isLoading ? (
        <div className="px-4">
          <LoadingSpinner message="Finding restaurants near you..." />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 px-4 text-center"
          data-ocid="restaurant.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg mb-1">
            No restaurants found
          </h3>
          <p className="text-sm text-muted-foreground">
            {search
              ? "Try a different search term"
              : "No restaurants are open right now. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {filtered.map((restaurant, idx) => (
            <RestaurantCard
              key={restaurant.id.toString()}
              restaurant={restaurant}
              onClick={() => onSelectRestaurant(restaurant)}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
