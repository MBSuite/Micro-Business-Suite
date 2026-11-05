/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/api/admin/plugins/route.ts
import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { listPluginPacks } from "@/lib/plugin-packs";
import { getCompanyModuleOverrides, saveCompanyModuleOverrides } from "@/lib/module-config";
import { MODULE_REGISTRY } from "@/lib/module-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const companyId = await getUserCompanyId(session.user.id);
  const overrides = await getCompanyModuleOverrides(companyId);

  const getValue = (moduleId: string) => {
    if (typeof overrides[moduleId] === "boolean") return overrides[moduleId];
    const mod = MODULE_REGISTRY.find((m) => m.id === moduleId);
    return mod?.enabledByDefault !== false;
  };

  const packs = listPluginPacks().map((p) => {
    const installed = p.modules.length > 0 && p.modules.every((m) => getValue(m));
    const partial = p.modules.some((m) => getValue(m)) && !installed;
    return { ...p, installed, partial, moduleStatus: p.modules.map((m) => ({ id: m, enabled: getValue(m) })) };
  });

  return NextResponse.json({ success: true, companyId, packs, overrides });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  const pack = listPluginPacks().find((p) => p.id === b.packId);
  if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });

  const overrides = await getCompanyModuleOverrides(companyId);
  const install = b.action === "install";
  for (const m of pack.modules) {
    overrides[m] = install;
  }
  // dependencies
  if (install && pack.dependencies) {
    for (const dep of pack.dependencies) {
      const depPack = listPluginPacks().find((p) => p.id === dep);
      if (depPack) for (const m of depPack.modules) overrides[m] = true;
    }
  }

  await saveCompanyModuleOverrides(companyId, overrides, Number(session.user.id));
  return NextResponse.json({ success: true });
}
