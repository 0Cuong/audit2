const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Journal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const handleSaveEntry = async \(entryData: Omit<JournalEntry, 'id' \| 'created_at'>, existingId\?: string\) => \{[\s\S]*?\} else \{[\s\S]*?\}\s*\}\s*\};\s*const handleDeleteEntry/g;

const replacement = `const handleSaveEntry = async (entryData: Omit<JournalEntry, 'id' | 'created_at'>, existingId?: string) => {
    try {
      if (existingId) {
        const updated = await journalRepository.update(existingId, entryData as any);
        setEntries((prev) => prev.map((e) => (e.id === existingId ? (updated as any) : e)));
      } else {
        const created = await journalRepository.create(entryData as any);
        setEntries((prev) => [(created as any), ...prev]);
      }
    } catch (e) {
      console.warn('Failed to save journal entry', e);
    }
  };

  const handleDeleteEntry`;

content = content.replace(regex, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Journal.tsx handleSave');
