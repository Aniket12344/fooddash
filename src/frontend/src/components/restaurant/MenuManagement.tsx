import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAddMenuItem,
  useDeleteMenuItem,
  useListRestaurantMenuItems,
  useUpdateMenuItem,
} from "../../hooks/useQueries";
import type { MenuItem, RestaurantId } from "../../hooks/useQueries";
import { formatPrice } from "../../utils/format";
import { LoadingSpinner } from "../LoadingSpinner";

interface MenuManagementProps {
  restaurantId: RestaurantId;
}

interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  isAvailable: boolean;
  imageDataUrl?: string;
}

const DEFAULT_FORM: MenuItemFormData = {
  name: "",
  description: "",
  price: "",
  category: "",
  isAvailable: true,
  imageDataUrl: undefined,
};

function MenuItemForm({
  initial,
  onSubmit,
  isPending,
  onCancel,
  title,
}: {
  initial: MenuItemFormData;
  onSubmit: (data: MenuItemFormData) => void;
  isPending: boolean;
  onCancel: () => void;
  title: string;
}) {
  const [form, setForm] = useState(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (
    key: keyof MenuItemFormData,
    value: string | boolean | undefined,
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      set("imageDataUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.category.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    const price = Number.parseFloat(form.price);
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="item-name" className="text-sm font-medium mb-1.5 block">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="item-name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g., Margherita Pizza"
          className="bg-card border-border"
          required
        />
      </div>
      <div>
        <Label htmlFor="item-desc" className="text-sm font-medium mb-1.5 block">
          Description
        </Label>
        <Textarea
          id="item-desc"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the dish..."
          className="bg-card border-border resize-none"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label
            htmlFor="item-price"
            className="text-sm font-medium mb-1.5 block"
          >
            Price ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="item-price"
            type="number"
            step="0.01"
            min="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="9.99"
            className="bg-card border-border"
            required
          />
        </div>
        <div>
          <Label
            htmlFor="item-category"
            className="text-sm font-medium mb-1.5 block"
          >
            Category <span className="text-destructive">*</span>
          </Label>
          <Input
            id="item-category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="e.g., Mains"
            className="bg-card border-border"
            required
          />
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
        <Label
          htmlFor="item-available"
          className="text-sm font-medium cursor-pointer"
        >
          Available for ordering
        </Label>
        <Switch
          id="item-available"
          checked={form.isAvailable}
          onCheckedChange={(v) => set("isAvailable", v)}
        />
      </div>

      {/* Image Upload */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          Item Photo{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-sm"
            data-ocid="menu.upload_button"
          >
            <Camera className="h-4 w-4 text-muted-foreground" />
            {form.imageDataUrl ? "Change Photo" : "Upload Photo"}
          </button>
          {form.imageDataUrl && (
            <div className="flex items-center gap-2">
              <img
                src={form.imageDataUrl}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => set("imageDataUrl", undefined)}
                className="text-destructive/60 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          data-ocid="menu.dropzone"
        />
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-1.5" />
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 gradient-food border-0 text-white"
          disabled={isPending}
          data-ocid="menu.save_button"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              {title}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function MenuManagement({ restaurantId }: MenuManagementProps) {
  const { data: menuItems, isLoading } =
    useListRestaurantMenuItems(restaurantId);
  const { mutateAsync: addItem, isPending: isAdding } = useAddMenuItem();
  const { mutateAsync: updateItem, isPending: isUpdating } =
    useUpdateMenuItem();
  const { mutateAsync: deleteItem, isPending: isDeleting } =
    useDeleteMenuItem();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleAdd = async (data: MenuItemFormData) => {
    try {
      const priceCents = BigInt(
        Math.round(Number.parseFloat(data.price) * 100),
      );
      const newItem = await addItem({
        restaurantId,
        name: data.name.trim(),
        description: data.description.trim(),
        price: priceCents,
        category: data.category.trim(),
      });
      // Save image to localStorage
      if (data.imageDataUrl && newItem) {
        localStorage.setItem(
          `fooddash_menu_image_${restaurantId}_${newItem.id}`,
          data.imageDataUrl,
        );
      }
      setShowAddDialog(false);
      toast.success("Menu item added!");
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleEdit = async (data: MenuItemFormData) => {
    if (!editingItem) return;
    try {
      const priceCents = BigInt(
        Math.round(Number.parseFloat(data.price) * 100),
      );
      await updateItem({
        menuItemId: editingItem.id,
        name: data.name.trim(),
        description: data.description.trim(),
        price: priceCents,
        category: data.category.trim(),
        isAvailable: data.isAvailable,
        restaurantId,
      });
      // Save image to localStorage
      if (data.imageDataUrl) {
        localStorage.setItem(
          `fooddash_menu_image_${restaurantId}_${editingItem.id}`,
          data.imageDataUrl,
        );
      }
      setEditingItem(null);
      toast.success("Item updated!");
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleDelete = async (item: MenuItem) => {
    try {
      await deleteItem({ menuItemId: item.id, restaurantId });
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const categories = Array.from(
    new Set(menuItems?.map((i) => i.category) ?? []),
  ).sort();

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-black text-2xl">Menu</h2>
          <p className="text-sm text-muted-foreground">
            {(menuItems ?? []).length} item{menuItems?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="gradient-food border-0 text-white shadow-food gap-1.5"
          onClick={() => setShowAddDialog(true)}
          data-ocid="menu.add_button"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading menu..." />
      ) : (menuItems ?? []).length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="menu.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-display font-bold text-lg">No menu items yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first dish to get started
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {(menuItems ?? [])
                  .filter((i) => i.category === category)
                  .map((item, idx) => (
                    <motion.div
                      key={item.id.toString()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      data-ocid={`menu.item.${idx + 1}`}
                      className="bg-card border border-border rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Image thumbnail */}
                        {(() => {
                          const imgData = localStorage.getItem(
                            `fooddash_menu_image_${restaurantId}_${item.id}`,
                          );
                          return imgData ? (
                            <img
                              src={imgData}
                              alt={item.name}
                              className="w-14 h-14 rounded-lg object-cover border border-border flex-shrink-0"
                            />
                          ) : null;
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">
                              {item.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className={
                                item.isAvailable
                                  ? "border-success/40 text-success text-[10px] px-1.5"
                                  : "border-muted-foreground/40 text-muted-foreground text-[10px] px-1.5"
                              }
                            >
                              {item.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <p className="font-display font-bold text-primary mt-1">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditingItem(item)}
                            data-ocid="menu.edit_button"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive/60 hover:text-destructive"
                                data-ocid="menu.delete_button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-display font-black">
                                  Delete &ldquo;{item.name}&rdquo;?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This menu item will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="menu.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => handleDelete(item)}
                                  disabled={isDeleting}
                                  data-ocid="menu.confirm_button"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent
              className="bg-card border-border max-w-sm mx-4"
              data-ocid="menu.dialog"
            >
              <DialogHeader>
                <DialogTitle className="font-display font-black text-xl">
                  Add Menu Item
                </DialogTitle>
              </DialogHeader>
              <MenuItemForm
                initial={DEFAULT_FORM}
                onSubmit={handleAdd}
                isPending={isAdding}
                onCancel={() => setShowAddDialog(false)}
                title="Add Item"
              />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Edit dialog */}
      <AnimatePresence>
        {editingItem && (
          <Dialog
            open={!!editingItem}
            onOpenChange={(o) => !o && setEditingItem(null)}
          >
            <DialogContent
              className="bg-card border-border max-w-sm mx-4"
              data-ocid="menu.dialog"
            >
              <DialogHeader>
                <DialogTitle className="font-display font-black text-xl">
                  Edit Item
                </DialogTitle>
              </DialogHeader>
              <MenuItemForm
                initial={{
                  name: editingItem.name,
                  description: editingItem.description,
                  price: (Number(editingItem.price) / 100).toFixed(2),
                  category: editingItem.category,
                  isAvailable: editingItem.isAvailable,
                  imageDataUrl:
                    localStorage.getItem(
                      `fooddash_menu_image_${restaurantId}_${editingItem.id}`,
                    ) ?? undefined,
                }}
                onSubmit={handleEdit}
                isPending={isUpdating}
                onCancel={() => setEditingItem(null)}
                title="Save Changes"
              />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
