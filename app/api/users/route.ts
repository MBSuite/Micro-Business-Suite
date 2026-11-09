/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/permissions";

// GET /api/users - List all users (Admin only)
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const userIsSuperAdmin = await isSuperAdmin(session.user.id);
    const actorResult = await query(
      "SELECT company_id FROM users WHERE id = $1",
      [session.user.id]
    );
    const companyId = actorResult.rows[0]?.company_id;
    if (!userIsSuperAdmin && companyId == null) {
      return NextResponse.json({ error: "Company context required" }, { status: 403 });
    }

    const result = await query(
      `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.status,
          u.created_at,
          COALESCE(
            JSON_AGG(
              DISTINCT jsonb_build_object(
                'id', g.id,
                'name', g.name,
                'color', g.color,
                'is_system', g.is_system
              )
            ) FILTER (WHERE g.id IS NOT NULL),
            '[]'
          ) as groups
        FROM users u
        LEFT JOIN user_groups ug ON u.id = ug.user_id
        LEFT JOIN groups g ON ug.group_id = g.id
        ${userIsSuperAdmin ? "" : "WHERE u.company_id = $1"}
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `,
      userIsSuperAdmin ? [] : [companyId]
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("GET /api/users error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch users", details: errorMessage },
      { status: 500 }
    );
  }
}
