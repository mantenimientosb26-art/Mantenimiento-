import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://servicio-tecnico-mantenimiento.servicio-tecnico-mantenimiento.workers.dev", "https://mantenimiento-avisos-nuevo.servicio-tecnico-mantenimiento.workers.dev"]);
const APP_ORIGIN = "https://servicio-tecnico-mantenimiento.servicio-tecnico-mantenimiento.workers.dev";
const corsHeaders = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const allowedTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
  "video/mp4", "video/quicktime", "video/webm",
]);
const maxFileBytes = 25 * 1024 * 1024;
const maxFiles = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origen no permitido" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("submit-maintenance-incident: missing server environment");
    return json({ error: "Configuración del servidor incompleta. El aviso no se ha guardado; informa al administrador." }, 500);
  }
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const form = await req.formData();
    const siteId = String(form.get("site_id") ?? "");
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const reportedBy = String(form.get("reported_by_name") ?? "").trim();
    const phone = String(form.get("reported_by_phone") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const priority = String(form.get("priority") ?? "normal");

    if (!siteId || title.length < 4 || title.length > 160 || description.length < 10 || description.length > 5000 || reportedBy.length < 2 || reportedBy.length > 120 || phone.length > 40) {
      return json({ error: "Revisa el local, asunto, descripción, nombre y teléfono." }, 400);
    }
    if (!["low", "normal", "high", "urgent"].includes(priority)) return json({ error: "Prioridad no válida." }, 400);

    const allowedSiteIds = new Set(["59935291-1615-4919-ac36-aa7f1753be2e","ea93cc19-4fca-4e1a-9a54-d809e7142739","b282a1b5-7f31-487b-a291-2ff478e2220c","9f6beb10-52cf-4fbf-ae8f-78bf972b393f","07474a45-fcc1-4f62-a476-b42ea417f486","75942f0b-de2b-4aaa-b4d4-d2d3a56896c5","73e0f3ee-5a8b-4ba7-b561-c755bf3dec57","eebc7258-246a-4a9d-a2d5-8b3bdad0ca8d","a4d8d663-b8d4-4413-9d89-3ad840ae8254","468203ac-d131-4474-aebd-d21f1d510ad3","6c3c9a85-b749-4f96-b139-04ca74f37651","e4f9e376-1ac0-4c5e-81ef-969e0b31a54e","e6f36114-4726-4401-9201-1a7c2ac21b54"]);
    if (!allowedSiteIds.has(siteId)) return json({ error: "Selecciona un local válido." }, 400);

    const files = form.getAll("files").filter((v): v is File => v instanceof File && v.size > 0);
    if (files.length > maxFiles) return json({ error: "Puedes adjuntar un máximo de 5 archivos." }, 400);
    for (const file of files) {
      if (!allowedTypes.has(file.type) || file.size > maxFileBytes) {
        return json({ error: "Archivo no permitido. Usa imágenes o vídeos admitidos de hasta 25 MB cada uno." }, 400);
      }
    }

    const { data: incident, error: incidentError } = await sb.from("incidents").insert({
      site_id: siteId, title, description, reported_by_name: reportedBy,
      reported_by_phone: phone || null, category: category || null, priority, status: "new", source: "form",
    }).select("id").single();

    if (incidentError || !incident) {
      console.error("submit-maintenance-incident: incident insert failed", incidentError?.message ?? "no row returned");
      return json({ error: "No se pudo registrar el aviso. No vuelvas a enviarlo varias veces; informa al administrador." }, 500);
    }

    // Los archivos se guardan exclusivamente en Google Drive mediante el Worker.
    // Esta función solo registra los datos del aviso en Supabase.
    return json({
      ok: true,
      incident_id: incident.id,
      attachment_count: 0,
      warning: null,
    });
  } catch (error) {
    console.error("submit-maintenance-incident: request processing failed", error instanceof Error ? error.message : String(error));
    return json({ error: "No se pudo procesar la solicitud. El aviso puede no haberse guardado; revisa los datos e inténtalo una sola vez." }, 400);
  }
});