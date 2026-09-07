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
      
      // Fix missing `if (error) throw error;` inside closure
      content = content.replace(/order\([^)]+\);\s*return resData \|\| \[\];/g, (match) => {
          modified = true;
          return match.replace(';', ';\n          if (error) throw error;');
      });
      
      // Remove `if (error) throw error;` outside closure
      if (content.includes('if (error) throw error;')) {
          const parts = content.split('if (error) throw error;');
          // Only keep the inner ones
          content = content.replace(/      if \(error\) throw error;\n/g, '');
          modified = true;
      }
      
      if (modified) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Fixed ${filePath}`);
      }
    }
  }
}
