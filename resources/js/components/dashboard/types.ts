export interface DashboardStat {
    key: string;
    label: string;
    value: number;
    change_pct: number;
    context: string;
    tone: 'blue' | 'cyan' | 'violet' | 'emerald';
}

export interface DashboardHighlight {
    key: string;
    label: string;
    value: string | number;
    hint: string;
    tone: 'blue' | 'cyan' | 'violet' | 'emerald';
}

export interface DashboardBreakdownItem {
    key: string;
    label: string;
    total: number;
    pct: number;
    amount_total?: number;
}

export interface TrendPoint {
    month: string;
    month_full: string;
    enrollments: number;
    revenue: number;
}

export interface CourseStatusPoint {
    status: string;
    label: string;
    total: number;
}

export interface TopCourse {
    id: string;
    title: string;
    status: string;
    status_label: string;
    students: number;
    rating: number;
    reviews: number;
    estimated_revenue: number;
    currency: string;
}

export interface RecentActivity {
    id: string;
    actor: string;
    actor_initials: string;
    action: string;
    action_label: string;
    subject: string | null;
    subject_id: string | null;
    created_at: string | null;
}
