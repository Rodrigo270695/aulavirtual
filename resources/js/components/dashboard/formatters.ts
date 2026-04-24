export function formatCurrency(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatRelative(iso: string | null): string {
    if (!iso) {
        return 'sin fecha';
    }

    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return `hace ${d} d`;
}
