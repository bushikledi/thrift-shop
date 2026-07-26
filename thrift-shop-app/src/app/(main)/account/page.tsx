/**
 * Account Profile Page
 * User profile management
 */
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Loader2, Lock, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/useUsers";
import { mediaApi } from "@/lib/api/media";
import { FieldError } from "@/components/forms/field-error";

/**
 * Only what PUT /users/me actually accepts.
 *
 * `email` used to be part of this form and was sent with every save. The API
 * validates with `forbidNonWhitelisted`, and UpdateUserDto has no `email` (nor,
 * previously, `bio`) — so the whole request came back 400 and *no* profile
 * change could ever be saved. The address is the login identity and is tied to
 * `emailVerified`, so it is shown read-only here rather than silently dropped.
 */
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phone: z.string().max(30, "Phone number is too long").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/** Blank optional fields are omitted rather than sent as "". */
function emptyToUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Matches the copy under the upload control. */
const AVATAR_MAX_MB = 2;

/** Fields /users/me returns that the generated DTO does not yet document. */
interface ProfileFields {
  name?: string;
  email?: string;
  phone?: string | null;
  bio?: string | null;
  avatar?: string | null;
}

export default function AccountProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { data: profileData } = useUserProfile();
  const profile = profileData as (ProfileFields & typeof profileData) | undefined;

  const profileCounts = (
    profileData as { _count?: { orders?: number; reviews?: number; savedItems?: number } }
  )?._count;
  const accountCounts = {
    orders: profileCounts?.orders ?? 0,
    reviews: profileCounts?.reviews ?? 0,
    savedItems: profileCounts?.savedItems ?? 0,
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const updateProfileMutation = useUpdateUserProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: "",
      bio: "",
    },
  });

  // Populate from the stored profile once it loads. Previously the form seeded
  // itself from the auth store (which holds only id/email/name/role) with
  // phone and bio hardcoded to "", so a saved phone number never appeared in
  // the field — and saving would have wiped it.
  const storedValues = {
    name: profile?.name ?? user?.name ?? "",
    phone: profile?.phone ?? "",
    bio: profile?.bio ?? "",
  };

  useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
    });
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        name: data.name,
        phone: emptyToUndefined(data.phone),
        bio: emptyToUndefined(data.bio),
      });
      updateUser(updatedUser);
      setIsEditing(false);
    } catch {
      // useUpdateUserProfile surfaces the server's message; a second generic
      // toast here just stacked "Failed to update profile" on top of it.
    }
  };

  const handleCancel = () => {
    reset(storedValues);
    setIsEditing(false);
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    // Allow re-picking the same file after a failure.
    event.target.value = "";
    if (!file) return;

    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      toast.error(`Image must be ${AVATAR_MAX_MB}MB or smaller`);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const media = await mediaApi.upload(file, "USER", user?.id);
      const updatedUser = await updateProfileMutation.mutateAsync({
        avatar: media.url,
      });
      updateUser(updatedUser);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload photo"
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            This will be displayed on your public profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={profile?.avatar ?? (user as { avatar?: string })?.avatar}
              />
              <AvatarFallback className="text-2xl">
                {profile?.name?.[0] || user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              {/* Was a button with no onClick. Uploads to media as a USER-owned
                  asset, then stores the URL on the profile. */}
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={isUploadingAvatar}
              >
                <label className="cursor-pointer">
                  {isUploadingAvatar ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  {isUploadingAvatar ? "Uploading…" : "Change Photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />
                </label>
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, GIF or PNG. Max size {AVATAR_MAX_MB}MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  aria-invalid={!!errors.name}
                  id="name"
                  {...register("name")}
                  disabled={!isEditing}
                />
                <FieldError error={errors.name} />
              </div>
            </div>

            {/* Read-only: the address is the login identity and is tied to
                email verification, so changing it needs its own verified
                flow. It was editable here and silently rejected by the API. */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? user?.email ?? ""}
                readOnly
                disabled
              />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Your email is used to sign in and can&apos;t be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                disabled={!isEditing}
                placeholder="(555) 555-5555"
                aria-invalid={!!errors.phone}
              />
              <FieldError error={errors.phone} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                aria-invalid={!!errors.bio}
                id="bio"
                {...register("bio")}
                disabled={!isEditing}
                placeholder="Tell us a little about yourself..."
                rows={4}
              />
              <FieldError error={errors.bio} />
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!isDirty || updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Counts come from /users/me. They were hardcoded to 0, so an
              account with orders and reviews still read as empty. */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold tabular-nums">
                {accountCounts.orders}
              </p>
              <p className="text-sm text-muted-foreground">Orders Placed</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold tabular-nums">
                {accountCounts.reviews}
              </p>
              <p className="text-sm text-muted-foreground">Reviews Written</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold tabular-nums">
                {accountCounts.savedItems}
              </p>
              <p className="text-sm text-muted-foreground">Saved Items</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
