const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/widgets/MusicPlayerWidget.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('songRepository')) {
  content = content.replace("import { supabase } from '../../lib/supabase';", "import { songRepository } from '../../data/repositories/song/SongRepository';");
}

const oldFetch = `        const { data } = await supabase
          .from('songs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (data && data.length > 0) setSongs(data);`;
const newFetch = `        const data = await songRepository.findAll();
        if (data && data.length > 0) setSongs(data.slice(0, 10));`;
content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
