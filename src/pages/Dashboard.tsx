import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  SlidersHorizontal, 
  RotateCcw, 
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import BlockContainer from '../components/blocks/BlockContainer';
import { renderWidget, WIDGET_CATALOG } from '../components/widgets/WidgetRegistry';
import { type WidgetType } from '../types/personalization';

export default function Dashboard() {
  const { t } = useApp();
  const {
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    blocks,
    addBlock,
    resetBlocksToDefault,
    isEditMode,
    setIsEditMode,
    setIsStudioOpen,
  } = usePersonalization();

  const [showAddWidget, setShowAddWidget] = useState(false);

  const handleAddWidget = (type: WidgetType) => {
    addBlock(type);
    setShowAddWidget(false);
  };

  return (
    <main className="pt-24 sm:pt-28 pb-28 min-h-screen text-zinc-100 relative selection:bg-[#E5A93C]/30 selection:text-white">
      <div className="section-container relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-zinc-100">
              {t('dash.title')}
            </h1>
          </div>

          {/* Quick Space Actions Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddWidget(true)}
              className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-900" />
              <span>Thêm Widget</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditMode((prev) => !prev)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                isEditMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {isEditMode ? '✓ Xong Bố Cục' : 'Sắp Xếp Bố Cục'}
            </button>

            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="p-2.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/10 text-[#E5A93C] transition active:scale-95"
              title="Mở Studio Giao Diện"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Quick Switcher Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 bg-[#09090D]/90 backdrop-blur-2xl p-2.5 rounded-2xl border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          {/* Workspace Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => switchWorkspace(ws.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  ws.id === activeWorkspaceId
                    ? 'bg-white/[0.12] text-white border border-white/15 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <span>{ws.name}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Edit Mode Notice Banner */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-4 rounded-2xl bg-amber-950/70 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-xl backdrop-blur-xl"
            >
              <span>
                Kéo thả, đổi kích thước, ẩn hoặc khóa các widget.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resetBlocksToDefault()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-zinc-200 font-mono transition"
                >
                  <RotateCcw className="w-3 h-3 inline mr-1" /> Khôi phục mặc định
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold font-mono transition shadow"
                >
                  Hoàn Tất
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composable Dynamic Grid with 3D Monolith Blocks */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ perspective: 1200 }}
        >
          {blocks.map((block, idx) => (
            <BlockContainer
              key={block.id}
              block={block}
              index={idx}
              totalBlocks={blocks.length}
            >
              {renderWidget(block)}
            </BlockContainer>
          ))}
        </div>

      </div>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {showAddWidget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
            onClick={() => setShowAddWidget(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#09090D] border border-white/15 rounded-3xl p-6 sm:p-7 w-full max-w-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative max-h-[85vh] overflow-y-auto text-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowAddWidget(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
              >
                ✕
              </button>

              <h3 className="text-base sm:text-lg font-serif font-medium text-zinc-100 mb-1">
                Thêm widget
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Chọn widget để thêm vào trang chủ.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {WIDGET_CATALOG.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      onClick={() => handleAddWidget(item.type)}
                      className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-[#E5A93C]/40 hover:bg-zinc-900 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-[#E5A93C] group-hover:scale-110 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-white">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
