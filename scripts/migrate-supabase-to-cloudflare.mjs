const tables=["couple_profile","timeline_events","memories","love_letters","journal_entries","mood_entries","bucket_list_items","anniversaries","map_locations","songs","gifts","messages","settings","user_personalization","user_workspaces","user_custom_pages","user_assets","user_saved_views","user_rules","user_presets","user_config_revisions"];
const buckets=["avatars","memories","photos","assets"];

const supabaseUrl=(process.env.SUPABASE_URL||"").replace(/\/+$/,"");
const supabaseKey=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||"";
const target=(process.env.TARGET_API_URL||"").replace(/\/+$/,"");
const secret=process.env.IMPORT_SECRET||"";

if(!supabaseUrl||!supabaseKey||!target||!secret){throw new Error("Set SUPABASE_URL, SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY), TARGET_API_URL and IMPORT_SECRET");}
const headers={apikey:supabaseKey,Authorization:"Bearer "+supabaseKey};

async function expectOk(response,label){
  if(response.ok)return;
  const body=await response.text().catch(()=> "");
  throw new Error(label+" failed with HTTP "+response.status+(body?" — "+body.slice(0,500):""));
}

async function verifyTarget(){
  const r=await fetch(target+"/api/health");
  await expectOk(r,"Cloudflare health check");
  const body=await r.json().catch(()=>null);
  if(!body?.ok)throw new Error("Cloudflare health endpoint did not report ok=true");
}

async function getRows(table){
  const all=[];const size=1000;
  for(let offset=0;;offset+=size){
    const u=new URL(supabaseUrl+"/rest/v1/"+table);
    u.searchParams.set("select","*");u.searchParams.set("limit",String(size));u.searchParams.set("offset",String(offset));
    const r=await fetch(u,{headers});await expectOk(r,"Read "+table);
    const batch=await r.json();
    if(!Array.isArray(batch))throw new Error("Read "+table+" returned a non-array payload");
    if(!batch.length)break;all.push(...batch);if(batch.length<size)break;
  }
  return all;
}

async function importTable(table){
  const rows=await getRows(table);
  const r=await fetch(target+"/api/admin/import/table",{method:"POST",headers:{"content-type":"application/json","X-Import-Secret":secret},body:JSON.stringify({table,rows})});
  await expectOk(r,"Import "+table);
  console.log(table+": "+rows.length);
  return rows.length;
}

async function listObjects(bucket){
  const all=[];const size=1000;
  for(let offset=0;;offset+=size){
    const r=await fetch(supabaseUrl+"/storage/v1/object/list/"+encodeURIComponent(bucket),{method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify({prefix:"",limit:size,offset,sortBy:{column:"name",order:"asc"}})});
    await expectOk(r,"List storage bucket "+bucket);
    const batch=await r.json();
    if(!Array.isArray(batch))throw new Error("List "+bucket+" returned a non-array payload");
    if(!batch.length)break;all.push(...batch.filter(x=>x?.name));if(batch.length<size)break;
  }
  return all;
}

async function importBucket(bucket){
  const objects=await listObjects(bucket);let imported=0;
  for(const item of objects){
    const path=item.name;
    const source=supabaseUrl+"/storage/v1/object/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/");
    const r=await fetch(source,{headers});await expectOk(r,"Read storage object "+bucket+"/"+path);
    const form=new FormData();
    form.append("bucket",bucket);form.append("path",path);
    form.append("file",new Blob([await r.arrayBuffer()],{type:r.headers.get("content-type")||"application/octet-stream"}),path.split("/").pop()||"file");
    const up=await fetch(target+"/api/admin/import/storage",{method:"POST",headers:{"X-Import-Secret":secret},body:form});
    await expectOk(up,"Import storage object "+bucket+"/"+path);
    imported++;console.log("uploaded "+bucket+"/"+path);
  }
  console.log(bucket+": "+imported);return imported;
}

await verifyTarget();
const tableCounts={};for(const table of tables)tableCounts[table]=await importTable(table);
const storageCounts={};if(process.env.SKIP_STORAGE!=="1")for(const bucket of buckets)storageCounts[bucket]=await importBucket(bucket);
console.log(JSON.stringify({ok:true,tableCounts,storageCounts},null,2));
