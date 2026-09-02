import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Pin, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../contexts/AppContext';
import { type WorkspaceBlock } from '../../types/personalization';

export default function HubNotesWidget({ block }: { block: WorkspaceBlock }) {
  const { t } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputNote, setInputNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        if (data && data.length > 0) setMessages(data);
      } catch (e) {
        // Local fallback
      }
    })();
  }, []);

  const addQuickNote = async () => {
    if (!inputNote.trim()) return;
    const newNote = {
      id: 'local-' + Date.now(),
      content: inputNote.trim(),
      message_type: 'note',
      is_pinned: true,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [newNote, ...prev]);
    setInputNote('');

    try {
      await supabase.from('messages').insert({
        content: newNote.content,
        message_type: 'note',
        is_pinned: true,
      });
    } catch (e) {
      // Local fallback
    }
  };

  return (
    <div className="glass p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase font-sans tracking-wide">
              {block.title || t('hub.title')}
            </h3>
          </div>
          <NavLink
            to="/hub"
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {t('common.viewAll')}
          </NavLink>
        </div>

        {/* Quick add note input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={inputNote}
            onChange={(e) => setInputNote(e.target.value)}
            placeholder="Ghi chú nhanh cho người ấy..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addQuickNote();
              }
            }}
            className="flex-1 px-3 py-1.5 glass rounded-xl text-xs text-zinc-100 bg-transparent border border-white/10 outline-none focus:border-rose-500 transition"
          />
          <button
            type="button"
            onClick={addQuickNote}
            disabled={!inputNote.trim()}
            className="px-3 py-1.5 gradient-accent rounded-xl text-xs text-white font-semibold disabled:opacity-40 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pinned notes list */}
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {messages.slice(0, 3).map((m) => (
            <div
              key={m.id}
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2 text-xs text-zinc-200"
            >
              <Pin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed break-words">{m.content}</span>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-4">Chưa có lời nhắn nào được ghim.</p>
          )}
        </div>
      </div>

      <NavLink
        to="/hub"
        className="text-[11px] text-zinc-400 hover:text-white text-center mt-3 block font-mono"
      >
        Mở Góc Trò Chuyện & Nhắc Nhở →
      </NavLink>
    </div>
  );
}
