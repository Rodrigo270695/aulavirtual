export type LandingStat = {
    value: string;
    label: string;
};

export type LandingCourse = {
    title: string;
    category: string;
    instructor: string;
    level: 'Principiante' | 'Intermedio' | 'Avanzado';
    rating: number;
    students: number;
    price: string;
    originalPrice: string;
    bestseller?: boolean;
};

export type LandingCategory = {
    name: string;
    courses: number;
};

export type LandingTestimonial = {
    name: string;
    role: string;
    text: string;
    rating: number;
};
