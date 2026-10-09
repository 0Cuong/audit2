import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { matchRow, validateFilters, validateMutationFilters, resolveContainedPath } from './recovery-guards.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(root, 'recovered', 'database.json');
const storageRoot = path.join(root, 'recpvczpwybpbbntwnnk.storage (1)', 'recpvczpwybpbbntwnnk', 'memories');
const annRoot = path.join(root, 'recovered', 'anniversaries');
let db;
try {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!db || typeof db !== 'object' || !db.tables || typeof db.tables !== 'object') throw new Error('Invalid recovery database shape');
} catch (error) {
  if (error?.code !== 'ENOENT' && !/Invalid recovery database shape/.test(error?.message || '')) throw error;
  db = { source_backup: null, tables: {} };
  console.warn('[Recovery] Private recovered/database.json is missing. Starting in empty local mode; recovered user data has not been restored.');
}

function saveDb(){
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const tmpPath = dbPath + '.tmp';
  const serialized = JSON.stringify(db, null, 2);
  fs.writeFileSync(tmpPath, serialized, 'utf8');
  try {
    fs.renameSync(tmpPath, dbPath);
  } catch {
    // Windows may reject replacing an existing file with renameSync.
    fs.copyFileSync(tmpPath, dbPath);
    fs.unlinkSync(tmpPath);
  }
}
function tableRows(name){ return db.tables?.[name]?.rows || []; }
function setRows(name, rows){ if(!db.tables[name]) db.tables[name]={columns:Object.keys(rows[0]||{}),rows:[]}; db.tables[name].rows=rows; }

const BOOLEAN_COLUMNS = new Set([
  "is_completed","is_favorite","is_pinned","is_draft","is_locked","is_future","privacy_mode",
  "notifications_enabled","is_background","is_received","is_default","is_enabled"
]);
const JSON_COLUMNS = new Set([
  "photos","tags","contact_links","appearance","background","identity","navigation","blocks",
  "theme_override","background_override","navigation_override","filters","condition","action_payload",
  "identity_decoration","sample_blocks","snapshot"
]);

function normalizeMedia(row){
  const out={...row};
  for(const k of Object.keys(out)){
    if(BOOLEAN_COLUMNS.has(k)){
      if(out[k]==='t'||out[k]==='true'||out[k]===1||out[k]===true) out[k]=true;
      else if(out[k]==='f'||out[k]==='false'||out[k]===0||out[k]===false) out[k]=false;
    } else if(JSON_COLUMNS.has(k)){
      if(typeof out[k]==='string'){
        if(out[k]==='{}'||out[k]==='') out[k]=[];
        else { try { out[k]=JSON.parse(out[k]); } catch { out[k]=[]; } }
      }
    }
  }
  for(const k of ['url','photo_url','image_url','cover_url','partner1_avatar','partner2_avatar']){
    if(typeof out[k]==='string' && out[k].startsWith('https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/')){
      out[k]=out[k].replace('https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/','/api/media/');
    }
  }
  if(typeof out.photo_url==='string' && out.photo_url.startsWith('data:image/')){
    const id=out.id;
    const ext=out.photo_url.startsWith('data:image/webp') ? 'webp' : 'jpg';
    out.photo_url='/api/recovered/anniversaries/'+id+'.'+ext;
  }
  if(Array.isArray(out.photos)) out.photos=out.photos.map(x=>typeof x==='string'&&x.startsWith('https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/') ? x.replace('https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/','/api/media/') : x);
  return out;
}

function send(res,status,body,headers={}){ res.writeHead(status,{'content-type':'application/json; charset=utf-8',...headers}); res.end(JSON.stringify(body)); }
function mime(file){ const ext=path.extname(file).toLowerCase(); return ({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml'})[ext]||'application/octet-stream'; }

const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});
const api=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost:3000');
  if(u.pathname==='/api/health') return send(res,200,{ok:true,mode:'local-recovery',source:db.source_backup});
  if(u.pathname==='/api/recovery/summary') {
    const counts=Object.fromEntries(Object.entries(db.tables).map(([k,v])=>[k,v.rows?.length||0]));
    return send(res,200,{ok:true,source:db.source_backup,counts,totalRows:Object.values(counts).reduce((a,b)=>a+b,0)});
  }
  if(u.pathname.startsWith('/api/recovered/anniversaries/')){
    const name=path.basename(u.pathname);
    let file=resolveContainedPath(annRoot,name);
    if(!fs.existsSync(file)){
      const ext=path.extname(name).toLowerCase();
      const base=path.basename(name, ext);
      const altExt=ext==='.webp'?'.jpg':(ext==='.jpg'?'.webp':'');
      if(altExt){
        const altFile=resolveContainedPath(annRoot, base+altExt);
        if(fs.existsSync(altFile)) file=altFile;
      }
    }
    if(!fs.existsSync(file)) return send(res,404,{error:{message:'Recovered media not found'}});
    res.writeHead(200,{'content-type':mime(file),'cache-control':'no-cache'}); return fs.createReadStream(file).pipe(res);
  }
  if(u.pathname.startsWith('/api/media/')){
    let parts;
    try {
      parts = u.pathname.slice('/api/media/'.length).split('/').map((part) => decodeURIComponent(part));
    } catch {
      return send(res,400,{error:{message:'Invalid media path'}});
    }
    const bucket=parts.shift(), rel=parts.join('/');
    if(bucket!=='memories') return send(res,404,{error:{message:'Only recovered memories bucket is mounted'}});
    let file;
    try {
      file = resolveContainedPath(storageRoot, rel);
    } catch {
      return send(res,400,{error:{message:'Invalid media path'}});
    }
    if(!fs.existsSync(file)) return send(res,404,{error:{message:'Media not found',path:rel}});
    res.writeHead(200,{'content-type':mime(file),'cache-control':'no-cache'}); return fs.createReadStream(file).pipe(res);
  }
  if(u.pathname==='/api/data'){
    if(req.method==='GET') return send(res,200,{data:[],error:null});
    let raw=''; req.on('data',c=>raw+=c); req.on('end',()=>{
      try{
        const q=JSON.parse(raw||'{}');
        const name=q.table;
        const rows=tableRows(name);
        const columns=db.tables?.[name]?.columns || (rows[0] ? Object.keys(rows[0]) : []);
        if(q.action==='select'){
          const filters=validateFilters(q.filters, columns);
          let out=rows.filter(r=>matchRow(r,filters)).map(normalizeMedia);
          if(q.order?.column && !columns.includes(q.order.column)) throw new Error('Invalid order column: ' + q.order.column);
          if(q.order?.column) out.sort((a,b)=>{const av=a[q.order.column],bv=b[q.order.column]; return (av>bv?1:av<bv?-1:0)*(q.order.ascending===false?-1:1);});
          if(Number.isInteger(q.limit)) out=out.slice(0,q.limit);
          if(q.single==='single') return send(res,out.length===1?200:406,{data:out.length===1?out[0]:null,error:out.length===1?null:{message:'JSON object requested, multiple (or no) rows returned'}});
          if(q.single==='maybeSingle') return send(res,200,{data:out.length?out[0]:null,error:null});
          return send(res,200,{data:out,error:null});
        }
        if(['insert','upsert'].includes(q.action)){
          if(!db.tables?.[name]) throw new Error('Unknown recovery table: ' + name);
          const incoming=Array.isArray(q.data)?q.data:[q.data];
          if(!incoming.length || incoming.some((item) => !item || typeof item !== 'object')) throw new Error('Invalid insert payload');
          const conflict=q.onConflict||'id';
          if(!columns.includes(conflict)) throw new Error('Invalid conflict column: ' + conflict);
          for(const item of incoming){
            for(const key of Object.keys(item)) if(!columns.includes(key)) throw new Error('Invalid insert column: ' + key);
          }
          const next=[...rows];
          for(const item of incoming){
            const idx=next.findIndex(r=>r[conflict]===item[conflict]);
            if(q.action==='upsert'&&idx>=0) next[idx]={...next[idx],...item};
            else next.push(item);
          }
          setRows(name,next); saveDb();
          const inserted=next.filter((row) => incoming.some((item) => item[conflict]===row[conflict])).map(normalizeMedia);
          return send(res,200,{data:q.returnRows?(q.single==='single'?inserted[0]??null:inserted):null,error:null});
        }
        if(q.action==='update'||q.action==='delete'){
          const filters=validateMutationFilters(q.filters, columns, q.action);
          const selected=rows.filter(r=>matchRow(r,filters));
          if(q.action==='update') {
            const data=q.data && typeof q.data==='object' ? q.data : {};
            for(const key of Object.keys(data)) if(!columns.includes(key)) throw new Error('Invalid update column: ' + key);
            for(const r of rows) if(matchRow(r,filters)) Object.assign(r,data);
          } else {
            setRows(name,rows.filter(r=>!matchRow(r,filters)));
          }
          saveDb(); return send(res,200,{data:q.returnRows?(q.action==='update'?rows.filter(r=>matchRow(r,filters)).map(normalizeMedia):selected.map(normalizeMedia)):null,error:null});
        }
        return send(res,400,{data:null,error:{message:'Unsupported local action'}});
      }catch(e){
        const status=/without a filter|Invalid filter|Unsupported filter|Invalid (order|conflict|insert|update)|Unknown recovery table|payload/i.test(e.message) ? 400 : 500;
        return send(res,status,{data:null,error:{message:e.message}});
      }
    }); return;
  }
  if(u.pathname.startsWith('/api/storage/')){
    return send(res,501,{data:null,error:{message:'Local recovery storage mutation is not enabled in audit mode'}}, {'Allow':'GET'});
  }
  vite.middlewares(req,res,()=>send(res,404,{error:{message:'Not found'}}));
});
const recoveryHost = process.env.RECOVERY_HOST || '127.0.0.1';
const recoveryPort = Number(process.env.PORT || 3000);
api.listen(recoveryPort,recoveryHost,()=>console.log(`audit2 local recovery: http://${recoveryHost === '0.0.0.0' ? 'localhost' : recoveryHost}:${recoveryPort}/`));
