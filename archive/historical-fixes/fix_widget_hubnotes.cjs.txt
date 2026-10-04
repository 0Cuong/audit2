const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/widgets/HubNotesWidget.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('messageRepository')) {
  content = content.replace("import { supabase } from '../../lib/supabase';", "import { messageRepository } from '../../data/repositories/message/MessageRepository';");
}

const oldFetch = `        const { data } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        if (data && data.length > 0) setMessages(data);`;
const newFetch = `        const data = await messageRepository.findAll();
        if (data && data.length > 0) setMessages(data.slice(0, 6));`;
content = content.replace(oldFetch, newFetch);

const oldInsert = `      await supabase.from('messages').insert({
        content: newNote.content,
        message_type: 'note',
        is_pinned: true,
      });`;
const newInsert = `      await messageRepository.create({
        content: newNote.content,
        message_type: 'note',
        is_pinned: true,
        author_id: 'partner1', // Fallback, would be better to have real author
      } as any);`;
content = content.replace(oldInsert, newInsert);

fs.writeFileSync(filePath, content, 'utf8');
