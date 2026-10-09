const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Journal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('journalRepository')) {
  content = content.replace("import { supabase, isSupabaseConfigured } from '../lib/supabase';", "import { supabase, isSupabaseConfigured } from '../lib/supabase';\nimport { journalRepository } from '../data/repositories/journal/JournalRepository';");
}

// Convert fetch
const oldFetch = `        const data = await apiGovernance.fetchWithGovernance<any[]>(
          'repo_journal_all',
          async () => {
            const { data: resData, error } = await supabase
              .from('journal_entries')
              .select('*')
              .order('date', { ascending: false });
            if (error) throw error;
            return resData || [];
          },
          { ttl: 300000 }
        );`;
const newFetch = `        const data = await journalRepository.findAll();`;
content = content.replace(oldFetch, newFetch);

// Fix mutations
content = content.replace(/await supabase\.from\('journal_entries'\)\.delete\(\)\.eq\('id', id\);/g, "await journalRepository.delete(id);");
content = content.replace(/await supabase\.from\('journal_entries'\)\.update\(\{ is_pinned: newStatus \}\)\.eq\('id', id\);/g, "await journalRepository.update(id, { is_pinned: newStatus });");
content = content.replace(/await supabase\.from\('journal_entries'\)\.update\(\{ is_favorite: newStatus \}\)\.eq\('id', id\);/g, "await journalRepository.update(id, { is_favorite: newStatus });");

// Inside handleSave (which might use insert/update directly):
// Let's check handleSave
