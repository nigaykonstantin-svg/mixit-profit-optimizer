'use client';

import { AnalyticsDashboard } from '@/modules/analytics';
import { Button } from '@/modules/shared';

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="secondary" onClick={() => window.location.href = '/leader'}>
                        ← На главную
                    </Button>
                </div>
                <AnalyticsDashboard />
            </div>
        </div>
    );
}
