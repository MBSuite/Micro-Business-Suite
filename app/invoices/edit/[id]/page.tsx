/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";
import { notFound } from "next/navigation";
import EditInvoiceClient from "./EditInvoiceClient";

export const dynamic = 'force-dynamic';

async function getInvoice(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    const companyId = await getUserCompanyId(session.user.id);
    const res = await query(`
      SELECT i.*, c.name as customer_name 
      FROM invoices i 
      LEFT JOIN contacts c ON i.contact_id = c.id AND c.company_id = i.company_id
      WHERE i.id = $1 AND i.company_id = $2
    `, [id, companyId]);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    notFound();
  }

  return <EditInvoiceClient invoice={invoice} />;
}
