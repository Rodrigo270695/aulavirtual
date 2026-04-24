/**
 * Componentes de formulario reutilizables.
 *
 * Todos comparten el mismo patrón:
 *   - Label con asterisco (*) cuando required=true
 *   - Slot para el control (input, select, etc.)
 *   - Texto de ayuda opcional (hint)
 *   - Mensaje de error (de Inertia useForm o validación local)
 *
 * Exportaciones:
 *   FormField, FormInput, FormPasswordInput, FormTextarea, FormTagInput, FormImageField, FormVideoField, FormSelect, FormMultiSelect, FormComboboxMulti, FormComboboxSingle,
 *   FormCheckbox, FormCheckboxGroup, FormSwitch, FormRadioGroup
 */

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, CheckIcon, ChevronDown, ChevronsUpDown, Eye, EyeOff, ImagePlus, Video, X } from 'lucide-react';
import * as React from 'react';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ─── Tipos compartidos ────────────────────────────────────────────────────────

interface BaseFieldProps {
    label?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    className?: string;
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────

function FieldLabel({
    label,
    required,
    htmlFor,
}: {
    label: string;
    required?: boolean;
    htmlFor?: string;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500"
        >
            {label}
            {required && (
                <span className="ml-1 text-red-400" aria-hidden="true">*</span>
            )}
        </label>
    );
}

// ─── FieldHint ────────────────────────────────────────────────────────────────

function FieldHint({ hint }: { hint: string }) {
    return <p className="mt-1 text-[11px] text-slate-400">{hint}</p>;
}

// ─── FieldError ───────────────────────────────────────────────────────────────

function FieldError({ error }: { error: string }) {
    return (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
            <span className="inline-block size-1 rounded-full bg-red-400" />
            {error}
        </p>
    );
}

// ─── FormField (contenedor genérico) ─────────────────────────────────────────
// Úsalo cuando necesitas envolver un control custom o de terceros.

interface FormFieldProps extends BaseFieldProps {
    children: React.ReactNode;
    id?: string;
}

export function FormField({
    label,
    required,
    hint,
    error,
    className,
    children,
    id,
}: FormFieldProps) {
    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={id} />}
            {children}
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormInput ────────────────────────────────────────────────────────────────

interface FormInputProps
    extends BaseFieldProps,
        Omit<React.ComponentProps<'input'>, 'className'> {
    inputClassName?: string;
}

export function FormInput({
    label,
    required,
    hint,
    error,
    className,
    inputClassName,
    id,
    ...props
}: FormInputProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <input
                id={inputId}
                aria-invalid={!!error}
                className={cn(
                    'h-10 w-full rounded-lg border px-3 text-sm text-slate-800 placeholder:text-slate-400',
                    'transition-all outline-none',
                    'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error
                        ? 'border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-red-400/15'
                        : 'border-slate-200 bg-white',
                    inputClassName,
                )}
                required={required}
                {...props}
            />
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormPasswordInput ─────────────────────────────────────────────────────────
//
// Igual que FormInput pero con botón ojo para alternar visibilidad (misma UX que login).

interface FormPasswordInputProps
    extends BaseFieldProps,
        Omit<React.ComponentProps<'input'>, 'className' | 'type'> {
    inputClassName?: string;
}

export function FormPasswordInput({
    label,
    required,
    hint,
    error,
    className,
    inputClassName,
    id,
    ...props
}: FormPasswordInputProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const [showPassword, setShowPassword] = React.useState(false);

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <div className="relative">
                <input
                    id={inputId}
                    type={showPassword ? 'text' : 'password'}
                    aria-invalid={!!error}
                    className={cn(
                        'h-10 w-full rounded-lg border px-3 pr-10 text-sm text-slate-800 placeholder:text-slate-400',
                        'transition-all outline-none',
                        'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error
                            ? 'border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-red-400/15'
                            : 'border-slate-200 bg-white',
                        inputClassName,
                    )}
                    required={required}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={cn(
                        'absolute inset-y-0 right-0 flex cursor-pointer items-center rounded-r-lg px-3',
                        'text-slate-400 transition-colors hover:text-slate-600',
                        'focus-visible:ring-2 focus-visible:ring-blue-400/40 focus-visible:outline-none',
                    )}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="size-4 shrink-0" aria-hidden />
                    ) : (
                        <Eye className="size-4 shrink-0" aria-hidden />
                    )}
                </button>
            </div>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormTextarea ─────────────────────────────────────────────────────────────

interface FormTextareaProps
    extends BaseFieldProps,
        Omit<React.ComponentProps<'textarea'>, 'className'> {
    textareaClassName?: string;
    rows?: number;
}

export function FormTextarea({
    label,
    required,
    hint,
    error,
    className,
    textareaClassName,
    id,
    rows = 3,
    ...props
}: FormTextareaProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <textarea
                id={inputId}
                rows={rows}
                aria-invalid={!!error}
                className={cn(
                    'w-full resize-y rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400',
                    'transition-all outline-none',
                    'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error
                        ? 'border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-red-400/15'
                        : 'border-slate-200 bg-white',
                    textareaClassName,
                )}
                required={required}
                {...props}
            />
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormTagInput ───────────────────────────────────────────────────────────────
//
// Chips + texto en el mismo control. Enter o Tab (con texto) añade etiqueta; Backspace
// con input vacío borra la última. Clic en × quita una etiqueta.

interface FormTagInputProps extends BaseFieldProps {
    id?: string;
    value: string[];
    onChange: (tags: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function FormTagInput({
    label,
    required,
    hint,
    error,
    className,
    id,
    value,
    onChange,
    disabled,
    placeholder = 'Escribe y pulsa Enter o Tab',
}: FormTagInputProps) {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : 'tag-input');
    const [draft, setDraft] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const commit = React.useCallback(() => {
        const t = draft.trim().toLowerCase();

        if (!t) {
            return;
        }

        if (value.some((v) => v.toLowerCase() === t)) {
            setDraft('');

            return;
        }

        onChange([...value, t]);
        setDraft('');
    }, [draft, onChange, value]);

    const removeAt = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commit();

            return;
        }

        if (e.key === 'Tab' && draft.trim() !== '') {
            e.preventDefault();
            commit();

            return;
        }

        if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            e.preventDefault();
            removeAt(value.length - 1);
        }
    };

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <div
                role="group"
                aria-label={label}
                className={cn(
                    'flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5',
                    'transition-all outline-none',
                    disabled && 'cursor-not-allowed opacity-50',
                    error
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-slate-200 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15',
                )}
                onClick={() => {
                    if (!disabled) {
                        inputRef.current?.focus();
                    }
                }}
            >
                {value.map((tag, i) => (
                    <span
                        key={`${tag}-${i}`}
                        className="inline-flex max-w-full items-center gap-0.5 truncate rounded-full bg-violet-50 pl-2.5 pr-1 py-0.5 text-[11px] font-semibold text-violet-700"
                    >
                        <span className="truncate">{tag}</span>
                        {!disabled && (
                            <button
                                type="button"
                                aria-label={`Quitar ${tag}`}
                                className="flex size-5 shrink-0 items-center justify-center rounded-full text-violet-500 transition-colors hover:bg-violet-100 hover:text-violet-800"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeAt(i);
                                }}
                            >
                                <X className="size-3" strokeWidth={2.5} />
                            </button>
                        )}
                    </span>
                ))}
                <input
                    ref={inputRef}
                    id={inputId}
                    type="text"
                    disabled={disabled}
                    value={draft}
                    aria-invalid={!!error}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={() => {
                        if (draft.trim() !== '') {
                            commit();
                        }
                    }}
                    placeholder={value.length === 0 ? placeholder : undefined}
                    className="min-w-[6rem] flex-1 border-0 bg-transparent py-0.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />
            </div>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormImageField ───────────────────────────────────────────────────────────
//
// Subida de imagen con vista previa; `existingSrc` muestra la portada ya guardada (URL absoluta o /storage/...).

interface FormImageFieldProps extends BaseFieldProps {
    id?: string;
    accept?: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    /** Imagen actual (ej. `/storage/ruta/en/disco`) */
    existingSrc?: string | null;
    /** Solo cuando hay `existingSrc` y no hay `file`: quitar portada guardada. */
    onClearStored?: () => void;
}

export function FormImageField({
    label,
    hint,
    error,
    className,
    id,
    accept = 'image/jpeg,image/png,image/webp,image/gif',
    file,
    onFileChange,
    existingSrc,
    onClearStored,
}: FormImageFieldProps) {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : 'image-field');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!file) {
            setBlobUrl(null);

            return;
        }

        const url = URL.createObjectURL(file);
        setBlobUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    const showSrc = blobUrl ?? (existingSrc && !file ? existingSrc : null);

    return (
        <div className={cn('flex w-full min-w-0 flex-col', className)}>
            {label && <FieldLabel label={label} htmlFor={inputId} />}
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={accept}
                className="sr-only"
                aria-invalid={!!error}
                onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    onFileChange(f);
                    e.target.value = '';
                }}
            />
            <div className="flex w-full min-w-0 flex-col gap-2">
                <button
                    type="button"
                    aria-label="Seleccionar imagen de portada"
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        'relative flex h-28 w-full min-w-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors',
                        error
                            ? 'border-red-300 bg-red-50/40'
                            : 'border-slate-200 bg-slate-50/80 hover:border-blue-300 hover:bg-slate-50',
                    )}
                >
                    {showSrc ? (
                        <img src={showSrc} alt="" className="size-full object-cover" />
                    ) : (
                        <ImagePlus className="size-8 text-slate-300" strokeWidth={1.25} aria-hidden />
                    )}
                </button>
                {file || existingSrc ? (
                    <div className="flex w-full justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                if (file) {
                                    onFileChange(null);
                                } else {
                                    onClearStored?.();
                                }
                            }}
                            className="w-fit text-xs font-medium text-slate-500 underline-offset-2 hover:text-rose-600 hover:underline"
                        >
                            Quitar
                        </button>
                    </div>
                ) : null}
            </div>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormVideoField ───────────────────────────────────────────────────────────
//
// Subida de vídeo con vista previa; `existingSrc` muestra el archivo ya guardado (/storage/...).

interface FormVideoFieldProps extends BaseFieldProps {
    id?: string;
    accept?: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    existingSrc?: string | null;
    onClearStored?: () => void;
}

export function FormVideoField({
    label,
    hint,
    error,
    className,
    id,
    accept = 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/3gpp',
    file,
    onFileChange,
    existingSrc,
    onClearStored,
}: FormVideoFieldProps) {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : 'video-field');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!file) {
            setBlobUrl(null);

            return;
        }

        const url = URL.createObjectURL(file);
        setBlobUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    const showSrc = blobUrl ?? (existingSrc && !file ? existingSrc : null);

    return (
        <div className={cn('flex w-full min-w-0 flex-col', className)}>
            {label && <FieldLabel label={label} htmlFor={inputId} />}
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={accept}
                className="sr-only"
                aria-invalid={!!error}
                onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    onFileChange(f);
                    e.target.value = '';
                }}
            />
            <div className="flex w-full min-w-0 flex-col gap-2">
                <button
                    type="button"
                    aria-label="Seleccionar vídeo"
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        'relative flex min-h-32 w-full min-w-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors',
                        error
                            ? 'border-red-300 bg-red-50/40'
                            : 'border-slate-200 bg-slate-50/80 hover:border-blue-300 hover:bg-slate-50',
                    )}
                >
                    {showSrc ? (
                        <video
                            src={showSrc}
                            className="max-h-44 w-full bg-black object-contain"
                            controls
                            playsInline
                            preload="metadata"
                        />
                    ) : (
                        <Video className="size-10 text-slate-300" strokeWidth={1.15} aria-hidden />
                    )}
                </button>
                {file || existingSrc ? (
                    <div className="flex w-full justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                if (file) {
                                    onFileChange(null);
                                } else {
                                    onClearStored?.();
                                }
                            }}
                            className="w-fit text-xs font-medium text-slate-500 underline-offset-2 hover:text-rose-600 hover:underline"
                        >
                            Quitar
                        </button>
                    </div>
                ) : null}
            </div>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormSelect (Radix UI) ────────────────────────────────────────────────────

export interface FormSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface FormSelectProps extends BaseFieldProps {
    id?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    options: FormSelectOption[];
    disabled?: boolean;
    triggerClassName?: string;
    /** Acento del panel y del ítem activo (por defecto azul, coherente con el resto del admin). */
    accent?: 'blue' | 'violet' | 'amber';
}

export function FormSelect({
    label,
    required,
    hint,
    error,
    className,
    id,
    value,
    onValueChange,
    placeholder = 'Selecciona una opción',
    options,
    disabled,
    triggerClassName,
    accent = 'blue',
}: FormSelectProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const focusRing =
        accent === 'violet'
            ? 'focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20'
            : accent === 'amber'
              ? 'focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
              : 'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15';

    const itemInteractive =
        accent === 'violet'
            ? 'hover:bg-violet-50 hover:text-violet-800 focus:bg-violet-50 focus:text-violet-800 data-[state=checked]:text-violet-800'
            : accent === 'amber'
              ? 'hover:bg-amber-50 hover:text-amber-900 focus:bg-amber-50 focus:text-amber-900 data-[state=checked]:text-amber-900'
              : 'hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[state=checked]:text-blue-700';

    const checkColor =
        accent === 'violet' ? 'text-violet-600' : accent === 'amber' ? 'text-amber-600' : 'text-blue-600';

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
                <SelectPrimitive.Trigger
                    id={inputId}
                    aria-invalid={!!error}
                    className={cn(
                        'flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm',
                        'transition-all outline-none',
                        focusRing,
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'data-placeholder:text-slate-400',
                        error
                            ? 'border-red-400 bg-red-50/30 text-slate-800'
                            : 'border-slate-200 bg-white text-slate-800',
                        triggerClassName,
                    )}
                >
                    <SelectPrimitive.Value placeholder={placeholder} />
                    <SelectPrimitive.Icon asChild>
                        <ChevronDown className="size-4 text-slate-400" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>

                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        position="popper"
                        sideOffset={4}
                        className={cn(
                            'z-50 min-w-(--radix-select-trigger-width) overflow-hidden',
                            'rounded-xl border bg-white',
                            accent === 'violet'
                                ? 'border-violet-200/70 shadow-lg shadow-violet-950/10'
                                : accent === 'amber'
                                  ? 'border-amber-200/80 shadow-lg shadow-amber-950/10'
                                  : 'border-slate-200 shadow-lg',
                            'data-[state=open]:animate-in data-[state=closed]:animate-out',
                            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                            'data-[side=bottom]:translate-y-1',
                        )}
                    >
                        <SelectPrimitive.Viewport className="p-1">
                            {options.map((opt) => (
                                <SelectPrimitive.Item
                                    key={opt.value}
                                    value={opt.value}
                                    disabled={opt.disabled}
                                    className={cn(
                                        'relative flex cursor-pointer select-none items-center rounded-md py-2.5 pl-3 pr-8 text-sm',
                                        'text-slate-700 outline-none transition-colors',
                                        'data-disabled:pointer-events-none data-disabled:opacity-40',
                                        'data-[state=checked]:font-semibold',
                                        itemInteractive,
                                    )}
                                >
                                    <SelectPrimitive.ItemText>
                                        {opt.label}
                                    </SelectPrimitive.ItemText>
                                    <span className="absolute right-2 flex size-4 items-center justify-center">
                                        <SelectPrimitive.ItemIndicator>
                                            <Check className={cn('size-3.5', checkColor)} />
                                        </SelectPrimitive.ItemIndicator>
                                    </span>
                                </SelectPrimitive.Item>
                            ))}
                        </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormMultiSelect (select nativo multiple) ─────────────────────────────────
//
// Listbox nativo con selección múltiple (Ctrl/Cmd + clic en desktop).
// `value` y `options[].value` son strings, alineados con <option value="…">.
// El orden de las opciones lo define el consumidor (p. ej. orden ASC con localeCompare).

interface FormMultiSelectProps extends BaseFieldProps {
    id?: string;
    options: FormSelectOption[];
    /** Valores seleccionados (mismo formato que cada option.value) */
    value: string[];
    onValueChange: (values: string[]) => void;
    disabled?: boolean;
    /**
     * Filas visibles del listbox. Si se omite, se calcula con minVisibleRows / maxVisibleRows
     * según la cantidad de opciones.
     */
    size?: number;
    minVisibleRows?: number;
    maxVisibleRows?: number;
    selectClassName?: string;
}

export function FormMultiSelect({
    label,
    required,
    hint,
    error,
    className,
    id,
    options,
    value,
    onValueChange,
    disabled,
    size: sizeProp,
    minVisibleRows = 3,
    maxVisibleRows = 10,
    selectClassName,
}: FormMultiSelectProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const computedSize =
        sizeProp ??
        Math.min(Math.max(options.length > 0 ? options.length : 1, minVisibleRows), maxVisibleRows);

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <select
                id={inputId}
                multiple
                disabled={disabled}
                aria-invalid={!!error}
                aria-required={required}
                value={value}
                size={computedSize}
                onChange={(e) => {
                    onValueChange(Array.from(e.target.selectedOptions).map((o) => o.value));
                }}
                className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm text-slate-800',
                    'transition-all outline-none',
                    'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-slate-200 bg-white',
                    selectClassName,
                )}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormComboboxMulti (Popover + cmdk, multi-selección) ───────────────────────
//
// Combobox con búsqueda; cada ítem alterna selección. Pensado para listas medianas
// (roles, etiquetas, etc.). `options` en el orden deseado (p. ej. ASC en el padre).

interface FormComboboxMultiProps extends BaseFieldProps {
    id?: string;
    options: FormSelectOption[];
    value: string[];
    onValueChange: (values: string[]) => void;
    disabled?: boolean;
    /** En selección única (p. ej. categoría padre), cerrar al elegir. En multi (roles) dejar en false. */
    closeOnSelect?: boolean;
    triggerPlaceholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    triggerClassName?: string;
}

export function FormComboboxMulti({
    label,
    required,
    hint,
    error,
    className,
    id,
    options,
    value,
    onValueChange,
    disabled,
    closeOnSelect = false,
    triggerPlaceholder = 'Seleccionar…',
    searchPlaceholder = 'Buscar…',
    emptyText = 'Sin coincidencias.',
    triggerClassName,
}: FormComboboxMultiProps) {
    const [open, setOpen] = React.useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const selectedLabels = value
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter(Boolean) as string[];

    const summary =
        selectedLabels.length === 0
            ? triggerPlaceholder
            : selectedLabels.length <= 2
              ? selectedLabels.join(', ')
              : `${selectedLabels.length} seleccionados`;

    const toggle = (v: string) => {
        onValueChange(
            value.includes(v) ? value.filter((x) => x !== v) : [...value, v],
        );
    };

    const selectSingle = (v: string) => {
        onValueChange(value.includes(v) ? [] : [v]);
    };

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <Popover modal={false} open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        id={inputId}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-expanded={open}
                        className={cn(
                            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm',
                            'transition-all outline-none',
                            'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            error
                                ? 'border-red-400 bg-red-50/30 text-slate-800'
                                : 'border-slate-200 bg-white text-slate-800',
                            selectedLabels.length === 0 && 'text-slate-400',
                            triggerClassName,
                        )}
                    >
                        <span className="min-w-0 flex-1 truncate">{summary}</span>
                        <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandList>
                            <CommandEmpty>{emptyText}</CommandEmpty>
                            <CommandGroup>
                                {options.map((opt) => (
                                    <CommandItem
                                        key={opt.value}
                                        value={`${opt.label} ${opt.value}`}
                                        disabled={opt.disabled}
                                        onSelect={() => {
                                            if (opt.disabled) {
                                                return;
                                            }

                                            if (closeOnSelect) {
                                                selectSingle(opt.value);
                                                setOpen(false);
                                            } else {
                                                toggle(opt.value);
                                            }
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 size-4 shrink-0 text-blue-600',
                                                value.includes(opt.value) ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                        <span>{opt.label}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormComboboxSingle (Popover + cmdk, una opción) ─────────────────────────
//
// Igual que el multi pero selección única; admite `icon` opcional por ítem y en el trigger.

export interface FormComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}

interface FormComboboxSingleProps extends BaseFieldProps {
    id?: string;
    options: FormComboboxOption[];
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    triggerPlaceholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    triggerClassName?: string;
}

export function FormComboboxSingle({
    label,
    required,
    hint,
    error,
    className,
    id,
    options,
    value,
    onValueChange,
    disabled,
    triggerPlaceholder = 'Seleccionar…',
    searchPlaceholder = 'Buscar…',
    emptyText = 'Sin coincidencias.',
    triggerClassName,
}: FormComboboxSingleProps) {
    const [open, setOpen] = React.useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const selected = options.find((o) => o.value === value);
    const showPlaceholder = !selected;

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <Popover modal={false} open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        id={inputId}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-expanded={open}
                        className={cn(
                            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm',
                            'transition-all outline-none',
                            'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            error
                                ? 'border-red-400 bg-red-50/30 text-slate-800'
                                : 'border-slate-200 bg-white text-slate-800',
                            showPlaceholder && 'text-slate-400',
                            triggerClassName,
                        )}
                    >
                        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                            {selected?.icon ? (
                                <span className="flex shrink-0 items-center">{selected.icon}</span>
                            ) : null}
                            <span className="min-w-0 truncate">
                                {selected ? selected.label : triggerPlaceholder}
                            </span>
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandList>
                            <CommandEmpty>{emptyText}</CommandEmpty>
                            <CommandGroup>
                                {options.map((opt) => (
                                    <CommandItem
                                        key={`${opt.value}-${opt.label}`}
                                        value={`${opt.label} ${opt.value}`}
                                        disabled={opt.disabled}
                                        onSelect={() => {
                                            if (opt.disabled) {
                                                return;
                                            }

                                            onValueChange(opt.value);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 size-4 shrink-0 text-blue-600',
                                                value === opt.value ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                        {opt.icon ? (
                                            <span className="mr-2 flex shrink-0 items-center">{opt.icon}</span>
                                        ) : null}
                                        <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormCheckbox ─────────────────────────────────────────────────────────────

interface FormCheckboxProps extends BaseFieldProps {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    /** Texto que aparece al lado del checkbox (distinto al label superior) */
    description?: string;
}

export function FormCheckbox({
    label,
    required,
    hint,
    error,
    className,
    id,
    checked,
    onCheckedChange,
    disabled,
    description,
}: FormCheckboxProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <label
                htmlFor={inputId}
                className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
                    checked
                        ? 'border-blue-200 bg-blue-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50/60',
                    disabled && 'cursor-not-allowed opacity-50',
                )}
            >
                <CheckboxPrimitive.Root
                    id={inputId}
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    disabled={disabled}
                    className={cn(
                        'mt-0.5 size-4 shrink-0 rounded-[4px] border transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        checked
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-slate-300 bg-white',
                    )}
                >
                    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
                        <CheckIcon className="size-3" />
                    </CheckboxPrimitive.Indicator>
                </CheckboxPrimitive.Root>
                {description && (
                    <span className="text-sm leading-tight text-slate-700">{description}</span>
                )}
            </label>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormCheckboxGroup ────────────────────────────────────────────────────────

interface CheckboxOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}

interface FormCheckboxGroupProps extends BaseFieldProps {
    options: CheckboxOption[];
    value: string[];
    onChange: (value: string[]) => void;
    columns?: 1 | 2 | 3;
}

export function FormCheckboxGroup({
    label,
    required,
    hint,
    error,
    className,
    options,
    value,
    onChange,
    columns = 1,
}: FormCheckboxGroupProps) {
    const toggle = (v: string) => {
        onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    };

    const colClass = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }[columns];

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} />}
            <div className={cn('grid gap-2', colClass)}>
                {options.map((opt) => {
                    const checked = value.includes(opt.value);

                    return (
                        <label
                            key={opt.value}
                            className={cn(
                                'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
                                checked
                                    ? 'border-blue-200 bg-blue-50/50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50/60',
                                opt.disabled && 'cursor-not-allowed opacity-50',
                            )}
                        >
                            <CheckboxPrimitive.Root
                                checked={checked}
                                onCheckedChange={() => !opt.disabled && toggle(opt.value)}
                                disabled={opt.disabled}
                                className={cn(
                                    'mt-0.5 size-4 shrink-0 rounded-[4px] border transition-all',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
                                    checked
                                        ? 'border-blue-500 bg-blue-500 text-white'
                                        : 'border-slate-300 bg-white',
                                )}
                            >
                                <CheckboxPrimitive.Indicator className="flex items-center justify-center">
                                    <CheckIcon className="size-3" />
                                </CheckboxPrimitive.Indicator>
                            </CheckboxPrimitive.Root>
                            <div className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-slate-700">
                                    {opt.label}
                                </span>
                                {opt.description && (
                                    <span className="text-[11px] text-slate-400">
                                        {opt.description}
                                    </span>
                                )}
                            </div>
                        </label>
                    );
                })}
            </div>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormSwitch ───────────────────────────────────────────────────────────────

interface FormSwitchProps extends BaseFieldProps {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    description?: string;
}

export function FormSwitch({
    label,
    required,
    hint,
    error,
    className,
    id,
    checked,
    onCheckedChange,
    disabled,
    description,
}: FormSwitchProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} htmlFor={inputId} />}
            <div className="flex items-center gap-3">
                {/* Toggle track */}
                <button
                    id={inputId}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={disabled}
                    onClick={() => onCheckedChange?.(!checked)}
                    className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
                        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        checked ? 'bg-blue-500' : 'bg-slate-200',
                    )}
                >
                    <span
                        className={cn(
                            'pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
                            checked ? 'translate-x-4' : 'translate-x-0',
                        )}
                    />
                </button>
                {description && (
                    <span className={cn('text-sm', checked ? 'text-slate-700' : 'text-slate-500')}>
                        {description}
                    </span>
                )}
            </div>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}

// ─── FormRadioGroup ───────────────────────────────────────────────────────────

interface RadioOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}

interface FormRadioGroupProps extends BaseFieldProps {
    name: string;
    value?: string;
    onChange: (value: string) => void;
    options: RadioOption[];
    direction?: 'vertical' | 'horizontal';
}

export function FormRadioGroup({
    label,
    required,
    hint,
    error,
    className,
    name,
    value,
    onChange,
    options,
    direction = 'vertical',
}: FormRadioGroupProps) {
    return (
        <div className={cn('flex flex-col', className)}>
            {label && <FieldLabel label={label} required={required} />}
            <div
                className={cn(
                    'flex gap-2',
                    direction === 'vertical' ? 'flex-col' : 'flex-wrap',
                )}
            >
                {options.map((opt) => {
                    const isSelected = value === opt.value;

                    return (
                        <label
                            key={opt.value}
                            className={cn(
                                'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
                                isSelected
                                    ? 'border-blue-200 bg-blue-50/50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50/60',
                                opt.disabled && 'cursor-not-allowed opacity-50',
                            )}
                        >
                            {/* Radio custom */}
                            <div
                                className={cn(
                                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                                    isSelected
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-slate-300 bg-white',
                                )}
                            >
                                {isSelected && (
                                    <span className="size-1.5 rounded-full bg-white" />
                                )}
                            </div>
                            <input
                                type="radio"
                                name={name}
                                value={opt.value}
                                checked={isSelected}
                                disabled={opt.disabled}
                                onChange={() => !opt.disabled && onChange(opt.value)}
                                className="sr-only"
                            />
                            <div className="min-w-0 flex-1">
                                <span
                                    className={cn(
                                        'block text-sm font-medium',
                                        isSelected ? 'text-blue-700' : 'text-slate-700',
                                    )}
                                >
                                    {opt.label}
                                </span>
                                {opt.description && (
                                    <span className="text-[11px] text-slate-400">
                                        {opt.description}
                                    </span>
                                )}
                            </div>
                        </label>
                    );
                })}
            </div>
            {hint && !error && <FieldHint hint={hint} />}
            {error && <FieldError error={error} />}
        </div>
    );
}
