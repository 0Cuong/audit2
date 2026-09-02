import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  MoveUp, 
  MoveDown, 
  Maximize2, 
  Lock, 
  Unlock, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  GripVertical 
} from 'lucide-react';
import { type BlockSize, type WorkspaceBlock } from '../../types/personalization';
import { usePersonalization } from '../../contexts/PersonalizationContext';

interface BlockContainerProps {
  block: WorkspaceBlock;
  index: number;
  totalBlocks: number;
  children: ReactNode;
}

export default function BlockContainer({
  block,
  index,
  totalBlocks,
  children,
}: BlockContainerProps) {
  const {
    isEditMode,
    reorderBlocks,
    resizeBlock,
    toggleBlockLock,
    toggleBlockVisibility,
    toggleBlockCollapse,
    removeBlock,
  } = usePersonalization();

  // Map BlockSize to Tailwind grid column/row span classes
  const getSizeClasses = (size: BlockSize): string => {
    switch (size) {
      case '1x1':
        return 'col-span-1';
      case '2x1':
        return 'col-span-1 md:col-span-2';
      case '1x2':
        return 'col-span-1 row-span-2';
      case '2x2':
        return 'col-span-1 md:col-span-2 row-span-2';
      case 'full':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 'auto':
      default:
        return 'col-span-1';
    }
  };

  const nextSizes: Record<BlockSize, BlockSize> = {
    '1x1': '2x1',
    '2x1': 'full',
    'full': '1x1',
    '1x2': '2x2',
    '2x2': 'full',
    'auto': '2x1',
  };

  if (!block.isVisible && !isEditMode) {
    return null;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: block.isVisible ? 1 : 0.45, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className={`relative group/block transition-all duration-300 ${getSizeClasses(block.size)} ${
        isEditMode ? 'ring-1 ring-dashed ring-white/20 hover:ring-rose-500/50' : ''
      } ${!block.isVisible ? 'grayscale' : ''}`}
    >
      {/* Edit Toolbar Controls (Shown only during Edit Mode) */}
      {isEditMode && (
        <div className="absolute -top-3.5 left-3 right-3 z-30 flex items-center justify-between gap-1 bg-zinc-900/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xl text-zinc-300 select-none text-[11px]">
          {/* Drag / Block Type Indicator */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-zinc-400">
            <GripVertical className="w-3 h-3 text-zinc-500" />
            <span className="truncate max-w-[100px]">{block.title || block.type.replace('_', ' ')}</span>
            <span className="px-1.5 py-0.2 bg-white/10 rounded text-[9px]">{block.size}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Reorder Up */}
            <button
              type="button"
              disabled={index === 0}
              onClick={() => reorderBlocks(index, index - 1)}
              className="p-1 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Move Up"
            >
              <MoveUp className="w-3 h-3" />
            </button>

            {/* Reorder Down */}
            <button
              type="button"
              disabled={index === totalBlocks - 1}
              onClick={() => reorderBlocks(index, index + 1)}
              className="p-1 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Move Down"
            >
              <MoveDown className="w-3 h-3" />
            </button>

            {/* Cycle Resize */}
            <button
              type="button"
              onClick={() => resizeBlock(block.id, nextSizes[block.size] || '1x1')}
              className="p-1 rounded-md hover:bg-white/10 transition"
              title="Change Size (1x1 -> 2x1 -> Full)"
            >
              <Maximize2 className="w-3 h-3" />
            </button>

            {/* Collapse */}
            <button
              type="button"
              onClick={() => toggleBlockCollapse(block.id)}
              className="p-1 rounded-md hover:bg-white/10 transition"
              title={block.isCollapsed ? 'Expand' : 'Collapse'}
            >
              {block.isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>

            {/* Lock / Unlock */}
            <button
              type="button"
              onClick={() => toggleBlockLock(block.id)}
              className={`p-1 rounded-md hover:bg-white/10 transition ${block.isLocked ? 'text-amber-400' : ''}`}
              title={block.isLocked ? 'Unlock Block' : 'Lock Block'}
            >
              {block.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>

            {/* Hide / Show */}
            <button
              type="button"
              onClick={() => toggleBlockVisibility(block.id)}
              className="p-1 rounded-md hover:bg-white/10 transition"
              title={block.isVisible ? 'Hide Block' : 'Show Block'}
            >
              {block.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-rose-400" />}
            </button>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeBlock(block.id)}
              className="p-1 rounded-md hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition"
              title="Remove Block"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Block Body Content */}
      <div className={`h-full ${block.isCollapsed ? 'max-h-16 overflow-hidden pointer-events-none' : ''}`}>
        {children}
      </div>
    </motion.div>
  );
}
