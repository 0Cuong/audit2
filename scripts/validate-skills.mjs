#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const skillsRoot=path.join(root,"skills");
const registryPath=path.join(skillsRoot,"registry.json");

function walk(dir){
  const out=[];
  if(!fs.existsSync(dir)) return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(full));
    else if(entry.name==="SKILL.md") out.push(full);
  }
  return out;
}
function frontmatter(text,file){
  if(!text.startsWith("---\n")) throw new Error(file+": missing YAML frontmatter");
  const end=text.indexOf("\n---\n",4);
  if(end<0) throw new Error(file+": unterminated YAML frontmatter");
  const head=text.slice(4,end);
  const name=head.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description=head.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if(!name) throw new Error(file+": missing frontmatter name");
  if(!description) throw new Error(file+": missing frontmatter description");
  if(!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error(file+": invalid skill name: "+name);
  return {name,description};
}
function scanUnsafe(text,file){
  const patterns=[
    /curl\s+[^\n|]+\|\s*(sh|bash)/i,
    /wget\s+[^\n|]+\|\s*(sh|bash)/i,
    /rm\s+-rf\s+[/~]/i,
    /git\s+push\s+--force/i,
    /Invoke-WebRequest[^\n]+\|[^\n]*(iex|Invoke-Expression)/i
  ];
  return patterns.filter(re=>re.test(text)).map(re=>({file,pattern:String(re)}));
}
if(!fs.existsSync(registryPath)) throw new Error("skills/registry.json is missing");
const registry=JSON.parse(fs.readFileSync(registryPath,"utf8"));
if(registry.version!==1) throw new Error("Unsupported skills registry version");
const skillFiles=walk(skillsRoot);
const localNames=[];
const warnings=[];
for(const file of skillFiles){
  const text=fs.readFileSync(file,"utf8");
  const meta=frontmatter(text,file);
  const lines=text.split(/\r?\n/).length;
  if(lines>500) throw new Error(file+": exceeds 500 lines; move reference material out of SKILL.md");
  localNames.push(path.relative(skillsRoot,path.dirname(file)).split(path.sep).join("/"));
  warnings.push(...scanUnsafe(text,file));
}
for(const entry of registry.local||[]){
  const expected=path.join(skillsRoot,entry,"SKILL.md");
  if(!fs.existsSync(expected)) throw new Error("Registry local skill missing: "+entry);
}
const result={
  ok:true,
  localSkills:localNames.sort(),
  localCount:localNames.length,
  externalCount:Array.isArray(registry.external)?registry.external.length:0,
  warnings
};
process.stdout.write(JSON.stringify(result,null,2)+"\n");
if(warnings.length) process.stderr.write("Warning: potentially unsafe command patterns found; review manually.\n");
