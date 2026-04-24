// ─── Modelos Spatie ──────────────────────────────────────────────────────────

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions: Permission[];
    permissions_count: number;
    users_count: number;
    created_at: string;
    updated_at: string;
}

// ─── Paginación ───────────────────────────────────────────────────────────────

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    path: string;
}

// ─── Tabla genérica ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
    key: string;
    header: string;
    /** Clave que se envía al backend al ordenar. Si omitida usa `key`. */
    sortKey?: string;
    /** Muestra el icono de ordenamiento en el encabezado */
    sortable?: boolean;
    /** En vista card (móvil): este campo se convierte en el título/cabecera del card */
    cardPrimary?: boolean;
    /** En vista card (móvil): este campo se renderiza en la barra de acciones inferior */
    cardFooter?: boolean;
    /** Oculta este campo en la vista de card (móvil) */
    hideInCard?: boolean;
    /**
     * Renderer alternativo exclusivo para la vista card (móvil/tablet).
     * Si se omite, se usa `cell`. Útil para mostrar botones con etiquetas,
     * textos truncados, etc.
     */
    cardCell?: (row: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
    cell: (row: T) => React.ReactNode;
}

// ─── Filtros comunes ─────────────────────────────────────────────────────────

export interface BaseFilters {
    search?: string;
    per_page?: number | string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    [key: string]: string | number | undefined;
}

// ─── Capacidades (can) ───────────────────────────────────────────────────────

export interface RoleCan {
    create:      boolean;
    edit:        boolean;
    delete:      boolean;
    permissions: boolean;
}

// ─── Usuarios (panel admin) ──────────────────────────────────────────────────

/** Rol Spatie embebido en filas de usuario */
export interface UserRoleRef {
    id: number;
    name: string;
}

/** Opciones de rol para formularios (select / checkboxes) */
export interface RoleOption {
    id: number;
    name: string;
}

export interface AdminUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string | null;
    /** dni | ce | passport | cedula | ruc — alineado con DATABASE_DESIGN / UserRequest */
    document_type: string | null;
    document_number: string | null;
    phone_country_code: string | null;
    phone_number: string | null;
    /** ISO 3166-1 alpha-2 */
    country_code: string | null;
    timezone: string | null;
    is_active: boolean;
    is_banned: boolean;
    email_verified_at: string | null;
    roles: UserRoleRef[];
    roles_count: number;
    /** Cuenta de demo protegida: sin edición ni borrado desde el panel admin. */
    is_immutable_demo?: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

/** Filtros del listado admin de usuarios */
export type UserFilters = BaseFilters & {
    /** ID de rol Spatie; omitir o vacío = sin filtrar */
    role_id?: string | number;
    /** "1" = solo activos, "0" = solo inactivos; omitir = todos */
    is_active?: string;
};

// ─── Cupones (panel admin) ────────────────────────────────────────────────────

export interface AdminCoupon {
    id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: string | number;
    max_uses: number | null;
    max_uses_per_user: number;
    current_uses: number;
    min_purchase_amount: string | number;
    applies_to: 'all' | 'course' | 'category' | 'package' | 'specialization';
    applicable_id: string | null;
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
    created_by: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
}

export interface CouponCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export interface AdminCouponUsageUserRef {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export interface AdminCouponUsageOrderRef {
    id: string;
    order_number: string;
    total: string;
    currency: string;
}

export interface AdminCouponUsageRow {
    id: string;
    discount_applied: string;
    used_at: string | null;
    user: AdminCouponUsageUserRef | null;
    order: AdminCouponUsageOrderRef | null;
}

export interface AdminCouponUsagesPayload {
    coupon: {
        id: string;
        code: string;
        max_uses: number | null;
        max_uses_per_user: number;
        current_uses: number;
    };
    usages: AdminCouponUsageRow[];
}

export type CouponFilters = BaseFilters & {
    discount_type?: string;
    is_active?: string;
};

// ─── Órdenes (panel admin) ───────────────────────────────────────────────────

export interface AdminOrderUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export interface AdminOrderRow {
    id: string;
    order_number: string;
    status: string;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    total: string;
    currency: string;
    billing_name: string | null;
    billing_email: string | null;
    paid_at: string | null;
    created_at: string | null;
    items_count: number;
    user: AdminOrderUser | null;
}

export interface OrderCan {
    items: boolean;
}

export type OrderFilters = BaseFilters & {
    /** pending | paid | failed | cancelled | refunded */
    status?: string;
    date_from?: string;
    date_to?: string;
};

export interface AdminOrderItemRow {
    id: string;
    item_type: string;
    item_id: string;
    title: string;
    instructor_id: string | null;
    unit_price: string;
    discount_amount: string;
    final_price: string;
    instructor_revenue: string;
    platform_revenue: string;
    created_at: string | null;
}

export interface AdminOrderItemsPayload {
    order: {
        id: string;
        order_number: string;
        status: string;
        total: string;
        currency: string;
        billing_name: string | null;
        billing_email: string | null;
        paid_at: string | null;
        user: { first_name: string; last_name: string; email: string } | null;
    };
    items: AdminOrderItemRow[];
}

// ─── Pagos (panel admin) ─────────────────────────────────────────────────────

export interface AdminPaymentOrderRef {
    id: string;
    order_number: string;
    items_count: number;
    item_titles: string[];
}

export interface AdminPaymentUserRef {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export interface AdminPaymentRow {
    id: string;
    gateway: string;
    gateway_transaction_id: string | null;
    gateway_order_id: string | null;
    amount: string;
    currency: string;
    payment_method: string | null;
    card_last_four: string | null;
    card_brand: string | null;
    status: string;
    failure_reason: string | null;
    ip_address: string | null;
    processed_at: string | null;
    created_at: string | null;
    order: AdminPaymentOrderRef | null;
    user: AdminPaymentUserRef | null;
}

export type PaymentFilters = BaseFilters & {
    status?: string;
    gateway?: string;
    date_from?: string;
    date_to?: string;
};

// ─── Reembolsos (panel admin) ────────────────────────────────────────────────

export interface AdminRefundPaymentRef {
    id: string;
    gateway: string;
    gateway_transaction_id: string | null;
    currency: string;
}

export interface AdminRefundRow {
    id: string;
    reason: string;
    amount: string;
    status: string;
    admin_notes: string | null;
    gateway_refund_id: string | null;
    reviewed_at: string | null;
    processed_at: string | null;
    created_at: string | null;
    payment: AdminRefundPaymentRef | null;
    order: AdminPaymentOrderRef | null;
    user: AdminPaymentUserRef | null;
}

export type RefundFilters = BaseFilters & {
    status?: string;
    gateway?: string;
    date_from?: string;
    date_to?: string;
};

// ─── Pagos a instructores (panel admin) ──────────────────────────────────────

export interface AdminInstructorPayoutInstructorRef {
    id: string;
    payout_method: string | null;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    } | null;
}

export interface AdminInstructorPayoutRow {
    id: string;
    period_start: string | null;
    period_end: string | null;
    gross_sales: string;
    platform_fee: string;
    net_amount: string;
    currency: string;
    status: string;
    payment_reference: string | null;
    paid_at: string | null;
    created_at: string | null;
    instructor: AdminInstructorPayoutInstructorRef | null;
}

export interface InstructorPayoutInstructorOption {
    id: string;
    label: string;
}

export interface InstructorPayoutCan {
    create: boolean;
    edit: boolean;
}

export interface InstructorPayoutSalesSummary {
    gross_sales: string;
    courses_sold: number;
    orders_count: number;
}

export type InstructorPayoutFilters = BaseFilters & {
    status?: string;
    payout_method?: string;
};

// ─── Certificados · plantillas (panel admin) ─────────────────────────────────

export interface AdminCertificateTemplate {
    id: string;
    name: string;
    course_id: string | null;
    specialization_id: string | null;
    course: { id: string; title: string; slug: string } | null;
    specialization: { id: string; title: string; slug: string } | null;
    template_html: string;
    background_image: string | null;
    signature_image: string | null;
    signatory_name: string | null;
    signatory_title: string | null;
    institution_logo: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CertificateTemplateOption {
    id: string;
    label: string;
}

export interface CertificateTemplateCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export type CertificateTemplateFilters = BaseFilters & {
    /** "1" = solo activas, "0" = solo inactivas; omitir = todas */
    is_active?: string;
};

// ─── Certificados emitidos (panel admin) ─────────────────────────────────────

export interface AdminCertificate {
    id: string;
    verification_code: string;
    verification_url: string;
    student_name: string;
    course_title: string;
    instructor_name: string | null;
    completion_date: string | null;
    issued_at: string;
    is_revoked: boolean;
    revoked_reason: string | null;
    template_name: string | null;
}

export interface EnrollmentCertificateOption {
    id: string;
    label: string;
}

export type CertificateFilters = BaseFilters & {
    /** "0" = vigentes, "1" = revocados; omitir = todos */
    is_revoked?: string;
};

export interface CertificateEmitidosCan {
    emit: boolean;
    verifications: boolean;
}

/** Fila del log de verificaciones públicas de un certificado (admin). */
export interface AdminCertificateVerificationRow {
    id: string;
    ip_address: string | null;
    user_agent: string | null;
    verified_at: string;
}

/** Resumen del certificado en la pantalla de consultas al log. */
export interface CertificateVerificationLogCertificate {
    id: string;
    verification_code: string;
    verification_url: string;
    student_name: string;
    course_title: string;
    is_revoked: boolean;
    issued_at: string | null;
}

export type CertificateVerificationLogFilters = BaseFilters;

// ─── Instructores (panel admin) ──────────────────────────────────────────────

export interface InstructorUserRef {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
}

export interface AdminInstructor {
    id: string;
    user_id: string;
    user: InstructorUserRef;
    professional_title: string;
    specialization_area: string | null;
    teaching_bio: string | null;
    intro_video_url: string | null;
    status: 'pending' | 'active' | 'suspended' | 'rejected';
    approval_notes: string | null;
    total_students: number;
    total_courses: number;
    avg_rating: string | number;
    total_reviews: number;
    revenue_share_pct: string | number;
    payout_method: string | null;
    payout_details_enc: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface InstructorCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export interface InstructorUserOption {
    id: string;
    label: string;
}

export interface InstructorStatusOption {
    value: string;
    label: string;
}

export type InstructorFilters = BaseFilters & {
    status?: string;
};

// ─── Credenciales docentes (panel admin) ─────────────────────────────────────

export interface CredentialInstructorRef {
    id: string;
    user: InstructorUserRef | null;
}

export interface CredentialVerifierRef {
    id: string;
    first_name: string;
    last_name: string;
}

export interface AdminInstructorCredential {
    id: string;
    instructor_id: string;
    instructor: CredentialInstructorRef;
    credential_type: 'degree' | 'certification' | 'award' | 'publication';
    title: string;
    institution: string;
    obtained_date: string | null;
    expiry_date: string | null;
    credential_url: string | null;
    document_path: string | null;
    is_verified: boolean;
    verified_by: string | null;
    verified_at: string | null;
    verifier?: CredentialVerifierRef | null;
    created_at: string;
    updated_at: string;
}

export interface CredentialCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
    verify: boolean;
}

export interface CredentialTypeOption {
    value: string;
    label: string;
}

export type CredentialFilters = BaseFilters & {
    credential_type?: string;
    is_verified?: string;
};

// ─── Categorías y etiquetas (panel admin) ────────────────────────────────────

export interface CategoryParentRef {
    id: string;
    name: string;
    slug: string;
}

export interface AdminCategory {
    id: string;
    parent_id: string | null;
    /** 0 = raíz; sangría en tabla (viene del listado admin). */
    depth?: number;
    parent: CategoryParentRef | null;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    cover_image: string | null;
    sort_order: number;
    is_active: boolean;
    tags?: CatalogTag[];
    created_at: string;
    updated_at: string;
}

export interface CategoryCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export type CategoryFilters = BaseFilters & {
    /** "1" = activas, "0" = inactivas */
    is_active?: string;
};

export interface CategoryParentOption {
    id: string;
    label: string;
}

/** Etiqueta global del catálogo (tabla tags) */
export interface CatalogTag {
    id: string;
    name: string;
    slug: string;
    usage_count: number;
}

// ─── Cursos (panel admin) ────────────────────────────────────────────────────

export interface CourseCategoryRef {
    id: string;
    name: string;
    slug: string;
}

export interface CourseInstructorUserRef {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export interface CourseInstructorRef {
    id: string;
    user: CourseInstructorUserRef;
}

export interface AdminCourse {
    id: string;
    instructor_id: string;
    category_id: string;
    instructor: CourseInstructorRef;
    category: CourseCategoryRef;
    title: string;
    slug: string;
    subtitle: string | null;
    description: string;
    language: string;
    level: string;
    status: string;
    cover_image: string | null;
    promo_video_url: string | null;
    /** Ruta relativa en disco `public` (p. ej. course-promo-videos/…); excluyente con URL externa. */
    promo_video_path: string | null;
    /** Decimal serializado desde Laravel */
    price: string | number;
    is_free: boolean;
    currency: string;
    certificate_enabled: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    /** Etiquetas del catálogo enlazadas vía `course_tags` (misma tabla `tags` que categorías). */
    tags?: CatalogTag[];
}

export interface CourseCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
    /** Ver módulos del curso (estructura del contenido). */
    modulosView: boolean;
    /** Ver página de ficha de venta del curso (tabs requisitos / objetivos / público). */
    fichaView: boolean;
    /** Guardar ítems en la ficha de venta. */
    fichaEdit: boolean;
    /** Ver listado de matrículas del curso (alumnos inscritos). */
    matriculasView: boolean;
}

/** Usuario mínimo en filas de matrícula (admin). */
export interface AdminEnrollmentUserRef {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

/** Resumen de avance por lección / tareas (matrículas admin). */
export interface AdminEnrollmentTrackingSummary {
    lessons_total: number;
    lessons_completed: number;
    homework_lessons_total: number;
    homework_submitted_lessons: number;
}

/** Entrega de tarea en el detalle JSON de seguimiento. */
export interface AdminEnrollmentTrackingDeliverable {
    id: string;
    original_filename: string;
    url: string;
    file_size_bytes: number | null;
    created_at: string | null;
}

export interface AdminEnrollmentTrackingLesson {
    id: string;
    title: string;
    lesson_type: string;
    is_published: boolean;
    has_homework: boolean;
    homework_title: string | null;
    progress: {
        status: string;
        watch_pct: number;
        video_position_sec: number;
        completed_at: string | null;
        last_accessed_at: string | null;
    };
    deliverables: AdminEnrollmentTrackingDeliverable[];
}

export interface AdminEnrollmentTrackingModule {
    id: string;
    title: string;
    sort_order: number;
    lessons: AdminEnrollmentTrackingLesson[];
}

/** Respuesta de `GET .../enrollments/{enrollment}/tracking`. */
export interface AdminEnrollmentTrackingResponse {
    enrollment: {
        id: string;
        progress_pct: number;
        user: AdminEnrollmentUserRef;
    };
    summary: AdminEnrollmentTrackingSummary;
    modules: AdminEnrollmentTrackingModule[];
}

/** Fila de `enrollments` con `course_id` (panel admin). */
export interface AdminCourseEnrollmentRow {
    id: string;
    user_id: string;
    user: AdminEnrollmentUserRef;
    access_type: string;
    status: string;
    enrolled_at: string | null;
    expires_at: string | null;
    completed_at: string | null;
    last_accessed_at: string | null;
    /** Decimal serializado desde Laravel */
    progress_pct: string | number;
    tracking_summary: AdminEnrollmentTrackingSummary;
}

/** Cabecera del curso en la página de matrículas. */
export interface CourseEnrollmentsCourseSummary {
    id: string;
    title: string;
    slug: string;
    category: CourseCategoryRef | null;
}

export interface CourseEnrollmentsFilters {
    per_page?: number;
}

export type AdminLessonType = 'video' | 'document' | 'article' | 'quiz' | 'assignment';

export interface AdminCourseLesson {
    id: string;
    module_id: string;
    course_id: string;
    title: string;
    description: string | null;
    lesson_type: AdminLessonType;
    sort_order: number;
    duration_seconds: number;
    is_free_preview: boolean;
    is_published: boolean;
    content_text: string | null;
    /** El alumno puede subir archivos de entrega en el aula (premisa: título, descripción y contenido). */
    has_homework: boolean;
    created_at: string;
    updated_at: string;
    /** Conteo de filas en `lesson_documents` (eager `withCount`) */
    documents_count?: number;
    /** Conteo de filas en `lesson_resources` (alias en backend) */
    resources_count?: number;
    /** 0 o 1: registro en `lesson_videos` (1:1) */
    video_count?: number;
    /** 0 o 1: registro en `quizzes` con `lesson_id` (1:1 previsto) */
    quiz_count?: number;
}

export interface AdminCourseModule {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    sort_order: number;
    is_free_preview: boolean;
    duration_minutes: number;
    total_lessons: number;
    created_at: string;
    updated_at: string;
    lessons?: AdminCourseLesson[];
}

/** Permisos de lecciones en la vista de módulos del curso */
export interface CourseLessonsCan {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

/** Enlace a la página de materiales (documentos + recursos) de una lección */
export interface CourseModuleMaterialsCan {
    showPage: boolean;
}

/** Enlace a la página de cuestionario (solo lecciones tipo quiz) */
export interface CourseModuleQuizCan {
    showPage: boolean;
}

export interface AdminLessonDocument {
    id: string;
    lesson_id: string;
    title: string;
    file_path: string;
    original_filename: string;
    file_size_bytes: number | null;
    mime_type: string | null;
    is_downloadable: boolean;
    download_count: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export type AdminLessonResourceType = 'link' | 'github' | 'download' | 'software' | 'dataset';

export interface AdminLessonResource {
    id: string;
    lesson_id: string;
    resource_type: AdminLessonResourceType;
    title: string;
    url: string;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface LessonMaterialsDocCan {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export interface LessonMaterialsResCan {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export interface LessonMaterialsHomeworkCan {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export type AdminLessonVideoSource = 'upload' | 'youtube' | 'vimeo' | 'external';

export interface AdminLessonVideo {
    id: string;
    lesson_id: string;
    video_source: AdminLessonVideoSource;
    external_url: string | null;
    external_embed_url: string | null;
    external_provider_video_id: string | null;
    original_filename: string | null;
    storage_path: string | null;
    streaming_url: string | null;
    thumbnail_path: string | null;
    duration_seconds: number;
    file_size_bytes: number | null;
    resolution_480p: string | null;
    resolution_720p: string | null;
    resolution_1080p: string | null;
    codec: string | null;
    processing_status: string;
    processing_error: string | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface LessonMaterialsVideoCan {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export type AdminQuizType = 'formative' | 'summative';

export type AdminQuizShowAnswersAfter = 'never' | 'submission' | 'passed';

export type AdminQuizQuestionType =
    | 'single_choice'
    | 'multiple_choice'
    | 'true_false'
    | 'short_answer'
    | 'essay';

export interface AdminQuestionOption {
    id: string;
    question_id: string;
    option_text: string;
    is_correct: boolean;
    explanation: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface AdminQuizQuestion {
    id: string;
    quiz_id: string;
    question_text: string;
    question_type: AdminQuizQuestionType;
    explanation: string | null;
    image_path: string | null;
    points: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
    options?: AdminQuestionOption[];
}

export interface AdminQuiz {
    id: string;
    course_id: string;
    module_id: string | null;
    lesson_id: string | null;
    title: string;
    description: string | null;
    quiz_type: AdminQuizType;
    time_limit_minutes: number | null;
    max_attempts: number;
    passing_score: string;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_answers_after: AdminQuizShowAnswersAfter;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    questions?: AdminQuizQuestion[];
}

export interface LessonQuizQuizCan {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

/** Cabecera mínima de lección en la página de materiales */
export interface AdminLessonMaterialSummary {
    id: string;
    title: string;
    description: string | null;
    content_text: string | null;
    homework_title: string | null;
    homework_instructions: string | null;
    lesson_type: AdminLessonType;
    sort_order: number;
    has_homework: boolean;
}

/** Cabecera del curso en la vista de módulos */
export interface CourseModulesPageCourse {
    id: string;
    title: string;
    slug: string;
    category: CourseCategoryRef | null;
    total_modules: number;
}

export interface CourseModulesCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

/** Ítem de lista en la ficha de venta del curso (requisito, objetivo o público). */
export interface CourseFichaLineItem {
    id: string;
    description: string;
    sort_order: number;
}

export interface CourseFichaCourse {
    id: string;
    title: string;
    slug: string;
    category: CourseCategoryRef | null;
    requirements: CourseFichaLineItem[];
    objectives: CourseFichaLineItem[];
    target_audiences: CourseFichaLineItem[];
}

export interface CourseFichaCan {
    edit: boolean;
}

export type CourseFilters = BaseFilters & {
    category_id?: string;
    instructor_id?: string;
    status?: string;
    /** "1" = gratis, "0" = de pago */
    is_free?: string;
};

/** Opción id + label para selects/combobox (instructores, categorías en formulario curso) */
export interface CourseCatalogOption {
    id: string;
    label: string;
}

export interface CourseValueLabelOption {
    value: string;
    label: string;
}

// ─── Especializaciones (panel admin) ─────────────────────────────────────────

export interface AdminSpecializationCourseRef {
    id: string;
    title: string;
    slug: string;
    pivot: {
        sort_order: number;
        is_required: boolean;
    };
}

export interface AdminSpecialization {
    id: string;
    instructor_id: string;
    category_id: string;
    title: string;
    slug: string;
    description: string;
    cover_image: string | null;
    promo_video_url: string | null;
    price: string | number;
    discount_price: string | number | null;
    discount_ends_at: string | null;
    total_duration_hours: string | number;
    total_courses: number;
    difficulty_level: string;
    status: string;
    avg_rating: string | number;
    total_enrolled: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    instructor: CourseInstructorRef;
    category: CourseCategoryRef;
    courses: AdminSpecializationCourseRef[];
    courses_count: number;
}

export interface SpecializationCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export type SpecializationFilters = BaseFilters & {
    category_id?: string;
    instructor_id?: string;
    status?: string;
};

// ─── Paquetes (panel admin) ────────────────────────────────────────────────

export interface AdminPackageCourseRef {
    id: string;
    title: string;
    slug: string;
    pivot: {
        sort_order: number;
    };
}

export interface AdminPackage {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    cover_image: string | null;
    original_price: string | number;
    package_price: string | number;
    discount_pct: string | number;
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
    created_at: string;
    updated_at: string;
    courses: AdminPackageCourseRef[];
    courses_count: number;
}

/** Opción de curso en formulario de paquete (incluye precio de referencia). */
export interface PackageCourseOption extends CourseCatalogOption {
    price: string | number;
}

export interface PackageCan {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export type PackageFilters = BaseFilters & {
    /** "1" = activos, "0" = inactivos */
    is_active?: string;
};

// ─── Auditoría (panel admin) ───────────────────────────────────────────────

export interface AdminAuditUserRef {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export interface AdminActivityLogRow {
    id: string;
    action: string;
    /** Texto legible (p. ej. Inicio de sesión) */
    action_label: string;
    subject_type: string | null;
    subject_short: string | null;
    subject_id: string | null;
    ip_address: string | null;
    user: AdminAuditUserRef | null;
    /** Si no hay usuario (p. ej. fallo con correo inexistente), correo/usuario intentado */
    actor_hint?: string | null;
    user_agent_short: string | null;
    session_tail: string | null;
    extra_preview: string | null;
    has_snapshot: boolean;
    created_at: string | null;
}

export interface AdminLoginHistoryRow {
    id: string;
    ip_address: string;
    status: string;
    /** Correo o usuario del intento (también si aún no hay fila de usuario) */
    login_identifier: string | null;
    browser: string | null;
    os: string | null;
    country_code: string | null;
    failure_reason: string | null;
    user: AdminAuditUserRef | null;
    created_at: string | null;
}

export type AuditSection = 'activity' | 'logins';

export type AuditFilters = BaseFilters & {
    section?: AuditSection;
    /** success | failed | blocked — solo pestaña inicios de sesión */
    status?: string;
};
