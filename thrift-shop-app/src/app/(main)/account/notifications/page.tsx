/**
 * Account Notifications Page
 * Manage notification preferences
 */
"use client";

import { useState } from "react";
import { Bell, Mail, MessageSquare, Loader2 } from "lucide-react";

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useUsers";
import type { NotificationChannel } from "@/lib/api/users";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChannelSettings = {
  orders: boolean;
  promotions: boolean;
  reviews: boolean;
  messages: boolean;
};
type NotificationSettings = Record<NotificationChannel, ChannelSettings>;

const FALLBACK_SETTINGS: NotificationSettings = {
  email: { orders: true, promotions: false, reviews: true, messages: true },
  push: { orders: true, promotions: false, reviews: false, messages: true },
  sms: { orders: false, promotions: false, reviews: false, messages: false },
};

export default function AccountNotificationsPage() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Unsaved edits. Derived from the server value until the user changes
  // something, which avoids syncing server state into local state in an effect.
  const [draft, setDraft] = useState<NotificationSettings | null>(null);
  const settings = draft ?? preferences?.notifications ?? FALLBACK_SETTINGS;

  const handleToggle = (category: NotificationChannel, key: string) => {
    setDraft({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: !settings[category][key as keyof ChannelSettings],
      },
    });
  };

  const handleSave = () => {
    updatePreferences.mutate(
      { notifications: settings },
      // Drop the draft so the page follows the server value again.
      { onSuccess: () => setDraft(null) }
    );
  };

  const hasUnsavedChanges = draft !== null;

  const notificationCategories = [
    {
      key: "orders",
      title: "Order Updates",
      description: "Notifications about your orders",
      icon: Bell,
    },
    {
      key: "promotions",
      title: "Promotions & Offers",
      description: "Special deals and discounts",
      icon: Mail,
    },
    {
      key: "reviews",
      title: "Review Reminders",
      description: "Reminders to review your purchases",
      icon: MessageSquare,
    },
    {
      key: "messages",
      title: "Messages",
      description: "Messages from vendors and support",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Manage your notification preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationCategories.map((category) => (
              <div
                key={category.key}
                className="flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <Label>{category.title}</Label>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <Switch
                  checked={settings.email[category.key as keyof typeof settings.email]}
                  onCheckedChange={() => handleToggle("email", category.key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications in your browser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationCategories.map((category) => (
              <div
                key={category.key}
                className="flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <Label>{category.title}</Label>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <Switch
                  checked={settings.push[category.key as keyof typeof settings.push]}
                  onCheckedChange={() => handleToggle("push", category.key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications via text message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationCategories.map((category) => (
              <div
                key={category.key}
                className="flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <Label>{category.title}</Label>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <Switch
                  checked={settings.sms[category.key as keyof typeof settings.sms]}
                  onCheckedChange={() => handleToggle("sms", category.key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading || updatePreferences.isPending || !hasUnsavedChanges}
        >
          {updatePreferences.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {hasUnsavedChanges ? "Save Preferences" : "Saved"}
        </Button>
      </div>
    </div>
  );
}

