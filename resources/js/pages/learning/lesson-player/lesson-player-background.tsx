import type { PlatformColors } from './types';

type Props = {
    platform: PlatformColors;
};

export function LessonPlayerBackground({ platform }: Props) {
    return (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
            <div
                className="absolute -left-24 top-0 h-80 w-80 rounded-full opacity-[0.18] blur-3xl"
                style={{ backgroundColor: platform.color_primary }}
            />
            <div
                className="absolute right-0 top-32 h-72 w-72 translate-x-1/4 rounded-full opacity-[0.14] blur-3xl"
                style={{ backgroundColor: platform.color_accent }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-slate-100/90 via-white to-slate-50/95" />
            <div className="absolute bottom-0 left-1/2 h-px w-[min(100%,48rem)] -translate-x-1/2 bg-linear-to-r from-transparent via-slate-200/80 to-transparent" />
        </div>
    );
}
