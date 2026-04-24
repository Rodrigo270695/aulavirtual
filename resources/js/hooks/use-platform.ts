import { usePage } from '@inertiajs/react';
import type { PlatformSettings } from '@/types/platform';

export function usePlatform(): PlatformSettings {
    const { platform } = usePage().props;
    return platform as PlatformSettings;
}
