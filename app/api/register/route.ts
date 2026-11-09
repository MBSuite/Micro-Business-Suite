import { NextResponse } from "next/server";
import { registerUser } from "@/app/register/actions";
import { getRegistrationOrigin } from "@/lib/registration-origins.mjs";
import { isRegistrationBusinessType } from "@/lib/registration-business-types.mjs";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const allowedMethods = "POST, OPTIONS";
const allowedHeaders = "Content-Type";

function responseHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": allowedMethods,
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Max-Age": "600",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function errorResponse(message: string, status: number, origin?: string) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: origin ? responseHeaders(origin) : { "Cache-Control": "no-store", Vary: "Origin" },
    }
  );
}

export async function OPTIONS(request: Request) {
  const resolvedOrigin = getRegistrationOrigin(
    request.headers.get("origin"),
    process.env.MBS_REGISTRATION_ALLOWED_ORIGINS
  );
  if (!resolvedOrigin) return errorResponse("Origin is not allowed", 403);

  const requestedMethod = request.headers.get("access-control-request-method");
  if (requestedMethod && requestedMethod !== "POST") {
    return errorResponse("Method is not allowed", 405, resolvedOrigin.origin);
  }

  const requestedHeaders = request.headers.get("access-control-request-headers");
  if (requestedHeaders) {
    const headers = requestedHeaders
      .split(",")
      .map((header) => header.trim().toLowerCase())
      .filter(Boolean);
    if (headers.some((header) => header !== "content-type")) {
      return errorResponse("Request headers are not allowed", 400, resolvedOrigin.origin);
    }
  }

  return new Response(null, { status: 204, headers: responseHeaders(resolvedOrigin.origin) });
}

export async function POST(request: Request) {
  const resolvedOrigin = getRegistrationOrigin(
    request.headers.get("origin"),
    process.env.MBS_REGISTRATION_ALLOWED_ORIGINS
  );
  if (!resolvedOrigin) return errorResponse("Origin is not allowed", 403);

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse("Content-Type must be application/json", 415, resolvedOrigin.origin);
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader && Number(contentLengthHeader) > MAX_BODY_BYTES) {
    return errorResponse("Request body is too large", 413, resolvedOrigin.origin);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse("Could not read request body", 400, resolvedOrigin.origin);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return errorResponse("Request body is too large", 413, resolvedOrigin.origin);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON body", 400, resolvedOrigin.origin);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Invalid registration data", 400, resolvedOrigin.origin);
  }

  const input = body as Record<string, unknown>;
  const requiredFields = ["name", "email", "password", "confirmPassword", "companyName"];
  if (requiredFields.some((field) => typeof input[field] !== "string")) {
    return errorResponse("กรุณากรอกข้อมูลให้ครบทุกช่อง", 400, resolvedOrigin.origin);
  }
  const name = input.name as string;
  const email = input.email as string;
  const password = input.password as string;
  const confirmPassword = input.confirmPassword as string;
  const companyName = input.companyName as string;

  const businessType = resolvedOrigin.businessType ?? input.businessType;
  if (!isRegistrationBusinessType(businessType)) {
    return errorResponse("กรุณาเลือกประเภทธุรกิจที่ถูกต้อง", 400, resolvedOrigin.origin);
  }

  const formData = new FormData();
  formData.set("name", name);
  formData.set("email", email);
  formData.set("password", password);
  formData.set("confirmPassword", confirmPassword);
  formData.set("companyName", companyName);
  formData.set("businessType", businessType);

  try {
    const result = await registerUser(formData);
    if (result.error) {
      return errorResponse(result.error, 400, resolvedOrigin.origin);
    }

    return NextResponse.json(
      { success: true, message: "ลงทะเบียนสำเร็จ" },
      { headers: responseHeaders(resolvedOrigin.origin) }
    );
  } catch (error) {
    console.error("Central registration API failed", error);
    return errorResponse("ไม่สามารถลงทะเบียนได้ในขณะนี้ กรุณาลองใหม่", 500, resolvedOrigin.origin);
  }
}
