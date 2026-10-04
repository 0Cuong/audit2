const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/widgets/GoalTrackerWidget.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('bucketRepository')) {
  content = content.replace("import { supabase } from '../../lib/supabase';", "import { bucketRepository } from '../../data/repositories/bucket/BucketRepository';");
}

const oldFetch = `        const { data } = await supabase
          .from('bucket_list_items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        if (data) setItems(data);`;
const newFetch = `        const data = await bucketRepository.findAll();
        if (data) setItems(data.slice(0, 6));`;
content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
