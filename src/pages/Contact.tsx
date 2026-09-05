import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Send, 
  Check, 
  MessageCircle, 
  Sparkles, 
  MapPin, 
  Calendar 
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { safeGetStorage, safeSetStorage } from '../lib/storage';

interface NoteItem {
  id: string;
  sender: string;
  content: string;
  created_at: string;
}

export default function Contact() {
  const { t, profile } = useApp();

  const p1Name = profile?.partner1_name || 'Mạnh Cường';
  const p2Name = profile?.partner2_name || 'Xuân Nghi';

  const p1Avatar =
    profile?.partner1_avatar ||
    '/590610904_1909263110009109_2160755825373491978_n.jpg';

  const p2Avatar =
    profile?.partner2_avatar ||
    '/605572670_122215932062047100_7842864668271503382_n.jpg';

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    return safeGetStorage<NoteItem[]>('cuongisme_contact_notes', [
      {
        id: 'note-sample-1',
        sender: 'Xuân Nghi',
        content: 'Chào mừng bạn ghé thăm không gian lưu giữ tình yêu của tụi mình!',
        created_at: '2024-05-18T10:00:00.000Z',
      },
    ]);
  });

  const [senderName, setSenderName] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      sender: senderName.trim() || 'Người bạn ghé thăm',
      content: noteContent.trim(),
      created_at: new Date().toISOString(),
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    safeSetStorage('cuongisme_contact_notes', updated);

    setNoteContent('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <main className="pt-24 sm:pt-28 pb-28 min-h-screen text-zinc-100 relative selection:bg-amber-400/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* ============================================================ */}
        {/* HEADER: ABOUT US                                             */}
        {/* ============================================================ */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-400">
            <Heart className="w-3.5 h-3.5 text-rose-400/80 fill-rose-400/20" />
            <span>Về tụi mình</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-zinc-100">
            {p1Name} &amp; {p2Name}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
            Đây là không gian số nhỏ bé được tạo ra để lưu giữ từng kỷ niệm, lá thư tay và những ngày bình dị bên nhau.
          </p>
        </div>

        {/* ============================================================ */}
        {/* PROFILES: TWO PEOPLE                                         */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cuong */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                  <img
                    src={p1Avatar}
                    alt={p1Name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-zinc-100 font-normal">
                    {p1Name}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    12.09.2004 · Xử Nữ
                  </p>
                  <p className="text-[11px] text-amber-300/80 font-mono mt-1">
                    Kỹ thuật &amp; Xây dựng không gian
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Chăm chút từng dòng mã và trải nghiệm để hai đứa có một góc lưu giữ trọn vẹn những ngày yêu thương.
              </p>
            </div>

            {/* Social Links */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
              <a
                href="https://www.facebook.com/0Cuongisme"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/_kodl0/"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition"
              >
                Instagram
              </a>
              <a
                href="https://discord.gg/wZUDdwbq"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition"
              >
                Discord
              </a>
            </div>
          </div>

          {/* Nghi */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                  <img
                    src={p2Avatar}
                    alt={p2Name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-zinc-100 font-normal">
                    {p2Name}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    03.01.2005 · Ma Kết
                  </p>
                  <p className="text-[11px] text-rose-300/80 font-mono mt-1">
                    Cảm hứng &amp; Hình ảnh
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Lưu giữ những nụ cười, lựa chọn từng tấm ảnh và mang lại sự dịu dàng, ấm áp cho mỗi khoảnh khắc chung đôi.
              </p>
            </div>

            {/* Social Links */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
              <a
                href="https://www.facebook.com/nghinghi0301"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/hx.nghii/"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition"
              >
                Instagram
              </a>
              <a
                href="https://discord.gg/8NxAFzWXN"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition"
              >
                Discord
              </a>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GUESTBOOK / NOTE TO COUPLE                                   */}
        {/* ============================================================ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-white/[0.08] space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-zinc-100">
              Gửi một lời nhắn cho tụi mình
            </h3>
            <p className="text-xs text-zinc-400 font-light">
              Lời chúc hoặc dòng nhắn gửi nhỏ bé sẽ được lưu lại trong cuốn sổ tay này.
            </p>
          </div>

          <form onSubmit={handleSubmitNote} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Tên của bạn
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ví dụ: Bạn thân, Người quen..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Nội dung lời nhắn
              </label>
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Viết vài dòng gửi gắm..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <AnimatePresence>
                {sentSuccess && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã gửi lời nhắn thành công!</span>
                  </motion.span>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="ml-auto px-5 py-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi lời nhắn</span>
              </button>
            </div>
          </form>

          {/* Recent Notes List */}
          {notes.length > 0 && (
            <div className="pt-6 border-t border-white/[0.06] space-y-3">
              <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Lời nhắn đã nhận ({notes.length})
              </h4>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/[0.06] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-200 font-medium">{n.sender}</span>
                      <span className="text-zinc-500">
                        {new Date(n.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 font-light leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
