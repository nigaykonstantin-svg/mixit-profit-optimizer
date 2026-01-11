'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrgDashboard } from '@/modules/org-structure';
import { getCurrentUser, canAccessOrgStructure } from '@/modules/auth';

export default function OrgStructurePage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const user = getCurrentUser();

        if (!user) {
            // Not logged in - redirect to login
            router.push('/');
            return;
        }

        if (!canAccessOrgStructure(user)) {
            // No access to org structure - redirect to dashboard
            router.push('/leader');
            return;
        }

        setIsAuthorized(true);
    }, [router]);

    if (isAuthorized === null) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#0a0a12',
                color: '#71717a'
            }}>
                Проверка доступа...
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Will redirect
    }

    return <OrgDashboard />;
}
