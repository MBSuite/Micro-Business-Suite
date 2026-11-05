/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// =====================================================
// Micro Business Suite: Company Settings API
// RESTful API for company branding and configuration
// Copyright (c) 2026 Micro Business Suite. All Rights Reserved.
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCompanySettings, updateCompanySettings } from '@/lib/settings';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';

// GET company settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized — not authenticated' },
        { status: 401 }
      );
    }

    const result = await getCompanySettings();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT company settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized — not authenticated' },
        { status: 401 }
      );
    }
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: 'Forbidden — admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = await updateCompanySettings(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data ?? {}
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
