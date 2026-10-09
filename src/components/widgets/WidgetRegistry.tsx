import { ComponentType } from 'react';
import { 
  Heart, 
  Calendar, 
  Image as ImageIcon, 
  Target, 
  Sparkles, 
  Smile, 
  MessageSquare, 
  Zap, 
  Music, 
  MapPin, 
  FileText, 
  Camera, 
  Quote 
} from 'lucide-react';
import { type WidgetType, type WorkspaceBlock } from '../../types/personalization';

import LiveCounterWidget from './LiveCounterWidget';
import AnniversaryWidget from './AnniversaryWidget';
import MemoriesWidget from './MemoriesWidget';
import GoalTrackerWidget from './GoalTrackerWidget';
import ZodiacWidget from './ZodiacWidget';
import MoodSummaryWidget from './MoodSummaryWidget';
import HubNotesWidget from './HubNotesWidget';
import QuickShortcutsWidget from './QuickShortcutsWidget';
import MusicPlayerWidget from './MusicPlayerWidget';
import LoveMapWidget from './LoveMapWidget';
import CustomMarkdownWidget from './CustomMarkdownWidget';
import PhotoGalleryWidget from './PhotoGalleryWidget';
import DailyQuoteWidget from './DailyQuoteWidget';

export interface WidgetMetadata {
  type: WidgetType;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  defaultSize: '1x1' | '2x1' | '2x2' | 'full';
  category: 'core' | 'romantic' | 'media' | 'utility';
}

export const WIDGET_CATALOG: WidgetMetadata[] = [
  {
    type: 'live_counter',
    title: 'Bộ Đếm Tình Yêu',
    description: 'Hiển thị thời gian bên nhau theo thời gian thực cùng hồ sơ đôi lứa.',
    icon: Heart,
    defaultSize: 'full',
    category: 'romantic',
  },
  {
    type: 'anniversaries',
    title: 'Sự Kiện Sắp Tới',
    description: 'Đếm ngược các ngày kỷ niệm và sinh nhật quan trọng.',
    icon: Calendar,
    defaultSize: '1x1',
    category: 'romantic',
  },
  {
    type: 'memories_gallery',
    title: 'Khoảnh Khắc Gần Đây',
    description: 'Lưới ảnh kỷ niệm nổi bật được lưu gần đây nhất.',
    icon: ImageIcon,
    defaultSize: '1x1',
    category: 'media',
  },
  {
    type: 'goal_tracker',
    title: 'Tiến Độ Mục Tiêu',
    description: 'Thanh tiến trình và danh sách những điều muốn cùng nhau thực hiện.',
    icon: Target,
    defaultSize: '1x1',
    category: 'utility',
  },
  {
    type: 'zodiac_compat',
    title: 'Mức Độ Hợp Nhau',
    description: 'Tỷ lệ hòa hợp cung hoàng đạo và lời khuyên yêu thương.',
    icon: Sparkles,
    defaultSize: '1x1',
    category: 'romantic',
  },
  {
    type: 'mood_tracker',
    title: 'Nhật Ký Cảm Xúc',
    description: 'Tổng hợp trạng thái cảm xúc gần đây của hai bạn.',
    icon: Smile,
    defaultSize: '1x1',
    category: 'core',
  },
  {
    type: 'hub_notes',
    title: 'Ghi Chú & Nhắc Nhở',
    description: 'Bảng tin nhắn ghim nhanh và gợi ý trò chuyện mỗi ngày.',
    icon: MessageSquare,
    defaultSize: '2x1',
    category: 'core',
  },
  {
    type: 'quick_shortcuts',
    title: 'Lối Tắt Nhanh',
    description: 'Các nút chuyển hướng nhanh đến các trang quan trọng.',
    icon: Zap,
    defaultSize: '1x1',
    category: 'utility',
  },
  {
    type: 'music_player',
    title: 'Trình Phát Nhạc',
    description: 'Điều khiển phát những bản tình ca ý nghĩa trực tiếp trên trang chủ.',
    icon: Music,
    defaultSize: '2x1',
    category: 'media',
  },
  {
    type: 'love_map',
    title: 'Bản Đồ Kỷ Niệm',
    description: 'Khung xem bản đồ tương tác hiển thị những địa điểm gắn bó.',
    icon: MapPin,
    defaultSize: '1x1',
    category: 'media',
  },
  {
    type: 'custom_markdown',
    title: 'Ghi Chú Tùy Biến',
    description: 'Khối soạn thảo tự do ghi lại kế hoạch, checklist, thơ ca.',
    icon: FileText,
    defaultSize: '1x1',
    category: 'utility',
  },
  {
    type: 'photo_gallery',
    title: 'Thư Viện Ảnh',
    description: 'Trình chiếu slide ảnh động đồng bộ từ Asset Library.',
    icon: Camera,
    defaultSize: '2x1',
    category: 'media',
  },
  {
    type: 'daily_quote',
    title: 'Thông Điệp Mỗi Ngày',
    description: 'Những câu trích dẫn lãng mạn và truyền cảm hứng mỗi ngày.',
    icon: Quote,
    defaultSize: '1x1',
    category: 'romantic',
  },
];

export const widgetComponentMap: Record<WidgetType, ComponentType<{ block: WorkspaceBlock }>> = {
  live_counter: LiveCounterWidget,
  anniversaries: AnniversaryWidget,
  memories_gallery: MemoriesWidget,
  goal_tracker: GoalTrackerWidget,
  zodiac_compat: ZodiacWidget,
  mood_tracker: MoodSummaryWidget,
  hub_notes: HubNotesWidget,
  quick_shortcuts: QuickShortcutsWidget,
  music_player: MusicPlayerWidget,
  love_map: LoveMapWidget,
  custom_markdown: CustomMarkdownWidget,
  photo_gallery: PhotoGalleryWidget,
  daily_quote: DailyQuoteWidget,
  stats_summary: LiveCounterWidget,
};

export function renderWidget(block: WorkspaceBlock) {
  const Component = widgetComponentMap[block.type] || CustomMarkdownWidget;
  return <Component block={block} />;
}
