<?php

/**
 * Rutas del panel administrativo.
 *
 * Middleware aplicado al grupo:
 *   - auth      → usuario autenticado
 *   - verified  → correo verificado
 *
 * Los permisos granulares se verifican en cada controlador
 * para permitir respuestas más expresivas (403 con mensaje).
 */

use App\Http\Controllers\Admin\CertificateTemplateController;
use App\Http\Controllers\Admin\CertificateController;
use App\Http\Controllers\Admin\CertificateVerificationLogController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\InstructorPayoutController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\RefundController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\CourseEnrollmentController;
use App\Http\Controllers\Admin\CourseFichaController;
use App\Http\Controllers\Admin\CourseLessonController;
use App\Http\Controllers\Admin\CourseLessonDocumentController;
use App\Http\Controllers\Admin\CourseLessonHomeworkController;
use App\Http\Controllers\Admin\CourseLessonMaterialController;
use App\Http\Controllers\Admin\CourseLessonResourceController;
use App\Http\Controllers\Admin\CourseLessonQuizController;
use App\Http\Controllers\Admin\CourseLessonQuizQuestionController;
use App\Http\Controllers\Admin\CourseLessonVideoController;
use App\Http\Controllers\Admin\CourseModuleController;
use App\Http\Controllers\Admin\PackageController;
use App\Http\Controllers\Admin\GeneralSettingController;
use App\Http\Controllers\Admin\PlatformSettingController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\InstructorController;
use App\Http\Controllers\Admin\InstructorCredentialController;
use App\Http\Controllers\Admin\SpecializationController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\AuditController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'student.marketplace'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // ── Usuarios ───────────────────────────────────────────────────────
        Route::get('users', [UserController::class, 'index'])
            ->name('users.index')
            ->middleware('permission:usuarios.view');
        Route::post('users', [UserController::class, 'store'])
            ->name('users.store')
            ->middleware('permission:usuarios.create');
        Route::put('users/{user}', [UserController::class, 'update'])
            ->name('users.update')
            ->middleware('permission:usuarios.edit');
        Route::delete('users/{user}', [UserController::class, 'destroy'])
            ->name('users.destroy')
            ->middleware('permission:usuarios.delete');

        // ── Cupones ───────────────────────────────────────────────────────
        Route::get('coupons', [CouponController::class, 'index'])
            ->name('coupons.index')
            ->middleware('permission:cupones.view');
        Route::post('coupons', [CouponController::class, 'store'])
            ->name('coupons.store')
            ->middleware('permission:cupones.create');
        Route::put('coupons/{coupon}', [CouponController::class, 'update'])
            ->name('coupons.update')
            ->middleware('permission:cupones.edit');
        Route::delete('coupons/{coupon}', [CouponController::class, 'destroy'])
            ->name('coupons.destroy')
            ->middleware('permission:cupones.delete');
        Route::get('coupons/{coupon}/usages', [CouponController::class, 'usages'])
            ->name('coupons.usages')
            ->middleware('permission:cupones.view');

        // ── Órdenes (consulta / soporte) ─────────────────────────────────────
        Route::get('orders', [OrderController::class, 'index'])
            ->name('orders.index')
            ->middleware('permission:ordenes.view');
        Route::get('orders/{order}/items', [OrderController::class, 'items'])
            ->name('orders.items')
            ->middleware('permission:ordenes.items');
        Route::get('payments', [PaymentController::class, 'index'])
            ->name('payments.index')
            ->middleware('permission:pagos.view');
        Route::get('refunds', [RefundController::class, 'index'])
            ->name('refunds.index')
            ->middleware('permission:reembolsos.view');
        Route::get('instructor-payouts', [InstructorPayoutController::class, 'index'])
            ->name('instructor-payouts.index')
            ->middleware('permission:liquidaciones_instructores.view');
        Route::post('instructor-payouts', [InstructorPayoutController::class, 'store'])
            ->name('instructor-payouts.store')
            ->middleware('permission:liquidaciones_instructores.create');
        Route::put('instructor-payouts/{instructor_payout}', [InstructorPayoutController::class, 'update'])
            ->name('instructor-payouts.update')
            ->middleware('permission:liquidaciones_instructores.edit');
        Route::get('instructor-payouts/summary', [InstructorPayoutController::class, 'summary'])
            ->name('instructor-payouts.summary')
            ->middleware('permission:liquidaciones_instructores.view');
        Route::get('notifications', [NotificationController::class, 'index'])
            ->name('notifications.index')
            ->middleware('permission:notificaciones.view');
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead'])
            ->name('notifications.read-all')
            ->middleware('permission:notificaciones.view');
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead'])
            ->name('notifications.read')
            ->middleware('permission:notificaciones.view');
        Route::patch('notifications/{notification}/archive', [NotificationController::class, 'archive'])
            ->name('notifications.archive')
            ->middleware('permission:notificaciones.view');
        Route::put('notifications/preferences', [NotificationController::class, 'updatePreferences'])
            ->name('notifications.preferences.update')
            ->middleware('permission:notificaciones.edit');

        // ── Certificados · emitidos ───────────────────────────────────────────
        Route::get('certificates', [CertificateController::class, 'index'])
            ->name('certificates.index')
            ->middleware('permission:certificados_emitidos.view');
        Route::post('certificates', [CertificateController::class, 'store'])
            ->name('certificates.store')
            ->middleware('permission:certificados_emitidos.create');
        Route::get('certificates/{certificate}/verifications', [CertificateVerificationLogController::class, 'index'])
            ->name('certificates.verifications.index')
            ->middleware('permission:certificados_emitidos.verifications');

        // ── Certificados · plantillas ─────────────────────────────────────────
        Route::get('certificate-templates', [CertificateTemplateController::class, 'index'])
            ->name('certificate-templates.index')
            ->middleware('permission:certificados_plantillas.view');
        Route::get('certificate-templates/create', [CertificateTemplateController::class, 'create'])
            ->name('certificate-templates.create')
            ->middleware('permission:certificados_plantillas.create');
        Route::get('certificate-templates/{certificate_template}/edit', [CertificateTemplateController::class, 'edit'])
            ->name('certificate-templates.edit')
            ->middleware('permission:certificados_plantillas.edit');
        Route::post('certificate-templates', [CertificateTemplateController::class, 'store'])
            ->name('certificate-templates.store')
            ->middleware('permission:certificados_plantillas.create');
        // POST + _method=PUT: FormData con archivos no llega bien en PUT directo (PHP).
        Route::match(['put', 'post'], 'certificate-templates/{certificate_template}', [CertificateTemplateController::class, 'update'])
            ->name('certificate-templates.update')
            ->middleware('permission:certificados_plantillas.edit');
        Route::delete('certificate-templates/{certificate_template}', [CertificateTemplateController::class, 'destroy'])
            ->name('certificate-templates.destroy')
            ->middleware('permission:certificados_plantillas.delete');

        // ── Especializaciones (rutas de aprendizaje) ─────────────────────────
        Route::get('specializations', [SpecializationController::class, 'index'])
            ->name('specializations.index')
            ->middleware('permission:especializaciones.view');
        Route::post('specializations', [SpecializationController::class, 'store'])
            ->name('specializations.store')
            ->middleware('permission:especializaciones.create');
        Route::put('specializations/{specialization}', [SpecializationController::class, 'update'])
            ->name('specializations.update')
            ->middleware('permission:especializaciones.edit');
        Route::delete('specializations/{specialization}', [SpecializationController::class, 'destroy'])
            ->name('specializations.destroy')
            ->middleware('permission:especializaciones.delete');

        // ── Paquetes (varios cursos con precio promocional) ─────────────────
        Route::get('packages', [PackageController::class, 'index'])
            ->name('packages.index')
            ->middleware('permission:paquetes.view');
        Route::post('packages', [PackageController::class, 'store'])
            ->name('packages.store')
            ->middleware('permission:paquetes.create');
        Route::put('packages/{package}', [PackageController::class, 'update'])
            ->name('packages.update')
            ->middleware('permission:paquetes.edit');
        Route::delete('packages/{package}', [PackageController::class, 'destroy'])
            ->name('packages.destroy')
            ->middleware('permission:paquetes.delete');

        // ── Instructores ───────────────────────────────────────────────────
        Route::get('instructors', [InstructorController::class, 'index'])
            ->name('instructors.index')
            ->middleware('permission:instructores.view');
        Route::post('instructors', [InstructorController::class, 'store'])
            ->name('instructors.store')
            ->middleware('permission:instructores.create');
        Route::put('instructors/{instructor}', [InstructorController::class, 'update'])
            ->name('instructors.update')
            ->middleware('permission:instructores.edit');
        Route::delete('instructors/{instructor}', [InstructorController::class, 'destroy'])
            ->name('instructors.destroy')
            ->middleware('permission:instructores.delete');

        // ── Credenciales docentes ───────────────────────────────────────────
        Route::get('instructor-credentials', [InstructorCredentialController::class, 'index'])
            ->name('instructor-credentials.index')
            ->middleware('permission:credenciales_docentes.view');
        Route::post('instructor-credentials', [InstructorCredentialController::class, 'store'])
            ->name('instructor-credentials.store')
            ->middleware('permission:credenciales_docentes.create');
        Route::put('instructor-credentials/{instructorCredential}', [InstructorCredentialController::class, 'update'])
            ->name('instructor-credentials.update')
            ->middleware('permission:credenciales_docentes.edit');
        Route::delete('instructor-credentials/{instructorCredential}', [InstructorCredentialController::class, 'destroy'])
            ->name('instructor-credentials.destroy')
            ->middleware('permission:credenciales_docentes.delete');

        // ── Categorías y etiquetas (taxonomía del catálogo) ─────────────────
        Route::get('categories', [CategoryController::class, 'index'])
            ->name('categories.index')
            ->middleware('permission:categorias.view');
        Route::post('categories', [CategoryController::class, 'store'])
            ->name('categories.store')
            ->middleware('permission:categorias.create');
        // POST + _method=PUT: multipart con archivos no llega bien en PUT directo (PHP).
        Route::match(['put', 'post'], 'categories/{category}', [CategoryController::class, 'update'])
            ->name('categories.update')
            ->middleware('permission:categorias.edit');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])
            ->name('categories.destroy')
            ->middleware('permission:categorias.delete');

        // ── Cursos (catálogo) ─────────────────────────────────────────────
        Route::get('courses', [CourseController::class, 'index'])
            ->name('courses.index')
            ->middleware('permission:cursos.view');
        Route::post('courses', [CourseController::class, 'store'])
            ->name('courses.store')
            ->middleware('permission:cursos.create');
        // POST + _method=PUT: multipart con vídeo no llega bien en PUT directo (PHP).
        Route::match(['put', 'post'], 'courses/{course}', [CourseController::class, 'update'])
            ->name('courses.update')
            ->middleware('permission:cursos.edit');
        Route::delete('courses/{course}', [CourseController::class, 'destroy'])
            ->name('courses.destroy')
            ->middleware('permission:cursos.delete');

        // ── Curso · matrículas (solo lectura: quién está inscrito) ───────────
        Route::get('courses/{course}/enrollments', [CourseEnrollmentController::class, 'index'])
            ->name('courses.enrollments.index')
            ->middleware('permission:cursos_matriculas.view');
        Route::get('courses/{course}/enrollments/{enrollment}/tracking', [CourseEnrollmentController::class, 'tracking'])
            ->name('courses.enrollments.tracking')
            ->middleware('permission:cursos_matriculas.view');

        // ── Curso · módulos (estructura del contenido) ─────────────────────
        Route::get('courses/{course}/modules', [CourseModuleController::class, 'index'])
            ->name('courses.modules.index')
            ->middleware('permission:cursos_modulos.view');
        Route::post('courses/{course}/modules', [CourseModuleController::class, 'store'])
            ->name('courses.modules.store')
            ->middleware('permission:cursos_modulos.create');
        Route::put('courses/{course}/modules/reorder', [CourseModuleController::class, 'reorder'])
            ->name('courses.modules.reorder')
            ->middleware('permission:cursos_modulos.edit');
        Route::put('courses/{course}/modules/{course_module}', [CourseModuleController::class, 'update'])
            ->name('courses.modules.update')
            ->middleware('permission:cursos_modulos.edit');
        Route::delete('courses/{course}/modules/{course_module}', [CourseModuleController::class, 'destroy'])
            ->name('courses.modules.destroy')
            ->middleware('permission:cursos_modulos.delete');

        // ── Curso · lecciones (por módulo) ─────────────────────────────────
        Route::post('courses/{course}/modules/{course_module}/lessons', [CourseLessonController::class, 'store'])
            ->name('courses.modules.lessons.store')
            ->middleware('permission:cursos_lecciones.create');
        Route::put('courses/{course}/modules/{course_module}/lessons/reorder', [CourseLessonController::class, 'reorder'])
            ->name('courses.modules.lessons.reorder')
            ->middleware('permission:cursos_lecciones.edit');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}', [CourseLessonController::class, 'update'])
            ->name('courses.modules.lessons.update')
            ->middleware('permission:cursos_lecciones.edit');
        Route::delete('courses/{course}/modules/{course_module}/lessons/{lesson}', [CourseLessonController::class, 'destroy'])
            ->name('courses.modules.lessons.destroy')
            ->middleware('permission:cursos_lecciones.delete');

        // ── Curso · lección · documentos y recursos (materiales) ───────────
        Route::get('courses/{course}/modules/{course_module}/lessons/{lesson}/materials', [CourseLessonMaterialController::class, 'show'])
            ->name('courses.modules.lessons.materials.show');
        Route::post('courses/{course}/modules/{course_module}/lessons/{lesson}/documents', [CourseLessonDocumentController::class, 'store'])
            ->name('courses.modules.lessons.documents.store')
            ->middleware('permission:cursos_lecciones_documentos.create');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}/documents/reorder', [CourseLessonDocumentController::class, 'reorder'])
            ->name('courses.modules.lessons.documents.reorder')
            ->middleware('permission:cursos_lecciones_documentos.edit');
        Route::match(['put', 'post'], 'courses/{course}/modules/{course_module}/lessons/{lesson}/documents/{lesson_document}', [CourseLessonDocumentController::class, 'update'])
            ->name('courses.modules.lessons.documents.update')
            ->middleware('permission:cursos_lecciones_documentos.edit');
        Route::delete('courses/{course}/modules/{course_module}/lessons/{lesson}/documents/{lesson_document}', [CourseLessonDocumentController::class, 'destroy'])
            ->name('courses.modules.lessons.documents.destroy')
            ->middleware('permission:cursos_lecciones_documentos.delete');
        Route::post('courses/{course}/modules/{course_module}/lessons/{lesson}/resources', [CourseLessonResourceController::class, 'store'])
            ->name('courses.modules.lessons.resources.store')
            ->middleware('permission:cursos_lecciones_recursos.create');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}/homework', [CourseLessonHomeworkController::class, 'update'])
            ->name('courses.modules.lessons.homework.update')
            ->middleware('permission:cursos_lecciones_tareas.edit');
        Route::delete('courses/{course}/modules/{course_module}/lessons/{lesson}/homework', [CourseLessonHomeworkController::class, 'destroy'])
            ->name('courses.modules.lessons.homework.destroy')
            ->middleware('permission:cursos_lecciones_tareas.delete');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}/resources/reorder', [CourseLessonResourceController::class, 'reorder'])
            ->name('courses.modules.lessons.resources.reorder')
            ->middleware('permission:cursos_lecciones_recursos.edit');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}/resources/{lesson_resource}', [CourseLessonResourceController::class, 'update'])
            ->name('courses.modules.lessons.resources.update')
            ->middleware('permission:cursos_lecciones_recursos.edit');
        Route::delete('courses/{course}/modules/{course_module}/lessons/{lesson}/resources/{lesson_resource}', [CourseLessonResourceController::class, 'destroy'])
            ->name('courses.modules.lessons.resources.destroy')
            ->middleware('permission:cursos_lecciones_recursos.delete');

        // ── Curso · lección · vídeo principal (1:1) ─────────────────────────
        Route::post('courses/{course}/modules/{course_module}/lessons/{lesson}/video', [CourseLessonVideoController::class, 'store'])
            ->name('courses.modules.lessons.video.store')
            ->middleware('permission:cursos_lecciones_videos.create');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}/video', [CourseLessonVideoController::class, 'update'])
            ->name('courses.modules.lessons.video.update')
            ->middleware('permission:cursos_lecciones_videos.edit');
        Route::delete('courses/{course}/modules/{course_module}/lessons/{lesson}/video', [CourseLessonVideoController::class, 'destroy'])
            ->name('courses.modules.lessons.video.destroy')
            ->middleware('permission:cursos_lecciones_videos.delete');

        // ── Curso · lección · cuestionario (lección tipo quiz) ─────────────
        Route::get('courses/{course}/modules/{course_module}/lessons/{lesson}/quiz', [CourseLessonQuizController::class, 'show'])
            ->name('courses.modules.lessons.quiz.show')
            ->middleware('permission:cursos_lecciones_quizzes.view');
        Route::post('courses/{course}/modules/{course_module}/lessons/{lesson}/quiz', [CourseLessonQuizController::class, 'store'])
            ->name('courses.modules.lessons.quiz.store')
            ->middleware('permission:cursos_lecciones_quizzes.create');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}/quiz', [CourseLessonQuizController::class, 'update'])
            ->name('courses.modules.lessons.quiz.update')
            ->middleware('permission:cursos_lecciones_quizzes.edit');
        Route::delete('courses/{course}/modules/{course_module}/lessons/{lesson}/quiz', [CourseLessonQuizController::class, 'destroy'])
            ->name('courses.modules.lessons.quiz.destroy')
            ->middleware('permission:cursos_lecciones_quizzes.delete');
        Route::post('courses/{course}/modules/{course_module}/lessons/{lesson}/quiz/questions', [CourseLessonQuizQuestionController::class, 'store'])
            ->name('courses.modules.lessons.quiz.questions.store')
            ->middleware('permission:cursos_lecciones_quizzes.edit');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}/quiz/questions/reorder', [CourseLessonQuizQuestionController::class, 'reorder'])
            ->name('courses.modules.lessons.quiz.questions.reorder')
            ->middleware('permission:cursos_lecciones_quizzes.edit');
        Route::put('courses/{course}/modules/{course_module}/lessons/{lesson}/quiz/questions/{quiz_question}', [CourseLessonQuizQuestionController::class, 'update'])
            ->name('courses.modules.lessons.quiz.questions.update')
            ->middleware('permission:cursos_lecciones_quizzes.edit');
        Route::delete('courses/{course}/modules/{course_module}/lessons/{lesson}/quiz/questions/{quiz_question}', [CourseLessonQuizQuestionController::class, 'destroy'])
            ->name('courses.modules.lessons.quiz.questions.destroy')
            ->middleware('permission:cursos_lecciones_quizzes.edit');

        // ── Curso · ficha de venta (requisitos, objetivos, público) ───────
        Route::get('courses/{course}/ficha', [CourseFichaController::class, 'show'])
            ->name('courses.ficha.show')
            ->middleware('permission:cursos_ficha.view');
        Route::put('courses/{course}/ficha/requirements', [CourseFichaController::class, 'updateRequirements'])
            ->name('courses.ficha.requirements.update')
            ->middleware('permission:cursos_ficha.edit');
        Route::put('courses/{course}/ficha/objectives', [CourseFichaController::class, 'updateObjectives'])
            ->name('courses.ficha.objectives.update')
            ->middleware('permission:cursos_ficha.edit');
        Route::put('courses/{course}/ficha/target-audiences', [CourseFichaController::class, 'updateTargetAudiences'])
            ->name('courses.ficha.target-audiences.update')
            ->middleware('permission:cursos_ficha.edit');

        // ── Configuración de plataforma (una sola fila) ───────────────────
        Route::get('platform-settings', [PlatformSettingController::class, 'edit'])
            ->name('platform-settings.edit')
            ->middleware('permission:plataforma.view');
        // post + _method=put (FormData): PUT real con multipart suele llegar vacío a PHP/Laravel
        Route::match(['put', 'post'], 'platform-settings', [PlatformSettingController::class, 'update'])
            ->name('platform-settings.update')
            ->middleware('permission:plataforma.edit');

        // ── Configuración general (contacto, legales y redes) ─────────────
        Route::get('general-settings', [GeneralSettingController::class, 'edit'])
            ->name('general-settings.edit')
            ->middleware('permission:general.view');
        Route::match(['put', 'post'], 'general-settings', [GeneralSettingController::class, 'update'])
            ->name('general-settings.update')
            ->middleware('permission:general.edit');

        // ── Auditoría (actividad e inicios de sesión) ─────────────────────
        Route::get('audit', [AuditController::class, 'index'])
            ->name('audit.index')
            ->middleware('permission:auditoria.view');

        // ── Roles ────────────────────────────────────────────────────────
        Route::resource('roles', RoleController::class)
            ->except(['create', 'edit', 'show'])   // todo via modal (SPA)
            ->middleware('permission:roles.view');  // guard mínimo de acceso
    });
