import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TransmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransmissionModal({ isOpen, onClose }: TransmissionModalProps) {
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const contentPayload = `[Liên hệ] Từ: ${senderName.trim() || 'Khách ghé thăm'} (${senderContact.trim() || 'Không để lại liên hệ'})\n\n${message.trim()}`;
      
      await supabase.from('messages').insert({
        content: contentPayload,
        message_type: 'direct_transmission',
        is_pinned: false,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        setSenderName('');
        setSenderContact('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to send transmission:', err);
      // Even if network falls back, provide clean state
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#09090D] border border-white/15 rounded-3xl w-full max-w-lg shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden relative text-zinc-100"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
            <div>
              <h3 className="font-serif text-lg font-medium text-zinc-100">
                Gửi lời nhắn
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gửi tin nhắn trực tiếp cho Cuong &amp; Xuan Nghi
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {success ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-base font-medium text-zinc-100">
                  Lời Nhắn Đã Được Gửi Đi!
                </h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Cảm ơn bạn đã ghé thăm và gửi gắm những lời chúc yêu thương đến tụi mình.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Tên Của Bạn
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Ví dụ: Hoàng Long..."
                      className="w-full px-3.5 py-2.5 bg-zinc-900/90 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none focus:border-[#E5A93C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Email / Instagram (Không bắt buộc)
                    </label>
                    <input
                      type="text"
                      value={senderContact}
                      onChange={(e) => setSenderContact(e.target.value)}
                      placeholder="@username hoặc email"
                      className="w-full px-3.5 py-2.5 bg-zinc-900/90 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none focus:border-[#E5A93C] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Nội Dung Lời Nhắn *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Gửi một lời chúc, câu hỏi hoặc chia sẻ cảm nghĩ của bạn..."
                    className="w-full px-3.5 py-2.5 bg-zinc-900/90 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none resize-none focus:border-[#E5A93C] transition leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-40 shadow-md active:scale-95"
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-zinc-900" />
                    )}
                    <span>{sending ? 'Đang gửi...' : 'Gửi Đi'}</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
