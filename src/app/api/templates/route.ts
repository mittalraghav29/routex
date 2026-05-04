import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { templates, taskSpecs } from '@/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

function parseTemplate(template: any) {
  if (template?.tags) {
    try {
      template.tags = JSON.parse(template.tags);
    } catch {
      template.tags = [];
    }
  }
  return template;
}

import { SEEDED_TEMPLATES } from '@/lib/templates-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = parseInt(searchParams.get('orgId') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';

    // 1. Fetch DB templates with joined TaskSpec
    let query = db.select({
      template: templates,
      taskSpec: taskSpecs
    })
      .from(templates)
      .$dynamic()
      .leftJoin(taskSpecs, eq(templates.taskSpecId, taskSpecs.id))
      .where(eq(templates.orgId, orgId));

    if (search) {
      query = query.where(
        and(
          eq(templates.orgId, orgId),
          like(templates.title, `%${search}%`)
        )
      );
    }

    if (tag) {
      // Simplified tag search for now
      query = query.where(
        and(
          eq(templates.orgId, orgId),
          sql`json_extract(${templates.tags}, '$') LIKE ${`%${tag}%`}`
        )
      );
    }

    const dbResults = await query
      .orderBy(desc(templates.createdAt));

    // Format DB results to match frontend expectation
    const formattedDbTemplates = dbResults.map(({ template, taskSpec }) => {
      const parsedTemplate = parseTemplate(template);
      let parsedSpec = null;
      if (taskSpec) {
        // Parse JSON fields in taskSpec
        parsedSpec = {
          ...taskSpec,
          inputs: taskSpec.inputs ? JSON.parse(taskSpec.inputs) : {},
          constraints: taskSpec.constraints ? JSON.parse(taskSpec.constraints) : {},
          acceptanceCriteria: taskSpec.acceptanceCriteria ? JSON.parse(taskSpec.acceptanceCriteria) : [],
        };
      }

      return {
        id: parsedTemplate.id.toString(),
        name: parsedTemplate.title,
        description: parsedTemplate.description,
        family: parsedSpec?.family || 'unknown',
        task_spec: parsedSpec,
        usage_count: parsedTemplate.proven ? 100 : 0, // Mock usage
        created_at: parsedTemplate.createdAt,
        tags: parsedTemplate.tags
      };
    });

    // 2. Filter Seeded Templates
    const lowerSearch = search.toLowerCase();
    const filteredSeeds = SEEDED_TEMPLATES.filter(t => {
      if (tag && !t.tags.includes(tag)) return false;
      if (!search) return true;
      return (
        t.name.toLowerCase().includes(lowerSearch) ||
        t.description.toLowerCase().includes(lowerSearch) ||
        t.family.toLowerCase().includes(lowerSearch)
      );
    });

    // 3. Merge (Seeds first, then DB). 
    // This ensures official templates are always visible at the top.
    const allTemplates = [...filteredSeeds, ...formattedDbTemplates];

    // Simple pagination on the merged array
    const paginatedTemplates = allTemplates.slice(offset, offset + limit);

    return NextResponse.json({ templates: paginatedTemplates, total: allTemplates.length });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const body = await request.json();

    // Security: Never allow userId in request body
    if ('userId' in body || 'user_id' in body || 'authorId' in body) {
      return NextResponse.json({
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED'
      }, { status: 400 });
    }

    const { title, description, taskSpecId, tags, orgId = 1, task_spec, family } = body;

    // Validation
    if (!title) {
      return NextResponse.json({
        error: 'Title is required',
        code: 'MISSING_TITLE'
      }, { status: 400 });
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({
        error: 'Tags are required and must be a non-empty array',
        code: 'MISSING_TAGS'
      }, { status: 400 });
    }

    let finalTaskSpecId = taskSpecId;

    // Create TaskSpec if provided (and no ID given)
    // This supports "Save as Template" from a Run
    if (!finalTaskSpecId && task_spec) {
      try {
        const newSpec = await db.insert(taskSpecs).values({
          userId: user.id,
          orgId: parseInt(orgId.toString()),
          family: family || task_spec.family || 'unknown',
          goal: task_spec.goal,
          context: task_spec.context || null,
          inputs: JSON.stringify(task_spec.inputs || {}),
          constraints: JSON.stringify(task_spec.constraints || {}),
          audience: task_spec.audience || null,
          format: task_spec.format || null,
          acceptanceCriteria: JSON.stringify(task_spec.acceptance_criteria || []),
          privacy: task_spec.privacy ? JSON.stringify(task_spec.privacy) : null,
          userPrefs: task_spec.userPrefs ? JSON.stringify(task_spec.userPrefs) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        if (newSpec.length > 0) {
          finalTaskSpecId = newSpec[0].id;
        }
      } catch (err) {
        console.error("Failed to create task spec:", err);
        // Continue without spec? Or fail? Fail is better.
        return NextResponse.json({
          error: 'Failed to create task spec definition',
          code: 'TASK_SPEC_CREATION_FAILED'
        }, { status: 500 });
      }
    }

    // Validate taskSpecId if provided or created
    if (finalTaskSpecId !== undefined && finalTaskSpecId !== null) {
      const taskSpecExists = await db.select()
        .from(taskSpecs)
        .where(eq(taskSpecs.id, finalTaskSpecId))
        .limit(1);

      if (taskSpecExists.length === 0) {
        return NextResponse.json({
          error: 'Invalid taskSpecId',
          code: 'INVALID_TASK_SPEC_ID'
        }, { status: 400 });
      }
    }

    const now = new Date();

    const newTemplate = await db.insert(templates)
      .values({
        userId: user.id, // From session, never from request
        orgId: parseInt(orgId.toString()),
        title: title.trim(),
        description: description?.trim() || null,
        taskSpecId: finalTaskSpecId || null,
        tags: JSON.stringify(tags),
        proven: false,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    const parsedTemplate = parseTemplate(newTemplate[0]);

    return NextResponse.json(parsedTemplate, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}