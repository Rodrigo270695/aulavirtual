import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormComboboxSingle, FormInput, FormSelect } from '@/components/form';
import { appToastQueue } from '@/lib/app-toast-queue';
import { Modal } from '@/components/ui/modal';
import * as instructorPayoutsRoute from '@/routes/admin/instructor-payouts';
import type {
    AdminInstructorPayoutRow,
    InstructorPayoutInstructorOption,
    InstructorPayoutSalesSummary,
} from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    payout: AdminInstructorPayoutRow | null;
    instructorOptions: InstructorPayoutInstructorOption[];
}

interface FormData {
    instructor_id: string;
    period_start: string;
    period_end: string;
    gross_sales: string;
    commission_pct: string;
    platform_fee: string;
    net_amount: string;
    currency: 'USD' | 'PEN';
    status: 'pending' | 'processing' | 'paid' | 'failed';
    payment_reference: string;
    paid_at: string;
}

function isoToInputDate(value: string | null): string {
    if (!value) {
        return '';
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return '';
    }

    return d.toISOString().slice(0, 10);
}

export function InstructorPayoutFormModal({ open, onClose, payout, instructorOptions }: Props) {
    const isEditing = payout !== null;
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summary, setSummary] = useState<InstructorPayoutSalesSummary | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        instructor_id: '',
        period_start: '',
        period_end: '',
        gross_sales: '',
        commission_pct: '15',
        platform_fee: '',
        net_amount: '',
        currency: 'USD',
        status: 'pending',
        payment_reference: '',
        paid_at: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        if (payout) {
            const gross = Number(payout.gross_sales ?? 0);
            const fee = Number(payout.platform_fee ?? 0);
            const commissionPct = gross > 0 ? ((fee * 100) / gross).toFixed(2) : '15';

            setData({
                instructor_id: payout.instructor?.id ?? '',
                period_start: payout.period_start ?? '',
                period_end: payout.period_end ?? '',
                gross_sales: String(payout.gross_sales ?? ''),
                commission_pct: commissionPct,
                platform_fee: String(payout.platform_fee ?? ''),
                net_amount: String(payout.net_amount ?? ''),
                currency: payout.currency === 'PEN' ? 'PEN' : 'USD',
                status: (payout.status as FormData['status']) ?? 'pending',
                payment_reference: payout.payment_reference ?? '',
                paid_at: isoToInputDate(payout.paid_at),
            });
        } else {
            setData({
                instructor_id: '',
                period_start: '',
                period_end: '',
                gross_sales: '',
                commission_pct: '15',
                platform_fee: '',
                net_amount: '',
                currency: 'USD',
                status: 'pending',
                payment_reference: '',
                paid_at: '',
            });
        }

        setSummary(null);
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, payout]);

    const applyComputedAmounts = (grossSalesRaw: string, commissionPctRaw: string) => {
        const gross = Number(grossSalesRaw || '0');
        const commission = Number(commissionPctRaw || '0');
        const fee = gross * (commission / 100);
        const net = gross - fee;

        setData('platform_fee', fee.toFixed(2));
        setData('net_amount', net.toFixed(2));
    };

    useEffect(() => {
        applyComputedAmounts(data.gross_sales, data.commission_pct);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.gross_sales, data.commission_pct]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (!data.instructor_id || !data.period_start || !data.period_end || !data.currency) {
            setSummary(null);
            setData('gross_sales', '');
            return;
        }

        const controller = new AbortController();
        const url = instructorPayoutsRoute.summary.url({
            query: {
                instructor_id: data.instructor_id,
                period_start: data.period_start,
                period_end: data.period_end,
                currency: data.currency,
            },
        });

        setSummaryLoading(true);

        void fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            signal: controller.signal,
        })
            .then(async (res) => {
                const body = (await res.json().catch(() => null)) as InstructorPayoutSalesSummary | null;
                if (!res.ok || !body) {
                    throw new Error('summary_fetch_failed');
                }

                setSummary(body);
                setData('gross_sales', body.gross_sales);
            })
            .catch((error: unknown) => {
                if ((error as { name?: string })?.name === 'AbortError') {
                    return;
                }

                setSummary(null);
                setData('gross_sales', '');
                appToastQueue.add(
                    { title: 'No se pudo calcular ventas brutas para el período.', variant: 'danger' },
                    { timeout: 5000 },
                );
            })
            .finally(() => {
                setSummaryLoading(false);
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, data.instructor_id, data.period_start, data.period_end, data.currency]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = { onSuccess: handleClose, preserveScroll: true };

        if (isEditing && payout) {
            put(instructorPayoutsRoute.update.url({ instructor_payout: payout.id }), options);

            return;
        }

        post(instructorPayoutsRoute.store.url(), options);
    };

    const footer = (
        <div className="flex w-full flex-wrap items-center justify-end gap-3">
            <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-300/90 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
            >
                Cancelar
            </button>
            <button
                form="instructor-payout-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar liquidación' : 'Crear liquidación'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? 'Editar liquidación' : 'Nueva liquidación'}
            description="Registra el pago saliente al instructor para un período específico."
            size="xl"
            footer={footer}
        >
            <form id="instructor-payout-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormComboboxSingle
                    label="Instructor"
                    required
                    id="payout-instructor-combobox"
                    options={instructorOptions.map((opt) => ({ value: opt.id, label: opt.label }))}
                    value={data.instructor_id}
                    onValueChange={(v) => setData('instructor_id', v)}
                    triggerPlaceholder="Selecciona un instructor"
                    searchPlaceholder="Buscar instructor..."
                    emptyText="No hay instructores disponibles."
                    error={errors.instructor_id}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                        label="Período inicio"
                        required
                        type="date"
                        value={data.period_start}
                        onChange={(e) => setData('period_start', e.target.value)}
                        error={errors.period_start}
                    />
                    <FormInput
                        label="Período fin"
                        required
                        type="date"
                        value={data.period_end}
                        onChange={(e) => setData('period_end', e.target.value)}
                        error={errors.period_end}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormInput
                        label="Ventas brutas"
                        type="text"
                        value={data.gross_sales}
                        readOnly
                        inputClassName="bg-slate-50"
                        error={errors.gross_sales}
                    />
                    <FormInput
                        label="Comisión (%)"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.commission_pct}
                        onChange={(e) => setData('commission_pct', e.target.value)}
                        error={errors.commission_pct}
                    />
                    <FormInput
                        label="Comisión plataforma"
                        type="text"
                        value={data.platform_fee}
                        readOnly
                        inputClassName="bg-slate-50"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                        label="Monto neto"
                        type="text"
                        value={data.net_amount}
                        readOnly
                        inputClassName="bg-slate-50"
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                            {summaryLoading && <Loader2 className="size-3.5 animate-spin text-blue-500" />}
                            Resumen de ventas del período
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-3">
                            <span>Cursos vendidos: <strong>{summary?.courses_sold ?? 0}</strong></span>
                            <span>Órdenes: <strong>{summary?.orders_count ?? 0}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormSelect
                        label="Moneda"
                        required
                        value={data.currency}
                        onValueChange={(v) => setData('currency', v as FormData['currency'])}
                        options={[
                            { value: 'USD', label: 'USD' },
                            { value: 'PEN', label: 'PEN' },
                        ]}
                        error={errors.currency}
                    />
                    <FormSelect
                        label="Estado"
                        required
                        value={data.status}
                        onValueChange={(v) => setData('status', v as FormData['status'])}
                        options={[
                            { value: 'pending', label: 'Pendiente' },
                            { value: 'processing', label: 'Procesando' },
                            { value: 'paid', label: 'Pagado' },
                            { value: 'failed', label: 'Fallido' },
                        ]}
                        error={errors.status}
                    />
                    <FormInput
                        label="Fecha de pago"
                        type="date"
                        value={data.paid_at}
                        onChange={(e) => setData('paid_at', e.target.value)}
                        error={errors.paid_at}
                    />
                </div>

                <FormInput
                    label="Referencia de pago"
                    value={data.payment_reference}
                    onChange={(e) => setData('payment_reference', e.target.value)}
                    placeholder="Transferencia, PayPal, lote, operación..."
                    error={errors.payment_reference}
                />
            </form>
        </Modal>
    );
}
