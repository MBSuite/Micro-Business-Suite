import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/core-standards';

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST() {
  try {
    if (process.env.MIGRATE_ENDPOINT_ENABLED !== 'true') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized — not authenticated' },
        { status: 401 }
      );
    }
    if (!canAccessAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden — admin access required' },
        { status: 403 }
      );
    }

    console.log('Checking recurring columns on quotations table (read-only)...');

    // First check if table exists
    const tableCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'quotations'
    `);

    if (tableCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Quotations table does not exist' }, { status: 404 });
    }

    // This endpoint is intentionally read-only: schema changes belong in
    // migrations/ and are applied by scripts/bootstrap-init-db.mjs.
    const result = await query(
      `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'quotations' AND column_name IN ('is_recurring', 'recurring_interval') ORDER BY column_name`
    );

    const present = new Set(result.rows.map((row: { column_name: string }) => row.column_name));
    const missing = ['is_recurring', 'recurring_interval'].filter((c) => !present.has(c));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing columns: ${missing.join(', ')}. Run database bootstrap (scripts/bootstrap-init-db.mjs).`,
          columns: result.rows,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Schema is up to date (no changes made by this endpoint)',
      columns: result.rows,
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
