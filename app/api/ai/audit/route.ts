import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import {
  runAiAudit,
  getOpenAiAlerts,
  getAlertCount,
  resolveAlert,
} from "@/lib/aiAudit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isSuperAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden — superadmin only" }, { status: 403 });
    }

    // Support both a full audit trigger and alert resolution
    const body = await request.json().catch(() => ({}));

    if (body.action === "resolve" && body.alertId) {
      await resolveAlert(Number(body.alertId));
      return NextResponse.json({ success: true });
    }

    const result = await runAiAudit();
    const alerts = await getOpenAiAlerts();
    const count = await getAlertCount();

    return NextResponse.json({
      success: true,
      ...result,
      alerts,
      count,
    });
  } catch (error: any) {
    console.error("AI Audit error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isSuperAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden — superadmin only" }, { status: 403 });
    }
    const alerts = await getOpenAiAlerts();
    const count = await getAlertCount();
    return NextResponse.json({ success: true, alerts, count });
  } catch (error: any) {
    console.error("AI Audit GET error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
