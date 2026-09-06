import { useState } from 'react';
import { Quote, RefreshCw } from 'lucide-react';
import { type WorkspaceBlock } from '../../types/personalization';

const quotes = [
  { text: 'Yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.', author: 'Antoine de Saint-Exupéry' },
  { text: 'Nếu biết trăm năm là hữu hạn, cớ gì ta không trọn vẹn yêu thương.', author: 'Phạm Lữ Ân' },
  { text: 'Có một người để thương, một chốn để về, ấy là hạnh phúc viên mãn nhất.', author: 'Cuongisme' },
  { text: 'Điều tuyệt vời nhất trên đời này là tìm thấy một người nhìn thấu tâm hồn bạn mà vẫn muốn ôm chặt lấy bạn.', author: 'Khuyết danh' },
  { text: 'Tình yêu không làm thế giới quay tròn. Tình yêu là thứ khiến chuyến đi đó trở nên đáng giá.', author: 'Franklin P. Jones' },
];

export default function DailyQuoteWidget({ block }: { block: WorkspaceBlock }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const current = quotes[index];

  const nextQuote = () => {
    setIndex((prev) => (prev + 1) % quotes.length);
  };

  return (
    <div className="glass p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300">
              <Quote className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase font-sans tracking-wide">
              {block.title || 'Thông Điệp Mỗi Ngày'}
            </h3>
          </div>

          <button
            type="button"
            onClick={nextQuote}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
            title="Đổi câu nói khác"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 my-2">
          <p className="font-serif italic text-sm sm:text-base text-zinc-100 leading-relaxed">
            "{current.text}"
          </p>
          <p className="text-right text-[11px] font-mono text-zinc-400 mt-2 font-semibold">
            - {current.author}
          </p>
        </div>
      </div>

      <div className="text-[10px] text-zinc-500 font-mono text-center mt-2">
        Daily Inspiration
      </div>
    </div>
  );
}
