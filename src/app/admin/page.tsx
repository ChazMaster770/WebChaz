import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/auth";
import { AdminPortal } from "@/components/AdminPortal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Studio — ChazMaster Album",
  description:
    "Scan Pokémon TCG cards by camera photo, match online card data, and manage your ChazMaster Album database.",
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  return <AdminPortal initialAuthed={authed} />;
}
