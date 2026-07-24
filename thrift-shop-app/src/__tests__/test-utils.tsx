/**
 * Test Utilities
 * Helper functions and providers for testing
 */
import React, { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a fresh query client for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

// Create wrapper with all providers
function createWrapper() {
  const testQueryClient = createTestQueryClient();
  
  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// Custom render method with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: createWrapper(), ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";

// Override render
export { customRender as render };


// Mock API response helper
export function mockApiResponse<T>(data: T, delay = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

// Mock API error helper
export function mockApiError(message: string, status = 500): Promise<never> {
  return Promise.reject({
    message,
    status,
    response: { data: { message } },
  });
}

// Test data factories
export const testData = {
  user: (overrides = {}) => ({
    id: "user-1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "user" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  product: (overrides = {}) => ({
    id: "product-1",
    name: "Test Product",
    slug: "test-product",
    description: "A test product description",
    price: 29.99,
    condition: "good" as const,
    images: ["https://example.com/image.jpg"],
    isActive: true,
    category: { id: "cat-1", name: "Test Category", slug: "test-category" },
    vendor: { id: "vendor-1", businessName: "Test Vendor" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  cartItem: (overrides = {}) => ({
    id: "cart-item-1",
    productId: "product-1",
    quantity: 1,
    price: 29.99,
    product: testData.product(),
    ...overrides,
  }),

  cart: (overrides = {}) => ({
    id: "cart-1",
    items: [testData.cartItem()],
    subtotal: 29.99,
    tax: 2.40,
    shipping: 0,
    total: 32.39,
    ...overrides,
  }),

  order: (overrides = {}) => ({
    id: "order-1",
    orderNumber: "ORD-001",
    status: "pending" as const,
    items: [testData.cartItem()],
    subtotal: 29.99,
    tax: 2.40,
    shippingCost: 5.99,
    total: 38.38,
    paymentMethod: "card",
    paymentStatus: "pending",
    shippingAddress: {
      name: "Test User",
      street: "123 Test St",
      city: "Test City",
      state: "TS",
      zip: "12345",
      country: "USA",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  vendor: (overrides = {}) => ({
    id: "vendor-1",
    businessName: "Test Vendor",
    description: "A test vendor description",
    logo: "https://example.com/logo.jpg",
    rating: 4.5,
    reviewCount: 100,
    productCount: 50,
    isVerified: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  category: (overrides = {}) => ({
    id: "category-1",
    name: "Test Category",
    slug: "test-category",
    description: "A test category",
    isActive: true,
    productCount: 10,
    ...overrides,
  }),

  review: (overrides = {}) => ({
    id: "review-1",
    rating: 5,
    title: "Great product!",
    comment: "This product exceeded my expectations.",
    user: testData.user(),
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  paginatedResponse: <T,>(data: T[], page = 1, limit = 10, total?: number) => ({
    data,
    meta: {
      page,
      limit,
      total: total ?? data.length,
      totalPages: Math.ceil((total ?? data.length) / limit),
    },
  }),
};

// Wait for element to appear
export async function waitForElement(
  callback: () => unknown,
  timeout = 3000
): Promise<unknown> {
  const startTime = Date.now();
  let lastError: Error | null = null;

  while (Date.now() - startTime < timeout) {
    try {
      const result = callback();
      if (result) return result;
    } catch (error) {
      lastError = error as Error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw lastError || new Error("Timeout waiting for element");
}
