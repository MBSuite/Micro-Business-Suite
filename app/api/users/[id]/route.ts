import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  clearPermissionCache,
  isAdmin,
  isSuperAdmin,
} from "@/lib/permissions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const targetId = Number(id);
  const actorId = Number(session.user.id);
  if (!Number.isSafeInteger(actorId) || actorId < 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (actorId === targetId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 409 });
  }

  if (!(await isAdmin(actorId))) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const actorIsSuperAdmin = await isSuperAdmin(actorId);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const targetResult = await client.query(
      "SELECT id, role, company_id FROM users WHERE id = $1 FOR UPDATE",
      [targetId]
    );
    const target = targetResult.rows[0];
    if (!target) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const actorResult = await client.query(
      "SELECT company_id FROM users WHERE id = $1",
      [actorId]
    );
    const actor = actorResult.rows[0];
    if (!actor) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!actorIsSuperAdmin && Number(actor.company_id) !== Number(target.company_id)) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (String(target.role || "").toLowerCase() === "superadmin") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Superadmin accounts cannot be deleted here" }, { status: 403 });
    }

    const targetAdminResult = await client.query(
      `
        SELECT (
          LOWER(COALESCE(role, '')) = 'admin'
          OR EXISTS (
            SELECT 1 FROM user_groups
            WHERE user_id = $1 AND group_id = 2
          )
        ) AS is_company_admin
        FROM users
        WHERE id = $1
      `,
      [targetId]
    );

    if (target.company_id != null && targetAdminResult.rows[0]?.is_company_admin) {
      await client.query("SELECT id FROM companies WHERE id = $1 FOR UPDATE", [target.company_id]);
      const remainingAdmins = await client.query(
        `
          SELECT COUNT(*)::int AS count
          FROM users u
          WHERE u.company_id = $1
            AND u.id <> $2
            AND (
              LOWER(COALESCE(u.role, '')) = 'admin'
              OR EXISTS (
                SELECT 1 FROM user_groups ug
                WHERE ug.user_id = u.id AND ug.group_id = 2
              )
            )
        `,
        [target.company_id, targetId]
      );
      if (remainingAdmins.rows[0]?.count === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Cannot delete the last company administrator" },
          { status: 409 }
        );
      }
    }

    await client.query("DELETE FROM users WHERE id = $1", [targetId]);
    await client.query("COMMIT");
    clearPermissionCache(targetId);

    return NextResponse.json({ success: true, deletedUserId: targetId });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("DELETE /api/users/[id] rollback error:", rollbackError);
    }
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  } finally {
    client.release();
  }
}
