const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/LoveMap.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The pattern to match is `if (error) throw error;` after a mutation.
// We'll replace it with `if (error) throw error; apiGovernance.invalidate('repo_map_locations_all');`
// But in insert, it's `if (error) throw error; apiGovernance.invalidate('repo_map_locations_all');`
// In delete, it is `if (error) { ...`

// For delete:
content = content.replace("const { error } = await supabase.from('map_locations').delete().eq('id', id);", "const { error } = await supabase.from('map_locations').delete().eq('id', id);\n        if (!error) { apiGovernance.invalidate('repo_map_locations_all'); }");

// For update:
content = content.replace("          if (error) throw error;", "          if (error) throw error;\n          apiGovernance.invalidate('repo_map_locations_all');");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed LoveMap.tsx');
