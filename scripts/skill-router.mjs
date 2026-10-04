#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const registry=JSON.parse(fs.readFileSync(path.join(root,"skills","registry.json"),"utf8"));
const task=process.argv.slice(2).join(" ").trim();
if(!task){ console.error("Usage: npm run skills:route -- \"task description\""); process.exit(1); }

const rules=[
  {skill:"core/repository-audit",terms:["audit","repository","repo","refactor","architecture","migration","recovery","unfamiliar"]},
  {skill:"core/skill-router",terms:["route","workflow","skill"]},
  {skill:"quality/verification",terms:["test","verify","verification","build","lint","typecheck","qa","regression"]},
  {skill:"security/external-skill-review",terms:["security","secret","credential","external skill","dependency","license","production"]},
  {skill:"frontend/anti-slop-frontend",terms:["frontend","ui","ux","design","landing","redesign","page","animation","motion","gsap","3d","three.js","webgl"]},
  {skill:"frontend/visual-qa",terms:["ui","ux","visual","screenshot","browser","responsive","accessibility","animation","motion"]},
  {skill:"research/github-skill-discovery",terms:["github","skill","library","research","current api","documentation","dependency"]}
];
const lower=task.toLowerCase();
const scored=rules.map(r=>({
  skill:r.skill,
  score:r.terms.reduce((n,t)=>n+(lower.includes(t)?1:0),0)
})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
const isHighRisk=/production|deploy|security|migration|recovery|database|secret|credential/i.test(task);
const verification=new Set();
if(scored.some(x=>x.skill.startsWith("frontend/"))){verification.add("typecheck");verification.add("lint");verification.add("build");verification.add("browser");}
if(scored.some(x=>x.skill==="core/repository-audit")||isHighRisk) verification.add("targeted-check");
if(isHighRisk) verification.add("security-review");
const available=new Set((registry.local||[]));
const selected=scored.slice(0,5).filter(x=>available.has(x.skill)).map(x=>x.skill);
if(!selected.includes("core/skill-router")) selected.unshift("core/skill-router");
process.stdout.write(JSON.stringify({
  task,
  skills:[...new Set(selected)],
  risk:isHighRisk?"high":scored.some(x=>x.score>=2)?"medium":"low",
  verification:[...verification],
  research_required:/github|library|current api|documentation|dependency/i.test(task)
},null,2)+"\n");
