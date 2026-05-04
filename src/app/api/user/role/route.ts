import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({ 
      headers: await headers() 
    });

    // Check if session exists
    if (!session) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    // Query user from database by session user ID
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    // Check if user exists in database
    if (userRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found', 
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const foundUser = userRecord[0];

    // Return user role, id, and email
    return NextResponse.json({
      role: foundUser.role,
      userId: foundUser.id,
      email: foundUser.email
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
      },
      { status: 500 }
    );
  }
}