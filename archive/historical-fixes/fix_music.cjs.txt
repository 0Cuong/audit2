const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Music.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('songRepository')) {
  content = content.replace("import { supabase, isSupabaseConfigured } from '../lib/supabase';", "import { supabase, isSupabaseConfigured } from '../lib/supabase';\nimport { songRepository } from '../data/repositories/song/SongRepository';");
}

// Convert fetch
const oldFetch = `    apiGovernance.fetchWithGovernance<any[]>(
      'repo_songs_all',
      async () => {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      { ttl: 300000 }
    )`;
const newFetch = `    songRepository.findAll()`;
content = content.replace(oldFetch, newFetch);

// Fix mutations
content = content.replace(/const \{ data \} = await supabase\.from\('songs'\)\.insert\(newSong\)\.select\(\)\.maybeSingle\(\);/g, "const data = await songRepository.create(newSong as any);");
content = content.replace(/await supabase\.from\('songs'\)\.delete\(\)\.eq\('id', id\);/g, "await songRepository.delete(id);");
content = content.replace(/await supabase\.from\('songs'\)\.update\(\{ is_favorite: !val \}\)\.eq\('id', id\);/g, "await songRepository.update(id, { is_favorite: !val });");
content = content.replace(/await supabase\.from\('songs'\)\.update\(\{ is_background: !val \}\)\.eq\('id', id\);/g, "await songRepository.update(id, { is_background: !val });");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Music.tsx');
