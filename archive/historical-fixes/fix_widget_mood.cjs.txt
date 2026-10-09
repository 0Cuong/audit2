const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/widgets/MoodSummaryWidget.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('moodRepository')) {
  content = content.replace("import { supabase } from '../../lib/supabase';", "import { moodRepository } from '../../data/repositories/mood/MoodRepository';");
}

const oldFetch = `        const { data } = await supabase
          .from('mood_entries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        if (data) setMoods(data);`;
const newFetch = `        const data = await moodRepository.findAll();
        if (data) setMoods(data.slice(0, 6));`;
content = content.replace(oldFetch, newFetch);

fs.writeFileSync(filePath, content, 'utf8');
