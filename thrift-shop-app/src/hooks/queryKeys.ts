/**
 * React Query Keys
 * Centralized query key management for cache invalidation
 */

export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    profile: () => [...queryKeys.users.all, "profile"] as const,
    savedItems: () => [...queryKeys.users.all, "saved"] as const,
    orders: (params?: { page?: number; limit?: number }) =>
      [...queryKeys.users.all, "orders", params] as const,
    address: () => [...queryKeys.users.all, "address"] as const,
    preferences: () => [...queryKeys.users.all, "preferences"] as const,
  },

  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
    featured: (limit?: number) =>
      [...queryKeys.products.all, "featured", limit] as const,
    related: (id: string, limit?: number) =>
      [...queryKeys.products.all, "related", id, limit] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (includeInactive?: boolean) =>
      [...queryKeys.categories.lists(), { includeInactive }] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (slug: string) =>
      [...queryKeys.categories.details(), slug] as const,
  },

  // Vendors
  vendors: {
    all: ["vendors"] as const,
    lists: () => [...queryKeys.vendors.all, "list"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.vendors.lists(), params] as const,
    details: () => [...queryKeys.vendors.all, "detail"] as const,
    detail: (name: string) => [...queryKeys.vendors.details(), name] as const,
    products: (name: string, params?: Record<string, unknown>) =>
      [...queryKeys.vendors.all, "products", name, params] as const,
    reviews: (name: string, params?: Record<string, unknown>) =>
      [...queryKeys.vendors.all, "reviews", name, params] as const,
    // Vendor dashboard (me)
    me: {
      all: ["vendors", "me"] as const,
      profile: () => [...queryKeys.vendors.me.all, "profile"] as const,
      stats: () => [...queryKeys.vendors.me.all, "stats"] as const,
      products: (params?: Record<string, unknown>) =>
        [...queryKeys.vendors.me.all, "products", params] as const,
      orders: (params?: Record<string, unknown>) =>
        [...queryKeys.vendors.me.all, "orders", params] as const,
      order: (id: string) =>
        [...queryKeys.vendors.me.all, "orders", id] as const,
      reviews: (params?: Record<string, unknown>) =>
        [...queryKeys.vendors.me.all, "reviews", params] as const,
    },
  },

  // Cart
  cart: {
    all: ["cart"] as const,
    current: () => [...queryKeys.cart.all, "current"] as const,
  },

  // Orders
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), params] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    track: (orderNumber: string) =>
      [...queryKeys.orders.all, "track", orderNumber] as const,
  },

  // Reviews
  reviews: {
    all: ["reviews"] as const,
    lists: () => [...queryKeys.reviews.all, "list"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.reviews.lists(), params] as const,
    details: () => [...queryKeys.reviews.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.reviews.details(), id] as const,
    product: (productId: string, params?: Record<string, unknown>) =>
      [...queryKeys.reviews.all, "product", productId, params] as const,
    vendor: (vendorId: string, params?: Record<string, unknown>) =>
      [...queryKeys.reviews.all, "vendor", vendorId, params] as const,
    me: (params?: Record<string, unknown>) =>
      [...queryKeys.reviews.all, "me", params] as const,
  },

  // Search
  search: {
    all: ["search"] as const,
    results: (params?: Record<string, unknown>) =>
      [...queryKeys.search.all, "results", params] as const,
    suggestions: (q: string) =>
      [...queryKeys.search.all, "suggestions", q] as const,
    trending: (limit?: number) =>
      [...queryKeys.search.all, "trending", limit] as const,
  },

  // Media
  media: {
    all: ["media"] as const,
    lists: () => [...queryKeys.media.all, "list"] as const,
    detail: (id: string) => [...queryKeys.media.all, "detail", id] as const,
    owner: (ownerType: string, ownerId: string) =>
      [...queryKeys.media.all, "owner", ownerType, ownerId] as const,
  },

  // Admin
  admin: {
    all: ["admin"] as const,
    stats: () => [...queryKeys.admin.all, "stats"] as const,
    users: {
      all: ["admin", "users"] as const,
      list: (params?: Record<string, unknown>) =>
        [...queryKeys.admin.users.all, "list", params] as const,
      detail: (id: string) =>
        [...queryKeys.admin.users.all, "detail", id] as const,
    },
    vendors: {
      all: ["admin", "vendors"] as const,
      list: (params?: Record<string, unknown>) =>
        [...queryKeys.admin.vendors.all, "list", params] as const,
      detail: (id: string) =>
        [...queryKeys.admin.vendors.all, "detail", id] as const,
    },
    orders: {
      all: ["admin", "orders"] as const,
      list: (params?: Record<string, unknown>) =>
        [...queryKeys.admin.orders.all, "list", params] as const,
      detail: (id: string) =>
        [...queryKeys.admin.orders.all, "detail", id] as const,
    },
    products: {
      all: ["admin", "products"] as const,
      list: (params?: Record<string, unknown>) =>
        [...queryKeys.admin.products.all, "list", params] as const,
    },
    reviews: {
      all: ["admin", "reviews"] as const,
      list: (params?: Record<string, unknown>) =>
        [...queryKeys.admin.reviews.all, "list", params] as const,
    },
    auditLogs: {
      all: ["admin", "audit-logs"] as const,
      list: (params?: Record<string, unknown>) =>
        [...queryKeys.admin.auditLogs.all, "list", params] as const,
    },
  },

  // Health
  health: {
    all: ["health"] as const,
    check: () => [...queryKeys.health.all, "check"] as const,
    db: () => [...queryKeys.health.all, "db"] as const,
    redis: () => [...queryKeys.health.all, "redis"] as const,
    objectStore: () => [...queryKeys.health.all, "object-store"] as const,
  },

  // Wishlist
  wishlist: {
    all: ["wishlist"] as const,
    check: (productId: string) => ["wishlist", "check", productId] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
