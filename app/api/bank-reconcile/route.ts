// Skeleton: AI Bank Reconcile endpoint
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { bankStatement } = await req.json();
  return NextResponse.json({ reconciled: true, matched: bankStatement ? 0 : 0, message: 'AI Bank Reconcile skeleton' });
}
