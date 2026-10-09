const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/widgets/AnniversaryWidget.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('anniversaryRepository')) {
  content = content.replace("import { supabase } from '../../lib/supabase';", "import { anniversaryRepository } from '../../data/repositories/anniversary/AnniversaryRepository';");
}

const oldFetch = `        const { data } = await supabase
          .from('anniversaries')
          .select('*')
          .order('date', { ascending: true })
          .limit(3);
        if (data) setEvents(data);`;
const newFetch = `        const data = await anniversaryRepository.findAll();
        if (data) {
          // Sort ascending locally
          const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setEvents(sorted.slice(0, 3));
        }`;
content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
