/**
 * Vendor Settings Page
 * Store configuration and settings
 */
"use client";

import { useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Store, Mail } from "lucide-react";
import {
  useMyVendorProfile,
  useUpdateMyVendorProfile,
} from "@/hooks/useVendors";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FieldError } from "@/components/forms/field-error";

const storeSettingsSchema = z.object({
  // Matches @MinLength(3) on the API's UpdateVendorDto, so a too-short name
  // is caught here rather than coming back as a 400.
  name: z.string().min(3, "Store name must be at least 3 characters"),
  description: z.string().optional(),
  // An empty contact email is valid — the field is optional. `.email()` alone
  // rejected "", which is what the form resets to when no contact email is
  // stored, so saving the Store Info tab failed validation against a field on
  // a *different*, unmounted tab and no request was ever sent.
  email: z.union([z.literal(""), z.string().email("Invalid email")]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

type StoreSettingsFormData = z.infer<typeof storeSettingsSchema>;

/** Store contact details live in the vendor settings JSON. */
interface VendorSettings {
  contact?: { email?: string; phone?: string };
}

/**
 * The generated VendorDetailDto omits address and settings even though
 * /vendors/me/profile returns them, so the shape this page relies on is
 * declared here until the response DTO documents those fields.
 */
interface VendorProfileFields {
  displayName?: string | null;
  bio?: string | null;
  address?: Record<string, string> | null;
  settings?: VendorSettings | null;
}

/** Which tab each field lives on, so an invalid field can be revealed. */
const FIELD_TAB: Record<keyof StoreSettingsFormData, string> = {
  name: "store",
  description: "store",
  email: "contact",
  phone: "contact",
  address: "contact",
  city: "contact",
  state: "contact",
  postalCode: "contact",
  country: "contact",
};

export default function VendorSettingsPage() {
  const { data: vendor, isLoading } = useMyVendorProfile();
  const updateProfile = useUpdateMyVendorProfile();
  const [tab, setTab] = useState("store");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreSettingsFormData>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: "",
      description: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Albania",
    },
  });

  // Populate the form once the stored profile arrives. reset() is the
  // react-hook-form API for this, so no server state is mirrored in useState.
  const profile = vendor as VendorProfileFields | undefined;

  useEffect(() => {
    if (!profile) return;
    const address = profile.address ?? {};
    const contact = profile.settings?.contact ?? {};

    reset({
      name: profile.displayName ?? "",
      description: profile.bio ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      address: address.street ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      postalCode: address.zip ?? "",
      country: address.country ?? "Albania",
    });
  }, [profile, reset]);

  const onSubmit = (data: StoreSettingsFormData) => {
    updateProfile.mutate({
      displayName: data.name,
      bio: data.description,
      address: {
        street: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        zip: data.postalCode ?? "",
        country: data.country ?? "",
      },
      settings: {
        // Preserve any settings this form does not manage.
        ...(profile?.settings ?? {}),
        contact: { email: data.email, phone: data.phone },
      },
      // Cast: the generated UpdateVendorDto types address/settings as empty
      // objects because the backend declares them with a bare @IsObject().
    } as unknown as Parameters<typeof updateProfile.mutate>[0]);
  };

  /**
   * Inactive tabs are unmounted, so an error on one of their fields would
   * block the save with nothing on screen to explain it. Reveal the tab and
   * say so.
   */
  const onInvalid = (formErrors: FieldErrors<StoreSettingsFormData>) => {
    const firstField = Object.keys(formErrors)[0] as
      | keyof StoreSettingsFormData
      | undefined;
    if (!firstField) return;
    setTab(FIELD_TAB[firstField]);
    toast.error(
      formErrors[firstField]?.message || "Please fix the highlighted field"
    );
  };

  const isSaving = updateProfile.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store configuration
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="store">
              <Store className="mr-2 h-4 w-4" />
              Store Info
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Mail className="mr-2 h-4 w-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>
                  Configure your store details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    aria-invalid={!!errors.name}
                    id="name"
                    {...register("name")}
                    placeholder="My Thrift Store"
                  />
                  <FieldError error={errors.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Store Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Tell customers about your store..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Update your contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      aria-invalid={!!errors.email}
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="store@example.com"
                    />
                    <FieldError error={errors.email} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="+355 69 123 4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} placeholder="City" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      {...register("state")}
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      {...register("postalCode")}
                      placeholder="Postal code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    {...register("country")}
                    placeholder="Country"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <span className="mr-2">Saving...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

