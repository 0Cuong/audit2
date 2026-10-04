const tables=["couple_profile","timeline_events","memories","love_letters","journal_entries","mood_entries","bucket_list_items","anniversaries","map_locations","songs","gifts","messages","settings","user_personalization","user_workspaces","user_custom_pages","user_assets","user_saved_views","user_rules","user_presets","user_config_revisions"];
const buckets=["avatars","memories","photos","assets"];
const supabaseUrl=(process.env.SUPABASE_URL||"").replace(/\/+$/,"");
const anonKey=process.env.SUPABASE_ANON_KEY||"";
const target=(process.env.TARGET_API_URL||"").replace(/\/+$/,"");
const secret=process.env.IMPORT_SECRET||"";
if(!supabaseUrl||!anonKey||!target||!secret){throw new Error("Set SUPABASE_URL, SUPABASE_ANON_KEY, TARGET_API_URL and IMPORT_SECRET");}
const headers={apikey:anonKey,Authorization:"Bearer "+anonKey};

async function getRows(table){
  const all=[]; const size=1000;
  for(let offset=0;;offset+=size){
    const u=new URL(supabaseUrl+"/rest/v1/"+table);
    u.searchParams.set("select","*");u.searchParams.set("limit",String(size));u.searchParams.set("offset",String(offset));
    const r=await fetch(u,{headers}); if(!r.ok)throw new Error(table+" "+r.status+" "+await r.text());
    const batch=await r.json(); if(!batch.length)break; all.push(...batch); if(batch.length<size)break;
  } return all;
}
async function importTable(table){
  const rows=await getRows(table);
  if(!rows.length){console.log(table+": 0");return;}
  const r=await fetch(target+"/api/admin/import/table",{method:"POST",headers:{"content-type":"application/json","X-Import-Secret":secret},body:JSON.stringify({table,rows})});
  if(!r.ok)throw new Error("Import "+table+" failed: "+await r.text());
  console.log(table+": "+rows.length);
}
async function listObjects(bucket){
  const all=[]; const size=1000;
  for(let offset=0;;offset+=size){
    const r=await fetch(supabaseUrl+"/storage/v1/object/list/"+encodeURIComponent(bucket),{method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify({prefix:"",limit:size,offset,sortBy:{column:"name",order:"asc"}})});
    if(!r.ok){console.warn(bucket+": list failed "+r.status);return [];}
    const batch=await r.json();if(!batch.length)break;all.push(...batch.filter(x=>x?.name));if(batch.length<size)break;
  }return all;
}
async function importBucket(bucket){
  for(const item of await listObjects(bucket)){
    const path=item.name;
    const source=supabaseUrl+"/storage/v1/object/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/");
    const r=await fetch(source,{headers});if(!r.ok){console.warn("skip "+bucket+"/"+path);continue;}
    const form=new FormData();form.append("bucket",bucket);form.append("path",path);form.append("file",new Blob([await r.arrayBuffer()],{type:r.headers.get("content-type")||"application/octet-stream"}),path.split("/").pop()||"file");
    const up=await fetch(target+"/api/admin/import/storage",{method:"POST",headers:{"X-Import-Secret":secret},body:form});
    if(!up.ok)console.warn("upload failed "+bucket+"/"+path);else console.log("uploaded "+bucket+"/"+path);
  }
}
for(const table of tables)await importTable(table);
if(process.env.SKIP_STORAGE!=="1")for(const bucket of buckets)await importBucket(bucket);
console.log("Migration complete.");