import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type RestaurantId = Nat;
  type MenuItemId = Nat;
  type OrderId = Nat;

  public type AppUserRole = {
    #customer;
    #restaurantOwner;
    #rider;
  };

  public type UserProfile = {
    name : Text;
    role : AppUserRole;
  };

  public type Restaurant = {
    id : RestaurantId;
    name : Text;
    cuisineType : Text;
    description : Text;
    owner : Principal;
    isOpen : Bool;
  };

  public type MenuItem = {
    id : MenuItemId;
    restaurantId : RestaurantId;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
    isAvailable : Bool;
  };

  public type OrderItem = {
    menuItemId : MenuItemId;
    name : Text;
    price : Nat;
    quantity : Nat;
  };

  public type OrderStatus = {
    #pending;
    #accepted;
    #preparing;
    #readyForPickup;
    #pickedUp;
    #delivered;
    #cancelled;
  };

  public type Order = {
    id : OrderId;
    customerId : Principal;
    restaurantId : RestaurantId;
    riderId : ?Principal;
    items : [OrderItem];
    status : OrderStatus;
    totalAmount : Nat;
    deliveryAddress : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let restaurants = Map.empty<RestaurantId, Restaurant>();
  let menuItems = Map.empty<MenuItemId, MenuItem>();
  let orders = Map.empty<OrderId, Order>();

  var nextRestaurantId : Nat = 1;
  var nextMenuItemId : Nat = 1;
  var nextOrderId : Nat = 1;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Helper function to check user role
  func hasRole(caller : Principal, requiredRole : AppUserRole) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) { profile.role == requiredRole };
    };
  };

  // Restaurant functions
  public shared ({ caller }) func createOrUpdateRestaurant(name : Text, cuisineType : Text, description : Text) : async Restaurant {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can manage restaurants");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can create/update restaurants");
    };

    let id = switch (restaurants.values().find(func(r : Restaurant) : Bool { r.owner == caller })) {
      case (?existing) { existing.id };
      case (null) {
        let currentId = nextRestaurantId;
        nextRestaurantId += 1;
        currentId;
      };
    };
    let restaurant = {
      id;
      name;
      cuisineType;
      description;
      owner = caller;
      isOpen = true;
    };
    restaurants.add(id, restaurant);
    restaurant;
  };

  public shared ({ caller }) func setRestaurantOpenStatus(isOpen : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can manage restaurants");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can update restaurant status");
    };

    let restaurant = switch (restaurants.values().find(func(r : Restaurant) : Bool { r.owner == caller })) {
      case (null) { Runtime.trap("Restaurant not found") };
      case (?r) { r };
    };
    let updated = { restaurant with isOpen };
    restaurants.add(restaurant.id, updated);
  };

  public query func getOpenRestaurants() : async [Restaurant] {
    restaurants.values().toArray().filter(func(r : Restaurant) : Bool { r.isOpen });
  };

  // Menu functions
  public shared ({ caller }) func addMenuItem(restaurantId : RestaurantId, name : Text, description : Text, price : Nat, category : Text) : async MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can manage menu items");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can add menu items");
    };

    switch (restaurants.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant not found") };
      case (?restaurant) {
        if (restaurant.owner != caller) { 
          Runtime.trap("Unauthorized: Only the restaurant owner can add menu items") 
        };
      };
    };

    let currentId = nextMenuItemId;
    nextMenuItemId += 1;
    let menuItem = {
      id = currentId;
      restaurantId;
      name;
      description;
      price;
      category;
      isAvailable = true;
    };
    menuItems.add(currentId, menuItem);
    menuItem;
  };

  public shared ({ caller }) func updateMenuItem(menuItemId : MenuItemId, name : Text, description : Text, price : Nat, category : Text, isAvailable : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can manage menu items");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can update menu items");
    };

    switch (menuItems.get(menuItemId)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?item) {
        switch (restaurants.get(item.restaurantId)) {
          case (null) { Runtime.trap("Restaurant not found") };
          case (?restaurant) {
            if (restaurant.owner != caller) { 
              Runtime.trap("Unauthorized: Only the restaurant owner can update menu items") 
            };
          };
        };
        let updated = { 
          item with 
          name; 
          description; 
          price; 
          category; 
          isAvailable 
        };
        menuItems.add(menuItemId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(menuItemId : MenuItemId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can manage menu items");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can delete menu items");
    };

    switch (menuItems.get(menuItemId)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?item) {
        switch (restaurants.get(item.restaurantId)) {
          case (null) { Runtime.trap("Restaurant not found") };
          case (?restaurant) {
            if (restaurant.owner != caller) { 
              Runtime.trap("Unauthorized: Only the restaurant owner can delete menu items") 
            };
          };
        };
      };
    };

    menuItems.remove(menuItemId);
  };

  public query func getRestaurantMenu(restaurantId : RestaurantId) : async [MenuItem] {
    menuItems.values().toArray().filter(
      func(item : MenuItem) : Bool { item.restaurantId == restaurantId and item.isAvailable }
    );
  };

  public query ({ caller }) func listRestaurantMenuItems(restaurantId : RestaurantId) : async [MenuItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list all menu items");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can list all menu items");
    };

    switch (restaurants.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant not found") };
      case (?restaurant) {
        if (restaurant.owner != caller) { 
          Runtime.trap("Unauthorized: Only the restaurant owner can list all menu items") 
        };
      };
    };

    menuItems.values().toArray().filter(
      func(item : MenuItem) : Bool { item.restaurantId == restaurantId }
    );
  };

  // Order functions
  public shared ({ caller }) func placeOrder(restaurantId : RestaurantId, items : [OrderItem], deliveryAddress : Text) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can place orders");
    };
    if (not hasRole(caller, #customer)) {
      Runtime.trap("Unauthorized: Only customers can place orders");
    };

    switch (restaurants.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant not found") };
      case (?r) {
        if (not r.isOpen) { Runtime.trap("Restaurant is closed") };
      };
    };

    let totalAmount = items.foldLeft(
      0, 
      func(acc : Nat, item : OrderItem) : Nat { acc + (item.price * item.quantity) }
    );
    let currentId = nextOrderId;
    nextOrderId += 1;

    let order = {
      id = currentId;
      customerId = caller;
      restaurantId;
      riderId = null;
      items;
      status = #pending;
      totalAmount;
      deliveryAddress;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    orders.add(currentId, order);
    order;
  };

  public query ({ caller }) func getMyOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view orders");
    };
    if (not hasRole(caller, #customer)) {
      Runtime.trap("Unauthorized: Only customers can view their orders");
    };

    orders.values().toArray().filter(
      func(order : Order) : Bool { order.customerId == caller }
    );
  };

  public shared ({ caller }) func cancelOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can cancel orders");
    };
    if (not hasRole(caller, #customer)) {
      Runtime.trap("Unauthorized: Only customers can cancel orders");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.customerId != caller) {
          Runtime.trap("Unauthorized: Can only cancel your own orders");
        };
        if (order.status != #pending) {
          Runtime.trap("Can only cancel pending orders");
        };
        let updated = { order with status = #cancelled; updatedAt = Time.now() };
        orders.add(orderId, updated);
      };
    };
  };

  public query ({ caller }) func getRestaurantOrders(restaurantId : RestaurantId) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view restaurant orders");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can view restaurant orders");
    };

    switch (restaurants.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant not found") };
      case (?restaurant) {
        if (restaurant.owner != caller) { 
          Runtime.trap("Unauthorized: Only the restaurant owner can view orders") 
        };
      };
    };

    orders.values().toArray().filter(
      func(order : Order) : Bool { order.restaurantId == restaurantId }
    );
  };

  public shared ({ caller }) func acceptRestaurantOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can accept orders");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can accept orders");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        switch (restaurants.get(order.restaurantId)) {
          case (null) { Runtime.trap("Restaurant not found") };
          case (?restaurant) {
            if (restaurant.owner != caller) { 
              Runtime.trap("Unauthorized: Only the restaurant owner can accept orders") 
            };
          };
        };
        if (order.status != #pending) {
          Runtime.trap("Can only accept pending orders");
        };
        let updated = { order with status = #accepted; updatedAt = Time.now() };
        orders.add(orderId, updated);
      };
    };
  };

  public shared ({ caller }) func rejectRestaurantOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can reject orders");
    };
    if (not hasRole(caller, #restaurantOwner)) {
      Runtime.trap("Unauthorized: Only restaurant owners can reject orders");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        switch (restaurants.get(order.restaurantId)) {
          case (null) { Runtime.trap("Restaurant not found") };
          case (?restaurant) {
            if (restaurant.owner != caller) { 
              Runtime.trap("Unauthorized: Only the restaurant owner can reject orders") 
            };
          };
        };
        if (order.status != #pending) {
          Runtime.trap("Can only reject pending orders");
        };
        let updated = { order with status = #cancelled; updatedAt = Time.now() };
        orders.add(orderId, updated);
      };
    };
  };

  public shared ({ caller }) func updateOrderStatus(orderId : OrderId, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update order status");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        switch (status) {
          case (#preparing or #readyForPickup) {
            if (not hasRole(caller, #restaurantOwner)) {
              Runtime.trap("Unauthorized: Only restaurant owners can update to this status");
            };
            switch (restaurants.get(order.restaurantId)) {
              case (null) { Runtime.trap("Restaurant not found") };
              case (?restaurant) {
                if (restaurant.owner != caller) { 
                  Runtime.trap("Unauthorized: Only the restaurant owner can update order status") 
                };
              };
            };
            if (status == #preparing and order.status != #accepted) {
              Runtime.trap("Can only set to preparing from accepted status");
            };
            if (status == #readyForPickup and order.status != #preparing) {
              Runtime.trap("Can only set to readyForPickup from preparing status");
            };
          };
          case (#pickedUp or #delivered) {
            if (not hasRole(caller, #rider)) {
              Runtime.trap("Unauthorized: Only riders can update to this status");
            };
            if (order.riderId != ?caller) { 
              Runtime.trap("Unauthorized: Only the assigned rider can update order status") 
            };
            if (status == #pickedUp and order.status != #readyForPickup) {
              Runtime.trap("Can only set to pickedUp from readyForPickup status");
            };
            if (status == #delivered and order.status != #pickedUp) {
              Runtime.trap("Can only set to delivered from pickedUp status");
            };
          };
          case (_) { Runtime.trap("Invalid status update") };
        };

        let updated = { order with status; updatedAt = Time.now() };
        orders.add(orderId, updated);
      };
    };
  };

  public query ({ caller }) func getReadyOrdersWithoutRider() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view available orders");
    };
    if (not hasRole(caller, #rider)) {
      Runtime.trap("Unauthorized: Only riders can view available orders");
    };

    orders.values().toArray().filter(
      func(order : Order) : Bool { order.status == #readyForPickup and order.riderId == null }
    );
  };

  public shared ({ caller }) func acceptDelivery(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can accept deliveries");
    };
    if (not hasRole(caller, #rider)) {
      Runtime.trap("Unauthorized: Only riders can accept deliveries");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.status != #readyForPickup or order.riderId != null) {
          Runtime.trap("Order is not available for pickup");
        };
        let updated = { order with riderId = ?caller; updatedAt = Time.now() };
        orders.add(orderId, updated);
      };
    };
  };

  public query ({ caller }) func getMyDeliveries() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view deliveries");
    };
    if (not hasRole(caller, #rider)) {
      Runtime.trap("Unauthorized: Only riders can view their deliveries");
    };

    orders.values().toArray().filter(
      func(order : Order) : Bool { order.riderId == ?caller }
    );
  };

  // Seed data on first deploy
  system func preupgrade() {};

  system func postupgrade() {
    if (nextRestaurantId == 1) {
      seedData();
    };
  };

  func seedData() {
    // Create sample restaurants
    let restaurant1 = {
      id = 1;
      name = "Pizza Palace";
      cuisineType = "Italian";
      description = "Authentic Italian pizza and pasta";
      owner = Principal.fromText("aaaaa-aa");
      isOpen = true;
    };
    restaurants.add(1, restaurant1);

    let restaurant2 = {
      id = 2;
      name = "Sushi Express";
      cuisineType = "Japanese";
      description = "Fresh sushi and Japanese cuisine";
      owner = Principal.fromText("aaaaa-aa");
      isOpen = true;
    };
    restaurants.add(2, restaurant2);

    let restaurant3 = {
      id = 3;
      name = "Burger Barn";
      cuisineType = "American";
      description = "Gourmet burgers and fries";
      owner = Principal.fromText("aaaaa-aa");
      isOpen = true;
    };
    restaurants.add(3, restaurant3);

    nextRestaurantId := 4;

    // Add menu items for Pizza Palace
    menuItems.add(1, {
      id = 1;
      restaurantId = 1;
      name = "Margherita Pizza";
      description = "Classic tomato and mozzarella";
      price = 1200;
      category = "Pizza";
      isAvailable = true;
    });

    menuItems.add(2, {
      id = 2;
      restaurantId = 1;
      name = "Pepperoni Pizza";
      description = "Loaded with pepperoni";
      price = 1400;
      category = "Pizza";
      isAvailable = true;
    });

    // Add menu items for Sushi Express
    menuItems.add(3, {
      id = 3;
      restaurantId = 2;
      name = "California Roll";
      description = "Crab, avocado, cucumber";
      price = 800;
      category = "Sushi";
      isAvailable = true;
    });

    menuItems.add(4, {
      id = 4;
      restaurantId = 2;
      name = "Salmon Nigiri";
      description = "Fresh salmon on rice";
      price = 600;
      category = "Sushi";
      isAvailable = true;
    });

    // Add menu items for Burger Barn
    menuItems.add(5, {
      id = 5;
      restaurantId = 3;
      name = "Classic Burger";
      description = "Beef patty with lettuce and tomato";
      price = 1000;
      category = "Burgers";
      isAvailable = true;
    });

    menuItems.add(6, {
      id = 6;
      restaurantId = 3;
      name = "Cheese Fries";
      description = "Crispy fries with melted cheese";
      price = 500;
      category = "Sides";
      isAvailable = true;
    });

    nextMenuItemId := 7;
  };
};
