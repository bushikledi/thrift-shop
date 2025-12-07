/**
 * Unauthorized Page
 * Shown when user doesn't have permission to access a route
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldX, Home, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            {isAuthenticated
              ? "You don't have permission to access this page. This area is restricted to authorized users only."
              : "You need to be logged in to access this page."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isAuthenticated && user && (
            <p className="text-sm text-muted-foreground">
              You are logged in as{" "}
              <span className="font-medium">{user.email}</span>
              {user.role && (
                <>
                  {" "}
                  with role{" "}
                  <span className="font-medium capitalize">
                    {user.role.toLowerCase()}
                  </span>
                </>
              )}
              .
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          {!isAuthenticated && (
            <Button variant="secondary" asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
