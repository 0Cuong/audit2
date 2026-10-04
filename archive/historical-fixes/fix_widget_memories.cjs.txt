const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/widgets/MemoriesWidget.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('memoryRepository')) {
  content = content.replace("import { supabase } from '../../lib/supabase';", "import { memoryRepository } from '../../data/repositories/memory/MemoryRepository';");
}

const oldFetch = `        const { data } = await supabase
          .from('memories')
          .select('*')
          .order('date', { ascending: false })
          .limit(4);
        if (data && data.length > 0) setMemories(data);`;
const newFetch = `        const data = await memoryRepository.findAll();
        if (data && data.length > 0) setMemories(data.slice(0, 4));`;
content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
