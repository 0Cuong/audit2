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
      
      const repoName = file.replace('Repository.ts', '').toLowerCase();
      const cacheKey = `'repo_${repoName}_all'`;
      
      let modified = false;
      
      // In create, update, delete, we need to add `apiGovernance.invalidate(cacheKey);` inside the try block right after success (or before return).
      // Let's inject it before `this.cacheData([parsed` in create, and before `return parsed` in update, and before `}` in delete try block.
      
      // Actually, doing it right after `if (error) throw error;` is the safest.
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
         if (lines[i].includes('if (error) throw error;')) {
            // Check if we are inside create, update, or delete
            // The easiest way is just to add apiGovernance.invalidate(cacheKey); if it's not findAll.
            // Let's check backwards for the method name.
            let method = '';
            for (let j = i; j >= 0; j--) {
               if (lines[j].includes('async create(')) { method = 'create'; break; }
               if (lines[j].includes('async update(')) { method = 'update'; break; }
               if (lines[j].includes('async delete(')) { method = 'delete'; break; }
               if (lines[j].includes('async findAll(')) { method = 'findAll'; break; }
               if (lines[j].includes('async findById(')) { method = 'findById'; break; }
            }
            
            if (['create', 'update', 'delete'].includes(method)) {
               if (!lines[i+1].includes('apiGovernance.invalidate')) {
                   lines.splice(i + 1, 0, `      apiGovernance.invalidate(${cacheKey});`);
                   modified = true;
               }
            }
         }
      }
      
      if (modified) {
         fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
         console.log(`Added invalidation to ${filePath}`);
      }
    }
  }
}

// Also check Journal, Music, LoveMap for direct writes
