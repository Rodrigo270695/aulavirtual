import { Link } from '@inertiajs/react';

const links = [
    { href: '/admin/courses', label: 'Cursos' },
    { href: '/admin/users', label: 'Usuarios' },
    { href: '/admin/orders', label: 'Órdenes' },
    { href: '/admin/audit', label: 'Auditoría' },
];

export function DashboardQuickLinks() {
    return (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {links.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    {item.label}
                </Link>
            ))}
        </section>
    );
}
