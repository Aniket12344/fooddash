import { MapPin, Navigation } from "lucide-react";

interface DeliveryMapProps {
  restaurantAddress: string;
  deliveryAddress: string;
  orderId: string | bigint;
}

export function DeliveryMap({
  restaurantAddress,
  deliveryAddress,
}: DeliveryMapProps) {
  // Use delivery address as the map query
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(deliveryAddress)}&output=embed&z=14`;

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Map iframe */}
      <div style={{ height: "280px", width: "100%", position: "relative" }}>
        <iframe
          title="Delivery Map"
          src={mapUrl}
          style={{ width: "100%", height: "100%", border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          data-ocid="order.map_marker"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2 bg-muted/30 border-t border-border flex-wrap">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: "oklch(0.58 0.24 25)" }}
          />
          <span className="text-xs text-muted-foreground font-medium">
            Restaurant
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: "oklch(0.62 0.2 210)" }}
          />
          <span className="text-xs text-muted-foreground font-medium">
            Delivery
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {deliveryAddress}
          </span>
        </div>
        {restaurantAddress && (
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {restaurantAddress}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
