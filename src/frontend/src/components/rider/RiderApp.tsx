import { Bike, MapPin, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { AvailableDeliveries } from "./AvailableDeliveries";
import { EarningsTab } from "./EarningsTab";
import { MyDeliveries } from "./MyDeliveries";
import { RiderProfile } from "./RiderProfile";
import type { RiderProfileData } from "./RiderProfile";

type RiderTab = "available" | "deliveries" | "earnings" | "profile";

const PROFILE_KEY = "fooddash_rider_profile";

export function RiderApp() {
  const [tab, setTab] = useState<RiderTab>("available");
  const [riderProfile, setRiderProfile] = useState<RiderProfileData | null>(
    null,
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        setRiderProfile(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleProfileSaved = (data: RiderProfileData) => {
    setRiderProfile(data);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 overflow-y-auto">
        {tab === "available" && (
          <AvailableDeliveries
            isProfileComplete={riderProfile?.isComplete ?? false}
            onGoToProfile={() => setTab("profile")}
          />
        )}
        {tab === "deliveries" && <MyDeliveries />}
        {tab === "earnings" && <EarningsTab />}
        {tab === "profile" && (
          <RiderProfile
            profileData={riderProfile}
            onProfileSaved={handleProfileSaved}
          />
        )}
      </main>

      {/* Bottom tab bar */}
      <nav className="tab-bar fixed bottom-0 left-0 right-0 z-20 max-w-2xl mx-auto">
        <div className="flex items-center justify-around px-4 py-2">
          <button
            type="button"
            onClick={() => setTab("available")}
            data-ocid="nav.available_tab"
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
              tab === "available"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin
              className={`h-5 w-5 ${tab === "available" ? "fill-primary/20" : ""}`}
            />
            <span className="text-[10px] font-semibold">Available</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("deliveries")}
            data-ocid="nav.deliveries_tab"
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
              tab === "deliveries"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bike
              className={`h-5 w-5 ${tab === "deliveries" ? "fill-primary/20" : ""}`}
            />
            <span className="text-[10px] font-semibold">Deliveries</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("earnings")}
            data-ocid="nav.earnings_tab"
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
              tab === "earnings"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet
              className={`h-5 w-5 ${tab === "earnings" ? "fill-primary/20" : ""}`}
            />
            <span className="text-[10px] font-semibold">Earnings</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("profile")}
            data-ocid="nav.profile_tab"
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all relative ${
              tab === "profile"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User
              className={`h-5 w-5 ${tab === "profile" ? "fill-primary/20" : ""}`}
            />
            <span className="text-[10px] font-semibold">Profile</span>
            {/* Dot indicator if selfie missing */}
            {!riderProfile?.isComplete && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warning" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
