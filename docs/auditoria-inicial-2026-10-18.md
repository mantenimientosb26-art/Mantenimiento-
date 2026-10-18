# Auditoría inicial del servicio técnico — 18/10/2026

## Alcance
Revisión de solo lectura de GitHub, Cloudflare y Supabase. No se ha desplegado código ni se ha modificado la base de datos.

## Estado observado
- Repositorio de trabajo: `mantenimientosb26-art/Mantenimiento-`.
- Proyecto Supabase `knpvuiamdbnbrkwmoxqf`: activo, región UE.
- Cloudflare Workers existentes: `mantenimiento-fichas`, `mantenimiento-avisos-internos`, `mantenimiento-avisos-nuevo`, `servicio-tecnico-mantenimiento`.
- Cloudflare Pages `servicio-tecnico-mantenimiento.pages.dev`: proyecto creado, pero la API no devuelve despliegues; la aplicación activa parece residir en Workers.
- Conteos actuales de base de datos: 13 locales, 102 equipos, 8 avisos, 1 registro en `equipment_maintenance_records`, 0 filas en `attachments`, 0 filas en la tabla antigua `interventions`.
- El repositorio contiene `cloudflare/fichas-independientes.html` como página provisional, pero la ficha funcional desplegada está en el Worker `mantenimiento-fichas`. Se ha guardado una copia del código desplegado en `cloudflare/mantenimiento-fichas.js` para poder revisarlo y mantenerlo bajo control de versiones.

## Hallazgos que requieren trabajo
1. **Divergencia de código:** el Worker funcional de fichas no estaba versionado en el repositorio. La copia recuperada permite revisar el código real sin sustituir la producción.
2. **Almacenamiento de miniaturas:** el Worker de fichas sube miniaturas a Supabase Storage (`maintenance-attachments`) y persiste enlaces firmados de 365 días. Esto contradice la regla documentada del proyecto de guardar adjuntos exclusivamente en Google Drive. No se ha cambiado el flujo, para no romper las miniaturas actuales.
3. **Observabilidad de la carga:** se añadió en esta rama aislada manejo de excepciones para la carga de locales y equipos, de forma que los errores de red se muestren en pantalla. La mejora aún no está desplegada ni probada en navegador; el origen exacto del estado de carga sigue pendiente de reproducirse con sesión autenticada.
4. **Seguridad Supabase:** los asesores detectan funciones `SECURITY DEFINER` ejecutables por `anon` o `authenticated`. Algunas parecen deliberadamente públicas (validación de invitaciones, lista pública de locales y envío de avisos con token); cada una debe revisarse individualmente. `log_maintenance_change()` es una función de trigger y aparece con permisos por defecto; conviene restringir su ejecución directa sin afectar los triggers.
5. **Datos reales pendientes de completar:** existen 102 equipos, pero solo un registro de mantenimiento y ninguna fila de adjuntos en la tabla de metadatos. Los archivos de Drive pueden estar fuera de esa tabla; se debe verificar el flujo y el registro de metadatos antes de concluir que falta documentación.
6. **RPC pública heredada:** el asesor de Supabase marca `submit_unified_public_incident(...)` como `SECURITY DEFINER` ejecutable por `anon`; su definición inserta avisos sin validar token. No aparece referenciada en el repositorio actual y el Worker vigente usa la Edge Function `submit-maintenance-incident`, pero hay que comprobar que no exista un formulario antiguo que dependa de ella antes de revocar su permiso público.
7. **Funciones públicas previstas:** `check_access_invitation`, `public_maintenance_sites` y `submit_public_incident` también aparecen en los avisos de seguridad. Algunas son parte del flujo público de invitaciones/avisos y no deben deshabilitarse sin revisar sus validaciones y usos.

## Cambio aplicado en producción — 18/10/2026
- Se añadió directamente a cada ficha de equipo el formulario **Añadir intervención** y el historial existente de ese equipo.
- El formulario registra tipo, fecha, asunto, descripción, materiales, coste y seguimiento en `equipment_maintenance_records`.
- Se requiere una sesión autenticada; se usa el usuario actual como `technician_id` y la política RLS existente restringe el acceso al local.
- Se añadió captura de errores en carga de locales/equipos para que se muestren en pantalla.
- El código del Worker y el JavaScript del navegador pasan comprobación sintáctica. Se verificó que el Worker desplegado contiene el formulario, el historial y la inserción, y que su contenido coincide con la versión guardada en la rama principal de GitHub.
- Se validó la inserción bajo RLS con una transacción de prueba usando la identidad admin; la operación se aceptó y se revirtió. Se confirmó que no quedó ninguna fila de prueba.
- **Pendiente:** probar una inserción real desde navegador con la cuenta del usuario. No se han creado registros de prueba ni modificado el esquema de Supabase.

## Siguiente secuencia segura
1. Reproducir el fallo de carga con sesión de administrador y registrar el error exacto.
2. Revisar las políticas RLS, permisos de funciones y logs de Supabase/Cloudflare.
3. Decidir cómo unificar el almacenamiento de miniaturas con el requisito de Google Drive sin perder fotografías existentes.
4. Corregir en una rama aislada, probar lectura de locales/equipos, formulario público sin adjuntos y formulario con adjunto.
5. Desplegar solo después de validar las pruebas y comprobar los endpoints activos.

## Seguridad y cambios de permisos — 18/10/2026
- Se retiró el permiso `EXECUTE` de `anon` sobre la RPC heredada `submit_unified_public_incident(...)`: los Workers activos usan la Edge Function `submit-maintenance-incident` y no referencian la RPC antigua. Se conserva el permiso de `authenticated`.
- Se retiró `EXECUTE` de `PUBLIC`, `anon` y `authenticated` sobre `log_maintenance_change()`, que es una función interna de trigger. Se verificó que los triggers de auditoría siguen definidos en `incidents`, `interventions`, `equipment` y `attachments`.
- Las funciones públicas de invitación/listado y la RPC con token de acceso se mantienen porque forman parte del flujo público y requieren una revisión individual antes de cambiar permisos.
- No se copiaron secretos OAuth, service-role keys ni tokens de Google Drive. No se alteraron registros de negocio ni el esquema de tablas.
