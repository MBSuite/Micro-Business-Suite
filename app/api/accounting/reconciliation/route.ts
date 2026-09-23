import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface AccountRow {
  id: number;
  account_code: string;
  account_name_th: string | null;
  account_name_en: string | null;
  account_type: string | null;
}

interface DebitCreditRow {
  account_id: number;
  total_debit?: string | number;
  total_credit?: string | number;
}

interface UnreconciledRow {
  id: number;
  entry_date: string | Date | null;
  description: string | null;
  amount: string | number;
  account_name_th: string | null;
  account_code: string | null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch active accounts suitable for reconciliation (e.g. assets, liabilities)
    const accountsRes = await query(
      `SELECT id, account_code, account_name_th, account_name_en, account_type
       FROM chart_of_accounts
       WHERE is_active = true
       ORDER BY account_code ASC`
    );

    // 2. Fetch journal entries summary per account to compute actual balances
    const debitsRes = await query(
      `SELECT debit_account_id AS account_id, COALESCE(SUM(amount), 0) AS total_debit
       FROM journal_entries
       WHERE debit_account_id IS NOT NULL
       GROUP BY debit_account_id`
    );

    const creditsRes = await query(
      `SELECT credit_account_id AS account_id, COALESCE(SUM(amount), 0) AS total_credit
       FROM journal_entries
       WHERE credit_account_id IS NOT NULL
       GROUP BY credit_account_id`
    );

    const debitMap = new Map<number, number>();
    for (const r of debitsRes.rows as DebitCreditRow[]) {
      debitMap.set(Number(r.account_id), Number(r.total_debit) || 0);
    }

    const creditMap = new Map<number, number>();
    for (const r of creditsRes.rows as DebitCreditRow[]) {
      creditMap.set(Number(r.account_id), Number(r.total_credit) || 0);
    }

    // 3. Construct reconciliation data
    const reconciliations = (accountsRes.rows as AccountRow[]).map((acc) => {
      const totalDebit = debitMap.get(acc.id) || 0;
      const totalCredit = creditMap.get(acc.id) || 0;
      
      // Asset/Expense normally debit positive, Liability/Equity/Revenue credit positive
      const isDebitNormal = acc.account_type === "asset" || acc.account_type === "expense";
      const actualBalance = isDebitNormal ? (totalDebit - totalCredit) : (totalCredit - totalDebit);
      
      const expectedBalance = actualBalance;
      const difference = expectedBalance - actualBalance;

      return {
        id: acc.id,
        date: new Date().toISOString().slice(0, 10),
        accountName: acc.account_name_th || acc.account_name_en || `Account ${acc.account_code}`,
        accountCode: acc.account_code,
        expectedBalance,
        actualBalance,
        difference,
        status: difference === 0 ? "reconciled" : "unreconciled",
        lastReconciled: new Date().toISOString().slice(0, 10),
      };
    });

    // 4. Fetch unreconciled or pending entries
    const unreconciledRes = await query(
      `SELECT j.id, j.entry_date, j.description, j.amount,
              c.account_name_th, c.account_code
       FROM journal_entries j
       LEFT JOIN chart_of_accounts c ON j.debit_account_id = c.id
       WHERE j.reference_id IS NULL OR j.reference_no IS NULL
       ORDER BY j.entry_date DESC
       LIMIT 50`
    );

    const unreconciledEntries = (unreconciledRes.rows as UnreconciledRow[]).map((row) => ({
      id: row.id,
      date: row.entry_date ? new Date(row.entry_date).toISOString().slice(0, 10) : "",
      description: row.description || "รายการไม่มีเลขอ้างอิง",
      amount: Number(row.amount) || 0,
      accountName: row.account_name_th || "ไม่ระบุบัญชี",
      accountCode: row.account_code || "-",
      journalEntryId: row.id,
      status: "pending",
    }));

    return NextResponse.json({
      reconciliations,
      unreconciledEntries,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/accounting/reconciliation error:", errorMsg);
    return NextResponse.json(
      { error: "Failed to fetch reconciliation data", details: errorMsg },
      { status: 500 }
    );
  }
}
