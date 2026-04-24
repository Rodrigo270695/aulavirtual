import { Link, router, usePage } from '@inertiajs/react';
import { BadgePercent, CreditCard, ShieldCheck, ShoppingBag, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { Button } from '@/components/ui/button';
import cart from '@/routes/cart';
import checkout from '@/routes/checkout';
import { login } from '@/routes';
import type { User } from '@/types';
import type { PublicCourse } from '@/types/public';

type CartLine = {
    course: PublicCourse;
    already_enrolled: boolean;
};

type CartPageProps = {
    lines: CartLine[];
    missingCount: number;
    summary: {
        paid_subtotal: number;
        discount_amount: number;
        total_payable: number;
        currency: string;
        coupon: {
            id: string;
            code: string;
            current_uses: number;
            max_uses: number | null;
            max_uses_per_user: number;
            used_by_user: number;
            remaining_user_uses: number;
        } | null;
    };
};

function formatMoney(value: number, currency: string): string {
    try {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}

export default function CartIndex({ lines, missingCount, summary }: CartPageProps) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const user = auth.user;

    const paidLines = lines.filter((l) => !l.course.is_free && !l.already_enrolled);
    const currency = summary.currency || lines[0]?.course.currency || 'PEN';
    const [couponCode, setCouponCode] = useState(summary.coupon?.code ?? '');

    const remove = (courseId: string) => {
        router.delete(cart.remove.url({ course: courseId }), { preserveScroll: true });
    };

    const applyCoupon = () => {
        if (!couponCode.trim()) {
            return;
        }
        router.post('/carrito/cupon/aplicar', { code: couponCode }, { preserveScroll: true });
    };

    const removeCoupon = () => {
        router.delete('/carrito/cupon', { preserveScroll: true });
    };

    const checkoutEnabled = !!user && lines.length > 0;

    return (
        <MarketplaceShell title="Carrito">
            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tu carrito</h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Revisa tus cursos y finaliza el checkout. Los cursos gratuitos se matriculan sin cargo.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
                                <ShoppingBag className="size-3.5" />
                                {lines.length} curso(s)
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                                <ShieldCheck className="size-3.5" />
                                Pago seguro
                            </span>
                        </div>
                    </div>
                </section>

                {missingCount > 0 ? (
                    <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {missingCount === 1
                            ? 'Un curso del carrito ya no está publicado y se ha omitido.'
                            : `${missingCount} cursos ya no están publicados y se han omitido.`}
                    </p>
                ) : null}

                {lines.length === 0 ? (
                    <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-sm">
                        <ShoppingBag className="mx-auto size-12 text-slate-300" aria-hidden />
                        <p className="mt-4 text-lg font-semibold text-slate-800">Tu carrito está vacío</p>
                        <p className="mt-2 text-sm text-slate-600">
                            Explora el catálogo y pulsa &quot;Añadir al carrito&quot; en un curso.
                        </p>
                        <Button asChild className="mt-5 rounded-xl font-semibold">
                            <Link href="/">Ir al catálogo</Link>
                        </Button>
                    </div>
                ) : (
                    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <ul className="space-y-4">
                            {lines.map(({ course, already_enrolled: enrolled }) => (
                                <li
                                    key={course.id}
                                    className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-start"
                                >
                                    <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-24 sm:w-40">
                                        {course.cover_image_url ? (
                                            <img
                                                src={course.cover_image_url}
                                                alt={course.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-500">
                                                Sin portada
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-base font-semibold text-slate-900">{course.title}</p>
                                        {course.subtitle ? (
                                            <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{course.subtitle}</p>
                                        ) : null}
                                        <p className="mt-1 text-xs text-slate-500">
                                            {course.instructor.name ? `Por ${course.instructor.name}` : 'Instructor no definido'}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                            <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">
                                                {course.level_label}
                                            </span>
                                            <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">
                                                {course.total_modules} módulos · {course.total_lessons} lecciones
                                            </span>
                                            {enrolled ? (
                                                <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                                                    Ya inscrito
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-start gap-2 sm:flex-col sm:items-end">
                                        <div className="text-right">
                                            {enrolled ? (
                                                <span className="text-sm font-semibold text-emerald-700">Incluido</span>
                                            ) : course.is_free ? (
                                                <p className="text-base font-bold tabular-nums text-emerald-700">
                                                    {formatMoney(0, course.currency)}
                                                </p>
                                            ) : (
                                                <>
                                                    {course.discount_price != null && course.discount_price < course.price ? (
                                                        <p className="text-xs tabular-nums text-slate-400 line-through">
                                                            {formatMoney(course.price, course.currency)}
                                                        </p>
                                                    ) : null}
                                                    <p className="text-base font-bold tabular-nums text-slate-900">
                                                        {formatMoney(course.effective_price, course.currency)}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="rounded-xl border-slate-200 text-slate-500 hover:text-rose-600"
                                            onClick={() => remove(course.id)}
                                            aria-label="Quitar del carrito"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <aside className="space-y-4 lg:sticky lg:top-24">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h2 className="text-base font-bold text-slate-900">Resumen de compra</h2>

                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span className="text-slate-600">Cursos en el carrito</span>
                                        <strong className="text-slate-900">{lines.length}</strong>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                        <span className="text-slate-600">Total a pagar ahora</span>
                                        <strong className="tabular-nums text-slate-900">
                                            {formatMoney(summary.total_payable, currency)}
                                        </strong>
                                    </div>
                                </div>

                                {user && paidLines.length > 0 ? (
                                    <div className="mt-4 space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                                        <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <Tag className="size-3.5" />
                                            Cupón
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Ingresa tu cupón"
                                                className="h-10 min-w-44 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none ring-blue-500 transition focus:ring-2"
                                            />
                                            <Button type="button" onClick={applyCoupon} className="rounded-xl px-4 font-semibold">
                                                Aplicar
                                            </Button>
                                            {summary.coupon && (
                                                <Button type="button" variant="outline" onClick={removeCoupon} className="rounded-xl">
                                                    Quitar
                                                </Button>
                                            )}
                                        </div>
                                        {summary.coupon && (
                                            <p className="text-xs text-slate-600">
                                                Cupón activo: <span className="font-semibold text-slate-800">{summary.coupon.code}</span> ·
                                                Usos tuyos: {summary.coupon.used_by_user}/{summary.coupon.max_uses_per_user} ·
                                                Restantes: {summary.coupon.remaining_user_uses}
                                                {summary.coupon.max_uses !== null
                                                    ? ` · Global: ${summary.coupon.current_uses}/${summary.coupon.max_uses}`
                                                    : ' · Global: ilimitado'}
                                            </p>
                                        )}
                                    </div>
                                ) : null}

                                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                                    {paidLines.length > 0 ? (
                                        <li className="flex items-center justify-between gap-2">
                                            <span>Subtotal cursos de pago</span>
                                            <strong className="tabular-nums">{formatMoney(summary.paid_subtotal, currency)}</strong>
                                        </li>
                                    ) : null}
                                    {paidLines.length > 0 && summary.discount_amount > 0 ? (
                                        <li className="flex items-center justify-between gap-2 text-emerald-700">
                                            <span className="inline-flex items-center gap-1">
                                                <BadgePercent className="size-3.5" />
                                                Descuento cupón
                                            </span>
                                            <strong className="tabular-nums">- {formatMoney(summary.discount_amount, currency)}</strong>
                                        </li>
                                    ) : null}
                                    <li className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2 text-slate-900">
                                        <span>Total a pagar</span>
                                        <strong className="text-base tabular-nums">{formatMoney(summary.total_payable, currency)}</strong>
                                    </li>
                                </ul>

                                {checkoutEnabled ? (
                                    <Button
                                        asChild
                                        className="mt-4 h-11 w-full rounded-xl font-semibold text-white shadow-md"
                                        style={{
                                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                        }}
                                    >
                                        <Link href={checkout.show.url()}>
                                            <span className="inline-flex items-center gap-2">
                                                <CreditCard className="size-4" />
                                                Ir al checkout
                                            </span>
                                        </Link>
                                    </Button>
                                ) : null}
                            </div>

                            {!user ? (
                                <div className="rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-4 text-sm text-violet-950">
                                    <p className="font-semibold">Inicia sesión para finalizar</p>
                                    <p className="mt-1 text-violet-900/90">
                                        Necesitas una cuenta para el checkout y la matrícula (gratis o de pago).
                                    </p>
                                    <Button asChild className="mt-4 w-full rounded-xl font-semibold">
                                        <Link href={login.url()}>Iniciar sesión</Link>
                                    </Button>
                                </div>
                            ) : null}
                        </aside>
                    </section>
                )}
            </main>
        </MarketplaceShell>
    );
}
