import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppUserRole, OrderStatus } from "../backend.d";
import type {
  MenuItem,
  MenuItemId,
  Order,
  OrderId,
  OrderItem,
  Restaurant,
  RestaurantId,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerUserProfile"] });
    },
  });
}

// ─── Restaurants ──────────────────────────────────────────────────────────────

export function useOpenRestaurants() {
  const { actor, isFetching } = useActor();
  return useQuery<Restaurant[]>({
    queryKey: ["openRestaurants"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOpenRestaurants();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrUpdateRestaurant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      cuisineType,
      description,
    }: {
      name: string;
      cuisineType: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createOrUpdateRestaurant(name, cuisineType, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openRestaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    },
  });
}

export function useSetRestaurantOpenStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isOpen: boolean) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.setRestaurantOpenStatus(isOpen);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openRestaurants"] });
    },
  });
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export function useRestaurantMenu(restaurantId: RestaurantId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<MenuItem[]>({
    queryKey: ["restaurantMenu", restaurantId?.toString()],
    queryFn: async () => {
      if (!actor || restaurantId === null) return [];
      return actor.getRestaurantMenu(restaurantId);
    },
    enabled: !!actor && !isFetching && restaurantId !== null,
  });
}

export function useListRestaurantMenuItems(restaurantId: RestaurantId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<MenuItem[]>({
    queryKey: ["menuItems", restaurantId?.toString()],
    queryFn: async () => {
      if (!actor || restaurantId === null) return [];
      return actor.listRestaurantMenuItems(restaurantId);
    },
    enabled: !!actor && !isFetching && restaurantId !== null,
  });
}

export function useAddMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      restaurantId,
      name,
      description,
      price,
      category,
    }: {
      restaurantId: RestaurantId;
      name: string;
      description: string;
      price: bigint;
      category: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addMenuItem(
        restaurantId,
        name,
        description,
        price,
        category,
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["menuItems", vars.restaurantId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["restaurantMenu", vars.restaurantId.toString()],
      });
    },
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      menuItemId: MenuItemId;
      name: string;
      description: string;
      price: bigint;
      category: string;
      isAvailable: boolean;
      restaurantId: RestaurantId;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateMenuItem(
        vars.menuItemId,
        vars.name,
        vars.description,
        vars.price,
        vars.category,
        vars.isAvailable,
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["menuItems", vars.restaurantId.toString()],
      });
    },
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      menuItemId,
    }: {
      menuItemId: MenuItemId;
      restaurantId: RestaurantId;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteMenuItem(menuItemId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["menuItems", vars.restaurantId.toString()],
      });
    },
  });
}

// ─── Orders (Customer) ────────────────────────────────────────────────────────

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      restaurantId,
      items,
      deliveryAddress,
    }: {
      restaurantId: RestaurantId;
      items: OrderItem[];
      deliveryAddress: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.placeOrder(restaurantId, items, deliveryAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useMyOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCancelOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: OrderId) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.cancelOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

// ─── Orders (Restaurant) ──────────────────────────────────────────────────────

export function useRestaurantOrders(restaurantId: RestaurantId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["restaurantOrders", restaurantId?.toString()],
    queryFn: async () => {
      if (!actor || restaurantId === null) return [];
      return actor.getRestaurantOrders(restaurantId);
    },
    enabled: !!actor && !isFetching && restaurantId !== null,
    refetchInterval: 15000,
  });
}

export function useAcceptRestaurantOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: OrderId) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.acceptRestaurantOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    },
  });
}

export function useRejectRestaurantOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: OrderId) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.rejectRestaurantOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: OrderId;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    },
  });
}

// ─── Orders (Rider) ───────────────────────────────────────────────────────────

export function useReadyOrdersWithoutRider() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["readyOrdersWithoutRider"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReadyOrdersWithoutRider();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useMyDeliveries() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["myDeliveries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyDeliveries();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useAcceptDelivery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: OrderId) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.acceptDelivery(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readyOrdersWithoutRider"] });
      queryClient.invalidateQueries({ queryKey: ["myDeliveries"] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: OrderId;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDeliveries"] });
      queryClient.invalidateQueries({ queryKey: ["readyOrdersWithoutRider"] });
    },
  });
}

// Re-export types for convenience
export type {
  MenuItem,
  Order,
  OrderItem,
  Restaurant,
  UserProfile,
  RestaurantId,
  MenuItemId,
  OrderId,
};
export { AppUserRole, OrderStatus };
