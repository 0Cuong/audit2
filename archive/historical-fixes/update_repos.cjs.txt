const fs = require('fs');
const path = require('path');

const repoDir = path.join(__dirname, 'src/data/repositories');
const dirs = fs.readdirSync(repoDir);

for (const dir of dirs) {
  const fullPath = path.join(repoDir, dir);
  if (fs.statSync(fullPath).isDirectory()) {
    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('Repository.ts') && f !== 'BaseRepository.ts' && f !== 'MemoryRepository.ts' && f !== 'TimelineRepository.ts');
    for (const file of files) {
      const filePath = path.join(fullPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Import apiGovernance
      if (!content.includes('apiGovernance')) {
        content = content.replace(
          "import { supabase, isSupabaseConfigured } from '../../../lib/supabase';",
          "import { supabase, isSupabaseConfigured } from '../../../lib/supabase';\nimport { apiGovernance } from '../../../lib/api-governance';"
        );
      }
      
      // Extract the TABLE name reference. It's usually like SupabaseMoodRepository.TABLE
      const match = content.match(/from\((Supabase[A-Za-z]+Repository\.TABLE)\)/);
      if (match) {
        const tableRef = match[1];
        
        // Find findAll method
        const findAllStart = content.indexOf('async findAll(): Promise<');
        if (findAllStart !== -1) {
           const tryStart = content.indexOf('try {', findAllStart);
           const catchStart = content.indexOf('} catch (e)', tryStart);
           
           if (tryStart !== -1 && catchStart !== -1) {
             const tryBlock = content.substring(tryStart, catchStart);
             if (tryBlock.includes('.from(') && !tryBlock.includes('apiGovernance.fetchWithGovernance')) {
               const repoName = file.replace('Repository.ts', '').toLowerCase();
               const cacheKey = `'repo_${repoName}_all'`;
               
               // We replace the specific try block parts
               let newTryBlock = tryBlock.replace(
                 /const\s+\{\s*data,\s*error\s*\}\s*=\s*await\s+supabase\s*\n\s*\.from\([^)]+\)\s*\n\s*\.select\('[^']+'\)(?:\s*\n\s*\.order\([^)]+\))?;/s,
                 (match) => {
                   return `const data = await apiGovernance.fetchWithGovernance<any[]>(\n        ${cacheKey},\n        async () => {\n          ${match.replace('const { data, error } = ', 'const { data: resData, error } = ')}\n          if (error) throw error;\n          return resData || [];\n        },\n        { ttl: 300000 }\n      );`;
                 }
               );
               
               // Also remove `if (error) throw error;` that comes after the old query if it exists outside the replacement
               newTryBlock = newTryBlock.replace(/\s*if\s*\(error\)\s*throw\s*error;/s, '');
               
               content = content.substring(0, tryStart) + newTryBlock + content.substring(catchStart);
             }
           }
        }
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
}
