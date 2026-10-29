import { updateCompanySettings } from "@/lib/settings";

export async function POST(req: Request) {
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
