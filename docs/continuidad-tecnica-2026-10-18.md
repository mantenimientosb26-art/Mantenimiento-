# Continuidad técnica — servicio de mantenimiento
Última revisión: 18/10/2026.

## Estado del trabajo
- La aplicación ya tiene los cambios principales de fichas guardados en GitHub y desplegados en Cloudflare.
- Se recuperó el Worker real `mantenimiento-fichas`, se añadió a cada equipo el formulario de alta de intervención y su historial, y se desplegó. El código de GitHub coincide exactamente con el Worker activo.
- La página principal `/local` del Worker `servicio-tecnico-mantenimiento` ya contiene una ficha modal de equipo con edición e intervención ligada al equipo. Se mantiene versionada en `cloudflare/servicio-tecnico-mantenimiento.js`.
- El formulario público de avisos sigue en `mantenimiento-avisos-nuevo` y llama a la Edge Function `submit-maintenance-incident` versión 4.
- Se aplicaron y registraron dos cambios de permisos Supabase: revocar `anon` de la RPC heredada `submit_unified_public_incident` y revocar ejecución directa de `log_maintenance_change()` a `PUBLIC`, `anon` y `authenticated`. Los 12 triggers de auditoría siguen definidos.
- No se han insertado datos de prueba ni se ha modificado el esquema de tablas.

## Arquitectura y enlaces
- Fichas independientes de locales/equipos: https://mantenimiento-fichas.servicio-tecnico-mantenimiento.workers.dev/
- Aplicación principal, panel y rutas de Drive: https://servicio-tecnico-mantenimiento.servicio-tecnico-mantenimiento.workers.dev/
- Formulario público: https://mantenimiento-avisos-nuevo.servicio-tecnico-mantenimiento.workers.dev/
- GitHub: https://github.com/mantenimientosb26-art/Mantenimiento-
- Supabase project ref: `knpvuiamdbnbrkwmoxqf`.

## Datos consultados
- 13 locales, 102 equipos y 8 avisos.
- `equipment_maintenance_records`: 1 intervención existente al revisar la base.
- `attachments`: 0 filas de metadatos; eso no prueba que no existan archivos en Google Drive.
- `interventions`: tabla antigua sin registros; el historial actual de equipos usa `equipment_maintenance_records`.
- Solo hay un perfil activo con rol `admin`; no hay filas en `site_access`. El administrador pasa por la rama de administración de `can_access_site()`.

## Qué se ha comprobado
- Sintaxis del Worker de fichas y del JavaScript de navegador: correcta.
- Worker desplegado `mantenimiento-fichas` contiene formulario, historial e inserción; su código coincide con `main` en GitHub.
- La tabla de intervenciones tiene RLS activado y concede a `authenticated` permisos de lectura/inserción. La política de inserción requiere acceso al local y que `technician_id` sea el usuario autenticado.
- Se hizo una inserción de prueba dentro de una transacción con rol `authenticated` e identidad admin; fue aceptada por RLS y se revirtió. La verificación posterior confirmó cero filas con el título de prueba y una intervención total.
- La función de auditoría sigue asociada a los triggers existentes.
- No fue posible ejecutar una prueba de navegador con una sesión real del usuario desde el entorno de herramientas. Por tanto, no se declara validado el guardado real de extremo a extremo.

## Pendientes concretos
1. Confirmar una inserción real de intervención desde la sesión de usuario y verificar que aparece al recargar. Si falla, la interfaz ya muestra el error de Supabase.
2. Validar un aviso público sin archivos y otro con archivos, confirmando el registro en Supabase y el archivo en Google Drive.
3. El Worker de fichas todavía sube miniaturas al bucket privado heredado `maintenance-attachments`. Migrar esas miniaturas a Drive requiere diseñar un endpoint protegido que actualice `equipment.photos` sin exponer secretos ni romper imágenes actuales.
4. Revisar los avisos restantes de los asesores de seguridad. Las funciones públicas de invitación/listado y el envío con token tienen usos previstos; no revocar permisos en bloque.
5. El código de producción de Workers debe compararse con los archivos versionados antes de cualquier despliegue. No asumir que una página HTML/JS incrustada es equivalente a otro Worker.

## Reglas de trabajo
- Mantener archivos exclusivamente en Google Drive para adjuntos nuevos del flujo de avisos; Supabase almacena datos y metadatos.
- No guardar secretos OAuth, service-role keys, tokens ni secretos compartidos en GitHub.
- No cambiar RLS ni privilegios para ocultar un error de interfaz.
- Después de cada cambio: validar sintaxis, comprobar el código activo y documentar el resultado real.
- Las Vercel Agent Skills del ZIP no son la ruta de despliegue de este proyecto; la arquitectura actual usa Cloudflare Workers y Supabase. Se aplican criterios compatibles, no una migración a Vercel.
