import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: email, password, and name are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters long',
          code: 'PASSWORD_TOO_SHORT'
        },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { 
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        },
        { status: 409 }
      );
    }

    // Generate unique user ID
    const userId = 'user_' + Date.now() + Math.random().toString(36).substring(2, 15);

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user record
    const newUser = await db
      .insert(user)
      .values({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        emailVerified: true, // Admin users have verified email
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (newUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to create user',
          code: 'USER_CREATION_FAILED'
        },
        { status: 500 }
      );
    }

    // Generate unique account ID
    const accountId = 'account_' + Date.now() + Math.random().toString(36).substring(2, 15);

    // Create account record with hashed password
    await db
      .insert(account)
      .values({
        id: accountId,
        accountId: normalizedEmail,
        providerId: 'credential',
        userId: userId,
        password: hashedPassword,
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Return created user without password
    const userResponse = {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email,
      emailVerified: newUser[0].emailVerified,
      image: newUser[0].image,
      createdAt: newUser[0].createdAt,
      updatedAt: newUser[0].updatedAt,
    };

    return NextResponse.json(userResponse, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}