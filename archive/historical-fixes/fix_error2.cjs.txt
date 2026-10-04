const fs = require('fs');
const path = require('path');

const repoDir = path.join(__dirname, 'src/data/repositories');
const dirs = fs.readdirSync(repoDir);

for (const dir of dirs) {
  const fullPath = path.join(repoDir, dir);
  if (fs.statSync(fullPath).isDirectory()) {
    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('Repository.ts'));
    for (const file of files) {
      const filePath = path.join(fullPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      let modified = false;
      
      // We removed `if (error) throw error;` entirely from findById, create, update, delete! Oops!
      // I should restore the file to what it was before `fix_error.cjs` by reading from git, but git is not available?
      // Wait, there is no git. I need to re-add `if (error) throw error;` everywhere it's missing!
      
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const { data, error } = await supabase') || lines[i].includes('const { data: resData, error } = await supabase') || lines[i].includes('const { data: created, error } = await supabase') || lines[i].includes('const { data: updated, error } = await supabase') || lines[i].includes('const { error } = await supabase')) {
           // Find the end of the query which is usually `.single();`, `);`, etc.
           let j = i;
           while (j < lines.length && !lines[j].includes(';') && !lines[j].includes('return resData')) {
             j++;
           }
           
           // We are at the end of the query (e.g. `.single();` or `.order(...);`)
           // We need to check if the next line has `if (error) throw error;`
           if (lines[j].includes('return resData')) {
              // This is the closure
              if (!lines[j].includes('throw error')) {
                  lines[j] = lines[j].replace('return resData', 'if (error) throw error; return resData');
                  modified = true;
              }
           } else if (lines[j].endsWith(';')) {
              if (j + 1 < lines.length && !lines[j+1].includes('throw error')) {
                  lines.splice(j + 1, 0, '      if (error) throw error;');
                  modified = true;
              }
           }
        }
      }
      
      if (modified) {
          fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
          console.log(`Fixed missing throw error in ${filePath}`);
      }
    }
  }
}
