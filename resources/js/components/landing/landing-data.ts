import type { LandingCategory, LandingCourse, LandingStat, LandingTestimonial } from '@/components/landing/landing-types';

export const landingStats: LandingStat[] = [
    { value: '500+', label: 'Cursos publicados' },
    { value: '50k+', label: 'Estudiantes activos' },
    { value: '4.9/5', label: 'Valoracion promedio' },
];

export const featuredCourses: LandingCourse[] = [
    {
        title: 'React y TypeScript desde cero a profesional',
        category: 'Desarrollo Web',
        instructor: 'Ana Torres',
        level: 'Intermedio',
        rating: 4.8,
        students: 12430,
        price: '$29.99',
        originalPrice: '$84.99',
        bestseller: true,
    },
    {
        title: 'Laravel 12: APIs robustas y arquitectura limpia',
        category: 'Backend',
        instructor: 'Carlos Mendoza',
        level: 'Intermedio',
        rating: 4.9,
        students: 9821,
        price: '$34.99',
        originalPrice: '$99.99',
        bestseller: true,
    },
    {
        title: 'Diseno de bases de datos para sistemas escalables',
        category: 'Base de Datos',
        instructor: 'Lucia Herrera',
        level: 'Avanzado',
        rating: 4.7,
        students: 6710,
        price: '$27.99',
        originalPrice: '$79.99',
    },
    {
        title: 'Fundamentos de Python para automatizacion',
        category: 'Programacion',
        instructor: 'Miguel Ruiz',
        level: 'Principiante',
        rating: 4.8,
        students: 15890,
        price: '$19.99',
        originalPrice: '$59.99',
    },
];

export const landingCategories: LandingCategory[] = [
    { name: 'Desarrollo web', courses: 126 },
    { name: 'Backend', courses: 94 },
    { name: 'Data y IA', courses: 71 },
    { name: 'Arquitectura de software', courses: 45 },
    { name: 'DevOps', courses: 38 },
    { name: 'Ciberseguridad', courses: 29 },
];

export const landingTestimonials: LandingTestimonial[] = [
    {
        name: 'Paula Rivera',
        role: 'Frontend Developer Jr.',
        text: 'La ruta de React me ayudo a conseguir mi primera oportunidad laboral en menos de 4 meses.',
        rating: 5,
    },
    {
        name: 'Daniel Flores',
        role: 'Analista de datos',
        text: 'El contenido es directo, practico y bien estructurado. Aprendo y aplico desde el primer modulo.',
        rating: 5,
    },
    {
        name: 'Sofia Camacho',
        role: 'Estudiante de ingenieria',
        text: 'Me encanta poder avanzar a mi ritmo y retomar exactamente donde deje cada leccion.',
        rating: 4,
    },
];
