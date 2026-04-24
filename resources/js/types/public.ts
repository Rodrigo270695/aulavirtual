import type { PaginatedData } from '@/types/admin';

export type PublicCourse = {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string;
    level: string;
    level_label: string;
    cover_image_url: string | null;
    is_free: boolean;
    price: number;
    discount_price: number | null;
    effective_price: number;
    currency: string;
    avg_rating: number;
    /** Reseñas publicadas (desnormalizado en `courses`); alinear con `course_reviews`. */
    total_reviews: number;
    total_enrolled: number;
    total_lessons: number;
    total_modules: number;
    duration_hours: number;
    category: {
        name: string | null;
        slug: string | null;
    };
    instructor: {
        name: string;
    };
};

export type PublicCategory = {
    id: string;
    name: string;
    slug: string;
    courses_count: number;
};

export type PublicInstructor = {
    id: string;
    name: string;
    professional_title: string;
    avg_rating: number;
    total_students: number;
    published_courses_count: number;
};

export type PublicCatalogFilters = {
    q: string;
    category: string;
    level: string;
    price: string;
    sort: string;
};

export type PublicCatalogStats = {
    courses: number;
    students: number;
    instructors: number;
};

export type PublicCatalogPageProps = {
    canRegister?: boolean;
    courses: PaginatedData<PublicCourse>;
    topInstructors: PublicInstructor[];
    filters: PublicCatalogFilters;
    stats: PublicCatalogStats;
};
