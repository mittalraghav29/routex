import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { runs, templates } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
            return NextResponse.json({
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
            }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const orgId = parseInt(searchParams.get('orgId') || '1');
        const userId = session.user.id;

        // Run counts
        const totalRunsResult = await db.select({ count: sql<number>`count(*)` })
            .from(runs)
            .where(and(eq(runs.orgId, orgId), eq(runs.userId, userId)));

        const successfulRunsResult = await db.select({ count: sql<number>`count(*)` })
            .from(runs)
            .where(and(
                eq(runs.orgId, orgId),
                eq(runs.userId, userId),
                eq(runs.status, 'succeeded')
            ));

        // Template counts
        const savedTemplatesResult = await db.select({ count: sql<number>`count(*)` })
            .from(templates)
            .where(eq(templates.userId, userId)); // Assuming templates have userId, check schema if needed

        // If templates table doesn't have userId (seeded might be mixed), checking schema is important.
        // In schema.ts: userId: text("user_id").notNull(),
        // So filter by userId is correct.

        return NextResponse.json({
            totalRuns: totalRunsResult[0].count,
            successfulRuns: successfulRunsResult[0].count,
            savedTemplates: savedTemplatesResult[0].count
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        }, { status: 500 });
    }
}
