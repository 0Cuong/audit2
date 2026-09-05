import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Heart, 
  Globe, 
  Palette, 
  Link as LinkIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  Check, 
  Instagram, 
  Facebook, 
  Youtube, 
  Github, 
  Mail, 
  Send, 
  MessageSquare, 
  Loader2,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import { useApp, type ThemeId, themeConfig } from '../contexts/AppContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { supabase } from '../lib/supabase';
import type { Lang } from '../i18n/translations';

interface ContactLink {
  label: string;
  url: string;
  icon: string;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: TikTokIcon,
  youtube: Youtube,
  discord: MessageSquare,
  telegram: Send,
  github: Github,
  email: Mail,
  website: Globe
};

const formatDateTimeForInput = (dateTimeStr: string | null | undefined): string => {
  if (!dateTimeStr) return '';
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch (e) {
    return '';
  }
};

export default function SettingsPage() {
  const { t, lang, setLang, theme, setTheme, profile, settings, refreshSettings, updateProfile } = useApp();
  const { setIsStudioOpen, identity, updateIdentity } = usePersonalization();
  const [tab, setTab] = useState<'profile' | 'appearance' | 'links' | 'privacy'>('profile');
  
  // Profile States
  const [p1Name, setP1Name] = useState(profile?.partner1_name || identity.partner1Name || '');
  const [p2Name, setP2Name] = useState(profile?.partner2_name || identity.partner2Name || '');
  const [p1Bday, setP1Bday] = useState(profile?.partner1_birthday || '');
  const [p2Bday, setP2Bday] = useState(profile?.partner2_birthday || '');
  const [relStart, setRelStart] = useState(() => formatDateTimeForInput(profile?.relationship_start));
  const [relStatus, setRelStatus] = useState(profile?.relationship_status || 'dating');
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Links States
  const [contactLinks, setContactLinks] = useState<ContactLink[]>(settings?.contact_links || []);
  const [newLink, setNewLink] = useState<ContactLink>({ label: '', url: '', icon: 'website' });
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [linksSaved, setLinksSaved] = useState(false);
  
  // Inline Link Editing States
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editIcon, setEditIcon] = useState('website');

  // Privacy States
  const [privacyPassword, setPrivacyPassword] = useState(settings?.privacy_password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  const initializedProfileId = useRef<string | null>(null);
  const isProfileDirtyRef = useRef(false);
  const initializedSettingsId = useRef<string | null>(null);

  useEffect(() => {
    if (profile && (!initializedProfileId.current || (profile.id !== initializedProfileId.current && !isProfileDirtyRef.current))) {
      setP1Name(profile.partner1_name || '');
      setP2Name(profile.partner2_name || '');
      setP1Bday(profile.partner1_birthday || '');
      setP2Bday(profile.partner2_birthday || '');
      setRelStart(formatDateTimeForInput(profile.relationship_start));
      setRelStatus(profile.relationship_status || 'dating');
      initializedProfileId.current = profile.id;
    }
  }, [profile]);

  useEffect(() => {
    if (settings && settings.id !== initializedSettingsId.current) {
      setContactLinks(settings.contact_links || []);
      setPrivacyPassword(settings.privacy_password || '');
      initializedSettingsId.current = settings.id;
    }
  }, [settings]);

  const formatUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      if (!relStart.trim()) {
        setProfileError('Vui lòng chọn ngày và giờ bắt đầu yêu nhau');
        setIsSavingProfile(false);
        return;
      }

      const dateObj = new Date(relStart);
      if (isNaN(dateObj.getTime())) {
        setProfileError('Định dạng ngày bắt đầu không hợp lệ');
        setIsSavingProfile(false);
        return;
      }

      const isoRelStart = dateObj.toISOString();

      // Update the authoritative couple_profile source
      const res = await updateProfile({
        partner1_name: p1Name.trim(),
        partner2_name: p2Name.trim(),
        partner1_birthday: p1Bday || null,
        partner2_birthday: p2Bday || null,
        relationship_start: isoRelStart,
        relationship_status: relStatus,
      });

      if (!res.success) {
        setProfileError(res.error || 'Lưu hồ sơ thất bại. Vui lòng kiểm tra lại kết nối.');
        return;
      }

      // Sync display names & status in identity without dual-writing relationshipStart
      updateIdentity({
        partner1Name: p1Name.trim(),
        partner2Name: p2Name.trim(),
        relationshipStatus: relStatus,
      });

      isProfileDirtyRef.current = false;
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setProfileError(err?.message || 'Đã xảy ra lỗi khi lưu hồ sơ');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveLinks = async () => {
    setIsSavingLinks(true);
    try {
      if (settings?.id && settings.id !== 'default-settings') {
        await supabase.from('settings').update({ contact_links: contactLinks }).eq('id', settings.id);
        await refreshSettings();
      } else {
        localStorage.setItem('cuongisme_settings', JSON.stringify({ ...settings, contact_links: contactLinks }));
      }
      setLinksSaved(true);
      setTimeout(() => setLinksSaved(false), 2000);
    } catch (err) {
      console.error('Error updating links:', err);
    } finally {
      setIsSavingLinks(false);
    }
  };

  const addLink = () => {
    if (!newLink.label || !newLink.url) return;
    const cleanLink = {
      ...newLink,
      url: formatUrl(newLink.url)
    };
    setContactLinks(prev => [...prev, cleanLink]);
    setNewLink({ label: '', url: '', icon: 'website' });
  };

  const removeLink = (i: number) => {
    setContactLinks(prev => prev.filter((_, j) => j !== i));
    if (editingIndex === i) {
      setEditingIndex(null);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditLabel(contactLinks[index].label);
    setEditUrl(contactLinks[index].url);
    setEditIcon(contactLinks[index].icon || 'website');
  };

  const saveEditedLink = (index: number) => {
    if (!editLabel || !editUrl) return;
    setContactLinks(prev =>
      prev.map((item, idx) => (idx === index ? { label: editLabel, url: formatUrl(editUrl), icon: editIcon } : item))
    );
    setEditingIndex(null);
  };

  const togglePrivacyMode = async () => {
    setIsTogglingPrivacy(true);
    try {
      const updatedMode = !settings?.privacy_mode;
      if (settings?.id && settings.id !== 'default-settings') {
        await supabase.from('settings').update({ privacy_mode: updatedMode }).eq('id', settings.id);
        await refreshSettings();
      } else {
        localStorage.setItem('cuongisme_settings', JSON.stringify({ ...settings, privacy_mode: updatedMode }));
      }
    } catch (err) {
      console.error('Error toggling privacy mode:', err);
    } finally {
      setIsTogglingPrivacy(false);
    }
  };

  const savePrivacyPassword = async () => {
    setIsSavingPrivacy(true);
    try {
      if (settings?.id && settings.id !== 'default-settings') {
        await supabase.from('settings').update({ privacy_password: privacyPassword }).eq('id', settings.id);
        await refreshSettings();
      } else {
        localStorage.setItem('cuongisme_settings', JSON.stringify({ ...settings, privacy_password: privacyPassword }));
      }
      setPrivacySaved(true);
      setTimeout(() => setPrivacySaved(false), 2000);
    } catch (err) {
      console.error('Error saving password:', err);
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const tabs = [
    { key: 'profile' as const, label: t('settings.profile'), icon: Heart },
    { key: 'appearance' as const, label: t('settings.theme'), icon: Palette },
    { key: 'links' as const, label: t('settings.links'), icon: LinkIcon },
    { key: 'privacy' as const, label: t('settings.privacy'), icon: Lock },
  ];

  const themeKeys: ThemeId[] = ['dark', 'light', 'purple', 'pink', 'emerald', 'sunset', 'midnight'];

  return (
    <main className="pt-24 pb-12 min-h-screen">
      <div className="section-container max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title gradient-text">{t('settings.title')}</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">Cấu hình hồ sơ, quyền riêng tư và hệ thống</p>
          </div>

          <button
            type="button"
            onClick={() => setIsStudioOpen(true)}
            className="btn-pill gradient-accent self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Mở Studio</span>
          </button>
        </motion.div>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-2xl transition ${
                tab === tb.key ? 'gradient-accent text-white shadow-sm' : `glass text-zinc-400 border border-white/10`
              }`}
            >
              <tb.icon className="w-3.5 h-3.5" /> {tb.label}
            </button>
          ))}
        </div>

        {/* Profile Settings */}
        {tab === 'profile' && (
          <div className="glass rounded-3xl p-6 sm:p-7 space-y-4 max-w-xl border border-white/10 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 mb-2">{t('common.partner1')}</h3>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={p1Name}
                  onChange={e => {
                    isProfileDirtyRef.current = true;
                    setProfileError(null);
                    setP1Name(e.target.value);
                  }}
                  placeholder="Tên chàng"
                  className="w-full px-4 py-2.5 glass rounded-xl text-sm text-zinc-100 bg-transparent outline-none border border-white/10 focus:border-rose-500"
                />
                <input
                  type="date"
                  value={p1Bday}
                  onChange={e => {
                    isProfileDirtyRef.current = true;
                    setProfileError(null);
                    setP1Bday(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 glass rounded-xl text-xs text-zinc-100 bg-transparent outline-none border border-white/10 focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-100 mb-2 pt-2">{t('common.partner2')}</h3>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={p2Name}
                  onChange={e => {
                    isProfileDirtyRef.current = true;
                    setProfileError(null);
                    setP2Name(e.target.value);
                  }}
                  placeholder="Tên nàng"
                  className="w-full px-4 py-2.5 glass rounded-xl text-sm text-zinc-100 bg-transparent outline-none border border-white/10 focus:border-rose-500"
                />
                <input
                  type="date"
                  value={p2Bday}
                  onChange={e => {
                    isProfileDirtyRef.current = true;
                    setProfileError(null);
                    setP2Bday(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 glass rounded-xl text-xs text-zinc-100 bg-transparent outline-none border border-white/10 focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-100 mb-2 pt-2">Ngày bắt đầu yêu nhau</h3>
              <div className="space-y-2.5">
                <input
                  type="datetime-local"
                  value={relStart}
                  onChange={e => {
                    isProfileDirtyRef.current = true;
                    setProfileError(null);
                    setRelStart(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 glass rounded-xl text-sm text-zinc-100 bg-transparent outline-none border border-white/10 focus:border-rose-500"
                />
                <select
                  value={relStatus}
                  onChange={e => {
                    isProfileDirtyRef.current = true;
                    setProfileError(null);
                    setRelStatus(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 glass rounded-xl text-sm bg-neutral-900 text-zinc-100 outline-none border border-white/10"
                >
                  <option value="dating" className="bg-neutral-900 text-white">Đang hẹn hò (Dating)</option>
                  <option value="engaged" className="bg-neutral-900 text-white">Đã đính hôn (Engaged)</option>
                  <option value="married" className="bg-neutral-900 text-white">Đã kết hôn (Married)</option>
                  <option value="custom" className="bg-neutral-900 text-white">Khác (Custom)</option>
                </select>
              </div>
            </div>

            {profileError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <button
              onClick={saveProfile}
              disabled={isSavingProfile}
              className={`w-full mt-4 py-3 gradient-accent rounded-2xl text-sm text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md ${
                isSavingProfile ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSavingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSavingProfile ? 'Đang lưu...' : profileSaved ? 'Đã lưu thành công!' : t('common.save')}
            </button>
          </div>
        )}

        {/* Appearance & Themes */}
        {tab === 'appearance' && (
          <div className="space-y-6 max-w-xl">
            {/* Banner linking to full Studio */}
            <div className="glass p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 flex items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1">Studio giao diện</h3>
                <p className="text-xs text-zinc-400">
                  Tùy chỉnh màu sắc, phông chữ, hình nền và bố cục.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className="btn-pill gradient-accent shrink-0"
              >
                Mở Studio
              </button>
            </div>

            <div className="glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-500" /> {t('settings.language')}
              </h3>
              <div className="flex gap-3">
                {(['vi', 'en'] as Lang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition ${
                      lang === l ? 'gradient-accent text-white shadow-md' : 'glass text-zinc-400 border border-white/10'
                    }`}
                  >
                    {l === 'vi' ? 'Tiếng Việt' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-rose-500" /> {t('settings.theme')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {themeKeys.map(th => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={`p-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-between border ${
                      theme === th ? 'ring-2 ring-rose-500 scale-102 shadow-md' : 'opacity-80 hover:opacity-100'
                    } ${themeConfig[th].card} ${themeConfig[th].border} ${themeConfig[th].text}`}
                  >
                    <span>{t(`theme.${th}`)}</span>
                    {theme === th && <Check className="w-3.5 h-3.5 text-rose-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Links Settings */}
        {tab === 'links' && (
          <div className="glass rounded-3xl p-6 sm:p-7 max-w-xl space-y-4 border border-white/10 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-100">{t('settings.links')}</h3>
            
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {contactLinks.map((link, i) => {
                const IconComponent = socialIcons[link.icon.toLowerCase()] || Globe;
                return (
                  <div key={i} className="glass p-3 rounded-2xl flex flex-col gap-2 border border-white/10">
                    {editingIndex === i ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select
                            value={editIcon}
                            onChange={e => setEditIcon(e.target.value)}
                            className="px-2 py-1.5 glass rounded-xl text-xs bg-neutral-900 text-white outline-none"
                          >
                            {Object.keys(socialIcons).map(k => (
                              <option key={k} value={k} className="bg-neutral-900 text-white">
                                {k.toUpperCase()}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editLabel}
                            onChange={e => setEditLabel(e.target.value)}
                            placeholder="Label"
                            className="flex-1 px-3 py-1.5 glass rounded-xl text-xs text-zinc-100 bg-transparent outline-none border border-white/10"
                          />
                        </div>
                        <input
                          type="text"
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          placeholder="URL"
                          className="w-full px-3 py-1.5 glass rounded-xl text-xs text-zinc-100 bg-transparent outline-none border border-white/10"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="p-1 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs transition"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => saveEditedLink(i)}
                            className="p-1 px-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-rose-500">
                            <IconComponent className="w-4 h-4" />
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-zinc-100 truncate">{link.label}</p>
                            <p className="text-[10px] text-zinc-400 truncate">{link.url}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => startEditing(i)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeLink(i)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {contactLinks.length === 0 && (
                <p className="text-xs text-center py-6 text-zinc-500">Chưa có liên kết nào.</p>
              )}
            </div>

            {/* Add new link form */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-xs font-bold text-zinc-400">Thêm liên kết mới</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newLink.label}
                  onChange={e => setNewLink(p => ({ ...p, label: e.target.value }))}
                  placeholder="Tên (VD: Instagram)"
                  className="w-full px-3 py-2 glass rounded-xl text-xs text-zinc-100 bg-transparent outline-none border border-white/10"
                />
                <select
                  value={newLink.icon}
                  onChange={e => setNewLink(p => ({ ...p, icon: e.target.value }))}
                  className="w-full px-3 py-2 glass rounded-xl text-xs bg-neutral-900 text-zinc-100 outline-none border border-white/10"
                >
                  {Object.keys(socialIcons).map(k => (
                    <option key={k} value={k} className="bg-neutral-900 text-white">
                      {k.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={newLink.url}
                onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                placeholder="Đường dẫn URL (https://...)"
                className="w-full px-3 py-2 glass rounded-xl text-xs text-zinc-100 bg-transparent outline-none border border-white/10"
              />
              <button
                onClick={addLink}
                className="w-full py-2 glass hover:bg-white/10 rounded-xl text-xs font-semibold text-zinc-200 transition border border-white/10"
              >
                + {t('common.add')}
              </button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={saveLinks}
                disabled={isSavingLinks}
                className={`w-full py-3 gradient-accent rounded-2xl text-sm text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md ${
                  isSavingLinks ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSavingLinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSavingLinks ? 'Đang lưu...' : linksSaved ? 'Đã lưu thành công!' : t('common.save')}
              </button>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {tab === 'privacy' && (
          <div className="glass rounded-3xl p-6 sm:p-7 max-w-xl space-y-4 border border-white/10 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" /> {t('settings.privacy')}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Chế độ riêng tư bảo vệ góc nhỏ tình yêu bằng mật khẩu. Khi bật, khách truy cập cần nhập mật khẩu để mở khóa các nội dung bí mật.
            </p>
            
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={togglePrivacyMode}
                disabled={isTogglingPrivacy}
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors outline-none ${
                  isTogglingPrivacy ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  settings?.privacy_mode ? 'gradient-accent' : 'bg-black/10 dark:bg-white/10'
                }`}
                aria-checked={settings?.privacy_mode}
                role="switch"
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings?.privacy_mode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                {settings?.privacy_mode ? 'Đang kích hoạt chế độ riêng tư' : 'Chế độ công khai'}
              </span>
            </div>

            {settings?.privacy_mode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 border-t border-white/10 space-y-3"
              >
                <label className="text-xs font-bold text-zinc-200">
                  Mật khẩu bảo vệ
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={privacyPassword}
                    onChange={e => setPrivacyPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-4 pr-10 py-2.5 glass rounded-xl text-sm text-zinc-100 bg-transparent outline-none border border-white/10 focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={savePrivacyPassword}
                  disabled={isSavingPrivacy}
                  className={`w-full py-2.5 gradient-accent rounded-xl text-sm text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md ${
                    isSavingPrivacy ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSavingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingPrivacy ? 'Đang lưu...' : privacySaved ? 'Đã cập nhật mật khẩu!' : t('common.save')}
                </button>
              </motion.div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}