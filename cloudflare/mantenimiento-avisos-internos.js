export default {
 async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname === "/health") return Response.json({ok:true,service:"avisos-internos"});
  if (url.pathname !== "/" && url.pathname !== "/index.html") return new Response("No encontrado",{status:404});
  return new Response(PAGE,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
 }
};
const PAGE = String.raw`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#174b38"><title>Avisos internos · Servicio Técnico</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root{font-family:Inter,system-ui,-apple-system,sans-serif;color:#172b24;background:#f3f7f4}*{box-sizing:border-box}body{margin:0}.top{background:#174b38;color:white;padding:20px max(16px,calc((100% - 1100px)/2));display:flex;align-items:center;justify-content:space-between;gap:12px}.top h1{margin:0;font-size:22px}.top p{margin:5px 0 0;color:#d9e9df;font-size:13px}.wrap{max-width:1100px;margin:22px auto;padding:0 16px}.card{background:white;border:1px solid #dce7df;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 2px 8px #143b2408}h2{font-size:18px;margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.field label{display:block;font-size:13px;font-weight:650;margin:0 0 6px;color:#385246}.field input,.field select,.field textarea,.filters select{width:100%;border:1px solid #cbd9d0;border-radius:9px;padding:11px;background:#fff;color:#172b24;font:inherit}.field textarea{min-height:90px;resize:vertical}.full{grid-column:1/-1}button{border:0;border-radius:9px;padding:11px 15px;font:600 14px system-ui;cursor:pointer;background:#174b38;color:white}button.secondary{background:#e7f0e9;color:#174b38}button:disabled{opacity:.5;cursor:wait}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.hidden{display:none!important}.muted{color:#62756a;font-size:13px}.message{padding:11px 13px;border-radius:9px;background:#e6f3e9;color:#174b38;margin:10px 0}.error{background:#fae8e5;color:#842f24}.filters{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin-bottom:14px}.notice{border:1px solid #dce7df;border-radius:11px;padding:14px;margin:10px 0}.notice h3{font-size:16px;margin:0 0 6px}.notice p{margin:6px 0;white-space:pre-wrap}.pill{display:inline-block;border-radius:30px;background:#e7f0e9;color:#174b38;padding:4px 9px;font-size:12px;font-weight:700}.pill.urgent,.pill.high{background:#fae8e5;color:#842f24}.noticefoot{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:10px}.login{max-width:430px;margin:36px auto}.statusselect{width:auto!important;padding:7px!important}.top button{background:#fff;color:#174b38}@media(max-width:650px){.grid,.filters{grid-template-columns:1fr}.top{align-items:flex-start}.top h1{font-size:19px}.noticefoot{align-items:flex-start;flex-direction:column}.full{grid-column:auto}}
</style></head><body>
<header class="top"><div><h1>🔧 Avisos internos</h1><p>Servicio Técnico · Incidencias vinculadas a locales y equipos</p></div><button id="logout" class="hidden">Cerrar sesión</button></header>
<main class="wrap">
<section id="login" class="card login"><h2>Acceso técnico</h2><p class="muted">Entra con tu cuenta habitual de la aplicación de mantenimiento.</p><div id="loginMsg" class="message hidden"></div><form id="loginForm" class="grid"><div class="field full"><label for="email">Correo electrónico</label><input id="email" type="email" autocomplete="username" required></div><div class="field full"><label for="password">Contraseña</label><input id="password" type="password" autocomplete="current-password" required></div><div class="full"><button id="loginBtn" type="submit">Iniciar sesión</button></div></form></section>
<section id="app" class="hidden">
<div class="card"><div class="row" style="justify-content:space-between"><div><h2>Nuevo aviso interno</h2><p class="muted">Elige un local y, si lo sabes, el equipo afectado. El aviso aparecerá en el historial relacionado.</p></div></div><div id="formMsg" class="message hidden"></div>
<form id="noticeForm" class="grid">
<div class="field"><label for="site">Local *</label><select id="site" required><option value="">Cargando locales…</option></select></div>
<div class="field"><label for="equipment">Equipo (opcional)</label><select id="equipment"><option value="">Sin equipo concreto</option></select></div>
<div class="field full"><label for="title">Título del aviso *</label><input id="title" maxlength="180" required placeholder="Ej. Frigorífico no enfría"></div>
<div class="field full"><label for="description">Descripción *</label><textarea id="description" required placeholder="Qué ocurre, desde cuándo y cualquier detalle útil"></textarea></div>
<div class="field"><label for="category">Tipo</label><select id="category"><option value="averia">Avería</option><option value="revision">Revisión</option><option value="preventivo">Mantenimiento preventivo</option><option value="seguimiento">Seguimiento</option><option value="otro">Otro</option></select></div>
<div class="field"><label for="priority">Prioridad</label><select id="priority"><option value="normal">Normal</option><option value="low">Baja</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></div>
<div class="full"><button id="createBtn" type="submit">Guardar aviso</button></div>
</form></div>
<div class="card"><h2>Listado de avisos</h2><div class="filters"><input id="search" placeholder="Buscar por título, local o equipo"><select id="statusFilter"><option value="">Todos los estados</option><option value="new">Nuevo</option><option value="triaged">Pendiente</option><option value="scheduled">Programado</option><option value="in_progress">En curso</option><option value="waiting_parts">Esperando material</option><option value="resolved">Resuelto</option><option value="closed">Cerrado</option><option value="cancelled">Cancelado</option></select><select id="siteFilter"><option value="">Todos los locales</option></select></div><div id="listMsg" class="message hidden"></div><div id="noticeList"><p class="muted">Cargando avisos…</p></div></div>
</section></main>
<script>
const SUPABASE_URL="https://knpvuiamdbnbrkwmoxqf.supabase.co";
const SUPABASE_KEY="sb_publishable_Q2_U354U7Wm5TSGVDH0Tiw_h0eP-nXX";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let currentUser=null, currentProfile=null, sites=[], equipment=[], incidents=[];
const $=id=>document.getElementById(id);
const labels={new:"Nuevo",triaged:"Pendiente",scheduled:"Programado",in_progress:"En curso",waiting_parts:"Esperando material",resolved:"Resuelto",closed:"Cerrado",cancelled:"Cancelado"};
const statusOptions=Object.entries(labels).map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join("");
function show(id,text,isError=false){const e=$(id);e.textContent=text;e.classList.remove("hidden","error");if(isError)e.classList.add("error")}
function hide(id){$(id).classList.add("hidden")}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function date(s){if(!s)return "—";try{return new Date(s).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}catch{return s}}
async function startSession(user){
 currentUser=user;
 const p=await db.from("profiles").select("id,full_name,role,active").eq("id",user.id).maybeSingle();
 if(p.error) throw p.error;
 if(!p.data||!p.data.active) throw new Error("La cuenta no tiene un perfil activo en la aplicación.");
 currentProfile=p.data;
 $("login").classList.add("hidden");$("app").classList.remove("hidden");$("logout").classList.remove("hidden");
 await loadReferenceData();await loadIncidents();
}
async function loadReferenceData(){
 const sr=await db.from("sites").select("id,name,code").eq("active",true).order("name");
 if(sr.error)throw sr.error;sites=sr.data||[];
 $("site").innerHTML='<option value="">Selecciona el local</option>'+sites.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join("");
 $("siteFilter").innerHTML='<option value="">Todos los locales</option>'+sites.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join("");
 const er=await db.from("equipment").select("id,site_id,name,category,brand,model").order("name");
 if(er.error)throw er.error;equipment=er.data||[];
 await loadEquipment();
}
async function loadEquipment(){
 const siteId=$("site").value;
 const forSite=siteId?equipment.filter(e=>e.site_id===siteId):[];
 $("equipment").innerHTML='<option value="">Sin equipo concreto</option>'+forSite.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+(e.category?" · "+esc(e.category):"")+'</option>').join("");
}
async function loadIncidents(){
 $("noticeList").innerHTML='<p class="muted">Cargando avisos…</p>';
 let q=db.from("incidents").select("id,site_id,equipment_id,title,description,category,priority,status,source,reported_by_name,created_at,updated_at,resolved_at,internal_notes").order("created_at",{ascending:false}).limit(300);
 if($("statusFilter").value)q=q.eq("status",$("statusFilter").value);
 if($("siteFilter").value)q=q.eq("site_id",$("siteFilter").value);
 const r=await q;if(r.error)throw r.error;incidents=r.data||[];renderIncidents();
}
function renderIncidents(){
 const term=$("search").value.trim().toLocaleLowerCase("es");
 const list=incidents.filter(i=>{const s=sites.find(x=>x.id===i.site_id)?.name||"";const e=equipment.find(x=>x.id===i.equipment_id)?.name||"";return !term||(i.title+" "+i.description+" "+s+" "+e).toLocaleLowerCase("es").includes(term)});
 if(!list.length){$("noticeList").innerHTML='<p class="muted">No hay avisos que coincidan con los filtros.</p>';return}
 $("noticeList").innerHTML=list.map(i=>{
  const site=sites.find(s=>s.id===i.site_id)?.name||"Local";const eq=equipment.find(e=>e.id===i.equipment_id)?.name||"Sin equipo asignado";
  const done=["resolved","closed","cancelled"].includes(i.status);
  return '<article class="notice"><div class="row" style="justify-content:space-between"><span class="pill '+esc(i.priority)+'">'+esc(({low:"Baja",normal:"Normal",high:"Alta",urgent:"Urgente"})[i.priority]||i.priority)+'</span><span class="muted">'+esc(date(i.created_at))+'</span></div><h3 style="margin-top:10px">'+esc(i.title)+'</h3><p class="muted">'+esc(site)+' · '+esc(eq)+'</p><p>'+esc(i.description)+'</p>'+(i.internal_notes?'<p class="muted"><b>Notas:</b> '+esc(i.internal_notes)+'</p>':'')+'<div class="noticefoot"><div class="row"><select aria-label="Estado del aviso" class="statusselect" data-status="'+esc(i.id)+'">'+statusOptions.replace('value="'+esc(i.status)+'"','value="'+esc(i.status)+'" selected')+'</select><button class="secondary" data-save="'+esc(i.id)+'">Guardar estado</button></div>'+(!done?'<button data-complete="'+esc(i.id)+'">Registrar reparación y cerrar</button>':'<span class="pill">'+esc(labels[i.status]||i.status)+'</span>')+'</div></article>'
 }).join("");
 $("noticeList").querySelectorAll("[data-save]").forEach(b=>b.onclick=()=>saveStatus(b.dataset.save));
 $("noticeList").querySelectorAll("[data-complete]").forEach(b=>b.onclick=()=>completeIncident(b.dataset.complete));
}
async function saveStatus(id){
 const sel=$("noticeList").querySelector('[data-status="'+id+'"]');if(!sel)return;
 const r=await db.from("incidents").update({status:sel.value,updated_at:new Date().toISOString(),...(sel.value==="resolved"||sel.value==="closed"?{resolved_at:new Date().toISOString()}:{})}).eq("id",id);
 if(r.error){show("listMsg","No se pudo actualizar el estado: "+r.error.message,true);return}
 show("listMsg","Estado actualizado.");await loadIncidents();
}
async function completeIncident(id){
 const incident=incidents.find(x=>x.id===id);if(!incident)return;
 const work=prompt("Trabajo realizado (obligatorio):");if(work===null)return;if(!work.trim()){show("listMsg","Indica el trabajo realizado para cerrar el aviso.",true);return}
 const parts=prompt("Repuestos o materiales utilizados (opcional):","");if(parts===null)return;
 const costText=prompt("Coste en euros (opcional, deja vacío si no procede):","");if(costText===null)return;
 let cost=null;if(costText.trim()){cost=Number(costText.replace(",","."));if(!Number.isFinite(cost)||cost<0){show("listMsg","El coste debe ser un número igual o mayor que cero.",true);return}}
 const now=new Date().toISOString();
 const ir=await db.from("interventions").insert({incident_id:id,technician_id:currentUser.id,started_at:now,ended_at:now,work_performed:work.trim(),parts_used:parts.trim()||null,cost,follow_up_required:false});
 if(ir.error){show("listMsg","No se guardó la reparación y el aviso sigue sin cerrar: "+ir.error.message,true);return}
 const notes=[incident.internal_notes,"Trabajo realizado: "+work.trim(),parts.trim()?"Materiales: "+parts.trim():null,cost!==null?"Coste: "+cost.toFixed(2)+" €":null].filter(Boolean).join("\n");
 const ur=await db.from("incidents").update({status:"resolved",resolved_at:now,updated_at:now,internal_notes:notes}).eq("id",id);
 if(ur.error){show("listMsg","La intervención se guardó, pero no se pudo cerrar el aviso. Actualiza el estado manualmente: "+ur.error.message,true);return}
 show("listMsg","Reparación guardada y aviso resuelto. El historial del equipo conserva el aviso y la intervención.");await loadIncidents();
}
$("loginForm").addEventListener("submit",async ev=>{ev.preventDefault();$("loginBtn").disabled=true;hide("loginMsg");try{const r=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(r.error)throw r.error;await startSession(r.data.user)}catch(e){show("loginMsg",e.message||"No se pudo iniciar sesión.",true)}finally{$("loginBtn").disabled=false}});
$("logout").onclick=async()=>{await db.auth.signOut();location.reload()};
$("site").addEventListener("change",()=>loadEquipment().catch(e=>show("formMsg",e.message,true)));
$("noticeForm").addEventListener("submit",async ev=>{
 ev.preventDefault();$("createBtn").disabled=true;hide("formMsg");
 const siteId=$("site").value;const title=$("title").value.trim();const description=$("description").value.trim();
 if(!siteId||!title||!description){show("formMsg","Completa el local, el título y la descripción.",true);$("createBtn").disabled=false;return}
 const payload={site_id:siteId,equipment_id:$("equipment").value||null,title,description,category:$("category").value,priority:$("priority").value,status:"new",source:"staff",reported_by_name:currentProfile.full_name||currentUser.email,created_by:currentUser.id};
 const r=await db.from("incidents").insert(payload);
 if(r.error){show("formMsg","No se pudo guardar el aviso: "+r.error.message,true)}else{$("noticeForm").reset();await loadEquipment();show("formMsg","Aviso interno guardado. Ya está vinculado al local y al equipo seleccionado.");await loadIncidents()}
 $("createBtn").disabled=false;
});
$("search").addEventListener("input",renderIncidents);
$("statusFilter").addEventListener("change",()=>loadIncidents().catch(e=>show("listMsg",e.message,true)));
$("siteFilter").addEventListener("change",()=>loadIncidents().catch(e=>show("listMsg",e.message,true)));
(async()=>{const s=await db.auth.getSession();if(s.data.session){try{await startSession(s.data.session.user)}catch(e){show("loginMsg",e.message||"No se pudo cargar la aplicación.",true)}}})();
</script></body></html>`;
