import { NextResponse } from "next/server";
import { auth, CompanyMappingError, getUserCompanyId } from "@/lib/auth";
import { checkPermission, isAdmin } from "@/lib/permissions";

/**
 * Session + tenant gate for the support inbox APIs.
 *
 * Access rule: an admin/superadmin always passes; other users need the matching
 * permission on the `support` module (granted through group_permissions).
 * Every route additionally scopes its SQL by the resolved company_id, so a
 * forged thread id from another tenant cannot be read or written.
 */

export type SupportAction = "read" | "create" | "update";

export type SupportActor = { userId: string; companyId: number };

export async function requireSupportActor(
  action: SupportAction
): Promise<{ actor: SupportActor } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userId = session.user.id;
  // Role-based access (consistent with the existing admin/superadmin bypass) plus
  // group-based access for least-privilege support staff. Admin/superadmin always
  // pass; a `support` role passes; otherwise the user must be a member of a group
  // that grants the requested action on the `support` module.
  const role = String(session.user.role || "").toLowerCase();
  // Role-based access consistent with the existing admin/superadmin bypass, plus a
  // dedicated `support` role for least-privilege support staff. Group-based access
  // is also honoured so members of a group granted the `support` module pass.
  const allowed =
    (await isAdmin(userId)) ||
    role === "support" ||
    (await checkPermission(userId, "support", action));
  if (!allowed) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  try {
    const companyId = await getUserCompanyId(userId);
    return { actor: { userId, companyId } };
  } catch (error) {
    if (error instanceof CompanyMappingError) {
      return {
        error: NextResponse.json(
          { error: "User is not mapped to a company" },
          { status: 403 }
        ),
      };
    }
    throw error;
  }
}
