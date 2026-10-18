# Continuidad técnica — aplicación de mantenimiento
Fecha de revisión: 18/10/2026

## Objetivo inmediato
Resolver el fallo recurrente al crear/añadir fichas de locales y comprobar el flujo completo de alta, carga de ficha, equipos, avisos e intervenciones. No desplegar cambios hasta verificarlo con una sesión autenticada.

## Repositorio y ramas
- Repositorio principal: https://github.com/mantenimientosb26-art/Mantenimiento-
- Rama de producción/código base: `main`
- Rama aislada de auditoría ya existente: `audit/recover-ficha-worker-2026-10-18`
- Otros trabajos existentes: `fix/intervenciones-aisladas`, `integration/menu-locales-intervenciones`, `rebuild/clean-app`, `recovery/stable-2026-10-12`.
- El 13/10 se restauró el código completo del Worker tras un parche fallido. Después hubo correcciones de miniaturas de equipos y del módulo de intervenciones. Evitar repetir parches sobre bloques HTML/JS incrustados sin inspeccionar primero el archivo completo.

## Arquitectura confirmada en el repositorio
- Aplicación y páginas servidas por Cloudflare Worker `servicio-tecnico-mantenimiento`.
- Formulario público/pasarela de avisos en Worker `mantenimiento-avisos-nuevo`.
- Proyecto Supabase: `knpvuiamdbnbrkwmoxqf`.
- Edge Function: `submit-maintenance-incident` (la documentación del repo indica versión 4).
- Adjuntos: solo Google Drive; no usar Supabase Storage para este flujo.
- Código del Worker de aplicación: `cloudflare/servicio-tecnico-mantenimiento.js`.
- Formulario/pasarela: `cloudflare/mantenimiento-avisos-nuevo.js`.
- Función de avisos: `supabase/functions/submit-maintenance-incident/index.ts`.

## Datos/estado que constan en las notas del proyecto
- 13 locales activos.
- La nota de producción del 12/10 registra 10 avisos, 0 adjuntos en la tabla de adjuntos, 0 equipos y 0 intervenciones. Otra nota anterior contiene conteos distintos; volver a consultar Supabase antes de tomar estos números como estado actual.
- El formulario público valida campos y adjuntos (máximo 5 archivos, 25 MB cada uno, fotos/vídeos) y delega el alta del aviso a Supabase; los archivos se suben después a Google Drive.
- El módulo de intervenciones consulta `sites` y `equipment` con el cliente Supabase y guarda en `equipment_maintenance_records`.

## Problema pendiente principal: fichas de locales
No está demostrado aún el origen exacto del fallo al crear/añadir fichas. Debe aislarse si el problema ocurre en:
1. inserción de un registro en `sites` (formulario de alta del local);
2. permisos/RLS o perfil de administrador;
3. actualización de la interfaz tras guardar;
4. navegación y carga de `/local` con el identificador correcto;
5. carga de equipos, avisos o permisos asociados al local.

No asumir que es un fallo visual ni modificar políticas de seguridad para “hacerlo funcionar” sin comprobar el error real. Capturar el mensaje de Supabase y correlacionarlo con logs.

## Otros riesgos ya documentados
- La subida real a Google Drive no quedó confirmada en la última revisión.
- La Edge Function de avisos usa una cabecera CORS fija para el dominio antiguo, aunque admite una lista de orígenes; revisar si hay llamadas directas desde navegador.
- La ficha de local debe mostrar errores explícitos de consulta y no dejar contadores vacíos/indefinidos.
- No guardar secretos, tokens OAuth ni claves service-role en GitHub.

## Skills y herramientas: selección compatible
### Del paquete Vercel Agent Skills adjunto
- `react-best-practices`: útil solo si se identifica código React/Next.js. El Worker revisado sirve HTML/JavaScript incrustado, así que no aplicarlo como refactor general.
- `composition-patterns`: orientado a arquitectura de componentes React; no es prioridad para el fallo actual.
- `web-design-guidelines`: útil más adelante para revisar accesibilidad, formularios, mensajes de error y uso móvil, pero no resuelve por sí solo la inserción/RLS.
- `deploy-to-vercel` y `vercel-optimize`: no son el camino de despliegue actual; la aplicación está en Cloudflare Workers y Supabase. No migrar a Vercel por instalar estas skills.
### Skills que sí encajan con la arquitectura
- Supabase skill: investigar Auth, permisos, RLS, consultas y validar cada cambio.
- Cloudflare Workers best practices / Wrangler: revisar el Worker y sus bindings, secretos y observabilidad antes de desplegar.
- Pruebas de regresión enfocadas en alta de local, lectura de ficha, alta de equipo y alta de aviso.

Las skills son instrucciones para agentes de desarrollo; tener el ZIP no las instala automáticamente dentro de ChatGPT ni ejecuta sus comprobaciones. Se pueden consultar y usar como criterios de revisión, y versionar en el repositorio únicamente las instrucciones que realmente se necesiten.

## Plan de trabajo obligatorio
1. Comparar `main` con la rama de auditoría y recuperar el último estado coherente antes de tocar código.
2. Consultar el esquema real de `sites`, sus políticas RLS, triggers y funciones relacionadas con el alta; revisar también el rol y los permisos del usuario autenticado.
3. Inspeccionar el manejador exacto del formulario de alta de local y comprobar qué respuesta recibe de Supabase.
4. Reproducir el error con una sesión autorizada y datos de prueba identificables; no borrar registros existentes.
5. Corregir en rama aislada y añadir una prueba que cubra el fallo.
6. Verificar: crear local, verlo en el listado, abrir su ficha, cargar equipos/avisos y comprobar que un usuario sin permisos no puede crear ni modificar locales.
7. Revisar logs y asesores de seguridad de Supabase. Desplegar solo tras superar las pruebas y confirmar que los secretos/bindings están configurados.

## Estado al cerrar esta revisión
- Se ha localizado el repositorio principal y confirmado el historial de restauración/correcciones del Worker.
- Se han leído el README, las notas de estado, el formulario público y partes relevantes del Worker de aplicación.
- No se ha reproducido todavía el fallo con una sesión autenticada y no se ha desplegado ni modificado código de producción.
