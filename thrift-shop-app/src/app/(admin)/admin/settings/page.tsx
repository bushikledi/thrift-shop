/**
 * Admin Settings Page
 * Platform configuration and settings
 */
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Bell, Shield, Globe, Mail, CreditCard } from "lucide-react";
import {
  useAdminSettings,
  useUpdateAdminSettings,
} from "@/hooks/useAdmin";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const settingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string().optional(),
  supportEmail: z.string().email("Invalid email").optional(),
  maintenanceMode: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: "ThriftShop",
      siteDescription: "",
      supportEmail: "",
      maintenanceMode: false as boolean,
    },
  });

  // Populate from the stored settings once they load.
  useEffect(() => {
    if (!settings) return;
    reset({
      siteName: settings.siteName,
      siteDescription: settings.siteDescription ?? "",
      supportEmail: settings.supportEmail ?? "",
      maintenanceMode: settings.maintenanceMode,
    });
  }, [settings, reset]);

  const maintenanceMode = watch("maintenanceMode");

  const onSubmit = (data: SettingsFormData) => {
    updateSettings.mutate({
      siteName: data.siteName,
      siteDescription: data.siteDescription || undefined,
      supportEmail: data.supportEmail || undefined,
      maintenanceMode: data.maintenanceMode,
    });
  };

  const isSaving = updateSettings.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage platform configuration and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Globe className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic platform information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    {...register("siteName")}
                    placeholder="ThriftShop"
                  />
                  {errors.siteName && (
                    <p className="text-sm text-destructive">
                      {errors.siteName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    {...register("siteDescription")}
                    placeholder="A modern thrift marketplace..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    {...register("supportEmail")}
                    placeholder="support@thriftshop.com"
                  />
                  {errors.supportEmail && (
                    <p className="text-sm text-destructive">
                      {errors.supportEmail.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable public access to the platform
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={maintenanceMode}
                    onCheckedChange={(checked) =>
                      setValue("maintenanceMode", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure email and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications for new orders
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Registration Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify admins when new users register
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Review Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when products receive reviews
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable rate limiting on API endpoints
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    defaultValue={60}
                    min={5}
                    max={1440}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment processing and fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformFee">Platform Fee (%)</Label>
                  <Input
                    id="platformFee"
                    type="number"
                    defaultValue={10}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <p className="text-sm text-muted-foreground">
                    Percentage fee charged on each transaction
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment on Delivery</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to pay when order arrives
                    </p>
                  </div>
                  <Switch defaultChecked />
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
