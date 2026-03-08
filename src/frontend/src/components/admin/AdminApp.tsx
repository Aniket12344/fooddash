import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bike,
  Eye,
  EyeOff,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AdminUser {
  principal: string;
  name: string;
  role: string;
  isActive: boolean;
  phone?: string;
  isAdmin?: boolean;
}

interface AdminRestaurant {
  id: number;
  name: string;
  cuisineType: string;
  owner: string;
  isOpen: boolean;
  isActive: boolean;
}

interface AdminRider {
  principal: string;
  name: string;
  phone: string;
  isActive: boolean;
  hasSelfie: boolean;
}

interface AdminOrder {
  id: string;
  restaurantName: string;
  customerName: string;
  amount: string;
  status: string;
  date: string;
}

// Sample seed data for demo
const SEED_RESTAURANTS: AdminRestaurant[] = [
  {
    id: 1,
    name: "Spice Garden",
    cuisineType: "Indian",
    owner: "owner1",
    isOpen: true,
    isActive: true,
  },
  {
    id: 2,
    name: "Pizza Palace",
    cuisineType: "Italian",
    owner: "owner2",
    isOpen: false,
    isActive: true,
  },
  {
    id: 3,
    name: "Dragon Wok",
    cuisineType: "Chinese",
    owner: "owner3",
    isOpen: true,
    isActive: true,
  },
];

const SEED_ORDERS: AdminOrder[] = [
  {
    id: "ORD001",
    restaurantName: "Spice Garden",
    customerName: "Priya S.",
    amount: "₹450",
    status: "delivered",
    date: "Today 2:30 PM",
  },
  {
    id: "ORD002",
    restaurantName: "Pizza Palace",
    customerName: "Rahul K.",
    amount: "₹320",
    status: "preparing",
    date: "Today 1:15 PM",
  },
  {
    id: "ORD003",
    restaurantName: "Dragon Wok",
    customerName: "Anita P.",
    amount: "₹680",
    status: "pickedUp",
    date: "Today 12:00 PM",
  },
  {
    id: "ORD004",
    restaurantName: "Spice Garden",
    customerName: "Vikram M.",
    amount: "₹250",
    status: "pending",
    date: "Today 11:45 AM",
  },
];

function initAdminData() {
  if (!localStorage.getItem("fooddash_admin_restaurants")) {
    localStorage.setItem(
      "fooddash_admin_restaurants",
      JSON.stringify(SEED_RESTAURANTS),
    );
  }
  if (!localStorage.getItem("fooddash_admin_orders")) {
    localStorage.setItem("fooddash_admin_orders", JSON.stringify(SEED_ORDERS));
  }
}

export function AdminApp() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  // SMS Config state
  const [smsApiKey, setSmsApiKey] = useState(
    () => localStorage.getItem("fooddash_sms_api_key") ?? "",
  );
  const [smsTemplateId, setSmsTemplateId] = useState(
    () => localStorage.getItem("fooddash_sms_template_id") ?? "",
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const isSmConfigured = !!localStorage.getItem("fooddash_sms_api_key");

  const handleSaveSmsConfig = () => {
    if (smsApiKey.trim()) {
      localStorage.setItem("fooddash_sms_api_key", smsApiKey.trim());
    } else {
      localStorage.removeItem("fooddash_sms_api_key");
    }
    if (smsTemplateId.trim()) {
      localStorage.setItem("fooddash_sms_template_id", smsTemplateId.trim());
    } else {
      localStorage.removeItem("fooddash_sms_template_id");
    }
    toast.success("SMS configuration saved");
  };

  useEffect(() => {
    initAdminData();
    loadData();
  }, []);

  const loadData = () => {
    setUsers(JSON.parse(localStorage.getItem("fooddash_users") ?? "[]"));
    setRestaurants(
      JSON.parse(localStorage.getItem("fooddash_admin_restaurants") ?? "[]"),
    );
    setRiders(
      JSON.parse(localStorage.getItem("fooddash_riders_admin") ?? "[]"),
    );
    setOrders(
      JSON.parse(localStorage.getItem("fooddash_admin_orders") ?? "[]"),
    );
  };

  const updateUser = (principal: string, update: Partial<AdminUser>) => {
    const updated = users.map((u) =>
      u.principal === principal ? { ...u, ...update } : u,
    );
    setUsers(updated);
    localStorage.setItem("fooddash_users", JSON.stringify(updated));
    toast.success("User updated");
  };

  const updateRestaurant = (id: number, update: Partial<AdminRestaurant>) => {
    const updated = restaurants.map((r) =>
      r.id === id ? { ...r, ...update } : r,
    );
    setRestaurants(updated);
    localStorage.setItem("fooddash_admin_restaurants", JSON.stringify(updated));
    toast.success("Restaurant updated");
  };

  const deleteRestaurant = (id: number) => {
    const updated = restaurants.filter((r) => r.id !== id);
    setRestaurants(updated);
    localStorage.setItem("fooddash_admin_restaurants", JSON.stringify(updated));
    toast.success("Restaurant removed");
  };

  const updateRider = (principal: string, update: Partial<AdminRider>) => {
    const updated = riders.map((r) =>
      r.principal === principal ? { ...r, ...update } : r,
    );
    setRiders(updated);
    localStorage.setItem("fooddash_riders_admin", JSON.stringify(updated));
    toast.success("Rider updated");
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-success border-success/40";
      case "preparing":
        return "text-primary border-primary/40";
      case "pickedUp":
        return "text-warning border-warning/40";
      case "pending":
        return "text-muted-foreground border-muted-foreground/40";
      default:
        return "text-muted-foreground border-border";
    }
  };

  return (
    <div className="px-4 pt-5 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-food flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage your FoodDash platform
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          {
            label: "Users",
            count: users.length,
            icon: Users,
            color: "text-primary",
          },
          {
            label: "Restaurants",
            count: restaurants.length,
            icon: Store,
            color: "text-warning",
          },
          {
            label: "Riders",
            count: riders.length,
            icon: Bike,
            color: "text-success",
          },
          {
            label: "Orders",
            count: orders.length,
            icon: Package,
            color: "text-[oklch(0.62_0.2_210)]",
          },
        ].map(({ label, count, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-3 text-center"
          >
            <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
            <p className={`font-display font-black text-xl ${color}`}>
              {count}
            </p>
            <p className="text-[9px] text-muted-foreground font-medium">
              {label}
            </p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full mb-4 grid grid-cols-5 h-10">
          <TabsTrigger
            value="users"
            className="text-xs"
            data-ocid="admin.users_tab"
          >
            <Users className="h-3.5 w-3.5 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="restaurants"
            className="text-xs"
            data-ocid="admin.restaurants_tab"
          >
            <Store className="h-3.5 w-3.5 mr-1" />
            Restaurants
          </TabsTrigger>
          <TabsTrigger
            value="riders"
            className="text-xs"
            data-ocid="admin.riders_tab"
          >
            <Bike className="h-3.5 w-3.5 mr-1" />
            Riders
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="text-xs"
            data-ocid="admin.orders_tab"
          >
            <Package className="h-3.5 w-3.5 mr-1" />
            Orders
          </TabsTrigger>
          <TabsTrigger
            value="sms"
            className="text-xs"
            data-ocid="admin.sms_config_tab"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            SMS
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          {users.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-ocid="admin.users_empty_state"
            >
              <Users className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="font-display font-bold text-lg">No users yet</p>
              <p className="text-sm text-muted-foreground">
                Users will appear here after signing up
              </p>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="admin.users_list">
              {users.map((user, idx) => (
                <div
                  key={user.principal}
                  data-ocid={`admin.users.item.${idx + 1}`}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full gradient-food flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {user.name}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-muted-foreground">
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select
                        value={user.role}
                        onValueChange={(v) =>
                          updateUser(user.principal, { role: v })
                        }
                      >
                        <SelectTrigger
                          className="h-7 w-28 text-xs"
                          data-ocid="admin.user_role_select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="restaurantOwner">
                            Restaurant
                          </SelectItem>
                          <SelectItem value="rider">Rider</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={(v) =>
                          updateUser(user.principal, { isActive: v })
                        }
                        data-ocid="admin.user_active_switch"
                      />
                    </div>
                  </div>
                  {!user.isActive && (
                    <div className="mt-2 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium">
                      Banned
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Restaurants Tab */}
        <TabsContent value="restaurants">
          <div className="space-y-2" data-ocid="admin.restaurants_list">
            {restaurants.map((restaurant, idx) => (
              <div
                key={restaurant.id}
                data-ocid={`admin.restaurants.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center flex-shrink-0">
                      <Store className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {restaurant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {restaurant.cuisineType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={
                        restaurant.isOpen
                          ? "border-success/40 text-success text-[10px]"
                          : "border-muted-foreground/40 text-muted-foreground text-[10px]"
                      }
                    >
                      {restaurant.isOpen ? "Open" : "Closed"}
                    </Badge>
                    <Switch
                      checked={restaurant.isActive}
                      onCheckedChange={(v) =>
                        updateRestaurant(restaurant.id, { isActive: v })
                      }
                      data-ocid="admin.restaurant_active_switch"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive"
                      onClick={() => deleteRestaurant(restaurant.id)}
                      data-ocid="admin.restaurant_delete_button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {!restaurant.isActive && (
                  <div className="mt-2 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium">
                    Deactivated
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Riders Tab */}
        <TabsContent value="riders">
          {riders.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-ocid="admin.riders_empty_state"
            >
              <Bike className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="font-display font-bold text-lg">No riders yet</p>
              <p className="text-sm text-muted-foreground">
                Riders will appear after completing their profile
              </p>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="admin.riders_list">
              {riders.map((rider, idx) => (
                <div
                  key={rider.principal}
                  data-ocid={`admin.riders.item.${idx + 1}`}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center text-success font-bold text-sm flex-shrink-0">
                        <Bike className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {rider.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rider.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {rider.hasSelfie ? (
                        <Badge
                          variant="outline"
                          className="border-success/40 text-success text-[10px]"
                        >
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-warning/40 text-warning text-[10px]"
                        >
                          No Selfie
                        </Badge>
                      )}
                      <Switch
                        checked={rider.isActive}
                        onCheckedChange={(v) =>
                          updateRider(rider.principal, { isActive: v })
                        }
                        data-ocid="admin.rider_active_switch"
                      />
                    </div>
                  </div>
                  {!rider.isActive && (
                    <div className="mt-2 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium">
                      Banned
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="overflow-x-auto" data-ocid="admin.orders_table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Restaurant</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, idx) => (
                  <TableRow
                    key={order.id}
                    data-ocid={`admin.orders.item.${idx + 1}`}
                  >
                    <TableCell className="text-xs font-mono">
                      {order.id}
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.restaurantName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {order.amount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${statusColor(order.status)}`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* SMS Config Tab */}
        <TabsContent value="sms">
          <div className="space-y-4">
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                MSG91 SMS Configuration
              </h3>
              <Badge
                variant="outline"
                className={
                  isSmConfigured
                    ? "border-success/40 text-success text-[10px]"
                    : "border-warning/40 text-warning text-[10px]"
                }
              >
                {isSmConfigured ? "✓ Configured" : "Demo Mode"}
              </Badge>
            </div>

            {/* Info box */}
            <div className="p-3 rounded-xl bg-muted/60 border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                OTP messages will be sent via{" "}
                <a
                  href="https://msg91.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline"
                >
                  MSG91
                </a>
                . Get your Auth Key from your MSG91 dashboard. If not
                configured, the app runs in <strong>demo mode</strong> — OTPs
                are not actually sent via SMS.
              </p>
            </div>

            {/* MSG91 Auth Key */}
            <div className="space-y-1.5">
              <Label htmlFor="sms-api-key" className="text-sm font-medium">
                MSG91 Auth Key
              </Label>
              <div className="relative">
                <Input
                  id="sms-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your MSG91 authkey"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  className="bg-card border-border pr-10"
                  data-ocid="admin.sms_apikey_input"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Stored locally in your browser. Never sent to any server.
              </p>
            </div>

            {/* MSG91 Template ID */}
            <div className="space-y-1.5">
              <Label htmlFor="sms-template-id" className="text-sm font-medium">
                OTP Template ID
              </Label>
              <Input
                id="sms-template-id"
                type="text"
                placeholder="Enter your MSG91 template ID"
                value={smsTemplateId}
                onChange={(e) => setSmsTemplateId(e.target.value)}
                className="bg-card border-border"
                data-ocid="admin.sms_template_input"
              />
              <p className="text-[10px] text-muted-foreground">
                Create an OTP template in your MSG91 dashboard and paste the ID
                here.
              </p>
            </div>

            {/* Save button */}
            <Button
              className="w-full h-11 gradient-food border-0 text-white font-semibold"
              onClick={handleSaveSmsConfig}
              data-ocid="admin.sms_config_save_button"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Save Config
            </Button>

            {/* Quick guide */}
            <div className="p-3 rounded-xl bg-card border border-border space-y-2">
              <p className="text-xs font-semibold">Quick Setup Guide</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Sign up at{" "}
                  <a
                    href="https://msg91.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    msg91.com
                  </a>
                </li>
                <li>Go to API → Auth Key and copy your key</li>
                <li>Create an OTP template and note the Template ID</li>
                <li>Paste both values above and click Save</li>
                <li>Users will now receive real OTPs via SMS</li>
              </ol>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer with Shopping bag accent */}
      <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
        <ShoppingBag className="h-3.5 w-3.5" />
        <p className="text-xs">FoodDash Admin · Powered by Internet Computer</p>
      </div>
    </div>
  );
}
