const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Memories.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/await supabase\.from\('memories'\)\.update\(\{ is_favorite: newVal \}\)\.eq\('id', id\);/g, "await memoryRepository.update(id, { is_favorite: newVal });");

content = content.replace(/await supabase\.from\('memories'\)\.update\(\{ is_pinned: newVal \}\)\.eq\('id', id\);/g, "await memoryRepository.update(id, { is_pinned: newVal });");

content = content.replace(/await supabase\.from\('memories'\)\.delete\(\)\.eq\('id', id\);/g, "await memoryRepository.delete(id);");

// Import memoryRepository if not imported
if (!content.includes('memoryRepository')) {
  content = content.replace("import { apiGovernance } from '../lib/api-governance';", "import { apiGovernance } from '../lib/api-governance';\nimport { memoryRepository } from '../data/repositories/memory/MemoryRepository';");
}

// In fetchSupabaseMemories, use memoryRepository.findAll() directly to avoid duplicating apiGovernance code
const oldFetch = `  const fetchSupabaseMemories = useCallback(async () => {
    try {
      const data = await apiGovernance.fetchWithGovernance<any[]>(
        'repo_memories_all', // Same key as MemoryRepository to deduplicate!
        async () => {
          const { data: resData, error } = await supabase
            .from('memories')
            .select('*')
            .order('date', { ascending: false });
          if (error) throw error;
          return resData || [];
        },
        { ttl: 300000 }
      );

      if (data && data.length > 0) {
        const normalized: MemoryItem[] = data.map((d: any) => ({
          ...d,
          media_type: d.media_type || d.category || 'photo',
          tags: Array.isArray(d.tags) ? d.tags : []
        }));
        setMemories(normalized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
    } catch (e) {
      console.warn('[Supabase] Falling back to offline memory storage');
    }
  }, []);`;

const newFetch = `  const fetchSupabaseMemories = useCallback(async () => {
    try {
      const data = await memoryRepository.findAll();
      if (data && data.length > 0) {
        const normalized: MemoryItem[] = data.map((d: any) => ({
          ...d,
          media_type: d.media_type || d.category || 'photo',
          tags: Array.isArray(d.tags) ? d.tags : []
        }));
        setMemories(normalized);
        // localStorage is already handled by repository
      }
    } catch (e) {
      console.warn('[Supabase] Falling back to offline memory storage');
    }
  }, []);`;

content = content.replace(oldFetch, newFetch);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Memories.tsx');
