import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from 'react';
import {
  type AppearanceTheme,
  type BackgroundConfig,
  type PersonalIdentity,
  type Workspace,
  type WorkspaceBlock,
  type CustomPage,
  type NavigationConfig,
  type UserAsset,
  type SavedView,
  type PersonalRule,
  type DesignPreset,
  type ConfigRevision,
  type WidgetType,
  type BlockSize,
  DEFAULT_APPEARANCE,
  DEFAULT_BACKGROUND,
  DEFAULT_IDENTITY,
  DEFAULT_WORKSPACES,
  DEFAULT_NAVIGATION,
  MASTER_DESIGN_PRESETS,
  DEFAULT_BLOCKS,
} from '../types/personalization';
import { safeGetStorage, safeSetStorage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface PersonalizationContextValue {
  // Appearance & Theme
  appearance: AppearanceTheme;
  updateAppearance: (updates: Partial<AppearanceTheme>) => void;
  updateColors: (colors: Partial<AppearanceTheme['colors']>) => void;
  updateTypography: (typography: Partial<AppearanceTheme['typography']>) => void;
  updateShape: (shape: Partial<AppearanceTheme['shape']>) => void;

  // Background System
  background: BackgroundConfig;
  updateBackground: (updates: Partial<BackgroundConfig>) => void;

  // Personal Identity
  identity: PersonalIdentity;
  updateIdentity: (updates: Partial<PersonalIdentity>) => void;

  // Multi-Workspaces
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string, icon?: string, description?: string) => string;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;

  // Blocks & Layout
  blocks: WorkspaceBlock[];
  addBlock: (type: WidgetType, size?: BlockSize, title?: string) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, updates: Partial<WorkspaceBlock>) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  resizeBlock: (id: string, size: BlockSize) => void;
  toggleBlockVisibility: (id: string) => void;
  toggleBlockLock: (id: string) => void;
  toggleBlockCollapse: (id: string) => void;
  resetBlocksToDefault: () => void;

  // Custom Pages
  customPages: CustomPage[];
  createCustomPage: (title: string, icon?: string, description?: string) => string;
  updateCustomPage: (id: string, updates: Partial<CustomPage>) => void;
  deleteCustomPage: (id: string) => void;

  // Navigation
  navigation: NavigationConfig;
  updateNavigation: (updates: Partial<NavigationConfig>) => void;
  reorderNavItems: (fromIndex: number, toIndex: number) => void;
  toggleNavItemPin: (id: string) => void;
  toggleNavItemHidden: (id: string) => void;

  // User Asset Library
  assets: UserAsset[];
  addAsset: (asset: Omit<UserAsset, 'id' | 'createdAt'>) => string;
  removeAsset: (id: string) => void;
  toggleAssetFavorite: (id: string) => void;

  // Saved Views
  savedViews: SavedView[];
  createSavedView: (view: Omit<SavedView, 'id' | 'createdAt'>) => string;
  deleteSavedView: (id: string) => void;

  // Personal Rules & Automation
  rules: PersonalRule[];
  createRule: (rule: Omit<PersonalRule, 'id'>) => string;
  updateRule: (id: string, updates: Partial<PersonalRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;

  // Presets & Templates
  presets: DesignPreset[];
  applyPreset: (preset: DesignPreset) => void;
  saveCurrentAsPreset: (name: string, description?: string, category?: string) => string;
  exportDesignJson: () => string;
  importDesignJson: (jsonStr: string) => boolean;

  // Revision History & Reset Controls
  revisions: ConfigRevision[];
  createSnapshot: (label: string) => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  resetAllPersonalization: () => void;

  // UI Studio & Modal Controls
  isStudioOpen: boolean;
  setIsStudioOpen: (open: boolean) => void;
  activeStudioTab: string;
  setActiveStudioTab: (tab: string) => void;
  isAssetLibraryOpen: boolean;
  setIsAssetLibraryOpen: (open: boolean) => void;
  isEditMode: boolean;
  setIsEditMode: (edit: boolean | ((prev: boolean) => boolean)) => void;
}

const PersonalizationContext = createContext<PersonalizationContextValue | null>(null);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  // 1. Core States with safe localStorage fallback
  const isHydratedRef = useRef(false);

  const [appearance, setAppearance] = useState<AppearanceTheme>(() =>
    safeGetStorage('cuongisme_p_appearance', DEFAULT_APPEARANCE)
  );
  const [background, setBackground] = useState<BackgroundConfig>(() =>
    safeGetStorage('cuongisme_p_background', DEFAULT_BACKGROUND)
  );
  const [identity, setIdentity] = useState<PersonalIdentity>(() => {
    const stored = safeGetStorage<any>('cuongisme_p_identity', DEFAULT_IDENTITY);
    if (stored && typeof stored === 'object') {
      const clean = { ...stored };
      delete clean.relationshipStart; // Migrated to CoupleProfile
      delete clean.partner1; // Migrated to CoupleProfile
      delete clean.partner2; // Migrated to CoupleProfile
      delete clean.brandName; // Use CoupleProfile names
      delete clean.tagline; // Let app manage this or empty string
      return clean as PersonalIdentity;
    }
    return { id: 'p-id-1', primaryColor: 'amber' } as any; // Strip all personal defaults
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() =>
    safeGetStorage('cuongisme_p_workspaces', DEFAULT_WORKSPACES)
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() =>
    safeGetStorage('cuongisme_p_active_ws', 'ws-main')
  );
  const [customPages, setCustomPages] = useState<CustomPage[]>(() =>
    safeGetStorage('cuongisme_p_custom_pages', [])
  );
  const [navigation, setNavigation] = useState<NavigationConfig>(() =>
    safeGetStorage('cuongisme_p_navigation', DEFAULT_NAVIGATION)
  );
  const [assets, setAssets] = useState<UserAsset[]>(() =>
    safeGetStorage('cuongisme_p_assets', [])
  );
  const [savedViews, setSavedViews] = useState<SavedView[]>(() =>
    safeGetStorage('cuongisme_p_saved_views', [])
  );
  const [rules, setRules] = useState<PersonalRule[]>(() =>
    safeGetStorage('cuongisme_p_rules', [
      {
        id: 'rule-1',
        name: 'Tự động giao diện ban đêm',
        trigger: 'time_of_day',
        condition: { field: 'hour', operator: 'greater_than', value: 19 },
        action: 'apply_theme',
        actionPayload: 'preset-obsidian',
        isEnabled: true,
      },
    ])
  );
  const [presets, setPresets] = useState<DesignPreset[]>(() => {
    const userSaved = safeGetStorage<DesignPreset[]>('cuongisme_p_user_presets', []);
    return [...MASTER_DESIGN_PRESETS, ...userSaved];
  });

  // Revision History Stacks
  const [history, setHistory] = useState<ConfigRevision[]>(() =>
    safeGetStorage('cuongisme_p_history', [])
  );
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // UI Studio & Modal Modals
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState('presets');
  const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive active workspace
  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || DEFAULT_WORKSPACES[0];
  const blocks = activeWorkspace.blocks || DEFAULT_BLOCKS;

  // 2. CSS Custom Property Injector Engine
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Apply color palette
    root.style.setProperty('--p-primary', appearance.colors.primary);
    root.style.setProperty('--p-secondary', appearance.colors.secondary);
    root.style.setProperty('--p-accent', appearance.colors.accent);
    root.style.setProperty('--p-bg', appearance.colors.background);
    root.style.setProperty('--p-surface', appearance.colors.surface);
    root.style.setProperty('--p-surface-elevated', appearance.colors.surfaceElevated);
    root.style.setProperty('--p-text', appearance.colors.text);
    root.style.setProperty('--p-text-muted', appearance.colors.textMuted);
    root.style.setProperty('--p-border', appearance.colors.border);

    // Apply typography
    root.style.setProperty('--p-font-family', appearance.typography.fontFamily);
    root.style.setProperty('--p-heading-font', appearance.typography.headingFont);
    root.style.setProperty('--p-font-scale', String(appearance.typography.fontScale));
    root.style.setProperty('--p-heading-scale', String(appearance.typography.headingScale));

    // Apply shapes & radiuses
    root.style.setProperty('--p-card-radius', appearance.shape.cardRadius);
    root.style.setProperty('--p-btn-radius', appearance.shape.buttonRadius);
    root.style.setProperty('--p-input-radius', appearance.shape.inputRadius);
    root.style.setProperty('--p-avatar-radius', appearance.shape.avatarRadius);
  }, [appearance]);

  // 3. Debounced Persistent Sync (LocalStorage + Supabase)
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      // Ensure identity is always stripped of obsolete relationshipStart
      const cleanIdentity = { ...identity };
      delete (cleanIdentity as any).relationshipStart;

      safeSetStorage('cuongisme_p_appearance', appearance);
      safeSetStorage('cuongisme_p_background', background);
      safeSetStorage('cuongisme_p_identity', cleanIdentity);
      safeSetStorage('cuongisme_p_workspaces', workspaces);
      safeSetStorage('cuongisme_p_active_ws', activeWorkspaceId);
      safeSetStorage('cuongisme_p_custom_pages', customPages);
      safeSetStorage('cuongisme_p_navigation', navigation);
      safeSetStorage('cuongisme_p_assets', assets);
      safeSetStorage('cuongisme_p_saved_views', savedViews);
      safeSetStorage('cuongisme_p_rules', rules);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('user_personalization').upsert(
            {
              id: '00000000-0000-0000-0000-000000000001',
              appearance,
              background,
              identity: cleanIdentity,
              navigation,
              active_workspace_id: activeWorkspaceId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (e) {
          // Local fallback
        }
      }
    }, 400);
  }, [
    appearance,
    background,
    identity,
    workspaces,
    activeWorkspaceId,
    customPages,
    navigation,
    assets,
    savedViews,
    rules,
  ]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    scheduleSave();
  }, [scheduleSave]);

  // Load Remote Personalization on init
  useEffect(() => {
    if (!isSupabaseConfigured) {
      isHydratedRef.current = true;
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_personalization')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          if (data.appearance) setAppearance(data.appearance);
          if (data.background) setBackground(data.background);
          if (data.identity) {
            const clean = { ...data.identity };
            delete clean.relationshipStart;
            setIdentity(clean);
          }
          if (data.navigation) setNavigation(data.navigation);
          if (data.active_workspace_id) setActiveWorkspaceId(data.active_workspace_id);
        }
      } catch (err) {
        console.warn('[Personalization] Using local cached state');
      } finally {
        isHydratedRef.current = true;
      }
    })();
  }, []);

  // 4. Snapshot & Revision Management
  const createSnapshot = useCallback(
    (label: string) => {
      const snapshotItem: ConfigRevision = {
        id: 'rev-' + Date.now(),
        timestamp: new Date().toISOString(),
        label,
        snapshot: {
          appearance,
          background,
          identity,
          workspaces,
          activeWorkspaceId,
          navigation,
        },
      };
      setHistory((prev) => [snapshotItem, ...prev.slice(0, 30)]);
      safeSetStorage('cuongisme_p_history', [snapshotItem, ...history.slice(0, 30)]);
      setHistoryIndex(0);
    },
    [appearance, background, identity, workspaces, activeWorkspaceId, navigation, history]
  );

  const undo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetSnapshot = history[nextIndex];
      if (targetSnapshot) {
        setAppearance(targetSnapshot.snapshot.appearance);
        setBackground(targetSnapshot.snapshot.background);
        setIdentity(targetSnapshot.snapshot.identity);
        setWorkspaces(targetSnapshot.snapshot.workspaces);
        setActiveWorkspaceId(targetSnapshot.snapshot.activeWorkspaceId);
        setNavigation(targetSnapshot.snapshot.navigation);
        setHistoryIndex(nextIndex);
        return true;
      }
    }
    return false;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const targetSnapshot = history[nextIndex];
      if (targetSnapshot) {
        setAppearance(targetSnapshot.snapshot.appearance);
        setBackground(targetSnapshot.snapshot.background);
        setIdentity(targetSnapshot.snapshot.identity);
        setWorkspaces(targetSnapshot.snapshot.workspaces);
        setActiveWorkspaceId(targetSnapshot.snapshot.activeWorkspaceId);
        setNavigation(targetSnapshot.snapshot.navigation);
        setHistoryIndex(nextIndex);
        return true;
      }
    }
    return false;
  }, [history, historyIndex]);

  // 5. Granular Updaters
  const updateAppearance = useCallback((updates: Partial<AppearanceTheme>) => {
    setAppearance((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateColors = useCallback((colors: Partial<AppearanceTheme['colors']>) => {
    setAppearance((prev) => ({
      ...prev,
      colors: { ...prev.colors, ...colors },
    }));
  }, []);

  const updateTypography = useCallback((typography: Partial<AppearanceTheme['typography']>) => {
    setAppearance((prev) => ({
      ...prev,
      typography: { ...prev.typography, ...typography },
    }));
  }, []);

  const updateShape = useCallback((shape: Partial<AppearanceTheme['shape']>) => {
    setAppearance((prev) => ({
      ...prev,
      shape: { ...prev.shape, ...shape },
    }));
  }, []);

  const updateBackground = useCallback((updates: Partial<BackgroundConfig>) => {
    setBackground((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateIdentity = useCallback((updates: Partial<PersonalIdentity>) => {
    setIdentity((prev) => {
      const merged = { ...prev, ...updates };
      delete (merged as any).relationshipStart;
      return merged;
    });
  }, []);

  // 6. Workspace Operations
  const switchWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    safeSetStorage('cuongisme_p_active_ws', id);
  }, []);

  const createWorkspace = useCallback(
    (name: string, icon = 'Heart', description = ''): string => {
      const newWsId = 'ws-' + Date.now();
      const newWs: Workspace = {
        id: newWsId,
        name,
        icon,
        description,
        isDefault: false,
        layoutMode: 'bento',
        blocks: [...DEFAULT_BLOCKS],
      };
      setWorkspaces((prev) => [...prev, newWs]);
      setActiveWorkspaceId(newWsId);
      return newWsId;
    },
    []
  );

  const updateWorkspace = useCallback((id: string, updates: Partial<Workspace>) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, ...updates, updatedAt: new Date().toISOString() } : ws))
    );
  }, []);

  const deleteWorkspace = useCallback(
    (id: string) => {
      if (workspaces.length <= 1) return;
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
      if (activeWorkspaceId === id) {
        const remaining = workspaces.filter((ws) => ws.id !== id);
        setActiveWorkspaceId(remaining[0].id);
      }
    },
    [workspaces, activeWorkspaceId]
  );

  // 7. Blocks & Dashboard Layout Operations
  const updateWorkspaceBlocks = useCallback(
    (updater: (prevBlocks: WorkspaceBlock[]) => WorkspaceBlock[]) => {
      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === activeWorkspaceId ? { ...ws, blocks: updater(ws.blocks || []) } : ws))
      );
    },
    [activeWorkspaceId]
  );

  const addBlock = useCallback(
    (type: WidgetType, size: BlockSize = '1x1', title?: string) => {
      const newBlock: WorkspaceBlock = {
        id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        title,
        size,
        order: blocks.length,
        isVisible: true,
        isLocked: false,
      };
      updateWorkspaceBlocks((prev) => [...prev, newBlock]);
    },
    [blocks.length, updateWorkspaceBlocks]
  );

  const removeBlock = useCallback(
    (id: string) => {
      updateWorkspaceBlocks((prev) => prev.filter((b) => b.id !== id));
    },
    [updateWorkspaceBlocks]
  );

  const updateBlock = useCallback(
    (id: string, updates: Partial<WorkspaceBlock>) => {
      updateWorkspaceBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    },
    [updateWorkspaceBlocks]
  );

  const reorderBlocks = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateWorkspaceBlocks((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return updated.map((b, idx) => ({ ...b, order: idx }));
      });
    },
    [updateWorkspaceBlocks]
  );

  const resizeBlock = useCallback(
    (id: string, size: BlockSize) => {
      updateBlock(id, { size });
    },
    [updateBlock]
  );

  const toggleBlockVisibility = useCallback(
    (id: string) => {
      updateWorkspaceBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isVisible: !b.isVisible } : b))
      );
    },
    [updateWorkspaceBlocks]
  );

  const toggleBlockLock = useCallback(
    (id: string) => {
      updateWorkspaceBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isLocked: !b.isLocked } : b))
      );
    },
    [updateWorkspaceBlocks]
  );

  const toggleBlockCollapse = useCallback(
    (id: string) => {
      updateWorkspaceBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isCollapsed: !b.isCollapsed } : b))
      );
    },
    [updateWorkspaceBlocks]
  );

  const resetBlocksToDefault = useCallback(() => {
    updateWorkspaceBlocks(() => [...DEFAULT_BLOCKS]);
  }, [updateWorkspaceBlocks]);

  // 8. Custom Pages Operations
  const createCustomPage = useCallback(
    (title: string, icon = 'FileText', description = ''): string => {
      const pageId = 'page-' + Date.now();
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const newPage: CustomPage = {
        id: pageId,
        workspaceId: activeWorkspaceId,
        title,
        slug: slug || pageId,
        icon,
        description,
        blocks: [
          { id: 'b-p1', type: 'custom_markdown', size: 'full', order: 0, isVisible: true, isLocked: false },
          { id: 'b-p2', type: 'photo_gallery', size: '2x1', order: 1, isVisible: true, isLocked: false },
          { id: 'b-p3', type: 'hub_notes', size: '1x1', order: 2, isVisible: true, isLocked: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCustomPages((prev) => [...prev, newPage]);

      // Add to navigation automatically
      setNavigation((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            id: 'nav-' + pageId,
            label: title,
            to: `/page/${pageId}`,
            icon,
            isPinned: true,
            isHidden: false,
            isCustom: true,
            order: prev.items.length,
          },
        ],
      }));

      return pageId;
    },
    [activeWorkspaceId]
  );

  const updateCustomPage = useCallback((id: string, updates: Partial<CustomPage>) => {
    setCustomPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  }, []);

  const deleteCustomPage = useCallback((id: string) => {
    setCustomPages((prev) => prev.filter((p) => p.id !== id));
    setNavigation((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.to !== `/page/${id}`),
    }));
  }, []);

  // 9. Navigation Operations
  const updateNavigation = useCallback((updates: Partial<NavigationConfig>) => {
    setNavigation((prev) => ({ ...prev, ...updates }));
  }, []);

  const reorderNavItems = useCallback((fromIndex: number, toIndex: number) => {
    setNavigation((prev) => {
      const updated = [...prev.items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { ...prev, items: updated.map((item, idx) => ({ ...item, order: idx })) };
    });
  }, []);

  const toggleNavItemPin = useCallback((id: string) => {
    setNavigation((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, isPinned: !it.isPinned } : it)),
    }));
  }, []);

  const toggleNavItemHidden = useCallback((id: string) => {
    setNavigation((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, isHidden: !it.isHidden } : it)),
    }));
  }, []);

  // 10. User Asset Library
  const addAsset = useCallback((asset: Omit<UserAsset, 'id' | 'createdAt'>): string => {
    const id = 'asset-' + Date.now();
    const newAsset: UserAsset = {
      ...asset,
      id,
      createdAt: new Date().toISOString(),
    };
    setAssets((prev) => [newAsset, ...prev]);
    return id;
  }, []);

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleAssetFavorite = useCallback((id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFavorite: !a.isFavorite } : a))
    );
  }, []);

  // 11. Saved Views
  const createSavedView = useCallback((view: Omit<SavedView, 'id' | 'createdAt'>): string => {
    const id = 'view-' + Date.now();
    const newView: SavedView = { ...view, id, createdAt: new Date().toISOString() };
    setSavedViews((prev) => [newView, ...prev]);
    return id;
  }, []);

  const deleteSavedView = useCallback((id: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // 12. Personal Rules
  const createRule = useCallback((rule: Omit<PersonalRule, 'id'>): string => {
    const id = 'rule-' + Date.now();
    const newRule: PersonalRule = { ...rule, id };
    setRules((prev) => [...prev, newRule]);
    return id;
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<PersonalRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r)));
  }, []);

  // 13. Presets & Sharing
  const applyPreset = useCallback(
    (preset: DesignPreset) => {
      createSnapshot(`Applied preset ${preset.name}`);
      setAppearance(preset.appearance);
      setBackground(preset.background);
      if (preset.navigationStyle) {
        setNavigation((prev) => ({ ...prev, style: preset.navigationStyle }));
      }
      if (preset.identityDecoration?.profileAccent) {
        setIdentity((prev) => ({ ...prev, profileAccent: preset.identityDecoration!.profileAccent! }));
      }
      if (preset.identityDecoration?.badge) {
        setIdentity((prev) => ({ ...prev, badge: preset.identityDecoration!.badge! }));
      }
    },
    [createSnapshot]
  );

  const saveCurrentAsPreset = useCallback(
    (name: string, description = '', category = 'Custom'): string => {
      const presetId = 'custom-preset-' + Date.now();
      const newPreset: DesignPreset = {
        id: presetId,
        name,
        description,
        category,
        author: identity.displayName || 'Me',
        version: '1.0.0',
        tags: ['custom', 'saved'],
        appearance,
        background,
        navigationStyle: navigation.style,
        identityDecoration: {
          badge: identity.badge,
          profileAccent: identity.profileAccent,
        },
      };
      setPresets((prev) => [...prev, newPreset]);
      const currentCustom = safeGetStorage<DesignPreset[]>('cuongisme_p_user_presets', []);
      safeSetStorage('cuongisme_p_user_presets', [...currentCustom, newPreset]);
      return presetId;
    },
    [appearance, background, navigation.style, identity]
  );

  const exportDesignJson = useCallback(() => {
    const exportBundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      theme: appearance,
      background,
      navigationStyle: navigation.style,
      badge: identity.badge,
      profileAccent: identity.profileAccent,
    };
    return JSON.stringify(exportBundle, null, 2);
  }, [appearance, background, navigation.style, identity.badge, identity.profileAccent]);

  const importDesignJson = useCallback(
    (jsonStr: string): boolean => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.theme && parsed.background) {
          createSnapshot('Imported Design');
          setAppearance(parsed.theme);
          setBackground(parsed.background);
          if (parsed.navigationStyle) {
            setNavigation((prev) => ({ ...prev, style: parsed.navigationStyle }));
          }
          if (parsed.profileAccent) {
            setIdentity((prev) => ({ ...prev, profileAccent: parsed.profileAccent }));
          }
          return true;
        }
        return false;
      } catch (e) {
        console.error('Invalid design json:', e);
        return false;
      }
    },
    [createSnapshot]
  );

  const resetAllPersonalization = useCallback(() => {
    createSnapshot('Reset All Personalization');
    setAppearance(DEFAULT_APPEARANCE);
    setBackground(DEFAULT_BACKGROUND);
    setIdentity(DEFAULT_IDENTITY);
    setWorkspaces(DEFAULT_WORKSPACES);
    setActiveWorkspaceId('ws-main');
    setNavigation(DEFAULT_NAVIGATION);
  }, [createSnapshot]);

  return (
    <PersonalizationContext.Provider
      value={{
        appearance,
        updateAppearance,
        updateColors,
        updateTypography,
        updateShape,
        background,
        updateBackground,
        identity,
        updateIdentity,
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        switchWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        blocks,
        addBlock,
        removeBlock,
        updateBlock,
        reorderBlocks,
        resizeBlock,
        toggleBlockVisibility,
        toggleBlockLock,
        toggleBlockCollapse,
        resetBlocksToDefault,
        customPages,
        createCustomPage,
        updateCustomPage,
        deleteCustomPage,
        navigation,
        updateNavigation,
        reorderNavItems,
        toggleNavItemPin,
        toggleNavItemHidden,
        assets,
        addAsset,
        removeAsset,
        toggleAssetFavorite,
        savedViews,
        createSavedView,
        deleteSavedView,
        rules,
        createRule,
        updateRule,
        deleteRule,
        toggleRule,
        presets,
        applyPreset,
        saveCurrentAsPreset,
        exportDesignJson,
        importDesignJson,
        revisions: history,
        createSnapshot,
        undo,
        redo,
        canUndo: historyIndex < history.length - 1 && history.length > 0,
        canRedo: historyIndex > 0,
        resetAllPersonalization,
        isStudioOpen,
        setIsStudioOpen,
        activeStudioTab,
        setActiveStudioTab,
        isAssetLibraryOpen,
        setIsAssetLibraryOpen,
        isEditMode,
        setIsEditMode,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error('usePersonalization must be used within PersonalizationProvider');
  return ctx;
}
