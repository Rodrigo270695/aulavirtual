# 🎓 Aula Virtual — Diseño de Base de Datos
**Motor:** PostgreSQL 15+
**Estrategia:** UUID como PK principal, índices selectivos, integridad referencial total
**Versión:** 1.0.0 | **Fecha:** 2026-04-08
**Autor:** Senior Systems Analyst & Database Architect

---

## Índice de Módulos

1. [MÓDULO 1 — Autenticación y Usuarios](#módulo-1--autenticación-y-usuarios)
2. [MÓDULO 2 — Perfiles de Instructores](#módulo-2--perfiles-de-instructores)
3. [MÓDULO 3 — Categorías y Etiquetas](#módulo-3--categorías-y-etiquetas)
4. [MÓDULO 4 — Cursos, Especializaciones y Paquetes](#módulo-4--cursos-especializaciones-y-paquetes)
5. [MÓDULO 5 — Contenido del Curso](#módulo-5--contenido-del-curso)
6. [MÓDULO 6 — Evaluaciones y Cuestionarios](#módulo-6--evaluaciones-y-cuestionarios)
7. [MÓDULO 7 — Matrículas y Progreso](#módulo-7--matrículas-y-progreso)
8. [MÓDULO 8 — Reseñas y Valoraciones](#módulo-8--reseñas-y-valoraciones)
9. [MÓDULO 9 — Certificados](#módulo-9--certificados)
10. [MÓDULO 10 — Comercio (Carrito, Órdenes y Pagos)](#módulo-10--comercio-carrito-órdenes-y-pagos)
11. [MÓDULO 11 — Notificaciones](#módulo-11--notificaciones)
12. [MÓDULO 12 — Auditoría y Logs](#módulo-12--auditoría-y-logs)

---

## Convenciones Generales

| Convención | Detalle |
|------------|---------|
| PK | `UUID` generado con `gen_random_uuid()` (pgcrypto) |
| Timestamps | `created_at`, `updated_at` en todas las tablas |
| Soft delete | `deleted_at TIMESTAMPTZ` donde aplica |
| Booleanos | `BOOLEAN DEFAULT false` |
| Texto corto | `VARCHAR(n)` con límite explícito |
| Texto largo | `TEXT` |
| Moneda | `NUMERIC(12,2)` en USD o moneda local |
| Enums | `VARCHAR` + CHECK CONSTRAINT (sin tipo ENUM para flexibilidad) |
| Índices | Prefijo `idx_` + tabla + columna(s) |
| FK | Prefijo `fk_` en constraints |

---

## MÓDULO 1 — Autenticación y Usuarios

> **Propósito:** Gestiona la identidad de todos los actores del sistema (estudiantes, instructores, administradores). Es la base de toda la plataforma. Se integra con el sistema de roles y permisos de Spatie.

---

### `users`

**Descripción:** Tabla central de usuarios del sistema. Almacena credenciales, datos de identidad completos y datos de contacto. Cualquier persona que interactúe con la plataforma tiene un registro aquí, independientemente de su rol. El login es siempre por **email** (no username), ya que es una plataforma educativa seria donde el email es el identificador natural, permite recuperación de contraseña directa y la integración OAuth (Google, GitHub) es inmediata.

**Por qué existe:** Centraliza la autenticación. Un mismo usuario puede ser estudiante y también instructor, lo que se gestiona con roles en vez de tablas separadas de login.

**Decisiones de diseño:**
- `first_name` + `last_name` separados → permite ordenar por apellido, generar certificados correctamente y hacer búsquedas precisas.
- `document_type` + `document_number` → soporta DNI peruano (8 dígitos), Carnet de Extranjería, Pasaporte, Cédula venezolana/colombiana, etc. La validación del formato se aplica en la capa de aplicación según el tipo.
- `phone_country_code` + `phone_number` → el prefijo internacional (+51 Perú, +58 Venezuela, +57 Colombia) se guarda separado del número local, lo que permite validar longitud por país sin mezclar formatos.
- `username` → opcional, solo para URL de perfil público (`/u/juan.perez`). No se usa para login.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Identificador único universal del usuario |
| `first_name` | `VARCHAR(100)` | NOT NULL | Nombre(s) del usuario (ej: Juan Carlos) |
| `last_name` | `VARCHAR(100)` | NOT NULL | Apellido(s) del usuario (ej: Pérez Rojas) |
| `username` | `VARCHAR(50)` | NULL, UNIQUE | Nombre de usuario opcional para URL de perfil público |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Correo electrónico — es el identificador de login |
| `email_verified_at` | `TIMESTAMPTZ` | NULL | Fecha de verificación del email; NULL = no verificado |
| `password` | `VARCHAR(255)` | NULL | Hash bcrypt; NULL si solo usa OAuth social |
| `avatar` | `VARCHAR(500)` | NULL | Ruta relativa al avatar almacenado en el servidor |
| `document_type` | `VARCHAR(20)` | NULL | Tipo de documento: dni, ce (carnet extranjería), passport, cedula, ruc |
| `document_number` | `VARCHAR(20)` | NULL | Número del documento (VARCHAR por pasaportes con letras) |
| `phone_country_code` | `VARCHAR(5)` | NULL | Prefijo internacional (ej: +51, +58, +57, +1) |
| `phone_number` | `VARCHAR(15)` | NULL | Número local sin prefijo (ej: 987654321 para Perú) |
| `country_code` | `CHAR(2)` | NULL | País de residencia ISO 3166-1 alpha-2 (PE, VE, CO, MX...) |
| `timezone` | `VARCHAR(60)` | DEFAULT 'America/Lima' | Zona horaria para mostrar fechas y horas correctamente |
| `is_active` | `BOOLEAN` | DEFAULT true | Permite desactivar cuentas sin eliminarlas |
| `is_banned` | `BOOLEAN` | DEFAULT false | Bloqueo por violación de términos de uso |
| `banned_reason` | `TEXT` | NULL | Motivo del baneo; visible solo para administradores |
| `last_login_at` | `TIMESTAMPTZ` | NULL | Timestamp del último acceso exitoso |
| `remember_token` | `VARCHAR(100)` | NULL | Token para la funcionalidad "recordar sesión" de Laravel |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de registro en la plataforma |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización del registro |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft delete; el registro no se elimina físicamente |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX idx_users_document ON users(document_type, document_number) WHERE document_number IS NOT NULL;
CREATE INDEX idx_users_country ON users(country_code);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_fullname ON users(last_name, first_name);
```

---

### `user_profiles`

**Descripción:** Información extendida del perfil del usuario: bio, redes sociales, intereses, datos académicos. Se separa de `users` para mantener la tabla de autenticación liviana y rápida.

**Por qué existe:** Las consultas de autenticación no necesitan cargar los 30+ campos del perfil. La separación mejora rendimiento en login y gestión de sesiones.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del perfil |
| `user_id` | `UUID` | NOT NULL, FK → users.id, UNIQUE | Relación 1:1 con users |
| `bio` | `TEXT` | NULL | Presentación personal del usuario (visible públicamente) |
| `headline` | `VARCHAR(200)` | NULL | Titular profesional (ej: "Ing. Civil - PhD candidate") |
| `website_url` | `VARCHAR(500)` | NULL | Sitio web personal o portafolio |
| `linkedin_url` | `VARCHAR(500)` | NULL | Perfil de LinkedIn |
| `github_url` | `VARCHAR(500)` | NULL | Perfil de GitHub (relevante para ingeniería) |
| `youtube_url` | `VARCHAR(500)` | NULL | Canal de YouTube opcional |
| `gender` | `VARCHAR(20)` | NULL | Género (sin enum para respeto a diversidad) |
| `birthdate` | `DATE` | NULL | Fecha de nacimiento para estadísticas demográficas |
| `engineering_field` | `VARCHAR(100)` | NULL | Especialidad de ingeniería del usuario |
| `academic_level` | `VARCHAR(50)` | NULL | Nivel académico: técnico, pregrado, postgrado, doctorado |
| `university` | `VARCHAR(200)` | NULL | Universidad o institución de estudio/trabajo |
| `graduation_year` | `SMALLINT` | NULL | Año de graduación o egreso |
| `years_experience` | `SMALLINT` | NULL | Años de experiencia profesional |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación del perfil |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_field ON user_profiles(engineering_field);
```

---

### `user_social_accounts`

**Descripción:** Almacena cuentas de OAuth vinculadas al usuario (Google, GitHub, Microsoft). Permite inicio de sesión social sin contraseña.

**Por qué existe:** Los estudiantes de ingeniería tienen cuentas universitarias de Google o Microsoft. El login social reduce fricción en el registro.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del vínculo social |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Usuario dueño de la cuenta social |
| `provider` | `VARCHAR(30)` | NOT NULL | Proveedor: google, github, microsoft, facebook |
| `provider_id` | `VARCHAR(255)` | NOT NULL | ID único del usuario en el proveedor externo |
| `provider_token` | `TEXT` | NULL | Access token del proveedor (cifrado en app) |
| `provider_refresh_token` | `TEXT` | NULL | Refresh token para renovar acceso |
| `token_expires_at` | `TIMESTAMPTZ` | NULL | Expiración del token |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de vinculación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_social_provider ON user_social_accounts(provider, provider_id);
CREATE INDEX idx_social_user ON user_social_accounts(user_id);
```

---

### `password_reset_tokens`

**Descripción:** Tokens temporales para el proceso de recuperación de contraseña por email. El token expira tras 60 minutos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `email` | `VARCHAR(255)` | PK | Email del usuario que solicita el reseteo |
| `token` | `VARCHAR(255)` | NOT NULL | Token hasheado con SHA-256 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Momento de creación; se usa para calcular expiración |

---

## MÓDULO 2 — Perfiles de Instructores

> **Propósito:** Gestiona la información pública y administrativa de los instructores/docentes de la plataforma. Un instructor es también un `user`, pero con datos adicionales sobre su capacidad de enseñanza, pago y credenciales académicas.

---

### `instructors`

**Descripción:** Perfil extendido del instructor. Contiene información para el pago de regalías, datos bancarios (cifrados en app), calificación promedio y estadísticas de enseñanza visibles públicamente.

**Por qué existe:** Separa la lógica de "ser instructor" de la identidad básica del usuario. Un instructor puede dejar de serlo o estar en revisión sin afectar su cuenta de usuario.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del instructor |
| `user_id` | `UUID` | NOT NULL, FK → users.id, UNIQUE | Referencia al usuario base |
| `professional_title` | `VARCHAR(150)` | NOT NULL | Título profesional completo (Ing. Civil, PhD...) |
| `specialization_area` | `VARCHAR(200)` | NULL | Área de especialización principal |
| `teaching_bio` | `TEXT` | NULL | Descripción de enfoque pedagógico (visible en curso) |
| `intro_video_url` | `VARCHAR(500)` | NULL | URL del video de presentación del instructor |
| `status` | `VARCHAR(20)` | DEFAULT 'pending' | Estado: pending, active, suspended, rejected |
| `approval_notes` | `TEXT` | NULL | Notas del admin al aprobar/rechazar la solicitud |
| `total_students` | `INTEGER` | DEFAULT 0 | Conteo desnormalizado de estudiantes (se actualiza periódicamente) |
| `total_courses` | `SMALLINT` | DEFAULT 0 | Número de cursos publicados |
| `avg_rating` | `NUMERIC(3,2)` | DEFAULT 0.00 | Calificación promedio (0.00 a 5.00) desnormalizada |
| `total_reviews` | `INTEGER` | DEFAULT 0 | Total de reseñas recibidas |
| `revenue_share_pct` | `NUMERIC(5,2)` | DEFAULT 70.00 | Porcentaje de ganancia sobre ventas (típico: 70%) |
| `payout_method` | `VARCHAR(30)` | NULL | Método de pago: bank_transfer, paypal, stripe_connect |
| `payout_details_enc` | `TEXT` | NULL | Datos bancarios cifrados (AES en aplicación) |
| `approved_at` | `TIMESTAMPTZ` | NULL | Fecha de aprobación por el administrador |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de solicitud como instructor |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_instructors_user ON instructors(user_id);
CREATE INDEX idx_instructors_status ON instructors(status);
CREATE INDEX idx_instructors_rating ON instructors(avg_rating DESC);
```

---

### `instructor_credentials`

**Descripción:** Credenciales académicas y certificaciones del instructor. Se usan para validar su autoridad en el área que enseña. El admin puede verificar cada credencial.

**Por qué existe:** En cursos de ingeniería, la credibilidad del instructor es crítica. Esta tabla documenta títulos, diplomados y certificaciones que validan su conocimiento.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la credencial |
| `instructor_id` | `UUID` | NOT NULL, FK → instructors.id | Instructor al que pertenece |
| `credential_type` | `VARCHAR(50)` | NOT NULL | Tipo: degree, certification, award, publication |
| `title` | `VARCHAR(255)` | NOT NULL | Nombre del título o certificación |
| `institution` | `VARCHAR(200)` | NOT NULL | Institución que otorgó la credencial |
| `obtained_date` | `DATE` | NULL | Fecha de obtención |
| `expiry_date` | `DATE` | NULL | Fecha de vencimiento (si aplica) |
| `credential_url` | `VARCHAR(500)` | NULL | URL de verificación externa (LinkedIn, Credly...) |
| `document_path` | `VARCHAR(500)` | NULL | Ruta del PDF del diploma/certificado subido |
| `is_verified` | `BOOLEAN` | DEFAULT false | Verificado por un administrador |
| `verified_by` | `UUID` | NULL, FK → users.id | Admin que verificó la credencial |
| `verified_at` | `TIMESTAMPTZ` | NULL | Fecha de verificación |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de registro |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_credentials_instructor ON instructor_credentials(instructor_id);
CREATE INDEX idx_credentials_verified ON instructor_credentials(is_verified);
```

---

## MÓDULO 3 — Categorías y Etiquetas

> **Propósito:** Organiza y clasifica el catálogo de cursos mediante una jerarquía de categorías (árbol padre-hijo) y etiquetas libres. Permite la búsqueda y el filtrado eficiente del catálogo.

---

### `categories`

**Descripción:** Categorías jerárquicas para los cursos. Soporta multinivel (padre → hijo → nieto). Ejemplo: Ingeniería Civil → Estructuras → Diseño Sísmico.

**Por qué existe:** Los estudiantes navegan por área de conocimiento. Una jerarquía permite menús de navegación profundos y filtros precisos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la categoría |
| `parent_id` | `UUID` | NULL, FK → categories.id | Categoría padre; NULL = categoría raíz |
| `name` | `VARCHAR(100)` | NOT NULL | Nombre de la categoría (ej: Ingeniería Civil) |
| `slug` | `VARCHAR(120)` | NOT NULL, UNIQUE | URL amigable (ej: ingenieria-civil) |
| `description` | `TEXT` | NULL | Descripción breve de la categoría |
| `icon` | `VARCHAR(100)` | NULL | Nombre del ícono o clase CSS (FontAwesome, etc.) |
| `cover_image` | `VARCHAR(500)` | NULL | Imagen de portada de la categoría |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden de aparición en el menú |
| `is_active` | `BOOLEAN` | DEFAULT true | Visibilidad en el catálogo |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;
```

---

### `tags`

**Descripción:** Etiquetas libres para clasificar cursos con palabras clave técnicas. Más granulares que las categorías. Ejemplo: "AutoCAD", "ANSYS", "Resistencia de materiales".

**Por qué existe:** La búsqueda por etiquetas permite encontrar cursos específicos por tecnología o tema sin depender de la jerarquía de categorías.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la etiqueta |
| `name` | `VARCHAR(80)` | NOT NULL, UNIQUE | Nombre de la etiqueta (normalizado a minúsculas) |
| `slug` | `VARCHAR(100)` | NOT NULL, UNIQUE | Slug para URL |
| `usage_count` | `INTEGER` | DEFAULT 0 | Conteo desnormalizado de cursos con esta etiqueta |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
```

---

### `course_tags`

**Descripción:** Tabla pivote que relaciona cursos con sus etiquetas. Permite búsquedas de muchos a muchos entre cursos y etiquetas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Referencia al curso |
| `tag_id` | `UUID` | NOT NULL, FK → tags.id | Referencia a la etiqueta |

**Restricción:** `PRIMARY KEY (course_id, tag_id)`

**Índices:**
```sql
CREATE INDEX idx_course_tags_tag ON course_tags(tag_id);
```

---

## MÓDULO 4 — Cursos, Especializaciones y Paquetes

> **Propósito:** Define el catálogo completo de productos que la plataforma ofrece. Un estudiante puede comprar cursos individuales, especializaciones (rutas de aprendizaje) o paquetes con descuento.

---

### `courses`

**Descripción:** Tabla principal del catálogo. Representa un curso individual con toda su metadata: descripción, precio, nivel, idioma, estadísticas de ventas y estado de publicación.

**Por qué existe:** Es el producto central de la plataforma. Contiene toda la información necesaria para que un estudiante decida comprarlo y para que el motor de búsqueda lo indexe.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del curso |
| `instructor_id` | `UUID` | NOT NULL, FK → instructors.id | Instructor principal del curso |
| `category_id` | `UUID` | NOT NULL, FK → categories.id | Categoría principal del curso |
| `title` | `VARCHAR(255)` | NOT NULL | Título del curso (SEO-friendly) |
| `slug` | `VARCHAR(300)` | NOT NULL, UNIQUE | URL amigable del curso |
| `subtitle` | `VARCHAR(400)` | NULL | Subtítulo descriptivo (aparece bajo el título) |
| `description` | `TEXT` | NOT NULL | Descripción completa (HTML permitido) |
| `language` | `VARCHAR(10)` | DEFAULT 'es' | Idioma principal del curso (ISO 639-1) |
| `level` | `VARCHAR(20)` | NOT NULL | Nivel: beginner, intermediate, advanced, all_levels |
| `status` | `VARCHAR(20)` | DEFAULT 'draft' | Estado: draft, under_review, published, unpublished, archived |
| `cover_image` | `VARCHAR(500)` | NULL | Imagen de portada (thumbnail principal) |
| `promo_video_url` | `VARCHAR(500)` | NULL | URL del video promocional alojado en el hosting |
| `price` | `NUMERIC(12,2)` | NOT NULL, DEFAULT 0 | Precio en moneda base de la plataforma |
| `discount_price` | `NUMERIC(12,2)` | NULL | Precio con descuento temporal |
| `discount_ends_at` | `TIMESTAMPTZ` | NULL | Fecha de vencimiento del precio con descuento |
| `is_free` | `BOOLEAN` | DEFAULT false | Marca el curso como gratuito |
| `currency` | `CHAR(3)` | DEFAULT 'USD' | Moneda ISO 4217 |
| `duration_hours` | `NUMERIC(6,2)` | DEFAULT 0 | Total de horas de contenido en video |
| `total_lessons` | `SMALLINT` | DEFAULT 0 | Número total de lecciones (desnormalizado) |
| `total_modules` | `SMALLINT` | DEFAULT 0 | Número total de módulos (desnormalizado) |
| `total_enrolled` | `INTEGER` | DEFAULT 0 | Total de estudiantes matriculados (desnormalizado) |
| `avg_rating` | `NUMERIC(3,2)` | DEFAULT 0.00 | Calificación promedio (desnormalizada) |
| `total_reviews` | `INTEGER` | DEFAULT 0 | Total de reseñas (desnormalizado) |
| `certificate_enabled` | `BOOLEAN` | DEFAULT true | Si el curso emite certificado al completarse |
| `completion_threshold` | `SMALLINT` | DEFAULT 80 | % mínimo de avance para emitir certificado |
| `has_quiz` | `BOOLEAN` | DEFAULT false | Indica si tiene evaluaciones/quizzes |
| `has_assignments` | `BOOLEAN` | DEFAULT false | Indica si tiene tareas para entregar |
| `published_at` | `TIMESTAMPTZ` | NULL | Fecha en que fue publicado por primera vez |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación del borrador |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft delete |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_status ON courses(status) WHERE status = 'published';
CREATE INDEX idx_courses_price ON courses(price);
CREATE INDEX idx_courses_rating ON courses(avg_rating DESC);
CREATE INDEX idx_courses_enrolled ON courses(total_enrolled DESC);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_free ON courses(is_free) WHERE is_free = true;
CREATE INDEX idx_courses_deleted ON courses(deleted_at) WHERE deleted_at IS NULL;
```

---

### `course_requirements`

**Descripción:** Requisitos previos que el estudiante debe tener antes de tomar el curso. Se muestran en la página de venta del curso.

**Por qué existe:** En cursos de ingeniería los prerrequisitos son fundamentales (ej: "Conocer cálculo diferencial antes de mecánica de fluidos").

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del requisito |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Curso al que pertenece |
| `description` | `VARCHAR(500)` | NOT NULL | Descripción del requisito (ej: "Cálculo diferencial básico") |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden de presentación en la página |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |

**Índices:**
```sql
CREATE INDEX idx_requirements_course ON course_requirements(course_id);
```

---

### `course_objectives`

**Descripción:** Lista de lo que el estudiante aprenderá al finalizar el curso ("Lo que aprenderás"). Se muestran prominentemente en la página de venta.

**Por qué existe:** Los objetivos de aprendizaje son el argumento de venta más importante para cursos técnicos. El estudiante necesita saber exactamente qué competencias adquirirá.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del objetivo |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Curso al que pertenece |
| `description` | `VARCHAR(500)` | NOT NULL | Descripción del objetivo (verbo de acción + competencia) |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden de presentación |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |

**Índices:**
```sql
CREATE INDEX idx_objectives_course ON course_objectives(course_id);
```

---

### `course_target_audiences`

**Descripción:** Define para quién está diseñado el curso. Permite al estudiante identificarse como público objetivo antes de comprar.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del registro |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Curso al que pertenece |
| `description` | `VARCHAR(500)` | NOT NULL | Descripción del público (ej: "Estudiantes de ingeniería civil") |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden de presentación |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |

**Índices:**
```sql
CREATE INDEX idx_target_audience_course ON course_target_audiences(course_id);
```

---

### `specializations`

**Descripción:** Ruta de aprendizaje estructurada que agrupa varios cursos relacionados. Al completar todos los cursos de la especialización el estudiante recibe un certificado especial. Equivalente a las "Especializaciones" de Coursera.

**Por qué existe:** Los estudiantes de ingeniería necesitan rutas de aprendizaje completas, no solo cursos aislados. Permite vender un "camino" completo hacia una competencia profesional.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la especialización |
| `instructor_id` | `UUID` | NOT NULL, FK → instructors.id | Instructor/curador principal |
| `category_id` | `UUID` | NOT NULL, FK → categories.id | Categoría de la especialización |
| `title` | `VARCHAR(255)` | NOT NULL | Nombre de la especialización |
| `slug` | `VARCHAR(300)` | NOT NULL, UNIQUE | URL amigable |
| `description` | `TEXT` | NOT NULL | Descripción detallada |
| `cover_image` | `VARCHAR(500)` | NULL | Imagen de portada |
| `promo_video_url` | `VARCHAR(500)` | NULL | Video de presentación |
| `price` | `NUMERIC(12,2)` | NOT NULL | Precio de la especialización completa |
| `discount_price` | `NUMERIC(12,2)` | NULL | Precio con descuento |
| `discount_ends_at` | `TIMESTAMPTZ` | NULL | Fin del descuento |
| `total_duration_hours` | `NUMERIC(6,2)` | DEFAULT 0 | Horas totales de todos los cursos |
| `total_courses` | `SMALLINT` | DEFAULT 0 | Número de cursos incluidos |
| `difficulty_level` | `VARCHAR(20)` | DEFAULT 'intermediate' | Nivel general de la especialización |
| `status` | `VARCHAR(20)` | DEFAULT 'draft' | Estado: draft, published, archived |
| `avg_rating` | `NUMERIC(3,2)` | DEFAULT 0.00 | Calificación promedio |
| `total_enrolled` | `INTEGER` | DEFAULT 0 | Estudiantes matriculados |
| `published_at` | `TIMESTAMPTZ` | NULL | Fecha de publicación |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_specializations_slug ON specializations(slug);
CREATE INDEX idx_specializations_status ON specializations(status);
CREATE INDEX idx_specializations_category ON specializations(category_id);
```

---

### `specialization_courses`

**Descripción:** Relación ordenada entre especializaciones y sus cursos. Define el orden en que deben tomarse los cursos dentro de la especialización.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `specialization_id` | `UUID` | NOT NULL, FK → specializations.id | Especialización |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Curso incluido |
| `sort_order` | `SMALLINT` | NOT NULL | Orden del curso en la ruta de aprendizaje |
| `is_required` | `BOOLEAN` | DEFAULT true | Si el curso es obligatorio para el certificado |

**Restricción:** `PRIMARY KEY (specialization_id, course_id)`

---

### `packages`

**Descripción:** Paquetes de cursos con precio reducido. Permite agrupar cursos por temática y venderlos con un descuento mayor al de la compra individual. Estrategia de upselling.

**Por qué existe:** Incentiva la compra de múltiples cursos a la vez con un precio más atractivo. Muy útil para vender "paquetes de herramientas" (ej: "Pack AutoCAD + Revit + BIM").

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del paquete |
| `title` | `VARCHAR(255)` | NOT NULL | Nombre del paquete |
| `slug` | `VARCHAR(300)` | NOT NULL, UNIQUE | URL amigable |
| `description` | `TEXT` | NULL | Descripción del paquete |
| `cover_image` | `VARCHAR(500)` | NULL | Imagen de portada |
| `original_price` | `NUMERIC(12,2)` | NOT NULL | Suma de precios individuales (referencia) |
| `package_price` | `NUMERIC(12,2)` | NOT NULL | Precio del paquete (con descuento) |
| `discount_pct` | `NUMERIC(5,2)` | DEFAULT 0 | Porcentaje de ahorro calculado |
| `is_active` | `BOOLEAN` | DEFAULT true | Disponibilidad en el catálogo |
| `valid_from` | `DATE` | NULL | Inicio de disponibilidad del paquete |
| `valid_until` | `DATE` | NULL | Fin de disponibilidad del paquete |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_active ON packages(is_active) WHERE is_active = true;
```

---

### `package_courses`

**Descripción:** Relación entre paquetes y los cursos que los componen.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `package_id` | `UUID` | NOT NULL, FK → packages.id | Paquete |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Curso incluido en el paquete |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden de presentación |

**Restricción:** `PRIMARY KEY (package_id, course_id)`

---

## MÓDULO 5 — Contenido del Curso

> **Propósito:** Estructura el contenido pedagógico dentro de cada curso. La jerarquía es: Curso → Módulos → Lecciones → Recursos (videos, PDFs, archivos). Los videos se alojan en el propio hosting del servidor.

---

### `course_modules`

**Descripción:** Secciones o unidades temáticas que dividen el curso. Equivalente a los capítulos de un libro. Cada módulo puede tener su propia descripción y objetivos específicos.

**Por qué existe:** Permite estructurar el conocimiento en bloques coherentes. Facilita la navegación del estudiante y el control de progreso por unidad temática.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del módulo |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Curso al que pertenece el módulo |
| `title` | `VARCHAR(255)` | NOT NULL | Título del módulo (ej: "Módulo 1: Análisis Estructural") |
| `description` | `TEXT` | NULL | Descripción y objetivos específicos del módulo |
| `sort_order` | `SMALLINT` | NOT NULL | Posición del módulo dentro del curso |
| `is_free_preview` | `BOOLEAN` | DEFAULT false | Si el módulo es visible sin compra (preview) |
| `duration_minutes` | `INTEGER` | DEFAULT 0 | Duración total en minutos (desnormalizado) |
| `total_lessons` | `SMALLINT` | DEFAULT 0 | Total de lecciones en este módulo |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_modules_course ON course_modules(course_id);
CREATE INDEX idx_modules_order ON course_modules(course_id, sort_order);
```

---

### `lessons`

**Descripción:** Unidad mínima de aprendizaje dentro de un módulo. Puede ser un video, un documento PDF, un artículo de texto o una combinación. Cada lección tiene su propia configuración de acceso y estado.

**Por qué existe:** Es el corazón del contenido. Permite mezclar distintos tipos de contenido dentro de un mismo módulo, adaptándose a diferentes estilos pedagógicos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la lección |
| `module_id` | `UUID` | NOT NULL, FK → course_modules.id | Módulo al que pertenece |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Referencia directa al curso (optimiza consultas) |
| `title` | `VARCHAR(255)` | NOT NULL | Título de la lección |
| `description` | `TEXT` | NULL | Descripción o introducción de la lección |
| `lesson_type` | `VARCHAR(20)` | NOT NULL | Tipo: video, document, article, quiz, assignment |
| `sort_order` | `SMALLINT` | NOT NULL | Posición dentro del módulo |
| `duration_seconds` | `INTEGER` | DEFAULT 0 | Duración en segundos (para videos) |
| `is_free_preview` | `BOOLEAN` | DEFAULT false | Accesible sin compra como preview |
| `is_published` | `BOOLEAN` | DEFAULT false | Visible para estudiantes matriculados |
| `content_text` | `TEXT` | NULL | Contenido HTML para lecciones tipo artículo |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, sort_order);
CREATE INDEX idx_lessons_published ON lessons(is_published) WHERE is_published = true;
```

---

### `lesson_videos`

**Descripción:** Metadata del vídeo asociado a una lección (**relación 1:1** con `lessons`). Soporta **dos familias de origen**:

1. **`upload`** — Archivo subido al propio sistema: rutas en almacenamiento, transcodificación opcional a HLS y resoluciones, estado de procesamiento.
2. **Externo** — Enlace a plataforma de terceros (`youtube`, `vimeo`) o URL genérica (`external`): el reproductor del alumno usa **embed / iframe** o la URL que permita el proveedor; no hay pipeline de transcodificación en servidor propio.

**Por qué existe:** Unificar en una sola fila “el vídeo principal de la lección” con un discriminador (`video_source`) para que la aplicación elija: reproductor propio (HLS/HTML5) vs embed (YouTube/Vimeo/otro).

**Lógica de aplicación (referencia para implementación futura):**

| `video_source` | Reproducción en el alumno | Campos que importan | Campos que suelen ir en NULL |
|----------------|---------------------------|---------------------|------------------------------|
| `upload` | Player propio (p. ej. HLS.js / `<video>`) apuntando a `streaming_url` o URL pública derivada de `storage_path` | `storage_path`, `duration_seconds`, `processing_status`; opcionalmente `streaming_url`, `resolution_*`, `thumbnail_path`, `codec` | `external_url`, `external_embed_url` |
| `youtube` | iframe / API de YouTube | `external_url` (URL de la página o del embed) y/o `external_provider_video_id` si se normaliza el ID | `storage_path`, `streaming_url`, `resolution_*`, `processing_*` (salvo política de “completed” fijo) |
| `vimeo` | iframe / API de Vimeo | Igual que YouTube con datos de Vimeo | Igual que fila anterior |
| `external` | iframe o redirección según política de seguridad | `external_url` (URL canónica o embed permitida) | Rutas locales y pipeline de upload |

**Validación recomendada (CHECK o capa de aplicación):**

- Si `video_source = 'upload'`: `storage_path` NOT NULL cuando el archivo ya está guardado; `external_url` NULL.
- Si `video_source IN ('youtube','vimeo','external')`: `external_url` NOT NULL (o al menos uno entre `external_url` y `external_embed_url`); `storage_path` y `streaming_url` NULL.

**Notas:** La duración y miniatura en vídeos externos pueden rellenarse manualmente en admin o obtenerse vía APIs de terceros (opcional). Los términos de uso de YouTube/Vimeo aplican al uso comercial del embed.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del registro de vídeo |
| `lesson_id` | `UUID` | NOT NULL, FK → lessons.id, UNIQUE | Lección a la que pertenece (1:1) |
| `video_source` | `VARCHAR(20)` | NOT NULL, DEFAULT `'upload'` | Origen: `upload`, `youtube`, `vimeo`, `external` |
| `external_url` | `VARCHAR(1000)` | NULL | URL pegada por el admin (página del vídeo o enlace que la app normaliza) |
| `external_embed_url` | `VARCHAR(1000)` | NULL | URL lista para `<iframe src="...">` si se precomputa en backend (opcional) |
| `external_provider_video_id` | `VARCHAR(100)` | NULL | ID del vídeo en el proveedor (p. ej. ID de YouTube/Vimeo) si se extrae para APIs/embeds |
| `original_filename` | `VARCHAR(255)` | NULL | Nombre original del archivo subido (solo relevante si `video_source = 'upload'`) |
| `storage_path` | `VARCHAR(1000)` | NULL | Ruta en disco/almacenamiento del vídeo master (solo `upload`) |
| `streaming_url` | `VARCHAR(1000)` | NULL | URL de streaming HLS (.m3u8) generado tras procesar (solo `upload`) |
| `thumbnail_path` | `VARCHAR(500)` | NULL | Miniatura (upload: extraída; externo: opcional / manual / API) |
| `duration_seconds` | `INTEGER` | NOT NULL | Duración en segundos (obligatoria para UX; en externos puede ser manual o API) |
| `file_size_bytes` | `BIGINT` | NULL | Tamaño del archivo master en bytes (típico solo en `upload`) |
| `resolution_480p` | `VARCHAR(500)` | NULL | Ruta del vídeo en 480p (pipeline propio) |
| `resolution_720p` | `VARCHAR(500)` | NULL | Ruta del vídeo en 720p |
| `resolution_1080p` | `VARCHAR(500)` | NULL | Ruta del vídeo en 1080p |
| `codec` | `VARCHAR(20)` | NULL | Codec del vídeo procesado (h264, h265…) — principalmente `upload` |
| `processing_status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'pending'` | `pending`, `processing`, `completed`, `failed`; en externos puede fijarse `completed` o `not_applicable` según convención del proyecto |
| `processing_error` | `TEXT` | NULL | Mensaje de error si el procesamiento falló (`upload`) |
| `processed_at` | `TIMESTAMPTZ` | NULL | Fin del procesamiento del archivo propio |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación del registro |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_lesson_videos_lesson ON lesson_videos(lesson_id);
CREATE INDEX idx_lesson_videos_status ON lesson_videos(processing_status);
CREATE INDEX idx_lesson_videos_source ON lesson_videos(video_source);
```

---

### `lesson_documents`

**Descripción:** PDFs y documentos descargables adjuntos a una lección. Pueden ser guías de laboratorio, formularios, planos, normas técnicas, libros de referencia, etc.

**Por qué existe:** En ingeniería, los materiales complementarios (normas, tablas, planos) son tan importantes como los videos. Esta tabla los gestiona con control de acceso.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del documento |
| `lesson_id` | `UUID` | NOT NULL, FK → lessons.id | Lección a la que está adjunto |
| `title` | `VARCHAR(255)` | NOT NULL | Título descriptivo del documento |
| `file_path` | `VARCHAR(1000)` | NOT NULL | Ruta del archivo en almacenamiento |
| `original_filename` | `VARCHAR(255)` | NOT NULL | Nombre original del archivo |
| `file_size_bytes` | `BIGINT` | NULL | Tamaño en bytes |
| `mime_type` | `VARCHAR(100)` | NULL | Tipo MIME (application/pdf, etc.) |
| `is_downloadable` | `BOOLEAN` | DEFAULT true | Permite descarga o solo visualización en browser |
| `download_count` | `INTEGER` | DEFAULT 0 | Contador de descargas |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden entre los adjuntos de la lección |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de subida |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_lesson_docs_lesson ON lesson_documents(lesson_id);
```

---

### `lesson_resources`

**Descripción:** Recursos adicionales genéricos vinculados a lecciones: enlaces externos, software, librerías, repositorios GitHub, datasets, etc.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del recurso |
| `lesson_id` | `UUID` | NOT NULL, FK → lessons.id | Lección a la que pertenece |
| `resource_type` | `VARCHAR(30)` | NOT NULL | Tipo: link, github, download, software, dataset |
| `title` | `VARCHAR(255)` | NOT NULL | Título descriptivo del recurso |
| `url` | `VARCHAR(1000)` | NOT NULL | URL del recurso |
| `description` | `TEXT` | NULL | Descripción o instrucciones de uso |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden de presentación |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |

**Índices:**
```sql
CREATE INDEX idx_lesson_resources_lesson ON lesson_resources(lesson_id);
```

---

## MÓDULO 6 — Evaluaciones y Cuestionarios

> **Propósito:** Gestiona el sistema de evaluación formativa y sumativa. Incluye cuestionarios por módulo/lección, banco de preguntas, intentos de los estudiantes, y calificaciones. Soporte para preguntas de opción múltiple, verdadero/falso y desarrollo.

---

### `quizzes`

**Descripción:** Evaluación o cuestionario asociado a un módulo o lección. Puede ser formativo (sin nota) o sumativo (con nota que afecta el certificado). Define las reglas del intento: tiempo límite, número de intentos, nota mínima aprobatoria.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del quiz |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Curso al que pertenece |
| `module_id` | `UUID` | NULL, FK → course_modules.id | Módulo (si es de módulo) |
| `lesson_id` | `UUID` | NULL, FK → lessons.id | Lección (si es de lección) |
| `title` | `VARCHAR(255)` | NOT NULL | Título del quiz |
| `description` | `TEXT` | NULL | Instrucciones para el estudiante |
| `quiz_type` | `VARCHAR(20)` | DEFAULT 'formative' | Tipo: formative (práctica), summative (evaluado) |
| `time_limit_minutes` | `SMALLINT` | NULL | Tiempo máximo; NULL = sin límite |
| `max_attempts` | `SMALLINT` | DEFAULT 3 | Número máximo de intentos permitidos; -1 = ilimitado |
| `passing_score` | `NUMERIC(5,2)` | DEFAULT 60.00 | Puntaje mínimo para aprobar (%) |
| `shuffle_questions` | `BOOLEAN` | DEFAULT false | Mezclar orden de preguntas en cada intento |
| `shuffle_options` | `BOOLEAN` | DEFAULT false | Mezclar opciones de respuesta |
| `show_answers_after` | `VARCHAR(20)` | DEFAULT 'submission' | Cuándo mostrar respuestas: never, submission, passed |
| `is_active` | `BOOLEAN` | DEFAULT true | Habilitado para los estudiantes |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_quizzes_course ON quizzes(course_id);
CREATE INDEX idx_quizzes_module ON quizzes(module_id);
CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
```

---

### `quiz_questions`

**Descripción:** Preguntas del banco de preguntas de un quiz. Soporta múltiples tipos de pregunta para variedad pedagógica. El peso de cada pregunta puede configurarse individualmente.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la pregunta |
| `quiz_id` | `UUID` | NOT NULL, FK → quizzes.id | Quiz al que pertenece |
| `question_text` | `TEXT` | NOT NULL | Enunciado de la pregunta (HTML permitido para fórmulas) |
| `question_type` | `VARCHAR(30)` | NOT NULL | Tipo: single_choice, multiple_choice, true_false, short_answer, essay |
| `explanation` | `TEXT` | NULL | Explicación de la respuesta correcta (se muestra después) |
| `image_path` | `VARCHAR(500)` | NULL | Imagen opcional en la pregunta (diagramas técnicos) |
| `points` | `NUMERIC(5,2)` | DEFAULT 1.00 | Peso de la pregunta en el puntaje total |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden de la pregunta |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id);
```

---

### `question_options`

**Descripción:** Opciones de respuesta para preguntas de opción múltiple o verdadero/falso. Indica cuál es la respuesta correcta.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la opción |
| `question_id` | `UUID` | NOT NULL, FK → quiz_questions.id | Pregunta a la que pertenece |
| `option_text` | `TEXT` | NOT NULL | Texto de la opción de respuesta |
| `is_correct` | `BOOLEAN` | DEFAULT false | Indica si esta es la respuesta correcta |
| `explanation` | `TEXT` | NULL | Por qué esta opción es correcta/incorrecta |
| `sort_order` | `SMALLINT` | DEFAULT 0 | Orden de presentación |

**Índices:**
```sql
CREATE INDEX idx_options_question ON question_options(question_id);
```

---

### `quiz_attempts`

**Descripción:** Registro de cada intento de un estudiante en un quiz. Cada intento es una sesión completa con sus respuestas, puntaje y estado de aprobación.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del intento |
| `quiz_id` | `UUID` | NOT NULL, FK → quizzes.id | Quiz evaluado |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Estudiante que intentó el quiz |
| `attempt_number` | `SMALLINT` | NOT NULL | Número de intento (1, 2, 3...) |
| `status` | `VARCHAR(20)` | DEFAULT 'in_progress' | Estado: in_progress, completed, timed_out, abandoned |
| `score` | `NUMERIC(5,2)` | NULL | Puntaje obtenido (%) |
| `total_points` | `NUMERIC(7,2)` | NULL | Puntos totales posibles |
| `obtained_points` | `NUMERIC(7,2)` | NULL | Puntos obtenidos |
| `is_passed` | `BOOLEAN` | NULL | Si aprobó según el passing_score |
| `started_at` | `TIMESTAMPTZ` | NOT NULL | Inicio del intento |
| `submitted_at` | `TIMESTAMPTZ` | NULL | Momento de envío |
| `time_spent_seconds` | `INTEGER` | NULL | Tiempo real usado en segundos |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de registro |

**Índices:**
```sql
CREATE INDEX idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_user ON quiz_attempts(user_id);
CREATE UNIQUE INDEX idx_attempts_unique ON quiz_attempts(quiz_id, user_id, attempt_number);
```

---

### `quiz_attempt_answers`

**Descripción:** Respuestas individuales dadas por el estudiante en cada pregunta de un intento específico. Permite auditar y mostrar resultados detallados.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la respuesta |
| `attempt_id` | `UUID` | NOT NULL, FK → quiz_attempts.id | Intento al que pertenece |
| `question_id` | `UUID` | NOT NULL, FK → quiz_questions.id | Pregunta respondida |
| `selected_option_id` | `UUID` | NULL, FK → question_options.id | Opción seleccionada (para opción múltiple) |
| `text_answer` | `TEXT` | NULL | Respuesta libre (para short_answer / essay) |
| `is_correct` | `BOOLEAN` | NULL | Si la respuesta es correcta (null para essay) |
| `points_earned` | `NUMERIC(5,2)` | DEFAULT 0 | Puntos obtenidos en esta pregunta |
| `graded_by` | `UUID` | NULL, FK → users.id | Instructor que calificó (para essay) |
| `graded_at` | `TIMESTAMPTZ` | NULL | Fecha de calificación manual |
| `grader_comment` | `TEXT` | NULL | Comentario del calificador |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de registro |

**Índices:**
```sql
CREATE INDEX idx_answers_attempt ON quiz_attempt_answers(attempt_id);
CREATE INDEX idx_answers_question ON quiz_attempt_answers(question_id);
```

---

## MÓDULO 7 — Matrículas y Progreso

> **Propósito:** Registra quién está matriculado en qué curso, cómo llegó (compra, cupón, acceso admin), y rastrea el progreso detallado por lección para calcular el porcentaje de avance y saber cuándo emitir el certificado.

---

### `enrollments`

**Descripción:** Matrícula de un usuario en un curso, especialización o paquete. Es el "contrato de acceso" al contenido. Registra la fuente del acceso para análisis de conversión.

**Por qué existe:** Es la tabla que controla el acceso al contenido. Sin un registro activo aquí, el estudiante no puede ver el material del curso.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la matrícula |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Estudiante matriculado |
| `course_id` | `UUID` | NULL, FK → courses.id | Curso (si es matrícula individual) |
| `specialization_id` | `UUID` | NULL, FK → specializations.id | Especialización (si aplica) |
| `package_id` | `UUID` | NULL, FK → packages.id | Paquete (si aplica) |
| `order_item_id` | `UUID` | NULL, FK → order_items.id | Orden de compra que generó la matrícula |
| `access_type` | `VARCHAR(20)` | DEFAULT 'paid' | Origen: paid, free, admin_grant, coupon, trial |
| `status` | `VARCHAR(20)` | DEFAULT 'active' | Estado: active, expired, refunded, suspended |
| `enrolled_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de matrícula |
| `expires_at` | `TIMESTAMPTZ` | NULL | Fecha de expiración; NULL = acceso vitalicio |
| `completed_at` | `TIMESTAMPTZ` | NULL | Fecha de finalización del curso |
| `last_accessed_at` | `TIMESTAMPTZ` | NULL | Último acceso al contenido del curso |
| `progress_pct` | `NUMERIC(5,2)` | DEFAULT 0.00 | Porcentaje de avance (desnormalizado) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación del registro |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_access ON enrollments(last_accessed_at DESC);
```

---

### `lesson_progress`

**Descripción:** Registra el estado de completado de cada lección por cada estudiante. Si la lección es un video, también guarda el último segundo visto para reanudar donde se quedó.

**Por qué existe:** Permite calcular el porcentaje de progreso del curso, mostrar qué lecciones están completadas en la UI, y reanudar videos desde el punto exacto.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del registro de progreso |
| `enrollment_id` | `UUID` | NOT NULL, FK → enrollments.id | Matrícula a la que pertenece |
| `lesson_id` | `UUID` | NOT NULL, FK → lessons.id | Lección rastreada |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Estudiante (denormalizado para consultas rápidas) |
| `status` | `VARCHAR(20)` | DEFAULT 'not_started' | Estado: not_started, in_progress, completed |
| `video_position_sec` | `INTEGER` | DEFAULT 0 | Segundo exacto donde se pausó el video |
| `watch_pct` | `NUMERIC(5,2)` | DEFAULT 0 | Porcentaje del video visto |
| `completed_at` | `TIMESTAMPTZ` | NULL | Fecha de completado de la lección |
| `first_accessed_at` | `TIMESTAMPTZ` | NULL | Primera vez que accedió a la lección |
| `last_accessed_at` | `TIMESTAMPTZ` | NULL | Último acceso a la lección |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_lesson_progress_unique ON lesson_progress(enrollment_id, lesson_id);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);
```

---

## MÓDULO 8 — Reseñas y Valoraciones

> **Propósito:** Gestiona el sistema de valoración de cursos e instructores. Las reseñas son el motor de confianza de la plataforma. Incluye moderación y votación de reseñas útiles.

---

### `course_reviews`

**Descripción:** Reseña y calificación de un estudiante sobre un curso. Solo puede dejar una reseña quien esté matriculado. Tiene sistema de moderación para evitar contenido inapropiado.

**Por qué existe:** Las reseñas son el factor #1 de conversión de ventas en plataformas educativas. También proveen feedback valioso al instructor.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la reseña |
| `course_id` | `UUID` | NOT NULL, FK → courses.id | Curso reseñado |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Estudiante que reseña |
| `enrollment_id` | `UUID` | NOT NULL, FK → enrollments.id | Matrícula que autoriza la reseña |
| `rating` | `SMALLINT` | NOT NULL, CHECK (1-5) | Calificación de 1 a 5 estrellas |
| `title` | `VARCHAR(255)` | NULL | Título corto de la reseña |
| `review_text` | `TEXT` | NULL | Texto completo de la reseña |
| `pros` | `TEXT` | NULL | Aspectos positivos del curso |
| `cons` | `TEXT` | NULL | Aspectos a mejorar del curso |
| `status` | `VARCHAR(20)` | DEFAULT 'published' | Estado: published, pending_moderation, rejected, hidden |
| `helpful_count` | `INTEGER` | DEFAULT 0 | Votos de "útil" (desnormalizado) |
| `instructor_response` | `TEXT` | NULL | Respuesta del instructor a la reseña |
| `instructor_replied_at` | `TIMESTAMPTZ` | NULL | Fecha de respuesta del instructor |
| `moderated_by` | `UUID` | NULL, FK → users.id | Admin que moderó la reseña |
| `moderated_at` | `TIMESTAMPTZ` | NULL | Fecha de moderación |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de publicación de la reseña |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última edición |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_reviews_unique ON course_reviews(course_id, user_id);
CREATE INDEX idx_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_reviews_rating ON course_reviews(course_id, rating);
CREATE INDEX idx_reviews_status ON course_reviews(status);
```

---

### `review_votes`

**Descripción:** Votos de "esta reseña fue útil" por parte de otros usuarios. Permite ordenar reseñas por utilidad percibida.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `review_id` | `UUID` | NOT NULL, FK → course_reviews.id | Reseña votada |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Usuario que vota |
| `is_helpful` | `BOOLEAN` | NOT NULL | true = útil, false = no útil |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha del voto |

**Restricción:** `PRIMARY KEY (review_id, user_id)`

---

## MÓDULO 9 — Certificados

> **Propósito:** Gestiona la emisión, almacenamiento y verificación de certificados de finalización de cursos y especializaciones. Los certificados tienen un código único verificable públicamente sin necesidad de cuenta.

---

### `certificate_templates`

**Descripción:** Plantillas de diseño para los certificados. Cada curso o especialización puede tener su propia plantilla con los datos del curso y la firma del instructor. El sistema renderiza el PDF final usando la plantilla y los datos del estudiante.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la plantilla |
| `course_id` | `UUID` | NULL, FK → courses.id | Plantilla para un curso específico |
| `specialization_id` | `UUID` | NULL, FK → specializations.id | Plantilla para una especialización |
| `name` | `VARCHAR(255)` | NOT NULL | Nombre descriptivo de la plantilla |
| `template_html` | `TEXT` | NOT NULL | HTML/CSS de la plantilla del certificado |
| `background_image` | `VARCHAR(500)` | NULL | Imagen de fondo del certificado |
| `signature_image` | `VARCHAR(500)` | NULL | Firma escaneada del instructor o director |
| `signatory_name` | `VARCHAR(150)` | NULL | Nombre del firmante |
| `signatory_title` | `VARCHAR(150)` | NULL | Cargo del firmante |
| `institution_logo` | `VARCHAR(500)` | NULL | Logo de la institución |
| `is_active` | `BOOLEAN` | DEFAULT true | Plantilla activa |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

---

### `certificates`

**Descripción:** Certificados emitidos a estudiantes que completaron un curso o especialización. Cada certificado tiene un código único que permite verificación pública sin login.

**Por qué existe:** Los certificados son el producto final del estudiante. Su verificabilidad pública le da valor real en el mercado laboral.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del certificado |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Estudiante que recibe el certificado |
| `enrollment_id` | `UUID` | NOT NULL, FK → enrollments.id | Matrícula que genera el certificado |
| `template_id` | `UUID` | NULL, FK → certificate_templates.id | Plantilla usada |
| `course_id` | `UUID` | NULL, FK → courses.id | Curso completado |
| `specialization_id` | `UUID` | NULL, FK → specializations.id | Especialización completada |
| `verification_code` | `VARCHAR(32)` | NOT NULL, UNIQUE | Código público de verificación (alfanumérico) |
| `verification_url` | `VARCHAR(500)` | NOT NULL | URL completa de verificación pública |
| `student_name` | `VARCHAR(150)` | NOT NULL | Nombre del estudiante al momento de emisión |
| `course_title` | `VARCHAR(255)` | NOT NULL | Título del curso al momento de emisión |
| `instructor_name` | `VARCHAR(150)` | NULL | Nombre del instructor al momento de emisión |
| `completion_date` | `DATE` | NOT NULL | Fecha de finalización del curso |
| `total_hours` | `NUMERIC(6,2)` | NULL | Horas totales del curso |
| `final_score` | `NUMERIC(5,2)` | NULL | Calificación final obtenida (si aplica) |
| `pdf_path` | `VARCHAR(500)` | NULL | Ruta del PDF generado y almacenado |
| `is_revoked` | `BOOLEAN` | DEFAULT false | Si el certificado fue revocado |
| `revoked_reason` | `TEXT` | NULL | Motivo de revocación |
| `revoked_at` | `TIMESTAMPTZ` | NULL | Fecha de revocación |
| `issued_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de emisión |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación del registro |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_certificates_code ON certificates(verification_code);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_enrollment ON certificates(enrollment_id);
CREATE INDEX idx_certificates_revoked ON certificates(is_revoked) WHERE is_revoked = false;
```

---

### `certificate_verifications`

**Descripción:** Log de cada consulta de verificación pública de un certificado. Útil para auditoría, detectar certificados falsos que se verifican masivamente, y estadísticas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la verificación |
| `certificate_id` | `UUID` | NOT NULL, FK → certificates.id | Certificado verificado |
| `ip_address` | `INET` | NULL | IP desde donde se verificó |
| `user_agent` | `TEXT` | NULL | Agente de usuario del navegador |
| `verified_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha y hora de la verificación |

**Índices:**
```sql
CREATE INDEX idx_cert_verifications_cert ON certificate_verifications(certificate_id);
CREATE INDEX idx_cert_verifications_date ON certificate_verifications(verified_at);
```

---

## MÓDULO 10 — Comercio (Carrito, Órdenes y Pagos)

> **Propósito:** Gestiona todo el flujo comercial de la plataforma: desde que el usuario agrega un producto al carrito hasta que se procesa el pago y se genera la matrícula. Incluye cupones de descuento, pasarelas de pago múltiples y gestión de reembolsos.

### Orden recomendado de migraciones (estable para `php artisan migrate`)

1. `coupons`
2. `shopping_carts`
3. `orders`
4. `cart_items`
5. `order_items`
6. `payments`
7. `refunds`
8. `instructor_payouts`
9. `coupon_usages`

> Nota: `coupon_usages` depende de `orders`, por eso debe crearse al final.

---

### `coupons`

**Descripción:** Cupones de descuento creados por administradores o instructores. Pueden aplicarse a cursos específicos, categorías completas o a toda la tienda. Soportan descuento fijo o porcentual.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del cupón |
| `code` | `VARCHAR(50)` | NOT NULL, UNIQUE | Código del cupón (ej: INGENIERIA2026) |
| `description` | `VARCHAR(255)` | NULL | Descripción interna del cupón |
| `discount_type` | `VARCHAR(20)` | NOT NULL | Tipo: percentage, fixed_amount |
| `discount_value` | `NUMERIC(10,2)` | NOT NULL | Valor del descuento (% o monto fijo) |
| `max_uses` | `INTEGER` | NULL | Usos máximos totales; NULL = ilimitado |
| `max_uses_per_user` | `SMALLINT` | DEFAULT 1 | Usos por usuario |
| `current_uses` | `INTEGER` | DEFAULT 0 | Contador de usos actuales |
| `min_purchase_amount` | `NUMERIC(12,2)` | DEFAULT 0 | Monto mínimo de compra para aplicar |
| `applies_to` | `VARCHAR(20)` | DEFAULT 'all' | Ámbito: all, course, category, package, specialization |
| `applicable_id` | `UUID` | NULL | ID del ítem específico al que aplica |
| `is_active` | `BOOLEAN` | DEFAULT true | Si el cupón está activo |
| `valid_from` | `TIMESTAMPTZ` | NULL | Inicio de validez |
| `valid_until` | `TIMESTAMPTZ` | NULL | Fin de validez |
| `created_by` | `UUID` | NOT NULL, FK → users.id | Admin/instructor que creó el cupón |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_coupons_code ON coupons(UPPER(code));
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coupons_validity ON coupons(valid_from, valid_until);
```

---

### `shopping_carts`

**Descripción:** Carrito de compras por usuario. Un usuario solo puede tener un carrito activo a la vez. Se asocia a la sesión del usuario y persiste entre sesiones.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del carrito |
| `user_id` | `UUID` | NOT NULL, FK → users.id, UNIQUE | Propietario del carrito (1:1 activo) |
| `coupon_id` | `UUID` | NULL, FK → coupons.id | Cupón aplicado al carrito |
| `subtotal` | `NUMERIC(12,2)` | DEFAULT 0 | Suma de ítems antes de descuento |
| `discount_amount` | `NUMERIC(12,2)` | DEFAULT 0 | Monto de descuento total |
| `total` | `NUMERIC(12,2)` | DEFAULT 0 | Total a pagar |
| `currency` | `CHAR(3)` | DEFAULT 'USD' | Moneda del carrito |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última modificación |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_carts_user ON shopping_carts(user_id);
```

---

### `cart_items`

**Descripción:** Ítems dentro del carrito de compras. Cada ítem puede ser un curso, una especialización o un paquete. Se valida que el usuario no esté ya matriculado al agregar.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del ítem |
| `cart_id` | `UUID` | NOT NULL, FK → shopping_carts.id | Carrito al que pertenece |
| `item_type` | `VARCHAR(20)` | NOT NULL | Tipo: course, specialization, package |
| `item_id` | `UUID` | NOT NULL | ID del producto (course/specialization/package) |
| `title` | `VARCHAR(255)` | NOT NULL | Título capturado al momento de agregar |
| `cover_image` | `VARCHAR(500)` | NULL | Imagen capturada al momento de agregar |
| `unit_price` | `NUMERIC(12,2)` | NOT NULL | Precio unitario al momento de agregar |
| `discount_price` | `NUMERIC(12,2)` | NULL | Precio con descuento si aplica |
| `final_price` | `NUMERIC(12,2)` | NOT NULL | Precio final cobrado por este ítem |
| `added_at` | `TIMESTAMPTZ` | DEFAULT now() | Cuándo se agregó al carrito |

**Índices:**
```sql
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
```

---

### `orders`

**Descripción:** Orden de compra generada al hacer checkout. Representa la intención de pago del usuario con todos los ítems y montos fijados en ese momento. Es el registro contable principal.

**Por qué existe:** Separa el carrito (mutable) de la orden (inmutable). Una vez generada la orden, los precios quedan fijos para auditoria fiscal.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la orden |
| `order_number` | `VARCHAR(30)` | NOT NULL, UNIQUE | Número de orden legible (ej: ORD-2026-00001) |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Comprador |
| `coupon_id` | `UUID` | NULL, FK → coupons.id | Cupón aplicado |
| `status` | `VARCHAR(20)` | DEFAULT 'pending' | Estado: pending, paid, failed, cancelled, refunded |
| `subtotal` | `NUMERIC(12,2)` | NOT NULL | Subtotal antes de descuento |
| `discount_amount` | `NUMERIC(12,2)` | DEFAULT 0 | Descuento total aplicado |
| `tax_amount` | `NUMERIC(12,2)` | DEFAULT 0 | Impuesto aplicado (IGV, IVA...) |
| `total` | `NUMERIC(12,2)` | NOT NULL | Total cobrado |
| `currency` | `CHAR(3)` | DEFAULT 'USD' | Moneda de la transacción |
| `billing_name` | `VARCHAR(150)` | NULL | Nombre en la factura |
| `billing_email` | `VARCHAR(255)` | NULL | Email de facturación |
| `billing_address` | `TEXT` | NULL | Dirección de facturación (JSON) |
| `notes` | `TEXT` | NULL | Notas internas o del cliente |
| `paid_at` | `TIMESTAMPTZ` | NULL | Fecha de pago exitoso |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación de la orden |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at DESC);
```

---

### `order_items`

**Descripción:** Detalle de cada ítem dentro de una orden. Los precios se copian en el momento de la orden para mantener historial inmutable, incluso si el precio del curso cambia después.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del ítem |
| `order_id` | `UUID` | NOT NULL, FK → orders.id | Orden a la que pertenece |
| `item_type` | `VARCHAR(20)` | NOT NULL | Tipo: course, specialization, package |
| `item_id` | `UUID` | NOT NULL | ID del producto comprado |
| `title` | `VARCHAR(255)` | NOT NULL | Título del producto al momento de compra |
| `instructor_id` | `UUID` | NULL, FK → instructors.id | Instructor del item (para liquidaciones) |
| `unit_price` | `NUMERIC(12,2)` | NOT NULL | Precio original |
| `discount_amount` | `NUMERIC(12,2)` | DEFAULT 0 | Descuento aplicado a este ítem |
| `final_price` | `NUMERIC(12,2)` | NOT NULL | Precio final pagado |
| `instructor_revenue` | `NUMERIC(12,2)` | DEFAULT 0 | Monto para el instructor según revenue_share |
| `platform_revenue` | `NUMERIC(12,2)` | DEFAULT 0 | Monto para la plataforma |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |

**Índices:**
```sql
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_instructor ON order_items(instructor_id);
```

---

### `payments`

**Descripción:** Registro de cada transacción de pago intentada. Una orden puede tener múltiples intentos de pago (si el primero falla). Almacena la referencia externa de la pasarela de pago.

**Por qué existe:** Desacopla la orden del pago real. Permite reintentar pagos, rastrear el estado con la pasarela y reconciliar con reportes bancarios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del pago |
| `order_id` | `UUID` | NOT NULL, FK → orders.id | Orden que se está pagando |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Usuario que paga |
| `gateway` | `VARCHAR(30)` | NOT NULL | Pasarela: stripe, paypal, mercadopago, culqi, izipay |
| `gateway_transaction_id` | `VARCHAR(255)` | NULL | ID de transacción en la pasarela externa |
| `gateway_order_id` | `VARCHAR(255)` | NULL | ID de la orden en la pasarela (si diferente) |
| `gateway_response` | `JSONB` | NULL | Respuesta completa de la pasarela (para auditoría) |
| `amount` | `NUMERIC(12,2)` | NOT NULL | Monto intentado |
| `currency` | `CHAR(3)` | DEFAULT 'USD' | Moneda del pago |
| `payment_method` | `VARCHAR(30)` | NULL | Método: credit_card, debit_card, bank_transfer, wallet |
| `card_last_four` | `CHAR(4)` | NULL | Últimos 4 dígitos de la tarjeta (para mostrar al usuario) |
| `card_brand` | `VARCHAR(20)` | NULL | Marca: visa, mastercard, amex, dinersclub |
| `status` | `VARCHAR(20)` | DEFAULT 'pending' | Estado: pending, completed, failed, cancelled, refunded |
| `failure_reason` | `TEXT` | NULL | Razón del fallo (del mensaje de la pasarela) |
| `ip_address` | `INET` | NULL | IP desde donde se realizó el pago |
| `processed_at` | `TIMESTAMPTZ` | NULL | Fecha de procesamiento exitoso |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación del intento |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_gateway_txn ON payments(gateway_transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(created_at DESC);
```

---

### `refunds`

**Descripción:** Solicitudes de reembolso y su procesamiento. Registra el motivo, monto, estado de aprobación y la referencia del reembolso en la pasarela de pago.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del reembolso |
| `payment_id` | `UUID` | NOT NULL, FK → payments.id | Pago a reembolsar |
| `order_id` | `UUID` | NOT NULL, FK → orders.id | Orden asociada |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Usuario que solicita el reembolso |
| `reason` | `TEXT` | NOT NULL | Motivo del reembolso indicado por el usuario |
| `amount` | `NUMERIC(12,2)` | NOT NULL | Monto a reembolsar (puede ser parcial) |
| `status` | `VARCHAR(20)` | DEFAULT 'pending' | Estado: pending, approved, rejected, processed |
| `admin_notes` | `TEXT` | NULL | Notas internas del admin |
| `gateway_refund_id` | `VARCHAR(255)` | NULL | ID del reembolso en la pasarela |
| `reviewed_by` | `UUID` | NULL, FK → users.id | Admin que procesó el reembolso |
| `reviewed_at` | `TIMESTAMPTZ` | NULL | Fecha de revisión |
| `processed_at` | `TIMESTAMPTZ` | NULL | Fecha de procesamiento efectivo del reembolso |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de solicitud |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_user ON refunds(user_id);
CREATE INDEX idx_refunds_status ON refunds(status);
```

---

### `instructor_payouts`

**Descripción:** Liquidaciones mensuales o periódicas a instructores. Registra el monto calculado a partir de sus ventas, el estado del pago y la referencia de transferencia.

**Por qué existe:** Los instructores deben recibir su porcentaje de las ventas. Esta tabla es el registro de tesorería para los pagos salientes de la plataforma.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la liquidación |
| `instructor_id` | `UUID` | NOT NULL, FK → instructors.id | Instructor beneficiario |
| `period_start` | `DATE` | NOT NULL | Inicio del período liquidado |
| `period_end` | `DATE` | NOT NULL | Fin del período liquidado |
| `gross_sales` | `NUMERIC(12,2)` | NOT NULL | Ventas brutas del período |
| `platform_fee` | `NUMERIC(12,2)` | NOT NULL | Comisión de la plataforma |
| `net_amount` | `NUMERIC(12,2)` | NOT NULL | Monto neto a pagar al instructor |
| `currency` | `CHAR(3)` | DEFAULT 'USD' | Moneda de la liquidación |
| `status` | `VARCHAR(20)` | DEFAULT 'pending' | Estado: pending, processing, paid, failed |
| `payment_reference` | `VARCHAR(255)` | NULL | Referencia de transferencia bancaria/PayPal |
| `paid_at` | `TIMESTAMPTZ` | NULL | Fecha de pago efectivo |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de generación del pago |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_payouts_instructor ON instructor_payouts(instructor_id);
CREATE INDEX idx_payouts_status ON instructor_payouts(status);
CREATE INDEX idx_payouts_period ON instructor_payouts(period_start, period_end);
```

---

### `coupon_usages`

**Descripción:** Registro de cada uso de un cupón. Permite auditar, verificar límites por usuario y calcular el impacto económico de cada campaña de descuentos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del uso |
| `coupon_id` | `UUID` | NOT NULL, FK → coupons.id | Cupón utilizado |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Usuario que usó el cupón |
| `order_id` | `UUID` | NOT NULL, FK → orders.id | Orden en la que se aplicó |
| `discount_applied` | `NUMERIC(12,2)` | NOT NULL | Monto real de descuento aplicado |
| `used_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de uso |

**Índices:**
```sql
CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id);
```

---

## MÓDULO 11 — Notificaciones

> **Propósito:** Gestiona las notificaciones del sistema hacia los usuarios: nuevas matrículas, respuestas a preguntas, nuevos comentarios en foros, estados de pago, vencimiento de acceso, etc.

---

### `notifications`

**Descripción:** Centro de notificaciones del sistema. Compatible con el sistema de notificaciones de Laravel. Almacena la versión in-app (campana / inbox) y el snapshot del contenido mostrado al usuario.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la notificación |
| `notifiable_type` | `VARCHAR(100)` | NOT NULL | Tipo del modelo notificable (App\Models\User) |
| `notifiable_id` | `UUID` | NOT NULL | ID del modelo notificable |
| `type` | `VARCHAR(255)` | NOT NULL | Clase de notificación (namespace completo) |
| `notification_type` | `VARCHAR(100)` | NOT NULL | Tipo funcional: payment_completed, refund_processed, quiz_graded |
| `title` | `VARCHAR(180)` | NOT NULL | Título visible en la notificación |
| `body` | `TEXT` | NOT NULL | Mensaje principal visible |
| `data` | `JSONB` | NOT NULL | Payload adicional (meta, ids, contexto) |
| `category` | `VARCHAR(30)` | DEFAULT 'system' | Categoría: commerce, learning, community, system |
| `priority` | `VARCHAR(15)` | DEFAULT 'normal' | Prioridad: low, normal, high |
| `action_url` | `VARCHAR(500)` | NULL | URL interna para CTA |
| `action_text` | `VARCHAR(80)` | NULL | Texto del botón/acción |
| `entity_type` | `VARCHAR(100)` | NULL | Tipo de entidad asociada (order, payment, course...) |
| `entity_id` | `UUID` | NULL | ID de la entidad asociada |
| `channel` | `VARCHAR(20)` | DEFAULT 'database' | Canal: database, mail, push, sms |
| `read_at` | `TIMESTAMPTZ` | NULL | Fecha de lectura; NULL = no leída |
| `archived_at` | `TIMESTAMPTZ` | NULL | Archivada por el usuario (inbox limpio sin perder historial) |
| `expires_at` | `TIMESTAMPTZ` | NULL | Fecha de expiración de la notificación |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de envío |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_notifications_notifiable ON notifications(notifiable_type, notifiable_id);
CREATE INDEX idx_notifications_unread ON notifications(notifiable_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_notification_type ON notifications(notification_type);
CREATE INDEX idx_notifications_category ON notifications(category, priority);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_notifications_expiry ON notifications(expires_at);
```

---

### `notification_preferences`

**Descripción:** Preferencias de notificación por usuario. Permite que cada usuario elija qué tipo de notificaciones recibe, por qué canal y con qué frecuencia.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador de la preferencia |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Usuario propietario |
| `notification_type` | `VARCHAR(100)` | NOT NULL | Tipo de notificación (ej: new_course, quiz_graded) |
| `email_enabled` | `BOOLEAN` | DEFAULT true | Recibir por email |
| `push_enabled` | `BOOLEAN` | DEFAULT true | Recibir como notificación push |
| `in_app_enabled` | `BOOLEAN` | DEFAULT true | Mostrar en el centro de notificaciones |
| `frequency` | `VARCHAR(20)` | DEFAULT 'instant' | Frecuencia: instant, daily_digest, weekly_digest |
| `quiet_hours_start` | `TIME` | NULL | Inicio de franja silenciosa (no molestar) |
| `quiet_hours_end` | `TIME` | NULL | Fin de franja silenciosa |
| `timezone` | `VARCHAR(64)` | NULL | Zona horaria para digest/quiet hours |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Restricción:** `UNIQUE (user_id, notification_type)`

**Índices:**
```sql
CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);
CREATE INDEX idx_notif_prefs_type ON notification_preferences(notification_type);
```

---

### `notification_deliveries`

**Descripción:** Bitácora de intentos de envío por canal externo (email/push/sms). Permite auditar entregas, diagnosticar fallos y reintentar notificaciones fallidas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del intento |
| `notification_id` | `UUID` | NOT NULL, FK → notifications.id | Notificación origen |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Receptor final |
| `channel` | `VARCHAR(20)` | NOT NULL | Canal: mail, push, sms |
| `status` | `VARCHAR(20)` | DEFAULT 'queued' | Estado: queued, sent, delivered, failed |
| `recipient` | `VARCHAR(255)` | NULL | Destino (email, token push, teléfono) |
| `subject_snapshot` | `VARCHAR(255)` | NULL | Asunto usado al momento del envío (correo) |
| `provider` | `VARCHAR(50)` | NULL | Proveedor: smtp, ses, mailgun, fcm, etc. |
| `provider_message_id` | `VARCHAR(255)` | NULL | ID devuelto por el proveedor |
| `error_message` | `TEXT` | NULL | Error de envío (si falló) |
| `sent_at` | `TIMESTAMPTZ` | NULL | Fecha de envío al proveedor |
| `delivered_at` | `TIMESTAMPTZ` | NULL | Confirmación de entrega (si existe webhook) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha de creación del intento |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | Última actualización |

**Índices:**
```sql
CREATE INDEX idx_notif_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX idx_notif_deliveries_user ON notification_deliveries(user_id);
CREATE INDEX idx_notif_deliveries_status ON notification_deliveries(status, channel);
CREATE INDEX idx_notif_deliveries_provider_msg ON notification_deliveries(provider_message_id);
CREATE INDEX idx_notif_deliveries_date ON notification_deliveries(created_at DESC);
```

---

## MÓDULO 12 — Auditoría y Logs

> **Propósito:** Registra la actividad crítica del sistema para seguridad, cumplimiento legal (GDPR/protección de datos), debugging y análisis de comportamiento. Nunca se elimina; solo se archiva.

---

### `activity_logs`

**Descripción:** Log general de acciones importantes realizadas por usuarios y el sistema. Basado en el patrón de auditoría: quién hizo qué, cuándo, sobre qué objeto y desde dónde.

**Por qué existe:** Permite detectar fraudes, rastrear cambios en datos críticos (precios, certificados), cumplir con auditorías y diagnosticar errores en producción.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del log |
| `user_id` | `UUID` | NULL, FK → users.id | Usuario que realizó la acción (NULL = sistema) |
| `action` | `VARCHAR(100)` | NOT NULL | Acción: user.login, course.published, payment.completed, cert.issued |
| `subject_type` | `VARCHAR(100)` | NULL | Tipo del modelo afectado (App\Models\Course) |
| `subject_id` | `UUID` | NULL | ID del modelo afectado |
| `old_values` | `JSONB` | NULL | Estado anterior del objeto (para cambios) |
| `new_values` | `JSONB` | NULL | Nuevo estado del objeto |
| `ip_address` | `INET` | NULL | IP del actor |
| `user_agent` | `TEXT` | NULL | Agente de usuario |
| `session_id` | `VARCHAR(255)` | NULL | ID de sesión de Laravel |
| `extra_data` | `JSONB` | NULL | Datos adicionales contextuales |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha del evento |

**Índices:**
```sql
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_subject ON activity_logs(subject_type, subject_id);
CREATE INDEX idx_activity_date ON activity_logs(created_at DESC);
```

---

### `login_history`

**Descripción:** Historial de inicios de sesión. Permite al usuario ver sus accesos recientes y al sistema detectar patrones inusuales (logins desde países distintos, muchos intentos fallidos).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `UUID` | PK | Identificador del intento |
| `user_id` | `UUID` | NOT NULL, FK → users.id | Usuario que intentó login |
| `ip_address` | `INET` | NOT NULL | IP de origen |
| `user_agent` | `TEXT` | NULL | Agente de usuario del navegador |
| `country_code` | `CHAR(2)` | NULL | País detectado por GeoIP |
| `city` | `VARCHAR(100)` | NULL | Ciudad detectada por GeoIP |
| `device_type` | `VARCHAR(20)` | NULL | Tipo: desktop, mobile, tablet |
| `browser` | `VARCHAR(50)` | NULL | Navegador detectado |
| `os` | `VARCHAR(50)` | NULL | Sistema operativo detectado |
| `status` | `VARCHAR(20)` | NOT NULL | Resultado: success, failed, blocked |
| `failure_reason` | `VARCHAR(100)` | NULL | Motivo del fallo: wrong_password, account_banned, etc. |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | Fecha del intento |

**Índices:**
```sql
CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_login_history_ip ON login_history(ip_address);
CREATE INDEX idx_login_history_date ON login_history(created_at DESC);
CREATE INDEX idx_login_history_status ON login_history(status, user_id);
```

---

## Resumen de Tablas por Módulo

| # | Módulo | Tablas | Propósito |
|---|--------|--------|-----------|
| 1 | Autenticación | users, user_profiles, user_social_accounts, password_reset_tokens | Identidad y sesiones |
| 2 | Instructores | instructors, instructor_credentials | Perfiles y validación docente |
| 3 | Categorías | categories, tags, course_tags | Taxonomía del catálogo |
| 4 | Catálogo | courses, course_requirements, course_objectives, course_target_audiences, specializations, specialization_courses, packages, package_courses | Productos disponibles |
| 5 | Contenido | course_modules, lessons, lesson_videos, lesson_documents, lesson_resources | Material pedagógico |
| 6 | Evaluaciones | quizzes, quiz_questions, question_options, quiz_attempts, quiz_attempt_answers | Evaluación del aprendizaje |
| 7 | Matrículas | enrollments, lesson_progress | Control de acceso y avance |
| 8 | Reseñas | course_reviews, review_votes | Valoración y social proof |
| 9 | Certificados | certificate_templates, certificates, certificate_verifications | Acreditación verificable |
| 10 | Comercio | coupons, shopping_carts, orders, cart_items, order_items, payments, refunds, instructor_payouts, coupon_usages | Monetización completa |
| 11 | Notificaciones | notifications, notification_preferences, notification_deliveries | Comunicación in-app y multicanal (incluye correo) |
| 12 | Auditoría | activity_logs, login_history | Seguridad y trazabilidad |

**Total: 42 tablas**

---

## Diagrama de Relaciones Clave (simplificado)

```
users ──────────────┬── user_profiles (1:1)
                    ├── instructors (1:1)
                    ├── enrollments (1:N)
                    ├── orders (1:N)
                    └── certificates (1:N)

instructors ────────┬── courses (1:N)
                    ├── specializations (1:N)
                    └── instructor_payouts (1:N)

courses ────────────┬── course_modules (1:N)
                    │     └── lessons (1:N)
                    │           ├── lesson_videos (1:1)
                    │           ├── lesson_documents (1:N)
                    │           └── lesson_resources (1:N)
                    ├── course_tags ──── tags (N:M)
                    ├── quizzes (1:N)
                    │     └── quiz_questions (1:N)
                    │           └── question_options (1:N)
                    ├── enrollments (1:N)
                    │     └── lesson_progress (1:N)
                    ├── course_reviews (1:N)
                    └── certificates (1:N)

orders ─────────────┬── order_items (1:N)
                    │     └── enrollments (1:1)
                    └── payments (1:N)
                          └── refunds (1:N)
```

---

## Notas de Implementación en Laravel

```php
// En AppServiceProvider::boot() activar UUID para PostgreSQL
use Illuminate\Support\Str;
Model::creating(fn($m) => $m->id ??= Str::uuid());

// Activar extensión pgcrypto en PostgreSQL para gen_random_uuid()
// En una migración inicial:
// DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

// Activar soft deletes en modelos con deleted_at
use Illuminate\Database\Eloquent\SoftDeletes;

// HasRoles de Spatie en User:
use Spatie\Permission\Traits\HasRoles;
```

---

*Diseño elaborado considerando escalabilidad, integridad referencial y rendimiento para una plataforma de aula virtual especializada en cursos de ingeniería. Cada decisión de diseño está orientada a soportar miles de usuarios concurrentes con consultas eficientes mediante el uso estratégico de índices PostgreSQL.*
