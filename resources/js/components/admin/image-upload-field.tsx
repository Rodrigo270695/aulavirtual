/**
 * ImageUploadField — selector de imagen con vista previa (logos, íconos, favicon).
 *
 * Pensado para FormData + Inertia: el padre guarda `File | null` en useForm.
 */

import { ImagePlus, X } from 'lucide-react';
import { useId, useRef } from 'react';
import { FormField } from '@/components/form';
import { cn } from '@/lib/utils';

export interface ImageUploadFieldProps {
    label: string;
    hint?: string;
    /** URL actual (servidor) o blob URL del archivo elegido */
    previewUrl: string;
    error?: string;
    disabled?: boolean;
    accept?: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    /** Texto bajo la zona de drop (ej. formatos) */
    footnote?: string;
    className?: string;
}

export function ImageUploadField({
    label,
    hint,
    previewUrl,
    error,
    disabled,
    accept = 'image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/x-icon,.ico',
    file,
    onFileChange,
    footnote = 'PNG, JPG, SVG o WebP. Máx. según validación del servidor.',
    className,
}: ImageUploadFieldProps) {
    const reactId = useId();
    const inputId = `image-upload-${reactId.replace(/:/g, '')}`;
    const inputRef = useRef<HTMLInputElement>(null);

    const clear = () => {
        onFileChange(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <FormField label={label} hint={hint} error={error} className={className} id={inputId}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
                <div
                    className={cn(
                        'flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50',
                        error && 'border-red-200 bg-red-50/30',
                    )}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="" className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                        <ImagePlus className="size-8 text-slate-300" aria-hidden />
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <input
                        ref={inputRef}
                        id={inputId}
                        type="file"
                        accept={accept}
                        disabled={disabled}
                        className="sr-only"
                        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                    />
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 transition-colors',
                            disabled
                                ? 'cursor-not-allowed border-slate-100 bg-slate-50/50 opacity-60'
                                : error
                                  ? 'border-red-200 bg-red-50/20 hover:border-red-300'
                                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30',
                        )}
                    >
                        <span className="text-center text-sm font-medium text-slate-700">
                            {file ? file.name : 'Haz clic para elegir imagen'}
                        </span>
                        <span className="mt-1 text-center text-xs text-slate-400">{footnote}</span>
                    </button>

                    {file && !disabled ? (
                        <button
                            type="button"
                            onClick={clear}
                            className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        >
                            <X className="size-3.5" />
                            Quitar archivo seleccionado
                        </button>
                    ) : null}
                </div>
            </div>
        </FormField>
    );
}
