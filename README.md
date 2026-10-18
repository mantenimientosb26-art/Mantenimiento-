# Servicio Técnico Mantenimiento

Aplicación de avisos, fichas de locales/equipos e intervenciones para los 13 locales.

## Arquitectura desplegada — revisada el 18/10/2026

- **Fichas de locales y equipos:** Cloudflare Worker `mantenimiento-fichas`.
  - Acceso: https://mantenimiento-fichas.servicio-tecnico-mantenimiento.workers.dev/
  - Código versionado: [cloudflare/mantenimiento-fichas.js](cloudflare/mantenimiento-fichas.js)
  - Cada ficha de equipo incluye historial y formulario para registrar intervenciones.
- **Formulario público de avisos:** Cloudflare Worker `mantenimiento-avisos-nuevo`.
- **OAuth y operaciones de Google Drive:** Cloudflare Worker `servicio-tecnico-mantenimiento`, incluidas las rutas `/google-drive/upload` y `/intervenciones`.
- **Base de datos y autenticación:** Supabase, proyecto `knpvuiamdbnbrkwmoxqf`.
- **Registro de avisos:** Edge Function `submit-maintenance-incident`, versión 4.
- **Datos:** Supabase almacena locales, equipos, avisos, usuarios, estados e intervenciones. Los archivos adjuntos del flujo de avisos deben guardarse exclusivamente en Google Drive; no subir adjuntos nuevos a Supabase Storage.

## Estado observado

- 13 locales, 102 equipos, 8 avisos y 1 intervención registrada.
- La tabla de metadatos `attachments` no tiene filas; esto no demuestra por sí solo que no existan archivos en Drive.
- La tabla antigua `interventions` está vacía; el historial actual usa `equipment_maintenance_records`.
- El formulario de intervenciones se ha añadido a cada ficha de equipo y está desplegado en Cloudflare. El código del Worker desplegado coincide con el guardado en GitHub.
- La inserción requiere una sesión válida y acceso al local; la política RLS comprueba que el técnico de la intervención coincide con el usuario autenticado.
- Se restringió la RPC heredada `submit_unified_public_incident` para impedir ejecución por usuarios anónimos y se retiró la ejecución directa de la función interna de auditoría `log_maintenance_change()`. Los triggers de auditoría siguen definidos.

## Pendiente de verificación funcional

1. Probar con una cuenta real que el formulario de intervención guarde una fila y que aparezca en el historial tras recargar.
2. Probar el envío público de aviso sin adjuntos y con adjuntos, comprobando la confirmación real.
3. Validar una subida a Google Drive de extremo a extremo y revisar el caso anterior en el que la subida devolvió un error aunque el archivo apareció en Drive.
4. Resolver el almacenamiento actual de miniaturas de las fichas, que aún usa el bucket privado heredado `maintenance-attachments`, para cumplir la regla de guardar archivos exclusivamente en Drive sin perder imágenes existentes.
5. Revisar los avisos restantes de los asesores de seguridad de Supabase. Las funciones públicas de invitaciones y envío de avisos tienen validaciones propias y no deben bloquearse a ciegas.

## Reglas de mantenimiento

- No desplegar cambios sin revisar el código actual, validar la sintaxis y comprobar los bindings/secretos.
- No guardar OAuth tokens, claves `service_role`, secretos compartidos ni credenciales en GitHub.
- No afirmar que un envío o una subida se completó hasta confirmar la respuesta real del servidor y el registro correspondiente.
- Documentar cambios de permisos en migraciones y comprobar que las políticas RLS siguen permitiendo el flujo previsto.

## Archivos principales

- `cloudflare/mantenimiento-fichas.js`: código del Worker de fichas y registro de intervenciones.
- `cloudflare/mantenimiento-avisos-nuevo.js`: formulario público y pasarela de avisos.
- `cloudflare/servicio-tecnico-mantenimiento.js`: rutas de Google Drive y módulo independiente de intervenciones.
- `supabase/functions/submit-maintenance-incident/index.ts`: registro de avisos en Supabase.
- `docs/auditoria-inicial-2026-10-18.md`: auditoría y cambios realizados.
