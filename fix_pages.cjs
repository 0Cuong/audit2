const fs = require('fs');
const path = require('path');

// 1. LoveMap.tsx
let p = path.join(__dirname, 'src/pages/LoveMap.tsx');
let c = fs.readFileSync(p, 'utf8');
c = c.replace("await supabase.from('map_locations').delete().eq('id', id);", "await supabase.from('map_locations').delete().eq('id', id);\n        apiGovernance.invalidate('repo_map_locations_all');");
if (!c.includes('apiGovernance')) {
    c = c.replace("import { supabase } from '../lib/supabase';", "import { supabase } from '../lib/supabase';\nimport { apiGovernance } from '../lib/api-governance';");
}
fs.writeFileSync(p, c, 'utf8');

// 2. Settings.tsx
p = path.join(__dirname, 'src/pages/Settings.tsx');
c = fs.readFileSync(p, 'utf8');
c = c.replace(/await supabase\.from\('settings'\)\.update\((.*?)\)\.eq\('id', settings\.id\);/g, "await supabase.from('settings').update($1).eq('id', settings.id);\n        apiGovernance.invalidate('app_settings');");
if (!c.includes('apiGovernance')) {
    c = c.replace("import { supabase } from '../lib/supabase';", "import { supabase } from '../lib/supabase';\nimport { apiGovernance } from '../lib/api-governance';");
}
fs.writeFileSync(p, c, 'utf8');

// 3. Journal.tsx
p = path.join(__dirname, 'src/pages/Journal.tsx');
c = fs.readFileSync(p, 'utf8');
c = c.replace("await supabase.from('journal_entries').delete().eq('id', id);", "await journalRepository.delete(id);");
c = c.replace("await supabase.from('journal_entries').update({ is_pinned: newStatus }).eq('id', id);", "await journalRepository.update(id, { is_pinned: newStatus });");
c = c.replace("await supabase.from('journal_entries').update({ is_favorite: newStatus }).eq('id', id);", "await journalRepository.update(id, { is_favorite: newStatus });");
fs.writeFileSync(p, c, 'utf8');

