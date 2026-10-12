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


## Revisión y correcciones — 12/10/2026
- Worker `servicio-tecnico-mantenimiento` desplegado con mensajes visibles para los casos de sesión ausente e identificador de local ausente en `/local`.
- En la ficha del local, cada aviso se puede expandir para leer título, descripción y persona que lo comunicó.
- En el panel principal, cada aviso se puede expandir para ver descripción, persona, teléfono y categoría.
- Worker `mantenimiento-avisos-nuevo` actualizado con el logo original SIGANBALANDO GROUP centrado sobre fondo blanco y validación previa de máximo 5 archivos, 25 MB por archivo y tipos MIME admitidos.
- Se preservaron `global_fetch_strictly_public`, el binding `DRIVE_KV` y los secretos OAuth `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
- No se borraron registros. Conteo consultado: 13 locales, 10 avisos, 0 adjuntos registrados en la tabla `attachments`, 0 equipos y 0 intervenciones.
- Cloudflare acepta los despliegues y no devuelve incidencias registradas en Observability; la prueba real de navegación y subida de archivos aún debe hacerse desde el navegador.

- La ficha del local consulta los adjuntos directamente en Google Drive mediante un endpoint protegido: valida sesión Supabase y exige perfil administrador; la búsqueda se agrupa para evitar una llamada por aviso.

- La subida interna a Drive está protegida por un secreto compartido entre los dos Workers, almacenado exclusivamente en secretos de Cloudflare.
- La consulta de archivos en Drive se valida con sesión Supabase y perfil `admin`; la ficha agrupa la consulta para evitar una llamada de OAuth por cada aviso.

- Los errores al consultar los adjuntos de Drive ahora se muestran en la ficha en lugar de confundirse con una carpeta sin archivos.


## Acceso privado y control de avisos — 12/10/2026
- Se desplegó registro con código de invitación de un solo uso, validado en Supabase y exigido también por el trigger de alta. El registro directo sin código válido se rechaza en base de datos.
- El administrador genera códigos desde el panel, asignando un local y el perfil Observación (solo lectura) o Técnico (gestión del local). Caducidad configurable de 1 a 30 días, siete por defecto.
- Los códigos se almacenan como hash y se consumen al registrarse; el alta crea automáticamente el perfil y el permiso para el local seleccionado.
- Se retiró la excepción de alta de administrador por correo; el perfil de administrador existente no se modifica.
- Se añadió eliminación de avisos en el panel y ficha, visible solo para el administrador, y política RLS de borrado exclusivo para administradores.
- La ficha muestra errores de consulta de local, equipos y avisos en vez de dejar contadores indefinidos; se corrigió la construcción de la fila de eliminación en la ficha.
- La ruta `/aviso` continúa siendo un formulario público separado para comunicar incidencias sin entrar al panel privado.

- Los informes globales requieren perfil administrador para evitar que una cuenta de observación acceda a agregados de otros locales.
- La ficha del local muestra mensajes concretos de error para consultas de local/equipos/avisos y ofrece eliminación administrativa de avisos.
