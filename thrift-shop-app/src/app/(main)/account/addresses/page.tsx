/**
 * Account Addresses Page
 * Manage shipping addresses
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUserAddress, useUpdateUserAddress } from "@/hooks/useUsers";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function AccountAddressesPage() {
  const { data: savedAddress, isLoading: addressLoading } = useUserAddress();
  const updateAddressMutation = useUpdateUserAddress();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Convert saved address to Address format for display
  const addresses: Address[] = savedAddress
    ? [
        {
          id: "default",
          label: "Default Address",
          street: savedAddress.street,
          city: savedAddress.city,
          state: savedAddress.state,
          postalCode: savedAddress.zip,
          country: savedAddress.country,
          isDefault: true,
        },
      ]
    : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Albania",
      isDefault: false,
    },
  });

  const isDefault = watch("isDefault");

  const onSubmit = async (data: AddressFormData) => {
    try {
      const addressData = {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.postalCode,
        country: data.country,
      };

      await updateAddressMutation.mutateAsync(addressData);
      reset();
      setIsDialogOpen(false);
      setEditingAddress(null);
    } catch (error) {
      // Error toast is handled by the mutation
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    reset({
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!savedAddress) {
      toast.info("No address to delete");
      return;
    }

    try {
      // Clear address by setting it to null (backend will handle this)
      // We'll need to update the API to accept null, for now we'll use empty strings
      await updateAddressMutation.mutateAsync({
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      });
    } catch (error) {
      // Error toast is handled by the mutation
    }
  };

  const handleSetDefault = (_addressId?: string) => {
    // Since we only have one address, it's always the default
    toast.info("This is already your default address");
  };

  if (addressLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your shipping addresses
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your shipping addresses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                reset();
                setEditingAddress(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
              <DialogDescription>
                Add a new shipping address for your orders
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit as (data: AddressFormData) => Promise<void>)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  {...register("label")}
                  placeholder="Home, Work, etc."
                />
                {errors.label && (
                  <p className="text-sm text-destructive">
                    {errors.label.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" {...register("street")} />
                {errors.street && (
                  <p className="text-sm text-destructive">
                    {errors.street.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} />
                  {errors.city && (
                    <p className="text-sm text-destructive">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" {...register("state")} />
                  {errors.state && (
                    <p className="text-sm text-destructive">
                      {errors.state.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" {...register("postalCode")} />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive">
                      {errors.postalCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...register("country")} />
                  {errors.country && (
                    <p className="text-sm text-destructive">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setValue("isDefault", e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="font-normal">
                  Set as default address
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    reset();
                    setEditingAddress(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateAddressMutation.isPending}
                >
                  {updateAddressMutation.isPending
                    ? "Saving..."
                    : "Save Address"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Add your first shipping address to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{address.label}</CardTitle>
                  {address.isDefault && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
