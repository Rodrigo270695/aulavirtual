/**
 * Duración en tarjetas (catálogo, mi aprendizaje): evita «0.0 h» cuando dura menos de 1 hora.
 */
export function formatCourseDurationHours(hours: number): string {
    if (!Number.isFinite(hours) || hours <= 0) {
        return '—';
    }
    if (hours < 1) {
        const mins = Math.max(1, Math.round(hours * 60));
        return `${mins} min`;
    }
    return `${hours.toFixed(1)} h`;
}
