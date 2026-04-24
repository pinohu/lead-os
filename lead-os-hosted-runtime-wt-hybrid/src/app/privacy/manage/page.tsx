import { redirect } from "next/navigation";

// Privacy footer historically linked here; GDPR self-service lives under /manage-data with query params.
export default async function PrivacyManageRedirect() {
  redirect("/manage-data");
}
