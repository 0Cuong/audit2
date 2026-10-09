const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Memories.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const handleAddMemory = async \(newMem: Omit<MemoryItem, 'id'>\) => \{[\s\S]*?catch \(e\) \{\s*\/\/ Local fallback already saved\s*\}\s*\};/;
const replacement = `const handleAddMemory = async (newMem: Omit<MemoryItem, 'id'>) => {
    try {
      const created = await memoryRepository.create(newMem as any);
      setMemories((prev) => [created as unknown as MemoryItem, ...prev]);
    } catch (e) {
      console.warn('Failed to save memory', e);
    }
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync(filePath, content, 'utf8');
