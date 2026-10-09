const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/widgets/AnniversaryWidget.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldFetch = `        const { data } = await supabase
          .from('anniversaries')
          .select('*')
          .order('date')
          .limit(4);
        if (data && data.length > 0) setEvents(data);`;
const newFetch = `        const data = await anniversaryRepository.findAll();
        if (data && data.length > 0) {
          // Sort ascending locally
          const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setEvents(sorted.slice(0, 4));
        }`;
content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
