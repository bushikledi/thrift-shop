/**
 * Zod Validation Schemas
 * Derived from OpenAPI schema definitions
 */
import { z } from "zod";
import {
  ProductCondition,
  UserRole,
  OrderStatus,
  PaymentMethod,
  PayoutMethod,
} from "@/types";

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum([UserRole.CUSTOMER, UserRole.VENDOR]),
  displayName: z.string().optional(), // Required for vendors
  bio: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ============================================
// User Schemas
// ============================================

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

// ============================================
// Product Schemas
// ============================================

export const productConditionSchema = z.enum([
  ProductCondition.LIKE_NEW,
  ProductCondition.VERY_GOOD,
  ProductCondition.GOOD,
  ProductCondition.FAIR,
  ProductCondition.POOR,
]);

export const createProductSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  comparePrice: z.number().positive().optional(),
  quantity: z.number().int().min(0).default(1),
  sku: z.string().optional(),
  isUnique: z.boolean().default(true),
  condition: productConditionSchema,
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  gender: z.string().optional(),
  measurements: z
    .object({
      chest: z.number().optional(),
      length: z.number().optional(),
      waist: z.number().optional(),
      hips: z.number().optional(),
      inseam: z.number().optional(),
    })
    .optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isFeatured: z.boolean().optional(),
});

// ============================================
// Category Schemas
// ============================================

export const createCategorySchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================
// Vendor Schemas
// ============================================

export const payoutDetailsSchema = z.object({
  method: z
    .enum([PayoutMethod.BANK, PayoutMethod.PAYPAL, PayoutMethod.MANUAL])
    .default(PayoutMethod.BANK),
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  routingNumber: z.string().optional(),
  paypalEmail: z.string().email().optional(),
  notes: z.string().optional(),
});

export const updateVendorSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .optional(),
  bio: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")),
  banner: z.string().url().optional().or(z.literal("")),
  address: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  payoutDetails: payoutDetailsSchema.optional(),
});

// ============================================
// Cart & Order Schemas
// ============================================

export const addToCartSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP/Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
});

export const guestInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
});

export const createOrderSchema = z.object({
  guestInfo: guestInfoSchema.optional(),
  shippingAddress: addressSchema,
  shippingMethod: z.string().optional(),
  paymentMethod: z
    .enum([PaymentMethod.COD, PaymentMethod.STRIPE])
    .default(PaymentMethod.COD),
  customerNotes: z.string().optional(),
  cartSessionId: z.string().min(1, "Cart session is required"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ]),
  trackingNumber: z.string().optional(),
  vendorNotes: z.string().optional(),
});

// ============================================
// Review Schemas
// ============================================

export const createReviewSchema = z
  .object({
    vendorId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().optional(),
  })
  .refine((data) => data.vendorId || data.productId, {
    message: "Either vendorId or productId is required",
  });

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
});

// ============================================
// Admin Schemas
// ============================================

export const adminUpdateUserSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  role: z.enum([UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN]).optional(),
});

export const adminUpdateVendorSchema = z.object({
  verified: z.boolean().optional(),
});

// ============================================
// Search & Filter Schemas
// ============================================

export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  vendorId: z.string().optional(),
  condition: productConditionSchema.optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  gender: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  tags: z.array(z.string()).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "popular"]).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  types: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

// ============================================
// Type exports from schemas
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
export type UpdateVendorFormData = z.infer<typeof updateVendorSchema>;
export type AddToCartFormData = z.infer<typeof addToCartSchema>;
export type UpdateCartItemFormData = z.infer<typeof updateCartItemSchema>;
export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusFormData = z.infer<typeof updateOrderStatusSchema>;
export type CreateReviewFormData = z.infer<typeof createReviewSchema>;
export type UpdateReviewFormData = z.infer<typeof updateReviewSchema>;
export type ProductFiltersFormData = z.infer<typeof productFiltersSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
