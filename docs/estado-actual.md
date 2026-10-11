# Estado técnico — 11/10/2026

## Recursos
- Worker formulario: `mantenimiento-avisos-nuevo`
- Worker Drive/OAuth: `servicio-tecnico-mantenimiento`
- Supabase: `knpvuiamdbnbrkwmoxqf`
- Edge Function: `submit-maintenance-incident` versión 4
- Locales: 13

## Hallazgos
- La función acepta POST multipart/form-data, valida los 13 IDs de local y los campos, e inserta en `public.incidents` con `status = new` y `source = form`.
- La función declara los adjuntos como responsabilidad del Worker y responde `attachment_count: 0`; los archivos no se guardan en Supabase Storage.
- El Worker del formulario hace la llamada a Supabase y después intenta subir archivos al endpoint `/google-drive/upload` del Worker de Drive.
- El endpoint de Drive crea una carpeta por aviso y sube los archivos a Google Drive usando un refresh token guardado en KV.
- Estado actual de las tablas consultadas: sites=13, incidents=0, attachments=0, equipment=0, interventions=0.

## Lo que NO está confirmado
- No se ha demostrado que un aviso real se inserte correctamente desde el formulario público.
- No se ha demostrado que las fotos/vídeos terminen en Drive.
- No se debe comunicar al usuario final que está arreglado hasta superar ambas pruebas.

## Próximas verificaciones
1. Consultar logs de la Edge Function usando los campos correctos del esquema de logs.
2. Comprobar en SQL el enum de estado/prioridad y las políticas/triggers asociados a `incidents`.
3. Ejecutar una prueba controlada con datos de prueba, comprobar que aparece el registro y retirarlo solo si se identifica inequívocamente como prueba.
4. Probar la subida de un archivo pequeño y comprobar carpeta/archivo en Drive.
5. Ajustar CORS si se hacen llamadas desde navegador; actualmente el origen permitido en cabecera es el Worker antiguo.
