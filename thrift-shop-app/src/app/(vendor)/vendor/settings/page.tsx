/**
 * Vendor Settings Page
 * Store configuration and settings
 */
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Store, Mail, MapPin, Phone } from "lucide-react";
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

const storeSettingsSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
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

export default function VendorSettingsPage() {
  const { data: vendor, isLoading } = useMyVendorProfile();
  const updateProfile = useUpdateMyVendorProfile();

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

  const isSaving = updateProfile.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store configuration
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="store" className="space-y-6">
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
                    id="name"
                    {...register("name")}
                    placeholder="My Thrift Store"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
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
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="store@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
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

