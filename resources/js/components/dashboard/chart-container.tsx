import { useEffect, useRef, useState } from 'react';

interface Size {
    width: number;
    height: number;
}

interface Props {
    className?: string;
    minHeight?: number;
    children: (size: Size) => React.ReactNode;
}

export function DashboardChartContainer({ className, minHeight = 288, children }: Props) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState<Size>({ width: 0, height: 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const update = () => {
            const next = {
                width: Math.floor(el.clientWidth),
                height: Math.floor(el.clientHeight),
            };
            setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
        };

        update();

        const ro = new ResizeObserver(() => update());
        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    const ready = size.width > 0 && size.height > 0;

    return (
        <div
            ref={ref}
            className={className ?? 'h-72 min-w-0'}
            style={{ minHeight }}
        >
            {ready ? children(size) : null}
        </div>
    );
}
