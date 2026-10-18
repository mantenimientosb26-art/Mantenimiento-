# Estado actual del servicio técnico
Última comprobación: 18/10/2026.

## Despliegues
- `mantenimiento-fichas`: fichas de locales/equipos, miniaturas y ahora registro e historial de intervenciones dentro de cada equipo. Desplegado el 18/10/2026.
- `mantenimiento-avisos-nuevo`: formulario público y pasarela de avisos.
- `servicio-tecnico-mantenimiento`: panel, ficha `/local`, módulo `/intervenciones` y endpoints de Google Drive/OAuth.
- Supabase Edge Function `submit-maintenance-incident`: versión 4.

## Datos observados
- 13 locales activos.
- 102 equipos.
- 8 avisos.
- 1 intervención existente en `equipment_maintenance_records`.
- 0 filas en `attachments` y 0 filas en la tabla antigua `interventions` en la última consulta.

## Intervenciones en fichas
El formulario de intervención se ha desplegado en `mantenimiento-fichas`. Permite registrar tipo, fecha, título, descripción, materiales, coste y seguimiento, y muestra el historial del equipo. Requiere sesión autenticada y utiliza la política RLS existente.

Comprobaciones realizadas:
- Sintaxis del Worker y del JavaScript del navegador: correcta.
- El contenido desplegado coincide con `cloudflare/mantenimiento-fichas.js` en GitHub.
- La tabla tiene RLS activado y permisos de lectura/inserción para `authenticated`; la política de inserción requiere acceso al local y coincidencia del técnico con el usuario autenticado.

Pendiente: probar un guardado real desde el navegador con una sesión de usuario. No se han creado filas de prueba.

## Seguridad aplicada
- Revocado `EXECUTE` a `anon` sobre la RPC antigua `submit_unified_public_incident(...)`; el formulario activo usa la Edge Function actual.
- Revocado `EXECUTE` a `PUBLIC`, `anon` y `authenticated` sobre la función interna de trigger `log_maintenance_change()`.
- Verificados los 12 triggers de auditoría asociados a avisos, intervenciones, equipos y adjuntos.

## Pendientes
1. Validar envío real de aviso público sin adjuntos y con adjuntos.
2. Confirmar la subida de fotos/vídeos a Google Drive de extremo a extremo.
3. Migrar las miniaturas de equipo del bucket heredado de Supabase Storage a Drive de forma segura, sin perder imágenes existentes.
4. Revisar avisos de seguridad restantes individualmente, sin desactivar RPC públicas que requieran invitación o token.

Para el contexto detallado y las decisiones técnicas, consultar [continuidad técnica](continuidad-tecnica-2026-10-18.md) y [auditoría inicial](auditoria-inicial-2026-10-18.md).
