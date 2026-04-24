import { Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    BadgePercent,
    CheckCircle2,
    CreditCard,
    Lock,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { Button } from '@/components/ui/button';
import cart from '@/routes/cart';
import checkout from '@/routes/checkout';
import type { PublicCourse } from '@/types/public';

type CheckoutLine = {
    course: PublicCourse;
    already_enrolled: boolean;
};

type CheckoutSummary = {
    free_pending: number;
    paid_pending: number;
    paid_total: number;
    discount_amount: number;
    coupon_code: string | null;
    currency: string;
    cart_empty: boolean;
};

type CheckoutPageProps = {
    lines: CheckoutLine[];
    summary: CheckoutSummary;
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

export default function CheckoutIndex({ lines, summary }: CheckoutPageProps) {
    const freeForm = useForm({});
    const [payProcessing, setPayProcessing] = useState(false);

    const canConfirmFree = summary.free_pending > 0;
    const canPayWithPaypal = summary.paid_pending > 0;
    const hasItems = !summary.cart_empty && lines.length > 0;
    const freeProcessing = freeForm.processing;

    const confirmEnrollment = () => {
        freeForm.post(checkout.confirm.url());
    };

    const startPayPalCheckout = () => {
        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        if (!token) {
            return;
        }

        setPayProcessing(true);

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = checkout.paypal.start.url();
        form.style.display = 'none';

        const csrf = document.createElement('input');
        csrf.type = 'hidden';
        csrf.name = '_token';
        csrf.value = token;
        form.appendChild(csrf);

        document.body.appendChild(form);
        form.submit();
    };

    return (
        <MarketplaceShell title="Checkout">
            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    href={cart.index.url()}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-900"
                >
                    <ArrowLeft className="size-4" aria-hidden />
                    Volver al carrito
                </Link>

                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-70"
                        style={{
                            background:
                                'radial-gradient(circle at 8% 16%, rgba(99,102,241,0.10), transparent 30%), radial-gradient(circle at 90% 20%, rgba(16,185,129,0.10), transparent 28%)',
                        }}
                    />
                    <div className="relative flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                                <Sparkles className="size-3.5" />
                                Checkout
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Finalizar compra</h1>
                            <p className="mt-2 text-sm text-slate-600">
                                Revisa tu pedido y confirma. Los cursos gratuitos se procesan sin cobro y los de pago
                                se completan por PayPal.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
                                <BadgeCheck className="size-3.5" />
                                {lines.length} línea(s)
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                                <Lock className="size-3.5" />
                                Checkout seguro
                            </span>
                        </div>
                    </div>
                </section>

                {!hasItems ? (
                    <p className="mt-8 rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-600 shadow-sm">
                        No hay artículos en el checkout.{' '}
                        <Link href={cart.index.url()} className="font-semibold text-violet-700 hover:underline">
                            Ir al carrito
                        </Link>
                    </p>
                ) : (
                    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="space-y-6">
                            <ol className="space-y-4">
                                <li className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-sky-50 text-slate-600">
                                        <ShieldCheck className="size-5" aria-hidden />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Datos y revisión</p>
                                        <p className="text-sm text-slate-600">
                                            Confirmas la compra con tu cuenta verificada. Solo se procesan cursos
                                            disponibles y se omiten los ya matriculados.
                                        </p>
                                    </div>
                                </li>
                                <li className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-sky-50 text-slate-600">
                                        <CreditCard className="size-5" aria-hidden />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Pago</p>
                                        <p className="text-sm text-slate-600">
                                            {summary.paid_pending > 0 ? (
                                                <>
                                                    Tienes cursos de pago pendientes. El cobro se realizará vía PayPal.
                                                    {summary.discount_amount > 0 ? ' Ya incluye descuento aplicado.' : ''}
                                                </>
                                            ) : (
                                                <>No hay cobros pendientes: los cursos del pedido son gratuitos.</>
                                            )}
                                        </p>
                                    </div>
                                </li>
                            </ol>

                            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Cursos del pedido
                                    </h2>
                                </div>
                                <ul className="divide-y divide-slate-100">
                                    {lines.map(({ course, already_enrolled: enrolled }) => (
                                        <li
                                            key={course.id}
                                            className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition hover:bg-slate-50/70"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-900">{course.title}</p>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                    <span>{course.level_label}</span>
                                                    <span>·</span>
                                                    <span>{course.total_lessons} lecciones</span>
                                                </div>
                                                {enrolled ? (
                                                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                                                        <CheckCircle2 className="size-3.5" />
                                                        Ya matriculado
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="text-right text-sm">
                                                {enrolled ? (
                                                    <span className="text-slate-500">—</span>
                                                ) : course.is_free ? (
                                                    <span className="font-semibold tabular-nums text-emerald-700">
                                                        {formatMoney(0, course.currency)}
                                                    </span>
                                                ) : (
                                                    <span className="font-semibold tabular-nums text-slate-900">
                                                        {formatMoney(course.effective_price, course.currency)}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <aside className="space-y-4 lg:sticky lg:top-24">
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                                <h2 className="text-base font-bold text-slate-900">Resumen de cobro</h2>

                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span className="text-slate-600">Cursos en el pedido</span>
                                        <strong className="text-slate-900">{lines.length}</strong>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">Método de pago: PayPal</p>
                                </div>

                                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                                    {summary.paid_pending > 0 ? (
                                        <li className="flex items-center justify-between gap-2">
                                            <span>Total a pagar</span>
                                            <strong className="rounded-lg bg-indigo-50 px-2 py-0.5 tabular-nums text-slate-900">
                                                {formatMoney(summary.paid_total, summary.currency)}
                                            </strong>
                                        </li>
                                    ) : (
                                        <li className="flex items-center justify-between gap-2">
                                            <span>Total del pedido</span>
                                            <strong className="tabular-nums text-emerald-700">
                                                {formatMoney(0, summary.currency)}
                                            </strong>
                                        </li>
                                    )}
                                    {summary.paid_pending > 0 && summary.discount_amount > 0 ? (
                                        <li className="flex items-center justify-between gap-2 text-emerald-700">
                                            <span className="inline-flex items-center gap-1">
                                                <BadgePercent className="size-3.5" />
                                                Cupón {summary.coupon_code ? summary.coupon_code : 'aplicado'}
                                            </span>
                                            <strong className="tabular-nums">
                                                - {formatMoney(summary.discount_amount, summary.currency)}
                                            </strong>
                                        </li>
                                    ) : null}
                                </ul>

                                <div className="mt-4 flex flex-col gap-3">
                                    {canPayWithPaypal ? (
                                        <Button
                                            type="button"
                                            disabled={payProcessing}
                                            onClick={startPayPalCheckout}
                                            className="h-12 w-full rounded-xl text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 disabled:opacity-60"
                                            style={{ background: 'linear-gradient(135deg, #1d4ed8, #6366f1)' }}
                                        >
                                            {payProcessing
                                                ? 'Conectando con PayPal…'
                                                : 'Pagar con PayPal'}
                                        </Button>
                                    ) : null}

                                    {canConfirmFree ? (
                                        <Button
                                            type="button"
                                            disabled={freeProcessing}
                                            onClick={confirmEnrollment}
                                            variant={canPayWithPaypal ? 'outline' : 'default'}
                                            className={`h-12 w-full rounded-xl text-base font-semibold transition hover:-translate-y-0.5 disabled:opacity-60 ${
                                                canPayWithPaypal
                                                    ? 'border-violet-300 text-violet-900'
                                                    : 'border-transparent text-white shadow-lg'
                                            }`}
                                            style={
                                                canPayWithPaypal
                                                    ? undefined
                                                    : { background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }
                                            }
                                        >
                                            {freeProcessing ? 'Procesando…' : 'Finalizar pedido'}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </aside>
                    </section>
                )}
            </main>
        </MarketplaceShell>
    );
}
