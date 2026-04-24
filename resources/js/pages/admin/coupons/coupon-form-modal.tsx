import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormComboboxSingle, FormInput, FormSelect, FormSwitch, FormTextarea } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import * as couponsRoute from '@/routes/admin/coupons';
import type { AdminCoupon, CourseCatalogOption } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    coupon: AdminCoupon | null;
    courseOptions: CourseCatalogOption[];
    categoryOptions: CourseCatalogOption[];
    packageOptions: CourseCatalogOption[];
    specializationOptions: CourseCatalogOption[];
}

interface FormData {
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: string;
    max_uses: string;
    max_uses_per_user: string;
    min_purchase_amount: string;
    applies_to: 'all' | 'course' | 'category' | 'package' | 'specialization';
    applicable_id: string;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
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

export function CouponFormModal({
    open,
    onClose,
    coupon,
    courseOptions,
    categoryOptions,
    packageOptions,
    specializationOptions,
}: Props) {
    const isEditing = coupon !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        max_uses_per_user: '1',
        min_purchase_amount: '0',
        applies_to: 'all',
        applicable_id: '',
        valid_from: '',
        valid_until: '',
        is_active: true,
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        if (coupon) {
            setData({
                code: coupon.code,
                description: coupon.description ?? '',
                discount_type: coupon.discount_type,
                discount_value: String(coupon.discount_value),
                max_uses: coupon.max_uses != null ? String(coupon.max_uses) : '',
                max_uses_per_user: String(coupon.max_uses_per_user),
                min_purchase_amount: String(coupon.min_purchase_amount),
                applies_to: coupon.applies_to,
                applicable_id: coupon.applicable_id ?? '',
                valid_from: isoToInputDate(coupon.valid_from),
                valid_until: isoToInputDate(coupon.valid_until),
                is_active: coupon.is_active,
            });
        } else {
            setData({
                code: '',
                description: '',
                discount_type: 'percentage',
                discount_value: '',
                max_uses: '',
                max_uses_per_user: '1',
                min_purchase_amount: '0',
                applies_to: 'all',
                applicable_id: '',
                valid_from: '',
                valid_until: '',
                is_active: true,
            });
        }

        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, coupon]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = { onSuccess: handleClose, preserveScroll: true };

        if (isEditing && coupon) {
            put(couponsRoute.update.url({ coupon: coupon.id }), options);

            return;
        }

        post(couponsRoute.store.url(), options);
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
                form="coupon-form"
                type="submit"
                disabled={processing}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
                {processing ? 'Guardando...' : isEditing ? 'Actualizar cupón' : 'Crear cupón'}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? `Editar cupón: ${coupon?.code}` : 'Nuevo cupón'}
            description="Configura descuento, alcance, vigencia y límites de uso."
            size="xl"
            footer={footer}
        >
            <form id="coupon-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                        label="Código"
                        required
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                        placeholder="INGENIERIA2026"
                        error={errors.code}
                        autoFocus
                    />
                    <FormSelect
                        label="Tipo de descuento"
                        required
                        value={data.discount_type}
                        onValueChange={(v) => setData('discount_type', v as FormData['discount_type'])}
                        options={[
                            { value: 'percentage', label: 'Porcentaje (%)' },
                            { value: 'fixed_amount', label: 'Monto fijo' },
                        ]}
                        error={errors.discount_type}
                    />
                </div>

                <FormTextarea
                    label="Descripción"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={2}
                    placeholder="Campaña de lanzamiento 2026..."
                    error={errors.description}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormInput
                        label={data.discount_type === 'percentage' ? 'Valor (%)' : 'Valor (monto)'}
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={data.discount_value}
                        onChange={(e) => setData('discount_value', e.target.value)}
                        error={errors.discount_value}
                    />
                    <FormInput
                        label="Compra mínima"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.min_purchase_amount}
                        onChange={(e) => setData('min_purchase_amount', e.target.value)}
                        error={errors.min_purchase_amount}
                    />
                    <FormInput
                        label="Máx. usos (global)"
                        type="number"
                        min="1"
                        step="1"
                        value={data.max_uses}
                        onChange={(e) => setData('max_uses', e.target.value)}
                        placeholder="Vacío = ilimitado"
                        error={errors.max_uses}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormInput
                        label="Usos por usuario"
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={data.max_uses_per_user}
                        onChange={(e) => setData('max_uses_per_user', e.target.value)}
                        error={errors.max_uses_per_user}
                    />
                    <FormSelect
                        label="Aplica a"
                        required
                        value={data.applies_to}
                        onValueChange={(v) => {
                            const next = v as FormData['applies_to'];
                            setData('applies_to', next);
                            setData('applicable_id', '');
                        }}
                        options={[
                            { value: 'all', label: 'Toda la tienda' },
                            { value: 'course', label: 'Curso específico' },
                            { value: 'category', label: 'Categoría específica' },
                            { value: 'package', label: 'Paquete específico' },
                            { value: 'specialization', label: 'Especialización específica' },
                        ]}
                        error={errors.applies_to}
                    />
                    {data.applies_to === 'course' || data.applies_to === 'category' || data.applies_to === 'package' || data.applies_to === 'specialization' ? (
                        <FormComboboxSingle
                            label={
                                data.applies_to === 'course'
                                    ? 'Curso aplicable'
                                    : data.applies_to === 'category'
                                      ? 'Categoría aplicable'
                                      : data.applies_to === 'package'
                                        ? 'Paquete aplicable'
                                        : 'Especialización aplicable'
                            }
                            id={`coupon-${data.applies_to}-combobox`}
                            options={
                                data.applies_to === 'course'
                                    ? courseOptions.map((c) => ({ value: c.id, label: c.label }))
                                    : data.applies_to === 'category'
                                      ? categoryOptions.map((c) => ({ value: c.id, label: c.label }))
                                      : data.applies_to === 'package'
                                        ? packageOptions.map((p) => ({ value: p.id, label: p.label }))
                                        : specializationOptions.map((s) => ({ value: s.id, label: s.label }))
                            }
                            value={data.applicable_id}
                            onValueChange={(v) => setData('applicable_id', v)}
                            triggerPlaceholder={
                                data.applies_to === 'course'
                                    ? 'Selecciona un curso'
                                    : data.applies_to === 'category'
                                      ? 'Selecciona una categoría'
                                      : data.applies_to === 'package'
                                        ? 'Selecciona un paquete'
                                        : 'Selecciona una especialización'
                            }
                            searchPlaceholder={
                                data.applies_to === 'course'
                                    ? 'Buscar curso...'
                                    : data.applies_to === 'category'
                                      ? 'Buscar categoría...'
                                      : data.applies_to === 'package'
                                        ? 'Buscar paquete...'
                                        : 'Buscar especialización...'
                            }
                            emptyText="Sin coincidencias."
                            error={errors.applicable_id}
                            required
                        />
                    ) : (
                        <FormInput
                            label="ID aplicable"
                            value={data.applicable_id}
                            onChange={(e) => setData('applicable_id', e.target.value)}
                            placeholder={data.applies_to === 'all' ? 'No aplica' : 'UUID del recurso'}
                            disabled={data.applies_to === 'all'}
                            error={errors.applicable_id}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormInput
                        label="Válido desde"
                        type="date"
                        value={data.valid_from}
                        onChange={(e) => setData('valid_from', e.target.value)}
                        error={errors.valid_from}
                    />
                    <FormInput
                        label="Válido hasta"
                        type="date"
                        value={data.valid_until}
                        onChange={(e) => setData('valid_until', e.target.value)}
                        error={errors.valid_until}
                    />
                </div>

                <FormSwitch
                    label="Cupón activo"
                    checked={data.is_active}
                    onCheckedChange={(v) => setData('is_active', v)}
                    description={data.is_active ? 'El cupón puede usarse.' : 'El cupón no podrá usarse.'}
                />
            </form>
        </Modal>
    );
}

