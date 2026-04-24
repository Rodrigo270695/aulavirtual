# Aula Virtual

Plataforma de aprendizaje en línea construida con **Laravel**, **Inertia.js** y **React**. Incluye catálogo público, matrícula, aula (lecciones, cuestionarios, tareas), certificados con verificación y QR, carrito, checkout con **PayPal**, notificaciones, roles y permisos (**Spatie**), login social (**Google** / **GitHub**) y panel para personal autorizado.

El **modelo de datos canónico** del producto (motor, tablas, relaciones y convenciones) está definido en [`DATABASE_DESIGN.md`](./DATABASE_DESIGN.md). Este README describe cómo levantar el código; el diseño de BD describe **qué** debe persistir en entornos serios.

---

## Base de datos según `DATABASE_DESIGN.md`

| Aspecto | Lo que establece el documento |
|---------|-------------------------------|
| Motor objetivo | **PostgreSQL 15+** |
| Claves primarias | **UUID** (`gen_random_uuid()` vía extensión **pgcrypto**) |
| Integridad | FK con prefijo `fk_`, índices con prefijo `idx_`, soft delete `deleted_at` donde aplica |
| Tipos / tiempo | `TIMESTAMPTZ`, `NUMERIC(12,2)` para montos, checks en `VARCHAR` en lugar de tipo ENUM nativo |
| Alcance | **12 módulos**, **42 tablas** (resumen en el propio documento) |

**Módulos cubiertos en el diseño:** (1) autenticación y usuarios, (2) instructores, (3) categorías y etiquetas, (4) cursos, especializaciones y paquetes, (5) contenido del curso, (6) evaluaciones y cuestionarios, (7) matrículas y progreso, (8) reseñas, (9) certificados, (10) comercio, (11) notificaciones, (12) auditoría y logs.

**Notas de implementación Laravel** (detalladas al final de `DATABASE_DESIGN.md`): habilitar UUID en modelos al crear registros, ejecutar `CREATE EXTENSION IF NOT EXISTS "pgcrypto"` en una migración inicial en PostgreSQL, usar `SoftDeletes` donde corresponda y `HasRoles` de Spatie en `User`.

**Trabajo diario:** el proyecto se desarrolla y despliega contra **PostgreSQL** (coherente con [`DATABASE_DESIGN.md`](./DATABASE_DESIGN.md)). El [`.env.example`](./.env.example) usa `pgsql` por defecto. Los **tests** automatizados siguen usando SQLite en memoria vía `phpunit.xml`, sin necesidad de levantar Postgres solo para ejecutar Pest.

---

## Requisitos previos

| Herramienta | Versión recomendada |
|-------------|---------------------|
| PHP | **8.3** o superior (compatible con 8.4 / 8.5 en CI) |
| Composer | 2.x |
| Node.js | **22** (alineado con GitHub Actions) |
| pnpm | **10** (fijado en `package.json` → `packageManager`) |
| PostgreSQL | **15+** (servidor local o remoto; base vacía antes del primer `migrate`) |

Extensiones PHP habituales de Laravel: `openssl`, `pdo`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`, `bcmath`, **`pdo_pgsql`**. Opcional: `pdo_sqlite` si en algún momento usas SQLite en `.env` (no es el flujo estándar del equipo).

---

## Puesta en marcha rápida

1. **PostgreSQL:** crea una base vacía (el ejemplo usa `aulavirtual`; puedes cambiar el nombre en `.env`).

   ```bash
   createdb aulavirtual
   ```

   En Windows, hazlo desde pgAdmin, `psql`, o la herramienta que uses con tu instalación de Postgres.

2. **Entorno:** copia `.env.example` → `.env` si aún no existe, y ajusta `DB_DATABASE`, `DB_USERNAME` y `DB_PASSWORD` a tu instancia.

3. Desde la raíz del repositorio:

```bash
composer run setup
```

Este script (definido en `composer.json`) hace aproximadamente:

1. `composer install`
2. Copia `.env` desde `.env.example` si no existe
3. `php artisan key:generate`
4. `php artisan migrate --force`
5. `php artisan storage:link`
6. `pnpm install`
7. `pnpm run build`

**Datos de prueba:** si necesitas roles y ajustes base, ejecuta después:

```bash
php artisan db:seed
```

---

## Instalación manual (paso a paso)

Si prefieres no usar `composer run setup`:

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd aulavirtual
   ```

2. **Instalar dependencias PHP**

   ```bash
   composer install
   ```

3. **Entorno**

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Base de datos (PostgreSQL)**

   Crea una base vacía y deja en `.env` lo mismo que en [`.env.example`](./.env.example): `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT` (5432), `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`. Si las migraciones usan UUID con `gen_random_uuid()`, asegura la extensión **pgcrypto** en esa base (ver *Notas de Implementación en Laravel* en [`DATABASE_DESIGN.md`](./DATABASE_DESIGN.md)).

   **Solo si insistes en SQLite** (no alineado con el diseño de producto): en `.env` comenta las variables `DB_*` de Postgres, activa el bloque `sqlite` del `.env.example` y crea `database/database.sqlite`.

   **MySQL** no es el motor del diseño documentado.

   ```bash
   php artisan migrate
   php artisan db:seed   # opcional
   ```

5. **Enlace de almacenamiento** (avatars, entregas, etc.)

   ```bash
   php artisan storage:link
   ```

6. **Frontend**

   ```bash
   pnpm install
   pnpm run build          # producción / CI
   # o, en desarrollo:
   pnpm run dev
   ```

7. **Colas y sesión**  
   Con la configuración por defecto del ejemplo, `SESSION_DRIVER` y `QUEUE_CONNECTION` pueden usar la base de datos. Tras migrar, en local puedes usar:

   ```bash
   php artisan queue:listen
   ```

---

## Desarrollo local

Arranca servidor PHP, cola y Vite en un solo comando:

```bash
composer run dev
```

Equivale a `php artisan serve`, `php artisan queue:listen` y `pnpm run dev` en paralelo (vía `concurrently`).

- Aplicación: por defecto `http://127.0.0.1:8000` (según `php artisan serve`).
- Comprobación de salud HTTP: ruta **`/up`**.

---

## Variables de entorno relevantes

Las principales están en [`.env.example`](./.env.example). Resumen:

| Área | Variables |
|------|-----------|
| App | `APP_NAME`, `APP_URL`, `APP_DEBUG`, `APP_LOCALE` (español por defecto en el ejemplo) |
| Base de datos | `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` |
| Correo | `MAIL_*` |
| PayPal | `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_CHECKOUT_CURRENCY`, etc. |
| OAuth (opcional) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`; `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI` (ver `config/services.php`) |

No subas nunca `.env` al repositorio; solo `.env.example`.

---

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `composer run dev` | Servidor + cola + Vite |
| `pnpm run dev` | Solo Vite (HMR) |
| `pnpm run build` | Compilar assets para producción |
| `composer run test` | Pint en modo test + `php artisan test` (Pest) |
| `./vendor/bin/pest` | Solo tests (como en CI) |
| `composer run lint` | Laravel Pint (PHP) |
| `composer run lint:check` | Pint sin escribir cambios |
| `pnpm run lint` / `pnpm run lint:check` | ESLint |
| `pnpm run format` / `pnpm run format:check` | Prettier |
| `pnpm run types:check` | TypeScript (`tsc --noEmit`) |
| `composer run ci:check` | Lint/format/types + tests (útil antes de abrir un PR) |

---

## Tests y CI

- **Tests:** Pest sobre PHPUnit; en el entorno de test se usa **SQLite en memoria** solo en PHPUnit (`phpunit.xml`). El código de aplicación en local y producción se asume con **Postgres**.
- **GitHub Actions:**
  - [`.github/workflows/tests.yml`](./.github/workflows/tests.yml): servicio **PostgreSQL 16**, variables `DB_*` para la job, `php artisan migrate`, build de Vite y `./vendor/bin/pest` (Pest sigue usando SQLite en memoria definido en `phpunit.xml`). PHP con extensiones `pgsql` y `pdo_pgsql`.
  - [`.github/workflows/lint.yml`](./.github/workflows/lint.yml): Pint, Prettier y ESLint.

Ramas disparadoras: `main`, `master`, `develop`, `workos` (push y pull request).

---

## Estructura del proyecto (resumen)

| Ruta | Contenido |
|------|-----------|
| `app/` | Lógica Laravel: modelos, controladores, políticas, jobs… |
| `routes/web.php` | Rutas web e Inertia (catálogo, aprendizaje, carrito, OAuth, etc.) |
| `resources/js/` | SPA React + Inertia (páginas, componentes, layouts) |
| `resources/css/` | Estilos (Tailwind v4) |
| `database/migrations/` | Esquema de base de datos |
| `database/seeders/` | Datos iniciales (`RolesAndPermissionsSeeder`, `PlatformSettingSeeder`, …) |
| `tests/` | Tests Pest (Feature / Unit) |
| `lang/` | Traducciones (p. ej. `es.json`) |

---

## Documentación adicional

- **[DATABASE_DESIGN.md](./DATABASE_DESIGN.md)** — Fuente de verdad del esquema: PostgreSQL 15+, 42 tablas en 12 módulos, convenciones de nombres, índices, diagrama de relaciones y fragmentos SQL / notas Laravel (UUID, `pgcrypto`, Spatie, soft deletes).

---

## Licencia

Este proyecto declara licencia **MIT** en `composer.json`. Ajusta este apartado si tu repositorio usa otra licencia.
