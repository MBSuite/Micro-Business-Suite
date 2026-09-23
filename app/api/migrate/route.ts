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

    console.log('Running migration to add recurring columns to quotations table...');
    
    // First check if table exists
    const tableCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'quotations'
    `);
    
    if (tableCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Quotations table does not exist' }, { status: 404 });
    }
    
    console.log('✅ Found quotations table');
    
    // Add is_recurring column
    try {
      await query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE`);
      console.log('✅ Added is_recurring column');
    } catch (err) {
      console.log('⚠️  is_recurring column:', err instanceof Error ? err.message : String(err));
    }
    
    // Add recurring_interval column  
    try {
      await query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS recurring_interval VARCHAR(20) DEFAULT 'none'`);
      console.log('✅ Added recurring_interval column');
    } catch (err) {
      console.log('⚠️  recurring_interval column:', err instanceof Error ? err.message : String(err));
    }
    
    // Verify the columns were added
    const result = await query(
      `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'quotations' AND column_name IN ('is_recurring', 'recurring_interval') ORDER BY column_name`
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      columns: result.rows 
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
