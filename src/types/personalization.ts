export type DensityMode = 'compact' | 'normal' | 'spacious';
export type ShapePreset = 'sharp' | 'soft' | 'rounded' | 'pill' | 'custom';
export type SurfaceStyle = 'flat' | 'bordered' | 'elevated' | 'translucent' | 'glass';
export type ShadowLevel = 'none' | 'subtle' | 'soft' | 'elevated';
export type MotionMode = 'reduced' | 'normal' | 'enhanced';
export type NavigationStyle = 'top_bar' | 'floating_dock' | 'sidebar' | 'compact_pill' | 'minimal';
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'gif' | 'animated';
export type BlockSize = '1x1' | '2x1' | '1x2' | '2x2' | 'full' | 'auto';
export type AssetCategory = 'avatar' | 'banner' | 'background' | 'photo' | 'sticker' | 'icon' | 'badge';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographyConfig {
  fontFamily: string;
  headingFont: string;
  fontScale: number; // 0.85 to 1.25
  headingScale: number; // 0.85 to 1.35
  fontWeight: string;
  lineHeight: number;
  letterSpacing: string;
  density: DensityMode;
}

export interface ShapeConfig {
  preset: ShapePreset;
  radiusScale: number; // 0 to 2 (0: sharp, 1: standard, 2: ultra rounded)
  cardRadius: string;
  buttonRadius: string;
  inputRadius: string;
  avatarRadius: string;
}

export interface AppearanceTheme {
  id: string;
  name: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  shape: ShapeConfig;
  surface: SurfaceStyle;
  shadow: ShadowLevel;
  motion: MotionMode;
  noiseOverlay: boolean;
}

export interface BackgroundConfig {
  type: BackgroundType;
  value: string; // Color hex, CSS gradient string, or media URL
  opacity: number; // 0 to 1
  blur: number; // 0 to 40px
  brightness: number; // 0.2 to 1.8
  contrast: number; // 0.5 to 1.5
  saturation: number; // 0 to 2
  overlayColor: string;
  overlayOpacity: number; // 0 to 1
  position: string;
  size: 'cover' | 'contain' | 'auto';
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  fixed: boolean;
  animationSpeed?: number; // for animated gradients/GIFs
}

export interface PersonalIdentity {
  displayName: string;
  nickname: string;
  partner1Name: string;
  partner2Name: string;
  partner1Avatar: string;
  partner2Avatar: string;
  bannerImage: string;
  coverImage: string;
  bio: string;
  statusEmoji: string;
  statusMessage: string;
  badge: string;
  /** @deprecated Canonical relationship start date is stored in couple_profile.relationship_start */
  relationshipStart?: string;
  relationshipStatus: string;
  profileAccent: string;
  profileLayout: 'banner_left' | 'banner_center' | 'minimal' | 'cards';
  visibility: 'private' | 'public' | 'shared';
}

export type WidgetType =
  | 'live_counter'
  | 'anniversaries'
  | 'memories_gallery'
  | 'goal_tracker'
  | 'zodiac_compat'
  | 'mood_tracker'
  | 'hub_notes'
  | 'quick_shortcuts'
  | 'music_player'
  | 'love_map'
  | 'custom_markdown'
  | 'photo_gallery'
  | 'daily_quote'
  | 'stats_summary';

export interface WorkspaceBlock {
  id: string;
  type: WidgetType;
  title?: string;
  size: BlockSize;
  order: number;
  isVisible: boolean;
  isLocked: boolean;
  isCollapsed?: boolean;
  settings?: Record<string, any>;
}

export interface CustomPage {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  icon: string;
  description?: string;
  blocks: WorkspaceBlock[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  to: string;
  icon: string;
  isPinned: boolean;
  isHidden: boolean;
  isCustom?: boolean;
  order: number;
}

export interface NavigationConfig {
  style: NavigationStyle;
  density: DensityMode;
  items: NavigationItem[];
}

export interface UserAsset {
  id: string;
  name: string;
  category: AssetCategory;
  url: string;
  thumbnail?: string;
  size?: number;
  mimeType?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export interface SavedView {
  id: string;
  pageKey: string; // e.g. 'memories', 'map', 'bucket', 'journal'
  name: string;
  icon: string;
  description?: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  displayMode?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface PersonalShortcut {
  id: string;
  title: string;
  icon: string;
  actionType: 'navigate' | 'filter_view' | 'trigger_audio' | 'modal_open' | 'custom';
  target: string;
  params?: Record<string, any>;
  order: number;
}

export interface PersonalRule {
  id: string;
  name: string;
  trigger: 'page_open' | 'time_of_day' | 'device_screen' | 'workspace_switch';
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  action: 'apply_theme' | 'apply_view' | 'switch_nav_style' | 'set_background' | 'set_density';
  actionPayload: any;
  isEnabled: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  description: string;
  isDefault: boolean;
  layoutMode: 'bento' | 'masonry' | 'editorial' | 'stream';
  blocks: WorkspaceBlock[];
  themeOverride?: Partial<AppearanceTheme>;
  backgroundOverride?: Partial<BackgroundConfig>;
  navigationOverride?: Partial<NavigationConfig>;
  activePageId?: string;
}

export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  version: string;
  previewThumbnail?: string;
  tags: string[];
  appearance: AppearanceTheme;
  background: BackgroundConfig;
  navigationStyle: NavigationStyle;
  identityDecoration?: {
    badge?: string;
    profileAccent?: string;
  };
  sampleBlocks?: WorkspaceBlock[];
}

export interface ConfigRevision {
  id: string;
  timestamp: string;
  label: string;
  snapshot: {
    appearance: AppearanceTheme;
    background: BackgroundConfig;
    identity: PersonalIdentity;
    workspaces: Workspace[];
    activeWorkspaceId: string;
    navigation: NavigationConfig;
  };
}

// ============================================================================
// DEFAULT MASTER CONFIGURATIONS & PRESETS
// ============================================================================

export const DEFAULT_COLOR_PALETTE: ColorPalette = {
  primary: '#f4f4f5',
  secondary: '#a1a1aa',
  accent: '#f43f5e', // Rose accent
  background: '#121214',
  surface: '#18181b',
  surfaceElevated: '#222226',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  border: 'rgba(255, 255, 255, 0.08)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif',
  headingFont: '"Newsreader", "Cormorant Garamond", Georgia, serif',
  fontScale: 1,
  headingScale: 1,
  fontWeight: '500',
  lineHeight: 1.5,
  letterSpacing: 'normal',
  density: 'normal',
};

export const DEFAULT_SHAPE: ShapeConfig = {
  preset: 'rounded',
  radiusScale: 1,
  cardRadius: '1.5rem',
  buttonRadius: '9999px',
  inputRadius: '0.875rem',
  avatarRadius: '9999px',
};

export const DEFAULT_APPEARANCE: AppearanceTheme = {
  id: 'obsidian-slate',
  name: 'Obsidian Slate',
  colors: DEFAULT_COLOR_PALETTE,
  typography: DEFAULT_TYPOGRAPHY,
  shape: DEFAULT_SHAPE,
  surface: 'glass',
  shadow: 'soft',
  motion: 'normal',
  noiseOverlay: true,
};

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'gradient',
  value: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.15), rgba(255, 255, 255, 0))',
  opacity: 1,
  blur: 0,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  overlayColor: '#000000',
  overlayOpacity: 0.2,
  position: 'center',
  size: 'cover',
  repeat: 'no-repeat',
  fixed: true,
};

export const DEFAULT_IDENTITY: PersonalIdentity = {
  displayName: '',
  nickname: '',
  partner1Name: '',
  partner2Name: '',
  partner1Avatar: '',
  partner2Avatar: '',
  bannerImage: '',
  coverImage: '',
  bio: '',
  statusEmoji: '',
  statusMessage: '',
  badge: '',
  relationshipStatus: 'dating',
  profileAccent: '#f43f5e',
  profileLayout: 'banner_center',
  visibility: 'private',
};

export const DEFAULT_BLOCKS: WorkspaceBlock[] = [
  { id: 'b-counter', type: 'live_counter', size: 'full', order: 0, isVisible: true, isLocked: false },
  { id: 'b-anniv', type: 'anniversaries', size: '1x1', order: 1, isVisible: true, isLocked: false },
  { id: 'b-memories', type: 'memories_gallery', size: '1x1', order: 2, isVisible: true, isLocked: false },
  { id: 'b-goals', type: 'goal_tracker', size: '1x1', order: 3, isVisible: true, isLocked: false },
  { id: 'b-zodiac', type: 'zodiac_compat', size: '1x1', order: 4, isVisible: true, isLocked: false },
  { id: 'b-mood', type: 'mood_tracker', size: '1x1', order: 5, isVisible: true, isLocked: false },
  { id: 'b-notes', type: 'hub_notes', size: '2x1', order: 6, isVisible: true, isLocked: false },
  { id: 'b-shortcuts', type: 'quick_shortcuts', size: '1x1', order: 7, isVisible: true, isLocked: false },
  { id: 'b-music', type: 'music_player', size: '2x1', order: 8, isVisible: true, isLocked: false },
  { id: 'b-map', type: 'love_map', size: '1x1', order: 9, isVisible: true, isLocked: false },
  { id: 'b-quote', type: 'daily_quote', size: '1x1', order: 10, isVisible: true, isLocked: false },
];

export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'nav-dash', label: 'nav.dashboard', to: '/', icon: 'LayoutDashboard', isPinned: true, isHidden: false, order: 0 },
  { id: 'nav-timeline', label: 'nav.timeline', to: '/timeline', icon: 'Hourglass', isPinned: true, isHidden: false, order: 1 },
  { id: 'nav-memories', label: 'nav.memories', to: '/memories', icon: 'Image', isPinned: true, isHidden: false, order: 2 },
  { id: 'nav-letters', label: 'nav.letters', to: '/letters', icon: 'Mail', isPinned: true, isHidden: false, order: 3 },
  { id: 'nav-journal', label: 'nav.journal', to: '/journal', icon: 'BookHeart', isPinned: true, isHidden: false, order: 4 },
  { id: 'nav-bucket', label: 'nav.bucket', to: '/bucket-list', icon: 'CheckSquare', isPinned: true, isHidden: false, order: 5 },
  { id: 'nav-anniversary', label: 'nav.anniversary', to: '/anniversary', icon: 'Calendar', isPinned: true, isHidden: false, order: 6 },
  { id: 'nav-mood', label: 'nav.mood', to: '/mood', icon: 'Smile', isPinned: false, isHidden: false, order: 7 },
  { id: 'nav-zodiac', label: 'nav.zodiac', to: '/zodiac', icon: 'Compass', isPinned: false, isHidden: false, order: 8 },
  { id: 'nav-map', label: 'nav.map', to: '/map', icon: 'MapPin', isPinned: false, isHidden: false, order: 9 },
  { id: 'nav-music', label: 'nav.music', to: '/music', icon: 'Music', isPinned: false, isHidden: false, order: 10 },
  { id: 'nav-gifts', label: 'nav.gifts', to: '/gifts', icon: 'Gift', isPinned: false, isHidden: false, order: 11 },
  { id: 'nav-hub', label: 'nav.hub', to: '/hub', icon: 'MessageSquare', isPinned: false, isHidden: false, order: 12 },
  { id: 'nav-contact', label: 'nav.contact', to: '/contact', icon: 'Users', isPinned: false, isHidden: false, order: 13 },
  { id: 'nav-settings', label: 'nav.settings', to: '/settings', icon: 'Settings', isPinned: false, isHidden: false, order: 14 },
];

export const DEFAULT_NAVIGATION: NavigationConfig = {
  style: 'floating_dock',
  density: 'normal',
  items: DEFAULT_NAVIGATION_ITEMS,
};

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws-main',
    name: 'Góc Nhỏ Tình Yêu',
    icon: 'Heart',
    description: 'Không gian chính kết nối mọi khoảnh khắc, nhật ký và kỷ niệm.',
    isDefault: true,
    layoutMode: 'bento',
    blocks: DEFAULT_BLOCKS,
  },
  {
    id: 'ws-travel',
    name: 'Chuyến Đi & Kỷ Niệm',
    icon: 'Plane',
    description: 'Tập trung vào bản đồ du lịch, danh sách ước mơ và thư viện ảnh.',
    isDefault: false,
    layoutMode: 'editorial',
    blocks: [
      { id: 'ws2-counter', type: 'live_counter', size: 'full', order: 0, isVisible: true, isLocked: false },
      { id: 'ws2-map', type: 'love_map', size: '2x2', order: 1, isVisible: true, isLocked: false },
      { id: 'ws2-memories', type: 'memories_gallery', size: '2x1', order: 2, isVisible: true, isLocked: false },
      { id: 'ws2-goals', type: 'goal_tracker', size: '1x1', order: 3, isVisible: true, isLocked: false },
      { id: 'ws2-music', type: 'music_player', size: '1x1', order: 4, isVisible: true, isLocked: false },
    ],
  },
  {
    id: 'ws-minimal',
    name: 'Minimal Focus',
    icon: 'Sparkles',
    description: 'Giao diện tối giản, yên tĩnh cho những ngày chỉ cần lắng đọng.',
    isDefault: false,
    layoutMode: 'stream',
    blocks: [
      { id: 'ws3-counter', type: 'live_counter', size: 'full', order: 0, isVisible: true, isLocked: false },
      { id: 'ws3-notes', type: 'hub_notes', size: '2x1', order: 1, isVisible: true, isLocked: false },
      { id: 'ws3-quote', type: 'daily_quote', size: '1x1', order: 2, isVisible: true, isLocked: false },
    ],
  },
];

// ============================================================================
// 8+ MASTER CURATED DESIGN PRESETS
// ============================================================================

export const MASTER_DESIGN_PRESETS: DesignPreset[] = [
  {
    id: 'preset-obsidian',
    name: 'Obsidian Velvet',
    description: 'Phong cách tối giản hiện đại với nền đen tuyền, kính mờ và điểm nhấn hoa hồng.',
    category: 'Minimal',
    author: 'Cuongisme Design',
    version: '1.0.0',
    tags: ['dark', 'glass', 'editorial', 'modern'],
    appearance: {
      ...DEFAULT_APPEARANCE,
      id: 'obsidian-velvet',
      name: 'Obsidian Velvet',
      colors: {
        ...DEFAULT_COLOR_PALETTE,
        primary: '#f4f4f5',
        accent: '#f43f5e',
        background: '#121214',
        surface: '#18181b',
        border: 'rgba(255, 255, 255, 0.08)',
      },
      shape: {
        preset: 'rounded',
        radiusScale: 1,
        cardRadius: '1.5rem',
        buttonRadius: '9999px',
        inputRadius: '0.875rem',
        avatarRadius: '9999px',
      },
      surface: 'glass',
      shadow: 'soft',
    },
    background: {
      type: 'gradient',
      value: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.15), rgba(255, 255, 255, 0))',
      opacity: 1,
      blur: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      overlayColor: '#000000',
      overlayOpacity: 0.2,
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat',
      fixed: true,
    },
    navigationStyle: 'floating_dock',
  },
  {
    id: 'preset-cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Phong cách viễn tưởng sắc sảo với các đường viền cyan sắc bén, neon tím và góc cạnh.',
    category: 'Futuristic',
    author: 'Cuongisme Design',
    version: '1.0.0',
    tags: ['cyberpunk', 'neon', 'sharp', 'tech'],
    appearance: {
      ...DEFAULT_APPEARANCE,
      id: 'cyberpunk-neon',
      name: 'Cyberpunk Neon',
      colors: {
        primary: '#00f0ff',
        secondary: '#ff007f',
        accent: '#00f0ff',
        background: '#090a0f',
        surface: '#0f111a',
        surfaceElevated: '#171a26',
        text: '#f0f6fc',
        textMuted: '#798299',
        border: 'rgba(0, 240, 255, 0.2)',
        success: '#00ff66',
        warning: '#ffe600',
        error: '#ff003c',
        info: '#00f0ff',
      },
      typography: {
        fontFamily: '"JetBrains Mono", monospace',
        headingFont: '"Silkscreen", monospace',
        fontScale: 0.95,
        headingScale: 1.1,
        fontWeight: '600',
        lineHeight: 1.4,
        letterSpacing: '0.04em',
        density: 'compact',
      },
      shape: {
        preset: 'sharp',
        radiusScale: 0.2,
        cardRadius: '0.25rem',
        buttonRadius: '0.25rem',
        inputRadius: '0.25rem',
        avatarRadius: '0.25rem',
      },
      surface: 'bordered',
      shadow: 'subtle',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #090a0f 0%, #15091e 50%, #06111e 100%)',
      opacity: 1,
      blur: 0,
      brightness: 1.1,
      contrast: 1.2,
      saturation: 1.3,
      overlayColor: '#000000',
      overlayOpacity: 0.3,
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat',
      fixed: true,
    },
    navigationStyle: 'top_bar',
  },
  {
    id: 'preset-editorial-light',
    name: 'Editorial Monochrome',
    description: 'Phong cách tạp chí báo in thanh lịch, sáng sủa, đề cao chữ nghệ thuật và khoảng thở.',
    category: 'Editorial',
    author: 'Cuongisme Design',
    version: '1.0.0',
    tags: ['light', 'editorial', 'serif', 'clean'],
    appearance: {
      ...DEFAULT_APPEARANCE,
      id: 'editorial-light',
      name: 'Editorial Monochrome',
      colors: {
        primary: '#18181b',
        secondary: '#52525b',
        accent: '#18181b',
        background: '#f4f4f5',
        surface: '#ffffff',
        surfaceElevated: '#fafafa',
        text: '#18181b',
        textMuted: '#71717a',
        border: 'rgba(0, 0, 0, 0.08)',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb',
      },
      typography: {
        fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
        headingFont: '"Newsreader", "Cormorant Garamond", Georgia, serif',
        fontScale: 1.05,
        headingScale: 1.25,
        fontWeight: '400',
        lineHeight: 1.6,
        letterSpacing: '-0.01em',
        density: 'spacious',
      },
      shape: {
        preset: 'soft',
        radiusScale: 0.8,
        cardRadius: '1rem',
        buttonRadius: '9999px',
        inputRadius: '0.75rem',
        avatarRadius: '9999px',
      },
      surface: 'flat',
      shadow: 'subtle',
      noiseOverlay: false,
    },
    background: {
      type: 'solid',
      value: '#f4f4f5',
      opacity: 1,
      blur: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      overlayColor: '#ffffff',
      overlayOpacity: 0,
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat',
      fixed: true,
    },
    navigationStyle: 'top_bar',
  },
  {
    id: 'preset-rose-charcoal',
    name: 'Rose Romance',
    description: 'Sắc hồng pastel ấm áp hòa cùng gam than chì huyền bí, ngập tràn cảm xúc đôi lứa.',
    category: 'Romantic',
    author: 'Cuongisme Design',
    version: '1.0.0',
    tags: ['rose', 'pink', 'romantic', 'warm'],
    appearance: {
      ...DEFAULT_APPEARANCE,
      id: 'rose-romance',
      name: 'Rose Romance',
      colors: {
        primary: '#fb7185',
        secondary: '#fda4af',
        accent: '#f43f5e',
        background: '#140f12',
        surface: '#1c1418',
        surfaceElevated: '#271b21',
        text: '#fff1f2',
        textMuted: '#be9ca6',
        border: 'rgba(244, 63, 94, 0.16)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#f43f5e',
        info: '#ec4899',
      },
      typography: {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        headingFont: '"Caveat", "Newsreader", cursive',
        fontScale: 1,
        headingScale: 1.3,
        fontWeight: '500',
        lineHeight: 1.5,
        letterSpacing: 'normal',
        density: 'normal',
      },
      shape: {
        preset: 'pill',
        radiusScale: 1.4,
        cardRadius: '2rem',
        buttonRadius: '9999px',
        inputRadius: '1.25rem',
        avatarRadius: '9999px',
      },
      surface: 'glass',
      shadow: 'soft',
    },
    background: {
      type: 'gradient',
      value: 'radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.18) 0%, rgba(20, 15, 18, 0.95) 70%)',
      opacity: 1,
      blur: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      overlayColor: '#000000',
      overlayOpacity: 0.25,
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat',
      fixed: true,
    },
    navigationStyle: 'floating_dock',
  },
  {
    id: 'preset-emerald-forest',
    name: 'Emerald Serenity',
    description: 'Xanh ngọc lục bảo mộc mạc và tĩnh lặng, mang lại cảm giác bình yên sâu thẳm.',
    category: 'Nature',
    author: 'Cuongisme Design',
    version: '1.0.0',
    tags: ['green', 'emerald', 'calm', 'nature'],
    appearance: {
      ...DEFAULT_APPEARANCE,
      id: 'emerald-serenity',
      name: 'Emerald Serenity',
      colors: {
        primary: '#34d399',
        secondary: '#6ee7b7',
        accent: '#10b981',
        background: '#0a120e',
        surface: '#111c16',
        surfaceElevated: '#182720',
        text: '#ecfdf5',
        textMuted: '#8ba699',
        border: 'rgba(16, 185, 129, 0.16)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4',
      },
      typography: {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        headingFont: '"Cinzel", serif',
        fontScale: 1,
        headingScale: 1.15,
        fontWeight: '500',
        lineHeight: 1.5,
        letterSpacing: '0.01em',
        density: 'normal',
      },
      shape: {
        preset: 'rounded',
        radiusScale: 1,
        cardRadius: '1.5rem',
        buttonRadius: '9999px',
        inputRadius: '1rem',
        avatarRadius: '9999px',
      },
      surface: 'glass',
      shadow: 'soft',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #0a120e 0%, #0e1a14 50%, #060c09 100%)',
      opacity: 1,
      blur: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1.1,
      overlayColor: '#000000',
      overlayOpacity: 0.2,
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat',
      fixed: true,
    },
    navigationStyle: 'floating_dock',
  },
  {
    id: 'preset-sunset-amber',
    name: 'Sunset Chill',
    description: 'Ánh hoàng hôn vàng cam ấm áp, êm đềm như những buổi chiều cùng nhau dạo phố.',
    category: 'Warm',
    author: 'Cuongisme Design',
    version: '1.0.0',
    tags: ['amber', 'sunset', 'orange', 'warm'],
    appearance: {
      ...DEFAULT_APPEARANCE,
      id: 'sunset-chill',
      name: 'Sunset Chill',
      colors: {
        primary: '#fbbf24',
        secondary: '#f97316',
        accent: '#f59e0b',
        background: '#14100c',
        surface: '#1c1611',
        surfaceElevated: '#261e18',
        text: '#fef3c7',
        textMuted: '#bfa791',
        border: 'rgba(245, 158, 11, 0.15)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#f97316',
      },
      shape: {
        preset: 'rounded',
        radiusScale: 1.1,
        cardRadius: '1.5rem',
        buttonRadius: '9999px',
        inputRadius: '1rem',
        avatarRadius: '9999px',
      },
      surface: 'glass',
      shadow: 'soft',
    },
    background: {
      type: 'gradient',
      value: 'radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.15) 0%, rgba(20, 16, 12, 0.95) 75%)',
      opacity: 1,
      blur: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      overlayColor: '#000000',
      overlayOpacity: 0.2,
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat',
      fixed: true,
    },
    navigationStyle: 'compact_pill',
  },
  {
    id: 'preset-retro-voxel',
    name: 'Retro Pixel & Voxel',
    description: 'Phong cách đồ họa 8-bit hoài niệm lấy cảm hứng từ thế giới khối vuông sáng tạo.',
    category: 'Playful',
    author: 'Cuongisme Design',
    version: '1.0.0',
    tags: ['pixel', 'retro', 'minecraft', '8bit'],
    appearance: {
      ...DEFAULT_APPEARANCE,
      id: 'retro-voxel',
      name: 'Retro Pixel & Voxel',
      colors: {
        primary: '#38bdf8',
        secondary: '#a3e635',
        accent: '#f43f5e',
        background: '#121517',
        surface: '#1a1f23',
        surfaceElevated: '#242b31',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        border: 'rgba(255, 255, 255, 0.15)',
        success: '#4ade80',
        warning: '#facc15',
        error: '#f87171',
        info: '#38bdf8',
      },
      typography: {
        fontFamily: '"Silkscreen", "Press Start 2P", monospace',
        headingFont: '"Silkscreen", monospace',
        fontScale: 0.85,
        headingScale: 1,
        fontWeight: '700',
        lineHeight: 1.4,
        letterSpacing: '0.05em',
        density: 'normal',
      },
      shape: {
        preset: 'sharp',
        radiusScale: 0.1,
        cardRadius: '0.125rem',
        buttonRadius: '0.125rem',
        inputRadius: '0.125rem',
        avatarRadius: '0.125rem',
      },
      surface: 'bordered',
      shadow: 'none',
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
      opacity: 1,
      blur: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      overlayColor: '#000000',
      overlayOpacity: 0.2,
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat',
      fixed: true,
    },
    navigationStyle: 'top_bar',
  },
  {
    id: 'preset-midnight-slate',
    name: 'Midnight Deep Blue',
    description: 'Màu xanh bóng đêm thẳm sâu, tinh tế và tĩnh lặng như bầu trời đầy sao.',
    category: 'Minimal',
    author: 'Cuongisme Design',
    version: '1.0.0',
    tags: ['blue', 'midnight', 'clean', 'deep'],
    appearance: {
      ...DEFAULT_APPEARANCE,
      id: 'midnight-deep-blue',
      name: 'Midnight Deep Blue',
      colors: {
        primary: '#60a5fa',
        secondary: '#93c5fd',
        accent: '#3b82f6',
        background: '#0a0e17',
        surface: '#111726',
        surfaceElevated: '#1a2236',
        text: '#f0f6ff',
        textMuted: '#8b9bb4',
        border: 'rgba(59, 130, 246, 0.15)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      shape: {
        preset: 'rounded',
        radiusScale: 1,
        cardRadius: '1.5rem',
        buttonRadius: '9999px',
        inputRadius: '0.875rem',
        avatarRadius: '9999px',
      },
      surface: 'glass',
      shadow: 'soft',
    },
    background: {
      type: 'gradient',
      value: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, rgba(10, 14, 23, 0.95) 70%)',
      opacity: 1,
      blur: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      overlayColor: '#000000',
      overlayOpacity: 0.2,
      position: 'center',
      size: 'cover',
      repeat: 'no-repeat',
      fixed: true,
    },
    navigationStyle: 'floating_dock',
  },
];
