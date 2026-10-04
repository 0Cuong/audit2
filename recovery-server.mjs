import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(root, 'recovered', 'database.json');
const storageRoot = path.join(root, 'recpvczpwybpbbntwnnk.storage (1)', 'recpvczpwybpbbntwnnk', 'memories');
const annRoot = path.join(root, 'recovered', 'anniversaries');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function saveDb(){ fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); }
function tableRows(name){ return db.tables?.[name]?.rows || []; }
function setRows(name, rows){ if(!db.tables[name]) db.tables[name]={columns:Object.keys(rows[0]||{}),rows:[]}; db.tables[name].rows=rows; }

function match(row, filters=[]){
  return filters.every(f=>{
    const v=row[f.column];
    switch(f.op){
      case 'eq': return v===f.value;
      case 'neq': return v!==f.value;
      case 'gt': return v>f.value;
      case 'gte': return v>=f.value;
      case 'lt': return v<f.value;
      case 'lte': return v<=f.value;
      case 'in': return Array.isArray(f.value)&&f.value.includes(v);
      case 'is': return f.value===null ? v===null : v===f.value;
      case 'contains': return Array.isArray(v) ? f.value.every(x=>v.includes(x)) : String(v??'').includes(String(f.value??''));
      default: return true;
    }
  });
}

function normalizeMedia(row){
  const out={...row};
  for(const k of ['url','photo_url','image_url','cover_url','partner1_avatar','partner2_avatar']){
    if(typeof out[k]==='string' && out[k].startsWith('https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/')){
      out[k]=out[k].replace('https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/','/api/media/');
    }
  }
  if(typeof out.photo_url==='string' && out.photo_url.startsWith('data:image/')){
    const id=out.id;
    const ext=out.photo_url.startsWith('data:image/webp') ? 'jpg' : 'jpg';
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
    const name=path.basename(u.pathname), file=path.join(annRoot,name);
    if(!file.startsWith(annRoot)||!fs.existsSync(file)) return send(res,404,{error:{message:'Recovered media not found'}});
    res.writeHead(200,{'content-type':mime(file),'cache-control':'no-cache'}); return fs.createReadStream(file).pipe(res);
  }
  if(u.pathname.startsWith('/api/media/')){
    const parts=u.pathname.slice('/api/media/'.length).split('/').map(decodeURIComponent);
    const bucket=parts.shift(), rel=parts.join('/');
    if(bucket!=='memories') return send(res,404,{error:{message:'Only recovered memories bucket is mounted'}});
    const file=path.resolve(storageRoot,rel);
    if(!file.startsWith(path.resolve(storageRoot))||!fs.existsSync(file)) return send(res,404,{error:{message:'Media not found',path:rel}});
    res.writeHead(200,{'content-type':mime(file),'cache-control':'no-cache'}); return fs.createReadStream(file).pipe(res);
  }
  if(u.pathname==='/api/data'){
    if(req.method==='GET') return send(res,200,{data:[],error:null});
    let raw=''; req.on('data',c=>raw+=c); req.on('end',()=>{
      try{
        const q=JSON.parse(raw||'{}'), name=q.table, rows=tableRows(name);
        if(q.action==='select'){
          let out=rows.filter(r=>match(r,q.filters)).map(normalizeMedia);
          if(q.order?.column) out.sort((a,b)=>{const av=a[q.order.column],bv=b[q.order.column]; return (av>bv?1:av<bv?-1:0)*(q.order.ascending===false?-1:1);});
          if(Number.isInteger(q.limit)) out=out.slice(0,q.limit);
          if(q.single==='single') return send(res,out.length===1?200:406,{data:out.length===1?out[0]:null,error:out.length===1?null:{message:'JSON object requested, multiple (or no) rows returned'}});
          if(q.single==='maybeSingle') return send(res,200,{data:out.length?out[0]:null,error:null});
          return send(res,200,{data:out,error:null});
        }
        if(['insert','upsert'].includes(q.action)){
          const incoming=Array.isArray(q.data)?q.data:[q.data], conflict=q.onConflict||'id';
          const next=[...rows];
          for(const item of incoming){const idx=next.findIndex(r=>r[conflict]===item[conflict]); if(q.action==='upsert'&&idx>=0) next[idx]={...next[idx],...item}; else next.push(item);}
          setRows(name,next); saveDb(); return send(res,200,{data:q.returnRows?incoming:null,error:null});
        }
        if(q.action==='update'||q.action==='delete'){
          const selected=rows.filter(r=>match(r,q.filters));
          if(q.action==='update') for(const r of rows) if(match(r,q.filters)) Object.assign(r,q.data||{});
          else setRows(name,rows.filter(r=>!match(r,q.filters)));
          saveDb(); return send(res,200,{data:q.returnRows?selected:null,error:null});
        }
        return send(res,400,{data:null,error:{message:'Unsupported local action'}});
      }catch(e){return send(res,500,{data:null,error:{message:e.message}});}
    }); return;
  }
  if(u.pathname.startsWith('/api/storage/')){
    if(req.method==='DELETE') return send(res,200,{data:[],error:null});
    return send(res,501,{data:null,error:{message:'Local recovery storage upload is not enabled in audit mode'}});
  }
  vite.middlewares(req,res,()=>send(res,404,{error:{message:'Not found'}}));
});
api.listen(3000,'0.0.0.0',()=>console.log('audit2 local recovery: http://localhost:3000/'));
