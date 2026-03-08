import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Order {
    id: OrderId;
    status: OrderStatus;
    deliveryAddress: string;
    createdAt: bigint;
    riderId?: Principal;
    restaurantId: RestaurantId;
    updatedAt: bigint;
    totalAmount: bigint;
    customerId: Principal;
    items: Array<OrderItem>;
}
export interface MenuItem {
    id: MenuItemId;
    name: string;
    isAvailable: boolean;
    description: string;
    restaurantId: RestaurantId;
    category: string;
    price: bigint;
}
export type MenuItemId = bigint;
export interface OrderItem {
    name: string;
    quantity: bigint;
    price: bigint;
    menuItemId: MenuItemId;
}
export type RestaurantId = bigint;
export interface Restaurant {
    id: RestaurantId;
    owner: Principal;
    name: string;
    cuisineType: string;
    description: string;
    isOpen: boolean;
}
export type OrderId = bigint;
export interface UserProfile {
    name: string;
    role: AppUserRole;
}
export enum AppUserRole {
    customer = "customer",
    restaurantOwner = "restaurantOwner",
    rider = "rider"
}
export enum OrderStatus {
    readyForPickup = "readyForPickup",
    preparing = "preparing",
    cancelled = "cancelled",
    pending = "pending",
    pickedUp = "pickedUp",
    delivered = "delivered",
    accepted = "accepted"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptDelivery(orderId: OrderId): Promise<void>;
    acceptRestaurantOrder(orderId: OrderId): Promise<void>;
    addMenuItem(restaurantId: RestaurantId, name: string, description: string, price: bigint, category: string): Promise<MenuItem>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelOrder(orderId: OrderId): Promise<void>;
    createOrUpdateRestaurant(name: string, cuisineType: string, description: string): Promise<Restaurant>;
    deleteMenuItem(menuItemId: MenuItemId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyDeliveries(): Promise<Array<Order>>;
    getMyOrders(): Promise<Array<Order>>;
    getOpenRestaurants(): Promise<Array<Restaurant>>;
    getReadyOrdersWithoutRider(): Promise<Array<Order>>;
    getRestaurantMenu(restaurantId: RestaurantId): Promise<Array<MenuItem>>;
    getRestaurantOrders(restaurantId: RestaurantId): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listRestaurantMenuItems(restaurantId: RestaurantId): Promise<Array<MenuItem>>;
    placeOrder(restaurantId: RestaurantId, items: Array<OrderItem>, deliveryAddress: string): Promise<Order>;
    rejectRestaurantOrder(orderId: OrderId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setRestaurantOpenStatus(isOpen: boolean): Promise<void>;
    updateMenuItem(menuItemId: MenuItemId, name: string, description: string, price: bigint, category: string, isAvailable: boolean): Promise<void>;
    updateOrderStatus(orderId: OrderId, status: OrderStatus): Promise<void>;
}
