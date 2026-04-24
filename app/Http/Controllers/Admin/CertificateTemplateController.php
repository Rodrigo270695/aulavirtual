<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CertificateTemplateRequest;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\Specialization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CertificateTemplateController extends Controller
{
    private const IMAGE_DISK = 'public';

    private const IMAGE_DIR = 'certificate-templates';

    public function index(): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $templates = CertificateTemplate::query()
            ->with([
                'course:id,title,slug',
                'specialization:id,title,slug',
            ])
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $needle = mb_strtolower(trim($search));
                    $query->where(function ($q) use ($needle): void {
                        $q->whereRaw('LOWER(name) LIKE ?', ["%{$needle}%"])
                            ->orWhereRaw('LOWER(template_html) LIKE ?', ["%{$needle}%"]);
                    });
                }
            )
            ->when(
                request()->filled('is_active') && in_array((string) request('is_active'), ['0', '1'], true),
                fn ($q) => $q->where('is_active', request('is_active') === '1')
            )
            ->when(
                in_array($sortBy, ['name', 'is_active', 'created_at'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                fn ($q) => $q->orderByDesc('created_at')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString();

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'is_active']);
        if (! request()->filled('is_active') || ! in_array((string) request('is_active'), ['0', '1'], true)) {
            unset($filters['is_active']);
        }

        return Inertia::render('admin/certificate-templates/index', [
            'templates' => $templates,
            'filters' => $filters,
            'can' => $this->capabilities(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('certificados_plantillas.create');

        return Inertia::render('admin/certificate-templates/editor', [
            'template' => null,
            'courseOptions' => $this->courseOptions(),
            'specializationOptions' => $this->specializationOptions(),
            'can' => $this->capabilities(),
        ]);
    }

    public function edit(CertificateTemplate $certificateTemplate): Response
    {
        $this->authorize('certificados_plantillas.edit');

        $certificateTemplate->loadMissing([
            'course:id,title,slug',
            'specialization:id,title,slug',
        ]);

        return Inertia::render('admin/certificate-templates/editor', [
            'template' => $certificateTemplate,
            'courseOptions' => $this->courseOptions(),
            'specializationOptions' => $this->specializationOptions(),
            'can' => $this->capabilities(),
        ]);
    }

    public function store(CertificateTemplateRequest $request): RedirectResponse
    {
        $this->authorize('certificados_plantillas.create');

        $validated = $this->validatedAttributes($request);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $disk = Storage::disk(self::IMAGE_DISK);

        foreach ([
            'background_image_file' => 'background_image',
            'signature_image_file' => 'signature_image',
            'institution_logo_file' => 'institution_logo',
        ] as $fileKey => $column) {
            if ($request->hasFile($fileKey)) {
                $validated[$column] = $request->file($fileKey)->store(self::IMAGE_DIR, self::IMAGE_DISK);
            }
        }

        $created = CertificateTemplate::query()->create($validated);

        return to_route('admin.certificate-templates.edit', ['certificate_template' => $created->id])
            ->with('success', 'Plantilla de certificado creada correctamente.');
    }

    public function update(CertificateTemplateRequest $request, CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $this->authorize('certificados_plantillas.edit');

        $validated = $this->validatedAttributes($request);
        $disk = Storage::disk(self::IMAGE_DISK);

        $imageMap = [
            'background_image_file' => ['column' => 'background_image', 'remove' => 'remove_background'],
            'signature_image_file' => ['column' => 'signature_image', 'remove' => 'remove_signature'],
            'institution_logo_file' => ['column' => 'institution_logo', 'remove' => 'remove_logo'],
        ];

        foreach ($imageMap as $fileKey => $meta) {
            $column = $meta['column'];
            $removeKey = $meta['remove'];

            if ($request->hasFile($fileKey)) {
                if ($certificateTemplate->{$column}) {
                    $disk->delete($certificateTemplate->{$column});
                }
                $validated[$column] = $request->file($fileKey)->store(self::IMAGE_DIR, self::IMAGE_DISK);
            } elseif ($request->boolean($removeKey)) {
                if ($certificateTemplate->{$column}) {
                    $disk->delete($certificateTemplate->{$column});
                }
                $validated[$column] = null;
            }
        }

        $certificateTemplate->update($validated);

        return back()->with('success', 'Plantilla de certificado actualizada correctamente.');
    }

    /**
     * @return array<string, bool>
     */
    private function capabilities(): array
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        return [
            'create' => $user?->can('certificados_plantillas.create') ?? false,
            'edit' => $user?->can('certificados_plantillas.edit') ?? false,
            'delete' => $user?->can('certificados_plantillas.delete') ?? false,
        ];
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{id: string, label: string}>
     */
    private function courseOptions()
    {
        return Course::query()
            ->orderBy('title')
            ->get(['id', 'title', 'slug'])
            ->map(fn (Course $c) => [
                'id' => $c->id,
                'label' => "{$c->title} ({$c->slug})",
            ])
            ->values();
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{id: string, label: string}>
     */
    private function specializationOptions()
    {
        return Specialization::query()
            ->orderBy('title')
            ->get(['id', 'title', 'slug'])
            ->map(fn (Specialization $s) => [
                'id' => $s->id,
                'label' => "{$s->title} ({$s->slug})",
            ])
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedAttributes(CertificateTemplateRequest $request): array
    {
        $validated = $request->validated();
        unset(
            $validated['background_image_file'],
            $validated['signature_image_file'],
            $validated['institution_logo_file'],
            $validated['remove_background'],
            $validated['remove_signature'],
            $validated['remove_logo'],
        );

        return $validated;
    }

    public function destroy(CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $this->authorize('certificados_plantillas.delete');

        if (Certificate::query()->where('template_id', $certificateTemplate->id)->exists()) {
            return back()->with('error', 'No se puede eliminar: existen certificados emitidos con esta plantilla.');
        }

        $name = $certificateTemplate->name;
        $disk = Storage::disk(self::IMAGE_DISK);

        foreach (['background_image', 'signature_image', 'institution_logo'] as $col) {
            $path = $certificateTemplate->{$col};
            if ($path) {
                $disk->delete($path);
            }
        }

        $certificateTemplate->delete();

        return back()->with('success', "Plantilla «{$name}» eliminada correctamente.");
    }
}
