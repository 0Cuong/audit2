import { useState } from 'react';
import { FileText, Edit2, Check } from 'lucide-react';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { type WorkspaceBlock } from '../../types/personalization';

export default function CustomMarkdownWidget({ block }: { block: WorkspaceBlock }) {
  const { updateBlock } = usePersonalization();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(
    block.settings?.content ||
      '### Chuyến phiêu lưu tiếp theo\n- [ ] Đặt vé máy bay Đà Lạt\n- [ ] Mua áo ấm đôi\n- [ ] Đặt bàn tối lãng mạn'
  );

  const saveContent = () => {
    updateBlock(block.id, {
      settings: { ...block.settings, content },
    });
    setIsEditing(false);
  };

  return (
    <div className="glass p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase font-sans tracking-wide">
              {block.title || 'Ghi Chú / Kế Hoạch Tùy Biến'}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => (isEditing ? saveContent() : setIsEditing(true))}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition"
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Xong</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Nhập ghi chú markdown, checklist, kế hoạch..."
            className="w-full p-3 glass rounded-xl text-xs text-zinc-100 font-mono bg-transparent border border-white/15 outline-none resize-none focus:border-rose-500 transition"
          />
        ) : (
          <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed space-y-1.5 bg-black/20 p-3.5 rounded-2xl border border-white/5">
            {content}
          </div>
        )}
      </div>

      <div className="text-[10px] text-zinc-500 font-mono mt-3 text-right">
        Custom Composable Block
      </div>
    </div>
  );
}
