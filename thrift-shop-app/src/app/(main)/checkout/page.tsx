/**
 * Checkout Page
 * Handles order placement with shipping and payment
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreditCard,
  Truck,
  ChevronLeft,
  Loader2,
  Lock,
  Check,
  MapPin,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Accordion component not available, using alternative UI
import {
  cn,
  formatCurrency,
  formatPhoneNumber,
  formatZipCode,
} from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useOrders";
import { useUserProfile } from "@/hooks/useUsers";
import { LoadingSkeleton, EmptyCart } from "@/components/shared";
import { useAuthStore } from "@/lib/stores/auth-store";

// Validation schema
const checkoutSchema = z
  .object({
    // Shipping
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    address: z.string().min(5, "Address is required"),
    apartment: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().min(5, "ZIP code is required"),
    country: z.string().min(2, "Country is required"),

    // Payment. Card details are never collected here - choosing "STRIPE"
    // redirects to Stripe's hosted checkout, so no card data touches this app.
    paymentMethod: z.enum(["COD", "STRIPE"]),

    // Options
    sameAsBilling: z.boolean(),
    shippingMethod: z.enum(["standard", "express", "overnight"]),
    notes: z.string().optional(),
  });

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const shippingMethods = [
  {
    id: "standard",
    name: "Standard Shipping",
    price: 0,
    time: "5-7 business days",
  },
  {
    id: "express",
    name: "Express Shipping",
    price: 9.99,
    time: "2-3 business days",
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    price: 24.99,
    time: "1 business day",
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<"shipping" | "payment" | "review">(
    "shipping"
  );
  const [usingSavedAddress, setUsingSavedAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const { data: cart, isLoading: cartLoading } = useCart();
  const checkoutMutation = useCheckout();
  const { isAuthenticated, user: authUser } = useAuthStore();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();

  // Parse user address from profile
  const userAddress = userProfile?.address as
    | {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      }
    | null
    | undefined;

  // Parse name into first and last name
  const parseName = (fullName?: string) => {
    if (!fullName) return { firstName: "", lastName: "" };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  };

  const { firstName: savedFirstName, lastName: savedLastName } = parseName(
    userProfile?.name || authUser?.name
  );

  // Parse street address (might contain apartment)
  const parseStreetAddress = (street?: string) => {
    if (!street) return { address: "", apartment: "" };
    // Check if street contains comma (likely has apartment)
    if (street.includes(",")) {
      const parts = street.split(",").map((p) => p.trim());
      return {
        address: parts[0],
        apartment: parts.slice(1).join(", "),
      };
    }
    return { address: street, apartment: "" };
  };

  const { address: savedAddress, apartment: savedApartment } =
    parseStreetAddress(userAddress?.street);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      sameAsBilling: true,
      shippingMethod: "standard",
      paymentMethod: "COD",
    },
  });

  // Pre-fill form with user data when authenticated and profile is loaded
  useEffect(() => {
    if (
      isAuthenticated &&
      userProfile &&
      !profileLoading &&
      !isEditingAddress
    ) {
      const hasAddress = userAddress && userAddress.street;

      if (hasAddress) {
        setValue("firstName", savedFirstName);
        setValue("lastName", savedLastName);
        setValue("email", userProfile.email || "");
        setValue("phone", userProfile.phone || "");
        setValue("address", savedAddress);
        setValue("apartment", savedApartment);
        setValue("city", userAddress.city || "");
        setValue("state", userAddress.state || "");
        setValue("zipCode", userAddress.zip || "");
        setValue("country", userAddress.country || "US");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time flag sync when prefilling the saved address
        setUsingSavedAddress(true);
      } else if (authUser) {
        // If no saved address but user is logged in, at least fill name and email
        setValue("firstName", savedFirstName);
        setValue("lastName", savedLastName);
        setValue("email", userProfile.email || authUser.email || "");
        setValue("phone", userProfile.phone || "");
      }
    }
  }, [
    isAuthenticated,
    userProfile,
    profileLoading,
    userAddress,
    savedFirstName,
    savedLastName,
    savedAddress,
    savedApartment,
    setValue,
    isEditingAddress,
    authUser,
  ]);

  const selectedShipping = useWatch({ control, name: "shippingMethod" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const sameAsBilling = useWatch({ control, name: "sameAsBilling" });
  const shippingCost =
    shippingMethods.find((m) => m.id === selectedShipping)?.price || 0;

  const cartItems = cart?.items || [];
  // Handle both string and number subtotal from API
  const subtotal =
    typeof cart?.subtotal === "string"
      ? parseFloat(cart.subtotal)
      : cart?.subtotal || 0;
  // The backend does not calculate or charge tax (Order.total = subtotal +
  // shipping - discount), so quoting an 8.75% estimate here made the checkout
  // total (e.g. 226) disagree with the order that actually gets created (208).
  // Keep the total honest until real tax handling exists server-side.
  const tax = 0;
  const total = subtotal + shippingCost + tax;

  const onSubmit: SubmitHandler<CheckoutFormData> = async (data) => {
    try {
      if (!cart?.id) {
        toast.error("Cart not found. Please refresh the page.");
        return;
      }

      if (cartItems.length === 0) {
        toast.error("Your cart is empty");
        router.push("/shop");
        return;
      }

      // Validate all required fields are filled
      const hasErrors = Object.keys(errors).length > 0;
      if (hasErrors) {
        toast.error("Please fix the errors in the form before submitting");
        // Scroll to first error
        const firstErrorField = Object.keys(errors)[0];
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          (element as HTMLElement).focus();
        }
        return;
      }

      // Include guest info if user is not authenticated
      const checkoutData: {
        shippingAddress: {
          street: string;
          city: string;
          state: string;
          zip: string;
          country: string;
        };
        paymentMethod: "COD" | "STRIPE";
        shippingMethod: string;
        customerNotes?: string;
        cartSessionId: string;
        guestInfo?: { name: string; email: string; phone: string };
      } = {
        shippingAddress: {
          street: data.address + (data.apartment ? `, ${data.apartment}` : ""),
          city: data.city,
          state: data.state,
          zip: data.zipCode,
          country: data.country,
        },
        paymentMethod: data.paymentMethod as "COD" | "STRIPE",
        shippingMethod: data.shippingMethod,
        customerNotes: data.notes || undefined,
        cartSessionId: cart.id,
      };

      // Add guest info for guest checkout
      // Always include guest info if user is not authenticated
      // Double-check auth state to ensure we have the latest value
      const currentAuthState = useAuthStore.getState();
      if (!currentAuthState.user || !currentAuthState.isAuthenticated) {
        checkoutData.guestInfo = {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
        };
      }

      // The mutation handles success/error and redirect
      await checkoutMutation.mutateAsync(checkoutData);
    } catch (err) {
      // Error toast is already shown by the hook
      // The hook also handles redirect on success
    }
  };

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <LoadingSkeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Checkout</h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {["shipping", "payment", "review"].map((s, i) => {
            const stepIndex = ["shipping", "payment", "review"].indexOf(step);
            const isActive = step === s;
            const isCompleted = i < stepIndex;
            const isUpcoming = i > stepIndex;

            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs sm:text-sm capitalize hidden sm:block",
                      isActive
                        ? "font-semibold text-primary"
                        : isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {s}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={cn(
                      "mx-2 sm:mx-4 h-px w-8 sm:w-12 transition-colors duration-300",
                      isCompleted ? "bg-green-500" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Shipping Information */}
            <Card className={cn(step !== "shipping" && "opacity-60")}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  <CardTitle>Shipping Information</CardTitle>
                </div>
                {isAuthenticated && usingSavedAddress && !isEditingAddress && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Using saved address
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingAddress(true);
                        setUsingSavedAddress(false);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Display saved address summary when using it */}
                {isAuthenticated &&
                  usingSavedAddress &&
                  !isEditingAddress &&
                  userAddress && (
                    <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-2 mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {savedFirstName} {savedLastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {savedAddress}
                              {savedApartment && `, ${savedApartment}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {userAddress.city}, {userAddress.state}{" "}
                              {userAddress.zip}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {userAddress.country || "US"}
                            </p>
                            {userProfile?.phone && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Phone: {userProfile.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                <div
                  className={cn(
                    "grid gap-4 sm:grid-cols-2",
                    usingSavedAddress && !isEditingAddress && "opacity-60"
                  )}
                >
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      disabled={
                        step !== "shipping" ||
                        (usingSavedAddress && !isEditingAddress)
                      }
                      aria-invalid={!!errors.firstName}
                      aria-describedby={
                        errors.firstName ? "firstName-error" : undefined
                      }
                    />
                    {errors.firstName && (
                      <p
                        id="firstName-error"
                        className="text-sm text-destructive flex items-center gap-1"
                        role="alert"
                      >
                        <span aria-hidden="true">⚠️</span>
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      disabled={
                        step !== "shipping" ||
                        (usingSavedAddress && !isEditingAddress)
                      }
                      aria-invalid={!!errors.lastName}
                      aria-describedby={
                        errors.lastName ? "lastName-error" : undefined
                      }
                    />
                    {errors.lastName && (
                      <p
                        id="lastName-error"
                        className="text-sm text-destructive flex items-center gap-1"
                        role="alert"
                      >
                        <span aria-hidden="true">⚠️</span>
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      disabled={
                        step !== "shipping" ||
                        (usingSavedAddress && !isEditingAddress)
                      }
                      aria-invalid={!!errors.email}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                    />
                    {errors.email && (
                      <p
                        id="email-error"
                        className="text-sm text-destructive flex items-center gap-1"
                        role="alert"
                      >
                        <span aria-hidden="true">⚠️</span>
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 555-5555"
                      {...register("phone", {
                        onChange: (e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          if (formatted !== e.target.value) {
                            e.target.value = formatted;
                            setValue("phone", formatted, {
                              shouldValidate: false,
                            });
                          }
                        },
                      })}
                      disabled={
                        step !== "shipping" ||
                        (usingSavedAddress && !isEditingAddress)
                      }
                      maxLength={14}
                      aria-invalid={!!errors.phone}
                      aria-describedby={
                        errors.phone ? "phone-error" : undefined
                      }
                    />
                    {errors.phone && (
                      <p
                        id="phone-error"
                        className="text-sm text-destructive flex items-center gap-1"
                        role="alert"
                      >
                        <span aria-hidden="true">⚠️</span>
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "space-y-2",
                    usingSavedAddress && !isEditingAddress && "opacity-60"
                  )}
                >
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    disabled={
                      step !== "shipping" ||
                      (usingSavedAddress && !isEditingAddress)
                    }
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div
                  className={cn(
                    "space-y-2",
                    usingSavedAddress && !isEditingAddress && "opacity-60"
                  )}
                >
                  <Label htmlFor="apartment">
                    Apartment, suite, etc. (optional)
                  </Label>
                  <Input
                    id="apartment"
                    {...register("apartment")}
                    disabled={
                      step !== "shipping" ||
                      (usingSavedAddress && !isEditingAddress)
                    }
                  />
                </div>

                <div
                  className={cn(
                    "grid gap-4 sm:grid-cols-3",
                    usingSavedAddress && !isEditingAddress && "opacity-60"
                  )}
                >
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      disabled={
                        step !== "shipping" ||
                        (usingSavedAddress && !isEditingAddress)
                      }
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      {...register("state")}
                      placeholder="State/Province"
                      disabled={
                        step !== "shipping" ||
                        (usingSavedAddress && !isEditingAddress)
                      }
                    />
                    {errors.state && (
                      <p className="text-sm text-destructive">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="12345"
                      {...register("zipCode", {
                        onChange: (e) => {
                          const formatted = formatZipCode(e.target.value);
                          if (formatted !== e.target.value) {
                            e.target.value = formatted;
                            setValue("zipCode", formatted, {
                              shouldValidate: false,
                            });
                          }
                        },
                      })}
                      disabled={
                        step !== "shipping" ||
                        (usingSavedAddress && !isEditingAddress)
                      }
                      maxLength={10}
                    />
                    {errors.zipCode && (
                      <p
                        className="text-sm text-destructive flex items-center gap-1"
                        role="alert"
                      >
                        <span aria-hidden="true">⚠️</span>
                        {errors.zipCode.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Country Field - Hidden but required for form validation */}
                <input type="hidden" {...register("country")} />

                {/* Shipping Method */}
                <Separator className="my-4" />
                <div className="space-y-4">
                  <Label>Shipping Method</Label>
                  <RadioGroup
                    value={selectedShipping}
                    onValueChange={(value) =>
                      setValue(
                        "shippingMethod",
                        value as "standard" | "express" | "overnight"
                      )
                    }
                    disabled={step !== "shipping"}
                  >
                    {shippingMethods.map((method) => (
                      <div
                        key={method.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-4",
                          selectedShipping === method.id &&
                            "border-primary bg-primary/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div>
                            <Label
                              htmlFor={method.id}
                              className="cursor-pointer font-medium"
                            >
                              {method.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {method.time}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">
                          {method.price === 0
                            ? "Free"
                            : formatCurrency(method.price)}
                        </span>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {step === "shipping" && (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      // Validate shipping fields before proceeding
                      const shippingFields = [
                        "firstName",
                        "lastName",
                        "email",
                        "phone",
                        "address",
                        "city",
                        "state",
                        "zipCode",
                        "country",
                      ];
                      const hasShippingErrors = shippingFields.some(
                        (field) => errors[field as keyof typeof errors]
                      );
                      if (hasShippingErrors) {
                        toast.error(
                          "Please fill in all required shipping fields"
                        );
                        const firstErrorField = shippingFields.find(
                          (field) => errors[field as keyof typeof errors]
                        );
                        if (firstErrorField) {
                          const element = document.querySelector(
                            `[name="${firstErrorField}"]`
                          );
                          if (element) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            (element as HTMLElement).focus();
                          }
                        }
                        return;
                      }
                      setStep("payment");
                    }}
                  >
                    Continue to Payment
                    <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className={cn(step !== "payment" && "opacity-60")}>
              <CardHeader className="flex flex-row items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) =>
                      setValue("paymentMethod", value as "COD" | "STRIPE")
                    }
                    disabled={step !== "payment"}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-4",
                        paymentMethod === "COD" && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="COD" id="cod" />
                        <div>
                          <Label
                            htmlFor="cod"
                            className="cursor-pointer font-medium"
                          >
                            Cash on Delivery (COD)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Pay when you receive your order
                          </p>
                        </div>
                      </div>
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-4",
                        paymentMethod === "STRIPE" &&
                          "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="STRIPE" id="stripe" />
                        <div>
                          <Label
                            htmlFor="stripe"
                            className="cursor-pointer font-medium"
                          >
                            Credit/Debit Card
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Secure payment via Stripe
                          </p>
                        </div>
                      </div>
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Card payment is handled entirely by Stripe's hosted
                    checkout, so no card details are collected here. */}
                {paymentMethod === "STRIPE" && (
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Lock
                        className="mt-0.5 h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          You&apos;ll be redirected to Stripe to pay securely
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Card details are entered on Stripe&apos;s payment page
                          and never touch our servers. Your order is created
                          first and confirmed once payment succeeds.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="sameAsBilling"
                        checked={sameAsBilling}
                        onCheckedChange={(checked) =>
                          setValue("sameAsBilling", checked as boolean)
                        }
                        disabled={step !== "payment"}
                      />
                      <Label
                        htmlFor="sameAsBilling"
                        className="text-sm font-normal"
                      >
                        Billing address same as shipping
                      </Label>
                    </div>
                  </div>
                )}

                {paymentMethod === "COD" && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">
                      You will pay cash when your order is delivered. Please
                      have the exact amount ready.
                    </p>
                  </div>
                )}

                {step === "payment" && (
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("shipping")}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => setStep("review")}
                    >
                      Review Order
                      <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review & Place Order */}
            {step === "review" && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please review your order details before placing your order.
                  </p>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("payment")}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Place Order • {formatCurrency(total)}
                        </>
                      )}
                    </Button>
                    {/* Show form validation errors */}
                    {Object.keys(errors).length > 0 && step === "review" && (
                      <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                        <p
                          className="font-semibold mb-2 flex items-center gap-2"
                          role="alert"
                        >
                          <span className="text-destructive" aria-hidden="true">
                            ⚠️
                          </span>
                          Please fix the following errors before placing your
                          order:
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {Object.entries(errors).map(([field, error]) => {
                            const fieldLabel =
                              field
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())
                                .trim() || field;
                            return (
                              <li
                                key={field}
                                className="flex items-start gap-2"
                              >
                                <span className="mt-0.5">•</span>
                                <span>
                                  <span className="font-medium">
                                    {fieldLabel}:
                                  </span>{" "}
                                  {(error as { message?: string })?.message ||
                                    "Invalid"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full border-destructive/50 text-destructive hover:bg-destructive/20"
                          onClick={() => {
                            // Go back to the step with the first error
                            const errorFields = Object.keys(errors);
                            const firstError = errorFields[0];
                            if (
                              [
                                "firstName",
                                "lastName",
                                "email",
                                "phone",
                                "address",
                                "city",
                                "state",
                                "zipCode",
                                "country",
                                "shippingMethod",
                              ].includes(firstError)
                            ) {
                              setStep("shipping");
                            } else if (
                              ["paymentMethod"].includes(firstError)
                            ) {
                              setStep("payment");
                            }
                            // Scroll to error after step change
                            setTimeout(() => {
                              const element = document.querySelector(
                                `[name="${firstError}"]`
                              );
                              if (element) {
                                element.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                                (element as HTMLElement).focus();
                              }
                            }, 100);
                          }}
                        >
                          Go to Error
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-20 sm:top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                          <Image
                            src={
                              item.product.media?.[0]?.url || "/placeholder.jpg"
                            }
                            alt={item.product.title}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {item.product.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.product.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Payment Method
                    </span>
                    <span className="font-medium">
                      {paymentMethod === "COD" ? (
                        <span className="flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          Cash on Delivery
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          Credit/Debit Card
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shippingCost === 0
                        ? "Free"
                        : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
