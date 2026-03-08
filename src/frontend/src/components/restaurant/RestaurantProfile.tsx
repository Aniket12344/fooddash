import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Save, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateOrUpdateRestaurant } from "../../hooks/useQueries";
import type { Restaurant } from "../../hooks/useQueries";

const CUISINE_OPTIONS = [
  "Italian",
  "Japanese",
  "Mexican",
  "Indian",
  "Chinese",
  "American",
  "Thai",
  "Mediterranean",
  "French",
  "Korean",
  "Vietnamese",
  "Greek",
  "Middle Eastern",
  "Brazilian",
  "Other",
];

interface RestaurantProfileProps {
  restaurant: Restaurant | null;
  onSaved: (restaurant: Restaurant) => void;
}

export function RestaurantProfile({
  restaurant,
  onSaved,
}: RestaurantProfileProps) {
  const { mutateAsync: save, isPending } = useCreateOrUpdateRestaurant();
  const [form, setForm] = useState({
    name: restaurant?.name ?? "",
    cuisineType: restaurant?.cuisineType ?? "",
    description: restaurant?.description ?? "",
  });

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name,
        cuisineType: restaurant.cuisineType,
        description: restaurant.description,
      });
    }
  }, [restaurant]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.cuisineType.trim()) {
      toast.error("Name and cuisine type are required");
      return;
    }
    try {
      const saved = await save({
        name: form.name.trim(),
        cuisineType: form.cuisineType.trim(),
        description: form.description.trim(),
      });
      onSaved(saved);
      toast.success(
        restaurant ? "Restaurant updated!" : "Restaurant created! 🎉",
      );
    } catch {
      toast.error("Failed to save restaurant");
    }
  };

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="mb-6">
        <h2 className="font-display font-black text-2xl">
          {restaurant ? "Restaurant Profile" : "Create Restaurant"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {restaurant
            ? "Update your restaurant's information"
            : "Set up your restaurant to start accepting orders"}
        </p>
      </div>

      {!restaurant && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl gradient-food flex items-center justify-center flex-shrink-0">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">Create your restaurant</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the details below to get started accepting orders
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label
            htmlFor="restaurant-name"
            className="text-sm font-medium mb-1.5 flex items-center gap-1.5"
          >
            <Store className="h-3.5 w-3.5 text-primary" />
            Restaurant Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="restaurant-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g., Mario's Kitchen"
            className="h-11 bg-card border-border"
            required
          />
        </div>

        <div>
          <Label
            htmlFor="cuisine-type"
            className="text-sm font-medium mb-1.5 block"
          >
            Cuisine Type <span className="text-destructive">*</span>
          </Label>
          <select
            id="cuisine-type"
            value={form.cuisineType}
            onChange={(e) => set("cuisineType", e.target.value)}
            className="w-full h-11 bg-card border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
            data-ocid="profile.select"
          >
            <option value="">Select cuisine type...</option>
            {CUISINE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label
            htmlFor="restaurant-desc"
            className="text-sm font-medium mb-1.5 block"
          >
            Description
          </Label>
          <Textarea
            id="restaurant-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Tell customers what makes your restaurant special..."
            className="bg-card border-border resize-none"
            rows={3}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold gradient-food border-0 text-white shadow-food"
          disabled={isPending || !form.name.trim() || !form.cuisineType.trim()}
          data-ocid="profile.save_button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {restaurant ? "Save Changes" : "Create Restaurant"}
            </>
          )}
        </Button>
      </form>

      {/* Current info preview */}
      {restaurant && (
        <div className="mt-6 p-4 bg-card border border-border rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Current Info
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{restaurant.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cuisine</span>
              <span className="font-medium">{restaurant.cuisineType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`font-bold text-xs ${
                  restaurant.isOpen ? "text-success" : "text-muted-foreground"
                }`}
              >
                {restaurant.isOpen ? "🟢 Open" : "🔴 Closed"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
