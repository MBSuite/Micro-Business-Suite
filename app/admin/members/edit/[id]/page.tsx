import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import EditMemberClient from "./EditMemberClient";

export const dynamic = 'force-dynamic';

async function getUser(id: string) {
  try {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    const user = res.rows[0];
    if (!user || user.email === undefined) throw new Error("Schema mismatch or not found");
    return user;
  } catch (e) {
    console.error("Error fetching user for edit:", e);
    return null;
  }
}

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return <EditMemberClient user={user} />;
}
