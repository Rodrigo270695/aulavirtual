<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Limpia el caché antes del seed para evitar conflictos
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ----------------------------------------------------------------
        // PERMISOS
        // Convención: recurso.acción (snake_case)
        // Cada botón de la UI tiene su permiso; si el usuario no lo tiene
        // el botón simplemente no aparece.
        // ----------------------------------------------------------------

        $permissions = [
            // Dashboard
            'dashboard.view',

            // Usuarios (panel admin)
            'usuarios.view',
            'usuarios.create',
            'usuarios.edit',
            'usuarios.delete',

            // Instructores (panel admin)
            'instructores.view',
            'instructores.create',
            'instructores.edit',
            'instructores.delete',

            // Credenciales docentes (panel admin)
            'credenciales_docentes.view',
            'credenciales_docentes.create',
            'credenciales_docentes.edit',
            'credenciales_docentes.delete',
            'credenciales_docentes.verify',

            // Roles
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'roles.permissions', // asignar/quitar permisos a un rol

            // Plataforma (marca, colores, login, enlaces)
            'plataforma.view',
            'plataforma.edit',
            // Configuración general (contacto, legales, redes)
            'general.view',
            'general.edit',

            // Categorías y etiquetas (taxonomía del catálogo)
            'categorias.view',
            'categorias.create',
            'categorias.edit',
            'categorias.delete',

            // Cursos (catálogo)
            'cursos.view',
            'cursos.create',
            'cursos.edit',
            'cursos.delete',

            // Curso · módulos (estructura: unidades del curso)
            'cursos_modulos.view',
            'cursos_modulos.create',
            'cursos_modulos.edit',
            'cursos_modulos.delete',

            // Curso · lecciones (contenido dentro de cada módulo)
            'cursos_lecciones.view',
            'cursos_lecciones.create',
            'cursos_lecciones.edit',
            'cursos_lecciones.delete',

            // Curso · lección · documentos adjuntos (PDF, Office, etc.)
            'cursos_lecciones_documentos.view',
            'cursos_lecciones_documentos.create',
            'cursos_lecciones_documentos.edit',
            'cursos_lecciones_documentos.delete',

            // Curso · lección · recursos (enlaces externos, GitHub, etc.)
            'cursos_lecciones_recursos.view',
            'cursos_lecciones_recursos.create',
            'cursos_lecciones_recursos.edit',
            'cursos_lecciones_recursos.delete',

            // Curso · lección · vídeo principal (1:1, upload o embed)
            'cursos_lecciones_videos.view',
            'cursos_lecciones_videos.create',
            'cursos_lecciones_videos.edit',
            'cursos_lecciones_videos.delete',

            // Curso · lección · tarea (premisa + entrega del estudiante)
            'cursos_lecciones_tareas.view',
            'cursos_lecciones_tareas.create',
            'cursos_lecciones_tareas.edit',
            'cursos_lecciones_tareas.delete',

            // Curso · lección · cuestionario (quiz ligado a lección tipo quiz)
            'cursos_lecciones_quizzes.view',
            'cursos_lecciones_quizzes.create',
            'cursos_lecciones_quizzes.edit',
            'cursos_lecciones_quizzes.delete',

            // Aula del alumno · tarea (subida de entregables)
            'learning_tareas_entregas.view',
            'learning_tareas_entregas.create',
            'learning_tareas_entregas.delete',

            // Aula del alumno · reseña del curso (al completar)
            'learning_curso_resenas.create',

            // Curso · ficha de venta (página pública: requisitos, objetivos, público)
            'cursos_ficha.view',
            'cursos_ficha.edit',

            // Curso · matrículas (quién está inscrito; lectura desde admin)
            'cursos_matriculas.view',

            // Especializaciones (rutas de aprendizaje)
            'especializaciones.view',
            'especializaciones.create',
            'especializaciones.edit',
            'especializaciones.delete',

            // Paquetes (combo de cursos con descuento)
            'paquetes.view',
            'paquetes.create',
            'paquetes.edit',
            'paquetes.delete',

            // Certificados · plantillas (diseño PDF / HTML)
            'certificados_plantillas.view',
            'certificados_plantillas.create',
            'certificados_plantillas.edit',
            'certificados_plantillas.delete',
            // Certificados · emisión (registros emitidos)
            'certificados_emitidos.view',
            'certificados_emitidos.create',
            'certificados_emitidos.verifications',

            // Comercio · visibilidad de módulo
            'comercio.view',

            // Comercio · cupones
            'cupones.view',
            'cupones.create',
            'cupones.edit',
            'cupones.delete',

            // Comercio · órdenes (consulta; el alta ocurre en el flujo del estudiante)
            'ordenes.view',
            'ordenes.items',
            // Comercio · pagos (solo lectura por ahora)
            'pagos.view',
            // Comercio · reembolsos (solo lectura por ahora)
            'reembolsos.view',
            // Comercio · pagos a instructores
            'liquidaciones_instructores.view',
            'liquidaciones_instructores.create',
            'liquidaciones_instructores.edit',

            // Configuración · notificaciones (admin)
            'notificaciones.view',
            'notificaciones.edit',

            // Auditoría (registros de actividad e historial de inicios de sesión)
            'auditoria.view',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // ----------------------------------------------------------------
        // ROLES
        // ----------------------------------------------------------------

        /** Superadmin: acceso total, siempre sincroniza con todos los permisos */
        $superadmin = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $superadmin->syncPermissions(Permission::all());

        /** Student: rol por defecto para cualquier usuario que se registre */
        $student = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $student->syncPermissions([
            'dashboard.view',
            'learning_tareas_entregas.view',
            'learning_tareas_entregas.create',
            'learning_tareas_entregas.delete',
            'learning_curso_resenas.create',
        ]);

        /** Instructor: gestiona sus credenciales docentes */
        $instructor = Role::firstOrCreate(['name' => 'instructor', 'guard_name' => 'web']);
        $instructor->syncPermissions([
            'dashboard.view',
            'credenciales_docentes.view',
            'credenciales_docentes.create',
            'credenciales_docentes.edit',
            'credenciales_docentes.delete',
        ]);

        // ----------------------------------------------------------------
        // USUARIO SUPERADMIN
        // ----------------------------------------------------------------

        $user = User::firstOrCreate(
            ['email' => 'superadmin@aulavirtual.com'],
            [
                'first_name'        => 'Super',
                'last_name'         => 'Admin',
                'password'          => Hash::make('Admin@1234'),
                'email_verified_at' => now(),
                'country_code'      => 'PE',
                'timezone'          => 'America/Lima',
                'is_active'         => true,
                'is_banned'         => false,
            ]
        );

        if (! $user->hasRole('superadmin')) {
            $user->assignRole($superadmin);
        }

        // Re-sync por si se añadieron permisos nuevos
        $superadmin->syncPermissions(Permission::all());

        $this->command->info("✔ Rol [superadmin] con {$superadmin->permissions->count()} permiso(s).");
        $this->command->info("✔ Rol [student] con {$student->permissions->count()} permiso(s).");
        $this->command->info("✔ Rol [instructor] con {$instructor->permissions->count()} permiso(s).");
        $this->command->info('✔ Usuario superadmin@aulavirtual.com listo.');
    }
}
