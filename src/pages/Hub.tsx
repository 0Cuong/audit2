import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, MessageCircle, Bell, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { dailyQuestions } from '../data/zodiac';

interface MessageItem {
  id: string;
  content: string;
  message_type: 'note' | 'reminder' | 'question';
  is_pinned: boolean;
  created_at?: string;
}

const DEFAULT_MESSAGES: MessageItem[] = [
  { id: 'msg-1', content: 'Nhớ uống nước ấm và mang áo khoác khi đi làm nhé bé yêu!', message_type: 'note', is_pinned: true },
  { id: 'msg-2', content: 'Hẹn hò xem phim cuối tuần lúc 19:30 thứ Bảy.', message_type: 'reminder', is_pinned: true },
  { id: 'msg-3', content: 'Điều gì đã khiến bạn mỉm cười nhiều nhất hôm nay?', message_type: 'question', is_pinned: false },
];

export default function Hub() {
  const { t, tc } = useApp();
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const saved = localStorage.getItem('cuongisme_hub');
    return saved ? JSON.parse(saved) : DEFAULT_MESSAGES;
  });
  const [tab, setTab] = useState<'notes' | 'reminders' | 'questions'>('notes');
  const [newMsg, setNewMsg] = useState('');
  
  const [qIndex, setQIndex] = useState(() => Math.floor(Date.now() / 86400000) % dailyQuestions.length);
  const currentQ = dailyQuestions[qIndex];

  useEffect(() => {
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setMessages(data);
          localStorage.setItem('cuongisme_hub', JSON.stringify(data));
        }
      });
  }, []);

  const addMsg = async (type: 'note' | 'reminder' | 'question') => {
    const content = type === 'question' ? currentQ : newMsg.trim();
    if (!content) return;

    const newEntry: MessageItem = {
      id: 'local-' + Date.now(),
      content,
      message_type: type,
      is_pinned: type === 'note',
      created_at: new Date().toISOString(),
    };

    const updated = [newEntry, ...messages];
    setMessages(updated);
    localStorage.setItem('cuongisme_hub', JSON.stringify(updated));
    setNewMsg('');

    try {
      const { data } = await supabase.from('messages').insert({
        content,
        message_type: type,
        is_pinned: type === 'note',
      }).select().maybeSingle();

      if (data) {
        setMessages(prev => prev.map(m => m.id === newEntry.id ? data : m));
      }
    } catch (e) {
      // Local
    }
  };

  const togglePin = async (id: string, currentVal: boolean) => {
    const updated = messages.map(m => m.id === id ? { ...m, is_pinned: !currentVal } : m);
    setMessages(updated);
    localStorage.setItem('cuongisme_hub', JSON.stringify(updated));

    try {
      await supabase.from('messages').update({ is_pinned: !currentVal }).eq('id', id);
    } catch (e) {
      // Local
    }
  };

  const deleteMsg = async (id: string) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    localStorage.setItem('cuongisme_hub', JSON.stringify(updated));

    try {
      await supabase.from('messages').delete().eq('id', id);
    } catch (e) {
      // Local
    }
  };

  const shuffleQuestion = () => {
    setQIndex(prev => (prev + 1) % dailyQuestions.length);
  };

  const notes = messages.filter(m => m.message_type === 'note');
  const reminders = messages.filter(m => m.message_type === 'reminder');
  const questions = messages.filter(m => m.message_type === 'question');

  const currentTabData = tab === 'notes' ? notes : tab === 'reminders' ? reminders : questions;

  return (
    <main className="pt-24 pb-12 min-h-screen">
      <div className="section-container max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="page-title mb-1">{t('hub.title')}</h1>
        </motion.div>

        {/* Daily Question Feature Card */}
        <div className="bg-zinc-900/65 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-white/[0.08] mb-8 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-zinc-300">
              {t('hub.questions')}
            </span>
            
            <button 
              onClick={shuffleQuestion}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-white/5 transition"
              title="Đổi câu hỏi khác"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Đổi câu hỏi
            </button>
          </div>

          <p className="text-base sm:text-lg font-serif font-medium text-zinc-100 leading-relaxed italic">
            "{currentQ}"
          </p>

          <div className="mt-5 flex gap-2">
            <button 
              onClick={() => addMsg('question')} 
              className="btn-pill"
            >
              Lưu câu trả lời vào góc chuyện
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex gap-2 mb-4">
          {(['notes', 'reminders', 'questions'] as const).map(tb => (
            <button 
              key={tb} 
              onClick={() => setTab(tb)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                tab === tb ? 'bg-white/15 text-white border border-white/20 shadow-sm' : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-white/10'
              }`}
            >
              {tb === 'notes' ? <Pin className="w-3.5 h-3.5" /> : tb === 'reminders' ? <Bell className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
              {t(`hub.${tb}`)}
            </button>
          ))}
        </div>

        {/* Quick Add Bar */}
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={newMsg} 
            onChange={e => setNewMsg(e.target.value)} 
            placeholder={tab === 'notes' ? 'Ghi chú cho người ấy...' : tab === 'reminders' ? 'Thêm lời nhắc nhở...' : 'Gợi ý chủ đề trò chuyện...'}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMsg(tab === 'notes' ? 'note' : tab === 'reminders' ? 'reminder' : 'question');
              }
            }}
            className={`flex-1 px-4 py-2.5 glass rounded-2xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500 transition-all`} 
          />
          <button 
            onClick={() => addMsg(tab === 'notes' ? 'note' : tab === 'reminders' ? 'reminder' : 'question')}
            disabled={!newMsg.trim()}
            className="px-5 py-2.5 gradient-accent rounded-2xl text-sm text-white font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-md shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>

        {/* Message Items List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {currentTabData.map((m) => (
              <motion.div 
                key={m.id} 
                layout
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className={`glass rounded-2xl p-4 border ${tc.border} flex items-center justify-between gap-3.5 group hover-lift shadow-sm`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button 
                    onClick={() => togglePin(m.id, m.is_pinned)}
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
                    title={m.is_pinned ? "Bỏ ghim" : "Ghim"}
                  >
                    <Pin className={`w-4 h-4 ${m.is_pinned ? 'text-rose-500 fill-rose-500' : `${tc.textMuted} opacity-40 hover:opacity-100`}`} />
                  </button>
                  <span className={`text-xs sm:text-sm font-medium ${tc.text} leading-relaxed break-words`}>
                    {m.content}
                  </span>
                </div>

                <button 
                  onClick={() => deleteMsg(m.id)} 
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition shrink-0"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {currentTabData.length === 0 && (
            <div className={`glass rounded-3xl p-12 text-center border ${tc.border}`}>
              <MessageCircle className={`w-8 h-8 ${tc.textMuted} opacity-40 mx-auto mb-2`} />
              <p className={`text-sm ${tc.textMuted}`}>Chưa có mục nào trong phần này.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
