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

## Siguiente secuencia segura
1. Reproducir el fallo de carga con sesión de administrador y registrar el error exacto.
2. Revisar las políticas RLS, permisos de funciones y logs de Supabase/Cloudflare.
3. Decidir cómo unificar el almacenamiento de miniaturas con el requisito de Google Drive sin perder fotografías existentes.
4. Corregir en una rama aislada, probar lectura de locales/equipos, formulario público sin adjuntos y formulario con adjunto.
5. Desplegar solo después de validar las pruebas y comprobar los endpoints activos.

## Seguridad
No se copiaron secretos OAuth, service-role keys ni tokens de Google Drive. No se realizaron cambios de producción.
