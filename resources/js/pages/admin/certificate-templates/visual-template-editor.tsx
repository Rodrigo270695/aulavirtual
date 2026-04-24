import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    ChevronDown,
    Copy,
    Eraser,
    Eye,
    Italic,
    Maximize2,
    Underline,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

const VARIABLES = [
    '{{student_name}}',
    '{{course_title}}',
    '{{instructor_name}}',
    '{{completion_date}}',
    '{{total_hours}}',
    '{{verification_code}}',
    '{{verification_url}}',
    '{{qr_url}}',
    '{{background_image_url}}',
    '{{signature_image_url}}',
    '{{institution_logo_url}}',
    '{{signatory_name}}',
    '{{signatory_title}}',
] as const;

const VARIABLE_HELP: Record<(typeof VARIABLES)[number], { title: string; example: string }> = {
    '{{student_name}}': { title: 'Nombre completo del estudiante al emitir el certificado.', example: 'Ej.: Ana García López' },
    '{{course_title}}': { title: 'Título del curso completado.', example: 'Ej.: HTML básico' },
    '{{instructor_name}}': { title: 'Nombre del instructor principal asociado al curso.', example: 'Ej.: Solangel Bell' },
    '{{completion_date}}': { title: 'Fecha de finalización (formato según plantilla del servidor).', example: 'Ej.: 15/04/2026' },
    '{{total_hours}}': { title: 'Horas totales acreditadas en el curso.', example: 'Ej.: 24.50' },
    '{{verification_code}}': { title: 'Código único impreso para verificación pública.', example: 'Ej.: ABC123XYZ789' },
    '{{verification_url}}': { title: 'URL completa de la página de verificación.', example: 'Ej.: https://…/verificar/…' },
    '{{qr_url}}': { title: 'URL o data URI del QR (ya maquetado en el pie del diploma visual).', example: 'Imagen QR generada por el sistema' },
    '{{background_image_url}}': { title: 'Imagen de fondo subida en esta plantilla.', example: 'Marco institucional' },
    '{{signature_image_url}}': { title: 'Imagen de firma subida en esta plantilla.', example: 'Firma escaneada' },
    '{{institution_logo_url}}': { title: 'Logo institucional subido en esta plantilla.', example: 'Logo PNG/SVG' },
    '{{signatory_name}}': { title: 'Nombre del firmante (campos inferiores del formulario).', example: 'Coincide con “Nombre del firmante”' },
    '{{signatory_title}}': { title: 'Cargo bajo la firma (campos inferiores del formulario).', example: 'Directora académica' },
};

const SAMPLE_VALUES: Record<string, string> = {
    '{{student_name}}': 'Rodrigo Granja Requejo',
    '{{course_title}}': 'HTML BASICO',
    '{{instructor_name}}': 'Solangel Bell',
    '{{completion_date}}': '15/04/2026',
    '{{total_hours}}': '24.50',
    '{{verification_code}}': 'ABC123XYZ789',
    '{{verification_url}}': 'https://aula.local/certificados/verificar/ABC123XYZ789',
    '{{qr_url}}':
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'><rect width='240' height='240' fill='white'/><rect x='24' y='24' width='62' height='62' fill='black'/><rect x='154' y='24' width='62' height='62' fill='black'/><rect x='24' y='154' width='62' height='62' fill='black'/><rect x='104' y='104' width='32' height='32' fill='black'/><rect x='150' y='110' width='16' height='16' fill='black'/><rect x='178' y='118' width='20' height='20' fill='black'/><rect x='114' y='156' width='12' height='12' fill='black'/><rect x='132' y='170' width='20' height='20' fill='black'/></svg>",
    '{{background_image_url}}': "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
    '{{signature_image_url}}': "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
    '{{institution_logo_url}}': "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
    '{{signatory_name}}': 'Rodrigo Granja Requejo',
    '{{signatory_title}}': 'Ing. de Sistemas',
};

const DEFAULT_VISUAL_BODY = '';

/** Mantener alineado con App\Support\VisualCertificateHtml::wrap (PHP) al cambiar marco o CSS. */
export function buildVisualCertificateHtml(visualBody: string): string {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Certificado</title>
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "DejaVu Sans", Arial, sans-serif;
      color: #0f172a;
      background: #fff;
    }
    .cert {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 1123px;
      height: 794px;
      padding: 72px 72px 56px;
      border: 12px solid #2563eb;
      border-radius: 18px;
      background: #fff;
      overflow: hidden;
    }
    .bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 1;
      z-index: 0;
    }
    .content {
      position: relative;
      z-index: 2;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      text-align: center;
      padding-top: 72px;
    }
    .logo-wrap {
      position: absolute;
      top: 28px;
      left: 42px;
      z-index: 3;
    }
    .logo {
      max-height: 64px;
      max-width: 190px;
      object-fit: contain;
      display: block;
    }
    .cert-shelf {
      margin-top: auto;
      padding: 28px 12px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 22px;
      position: relative;
      z-index: 4;
    }
    .signature {
      max-width: 480px;
      width: 100%;
      text-align: center;
      flex: 0 0 auto;
    }
    .signature img {
      max-height: 95px;
      max-width: 260px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .signature .line {
      border-top: 2px solid #94a3b8;
      margin-top: 4px;
      padding-top: 8px;
    }
    .signature .line p {
      margin: 0;
      font-size: 19px;
      color: #334155;
    }
    .signature .line p.who {
      font-weight: 700;
      color: #0f172a;
    }
    .verify {
      flex: 0 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: rgba(255,255,255,.96);
      padding: 8px;
      text-align: center;
    }
    .verify img {
      width: 92px;
      height: 92px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="cert">
    <img class="bg" src="{{background_image_url}}" alt="" />
    <div class="logo-wrap">
      <img class="logo" src="{{institution_logo_url}}" alt="Logo institución" />
    </div>
    <div class="content">
      <!--VISUAL_EDITOR_BODY_START-->
      ${visualBody}
      <!--VISUAL_EDITOR_BODY_END-->
      <div class="cert-shelf">
        <div class="signature">
          <img src="{{signature_image_url}}" alt="Firma" />
          <div class="line">
            <p class="who">{{signatory_name}}</p>
            <p>{{signatory_title}}</p>
          </div>
        </div>
        <div class="verify">
          <img src="{{qr_url}}" alt="QR verificación pública" />
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function extractVisualBodyFromTemplate(templateHtml: string): string {
    const match = templateHtml.match(/<!--VISUAL_EDITOR_BODY_START-->([\s\S]*?)<!--VISUAL_EDITOR_BODY_END-->/i);

    if (match && match[1]) {
        return match[1].trim();
    }

    return DEFAULT_VISUAL_BODY;
}

type Props = {
    value: string;
    onChange: (value: string) => void;
    /** Imagen de fondo (nueva o `/storage/...`) para miniatura, vista previa y lienzo del modal. */
    certificateBackgroundSrc?: string | null;
    /** Imagen de firma subida para la vista previa (sustituye el placeholder transparente). */
    certificateSignatureSrc?: string | null;
};

function replaceVariablesForPreview(
    html: string,
    sampleOverrides?: Partial<Record<(typeof VARIABLES)[number], string>>,
): string {
    let output = html;

    for (const variable of VARIABLES) {
        const repl = sampleOverrides?.[variable] ?? SAMPLE_VALUES[variable] ?? variable;
        output = output.replaceAll(variable, repl);
    }

    return output;
}

type EditorToolbarProps = {
    runCmd: (command: string, val?: string) => void;
    className?: string;
};

function EditorToolbar({ runCmd, className }: EditorToolbarProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-2 py-2 sm:gap-2 sm:px-3',
                className,
            )}
        >
            <button
                type="button"
                onClick={() => runCmd('bold')}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500"
            >
                <Bold className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Negrita</span>
            </button>
            <button
                type="button"
                onClick={() => runCmd('italic')}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500"
            >
                <Italic className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Cursiva</span>
            </button>
            <button
                type="button"
                onClick={() => runCmd('underline')}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500"
            >
                <Underline className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Subrayar</span>
            </button>
            <span className="hidden h-6 w-px bg-slate-200 sm:inline" aria-hidden />
            <label className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                <span className="sr-only">Tamaño de texto</span>
                <span className="hidden md:inline">Tamaño</span>
                <select
                    className="h-8 max-w-[9rem] rounded-md border border-slate-200 bg-white px-1 text-xs font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    defaultValue="3"
                    onChange={(e) => runCmd('fontSize', e.target.value)}
                    aria-label="Tamaño de texto"
                >
                    <option value="1">Muy pequeño</option>
                    <option value="2">Pequeño</option>
                    <option value="3">Normal</option>
                    <option value="4">Mediano</option>
                    <option value="5">Grande</option>
                    <option value="6">Muy grande</option>
                    <option value="7">Titular</option>
                </select>
            </label>
            <label className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                Color
                <input
                    type="color"
                    className="h-8 w-9 cursor-pointer overflow-hidden rounded-md border border-slate-200 bg-white p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    defaultValue="#0f172a"
                    aria-label="Color del texto"
                    onInput={(e) => runCmd('foreColor', (e.target as HTMLInputElement).value)}
                />
            </label>
            <button
                type="button"
                onClick={() => runCmd('removeFormat')}
                title="Quitar negrita, color y estilos del fragmento seleccionado"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500"
            >
                <Eraser className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Limpiar</span>
            </button>
            <span className="hidden h-6 w-px bg-slate-200 sm:inline" aria-hidden />
            <button
                type="button"
                onClick={() => runCmd('justifyLeft')}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500"
                aria-label="Alinear a la izquierda"
            >
                <AlignLeft className="size-3.5" aria-hidden />
            </button>
            <button
                type="button"
                onClick={() => runCmd('justifyCenter')}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500"
                aria-label="Centrar"
            >
                <AlignCenter className="size-3.5" aria-hidden />
            </button>
            <button
                type="button"
                onClick={() => runCmd('justifyRight')}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500"
                aria-label="Alinear a la derecha"
            >
                <AlignRight className="size-3.5" aria-hidden />
            </button>
        </div>
    );
}

type VariableChipsProps = {
    compact: boolean;
    insertVariable: (variable: string) => void;
    copyVariable: (variable: string, ev: React.MouseEvent) => void;
};

function VariableChips({ compact, insertVariable, copyVariable }: VariableChipsProps) {
    return (
        <div className={cn('flex flex-wrap gap-1.5', compact ? 'gap-1' : 'gap-2')}>
            {VARIABLES.map((variable) => {
                const help = VARIABLE_HELP[variable];
                const tip = `${help.title} ${help.example}`;

                return (
                    <span
                        key={variable}
                        className={cn(
                            'inline-flex overflow-hidden rounded-md border border-blue-200 bg-white shadow-sm',
                            compact && 'rounded',
                        )}
                    >
                        <button
                            type="button"
                            title={tip}
                            onClick={() => insertVariable(variable)}
                            className={cn(
                                'font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500',
                                compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
                            )}
                        >
                            {variable}
                        </button>
                        <button
                            type="button"
                            title={`Copiar ${variable}`}
                            onClick={(ev) => void copyVariable(variable, ev)}
                            className="border-l border-blue-200 px-1 py-0.5 text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500"
                            aria-label={`Copiar variable ${variable}`}
                        >
                            <Copy className={compact ? 'size-3' : 'size-3.5'} aria-hidden />
                        </button>
                    </span>
                );
            })}
        </div>
    );
}

export function VisualTemplateEditor({
    value,
    onChange,
    certificateBackgroundSrc = null,
    certificateSignatureSrc = null,
}: Props) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    const [variablesOpen, setVariablesOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [zoom, setZoom] = useState(80);

    // Solo hidratar al abrir el modal: comparar innerHTML con `value` en cada render rompía al teclear
    // (el navegador normaliza HTML y el efecto pisaba el DOM con un `value` desfasado → texto invisible).
    useLayoutEffect(() => {
        if (!workspaceOpen) {
            return;
        }

        const run = () => {
            if (editorRef.current) {
                editorRef.current.innerHTML = value;
            }
        };

        run();
        const id = requestAnimationFrame(run);

        return () => cancelAnimationFrame(id);
        // value solo al abrir (mismo render que pone workspaceOpen en true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceOpen]);

    const runCmd = (command: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, val);
        onChange(editorRef.current?.innerHTML ?? '');
    };

    const insertVariable = (variable: string) => {
        runCmd('insertText', variable);
    };

    const copyVariable = async (variable: string, ev: React.MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();

        try {
            await navigator.clipboard.writeText(variable);
        } catch {
            window.prompt('Copia este texto:', variable);
        }
    };

    const previewOverrides = useMemo(() => {
        const o: Partial<Record<(typeof VARIABLES)[number], string>> = {};

        if (certificateBackgroundSrc) {
            o['{{background_image_url}}'] = certificateBackgroundSrc;
        }

        if (certificateSignatureSrc) {
            o['{{signature_image_url}}'] = certificateSignatureSrc;
        }

        return Object.keys(o).length > 0 ? o : undefined;
    }, [certificateBackgroundSrc, certificateSignatureSrc]);

    const previewHtml = useMemo(() => {
        return replaceVariablesForPreview(buildVisualCertificateHtml(value), previewOverrides);
    }, [value, previewOverrides]);

    const hasBodyContent = value.replace(/<[^>]+>/g, '').trim().length > 0 || /<img/i.test(value);
    const thumbScale = 0.2;

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
                    <div className="relative min-h-[140px] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 lg:max-w-md">
                        <div
                            className="pointer-events-none absolute left-0 top-0 origin-top-left bg-white"
                            style={{
                                width: 1123,
                                height: 794,
                                transform: `scale(${thumbScale})`,
                            }}
                            aria-hidden
                        >
                            <iframe title="Miniatura del certificado" srcDoc={previewHtml} className="size-full border-0" />
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Editor visual del certificado</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                Abre el <span className="font-semibold text-slate-800">espacio de diseño</span> para un área
                                alta: verás el <span className="font-semibold text-slate-800">fondo</span> que hayas subido
                                detrás del texto, como en el diploma final. Variables en panel plegable y barra de formato.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setWorkspaceOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                            >
                                <Maximize2 className="size-4 shrink-0" aria-hidden />
                                Abrir espacio de diseño
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                            >
                                <Eye className="size-4 shrink-0" aria-hidden />
                                Vista previa
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Estado: {hasBodyContent ? 'Hay texto o elementos en el cuerpo central.' : 'Cuerpo central vacío (solo se verá marco, firma y QR del diseño base).'}
                        </p>
                    </div>
                </div>
            </div>

            <Modal
                open={workspaceOpen}
                onClose={() => setWorkspaceOpen(false)}
                title="Espacio de diseño · certificado"
                description={
                    certificateBackgroundSrc
                        ? 'El marco reproduce el fondo que tienes en la plantilla para maquetar el texto sobre el diploma real.'
                        : 'Edita el bloque central del diploma. Sube un fondo en la tarjeta inferior para ver aquí el marco decorado.'
                }
                size="full"
                footer={
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-600">
                            Cierra cuando termines. El texto queda en esta sesión hasta que pulses <span className="font-semibold">Guardar cambios</span> arriba en la página de la plantilla.
                        </p>
                        <div className="flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            >
                                <Eye className="size-4" aria-hidden />
                                Vista previa
                            </button>
                            <button
                                type="button"
                                onClick={() => setWorkspaceOpen(false)}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                Listo, cerrar editor
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-3">
                    <Collapsible open={variablesOpen} onOpenChange={setVariablesOpen} className="rounded-xl border border-slate-200 bg-slate-50">
                        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                            <span>
                                Variables dinámicas{' '}
                                <span className="font-normal text-slate-500">({VARIABLES.length})</span>
                            </span>
                            <ChevronDown
                                className={cn('size-4 shrink-0 text-slate-500 transition-transform', variablesOpen && 'rotate-180')}
                                aria-hidden
                            />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="border-t border-slate-200 px-3 pb-3 pt-1">
                                <p className="mb-2 text-xs text-slate-600">
                                    Clic para insertar en el cursor · icono para copiar · descripción en tooltip al pasar el ratón.
                                </p>
                                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-100 bg-white p-2">
                                    <VariableChips compact insertVariable={insertVariable} copyVariable={copyVariable} />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <EditorToolbar runCmd={runCmd} />
                        {!certificateBackgroundSrc ? (
                            <p className="border-b border-amber-200/80 bg-amber-50/95 px-3 py-2 text-center text-[11px] font-medium text-amber-950">
                                Aún no hay fondo: súbelo en la sección <span className="font-semibold">Fondo</span> más abajo para ver el marco detrás del texto.
                            </p>
                        ) : null}
                        <div className="min-h-[52vh] overflow-y-auto bg-slate-100/90 p-2 sm:min-h-[56vh] sm:p-4">
                            <div
                                className={cn(
                                    'relative mx-auto w-full max-w-6xl overflow-hidden rounded-[18px] border-[10px] border-blue-600 shadow-2xl ring-1 ring-slate-900/10',
                                    'min-h-[min(58vh,560px)]',
                                )}
                            >
                                {certificateBackgroundSrc ? (
                                    <img
                                        src={certificateBackgroundSrc}
                                        alt=""
                                        className="pointer-events-none absolute inset-0 z-0 size-full object-cover"
                                        aria-hidden
                                    />
                                ) : (
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300"
                                        aria-hidden
                                    />
                                )}
                                <div
                                    className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/65 via-white/15 to-white/45"
                                    aria-hidden
                                />
                                <div className="relative z-10 flex min-h-[min(52vh,500px)] w-full flex-col px-4 pb-10 pt-12 text-center sm:px-10 sm:pt-16">
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        role="textbox"
                                        aria-multiline="true"
                                        aria-label="Cuerpo del certificado: edita el texto y inserta variables desde el panel superior."
                                        spellCheck={false}
                                        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
                                        onBlur={() => onChange(editorRef.current?.innerHTML ?? '')}
                                        className="relative z-20 min-h-[42vh] w-full flex-1 cursor-text px-1 text-sm leading-relaxed text-slate-900 outline-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:min-h-[46vh] sm:px-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                title="Vista previa del certificado"
                description="Tu texto y formato del centro se muestran tal como en el editor. Las variables {{…}} usan datos de ejemplo hasta emitir el certificado. Pulsa Guardar cambios en la página para conservar la plantilla."
                size="full"
                footer={
                    <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <ZoomOut className="size-3.5" aria-hidden />
                                Alejar
                            </button>
                            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                                {zoom}%
                            </span>
                            <button
                                type="button"
                                onClick={() => setZoom((z) => Math.min(130, z + 10))}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <ZoomIn className="size-3.5" aria-hidden />
                                Acercar
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPreviewOpen(false)}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cerrar
                        </button>
                    </div>
                }
            >
                <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                    <div className="mx-auto w-fit rounded-lg bg-white p-2 shadow-sm">
                        <iframe
                            title="Preview plantilla visual amplia"
                            srcDoc={previewHtml}
                            className="h-[794px] w-[1123px] rounded bg-white"
                            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
