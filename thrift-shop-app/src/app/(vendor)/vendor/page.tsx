/**
 * Vendor Root Page
 * Redirects to vendor dashboard
 */
import { redirect } from "next/navigation";

export default function VendorPage() {
  redirect("/vendor/dashboard");
}
