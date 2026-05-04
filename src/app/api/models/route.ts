import { NextResponse } from 'next/server';
import { getAllModels } from '@/lib/model-router';

export async function GET() {
    const models = getAllModels();
    return NextResponse.json(models);
}
