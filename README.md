# Servicio Técnico Mantenimiento

Repositorio de recuperación y control de versiones de la aplicación de avisos de mantenimiento para 13 locales.

## Arquitectura actual (verificada el 11/10/2026)
- Cloudflare Worker público: `mantenimiento-avisos-nuevo` (formulario y pasarela de avisos).
- Cloudflare Worker de Google Drive: `servicio-tecnico-mantenimiento` (OAuth y ruta `/google-drive/upload`).
- Supabase project ref: `knpvuiamdbnbrkwmoxqf` (datos de aplicación y avisos).
- Supabase Edge Function: `submit-maintenance-incident`, versión 4.
- Adjuntos: requisito del proyecto: **solo Google Drive**, nunca Supabase Storage.

## Estado de producción comprobado (12/10/2026)
- 13 locales activos en `public.sites`.
- 10 avisos, 0 adjuntos registrados, 0 equipos y 0 intervenciones en la base de datos.
- El panel se ha actualizado para abrir los avisos del listado mediante detalles desplegables y para mostrar mensajes claros en la ficha del local si falta sesión o identificador.
- El formulario público incluye el logotipo original SIGANBALANDO GROUP centrado sobre fondo blanco y valida en cliente el número, tipo y tamaño de los adjuntos.
- El Worker del formulario reenvía los campos a la función Supabase y, si hay archivos, intenta subirlos a Google Drive a través del Worker de Drive.
- La función Supabase actual registra únicamente el aviso y no sube archivos a Storage.
- El formulario muestra confirmación tras guardar el aviso y advierte si la subida de adjuntos falla.

## Pendientes / riesgos conocidos
1. La inserción de avisos debe validarse de extremo a extremo con una nueva prueba controlada; hay 10 registros existentes y no se han eliminado.
2. La subida a Google Drive debe validarse con un nuevo envío con adjunto; no se ha confirmado desde esta revisión.
3. Revisar los logs de `submit-maintenance-incident` y probar la inserción con un aviso controlado antes de declarar resuelto el formulario.
4. Revisar las cabeceras CORS de la función; `Access-Control-Allow-Origin` está fijado al dominio antiguo aunque la lista de orígenes admite el Worker nuevo. El Worker llama a la función desde servidor, pero esto puede afectar a llamadas directas desde navegador.
5. No guardar tokens, secretos de OAuth, service-role keys ni credenciales en este repositorio. Las credenciales permanecen en secretos de Cloudflare/Supabase.

## Contenido de este repositorio
- `cloudflare/mantenimiento-avisos-nuevo.js`: copia del código desplegado del formulario/pasarela.
- `supabase/functions/submit-maintenance-incident/index.ts`: código desplegado de la función Supabase.
- `docs/estado-actual.md`: notas de arquitectura y verificación.

## Regla de despliegue
No desplegar cambios de producción hasta que el código se revise, se compruebe la configuración de secretos/bindings y se realice una prueba de envío sin adjuntos y otra con adjuntos. Nunca incluir secretos en commits.


### Seguridad añadida (12/10/2026)
- La subida interna a Google Drive exige un secreto compartido entre los dos Workers; el valor permanece en secretos de Cloudflare y no está en el repositorio.
- La consulta de adjuntos de Drive desde la ficha requiere sesión Supabase válida y perfil administrador, y se realiza en lote para evitar una llamada por aviso.
