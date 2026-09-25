"use server";

import { revalidatePath } from "next/cache";
import {
  runAiAudit,
  getOpenAiAlerts,
  getAlertCount,
  resolveAlert,
  dismissAlert,
} from "@/lib/aiAudit";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

export async function getAllAiAlerts() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (!(await isSuperAdmin(session.user.id))) {
      return { success: false, error: "ไม่มีสิทธิ์ดูผลตรวจสอบ (superadmin เท่านั้น)" };
    }
    const alerts = await getOpenAiAlerts();
    return { success: true, data: alerts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAiAlertCount() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, count: 0 };
    if (!(await isSuperAdmin(session.user.id))) {
      return { success: false, count: 0 };
    }
    const count = await getAlertCount();
    return { success: true, count };
  } catch (error: any) {
    return { success: false, count: 0 };
  }
}

export async function triggerAiAudit() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (!(await isSuperAdmin(session.user.id))) {
      return { success: false, error: "ไม่มีสิทธิ์รันผลตรวจสอบ (superadmin เท่านั้น)" };
    }
    const result = await runAiAudit();
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolveAiAlert(id: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (!(await isSuperAdmin(session.user.id))) {
      return { success: false, error: "ไม่มีสิทธิ์แก้ผลตรวจสอบ (superadmin เท่านั้น)" };
    }
    await resolveAlert(id);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function dismissAiAlert(id: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (!(await isSuperAdmin(session.user.id))) {
      return { success: false, error: "ไม่มีสิทธิ์แก้ผลตรวจสอบ (superadmin เท่านั้น)" };
    }
    await dismissAlert(id);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
