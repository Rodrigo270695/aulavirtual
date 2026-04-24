import type { Auth } from '@/types/auth';
import type { LearningMenuRow } from '@/types/learning';
import type { PlatformSettings } from '@/types/platform';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            platform: PlatformSettings;
            auth: Auth;
            sidebarOpen: boolean;
            cartCount: number;
            cartCourseIds: string[];
            enrolledCourseIds: string[];
            learningMenu: LearningMenuRow[];
            [key: string]: unknown;
        };
    }
}
