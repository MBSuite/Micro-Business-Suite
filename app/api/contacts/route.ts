/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";
import { contactMatchesUsage, normalizeContactType } from "@/lib/contacts";

async function ensureContactsSchema(): Promise<boolean> {
  try {
    const { rows } = await query(`
      SELECT COUNT(*)::int AS count FROM information_schema.columns
      WHERE table_name = 'contacts' AND column_name IN ('contact_type', 'company_id')
    `);
    return Number(rows[0]?.count || 0) === 2;
  } catch (e) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const companyId = await getUserCompanyId(session.user.id);
    const contactsSchemaExists = await ensureContactsSchema();
    if (!contactsSchemaExists) {
      return NextResponse.json({ error: "Contacts schema is missing. Run database bootstrap first." }, { status: 500 });
    }

    const result = await query(
      `
      SELECT id, name, type, contact_type, address, phone, email, tax_id
      FROM contacts
      WHERE company_id = $1
      ORDER BY name
    `,
      [companyId]
    );
    let contacts = result.rows.map((contact: any) => ({
      ...contact,
      contact_type: normalizeContactType(contact.contact_type || contact.type),
    }));

    if (type) {
      const usage = type === "supplier" ? "expense" : type === "customer" ? "invoice" : "all";
      contacts = contacts.filter((contact: any) => contactMatchesUsage(contact.contact_type, usage));
    }

    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error("GET /api/contacts error", error);
    return NextResponse.json({ success: false, message: "Cannot fetch contacts" }, { status: 500 });
  }
}