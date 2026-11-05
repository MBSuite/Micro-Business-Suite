import { updateCompanySettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(session.user.id))) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const formData = await req.formData();
    const settings: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        settings[key] = value;
      }
    }
    const result = await updateCompanySettings(settings);
    if (result.success) {
      return Response.json({ success: true, data: result.data });
    }
    return Response.json({ success: false, error: result.error }, { status: 400 });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
