// API: Get all category configs
import { NextResponse } from 'next/server';
import { getCategoryConfigs } from '@/modules/config';

export async function GET() {
    try {
        const configs = await getCategoryConfigs();
        return NextResponse.json(configs);
    } catch (error) {
        console.error('Failed to get category configs:', error);
        return NextResponse.json([], { status: 500 });
    }
}
