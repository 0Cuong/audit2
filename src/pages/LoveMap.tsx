import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Trash2,
  X,
  Navigation,
  Compass,
  ExternalLink,
  Search,
  Edit3,
  Crosshair,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Map as MapIcon,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { safeGetStorage, safeSetStorage } from '../lib/storage';

export type LocationType = 'where_met' | 'date' | 'trip' | 'special' | 'future';
export type LocationSource = 'search' | 'gps' | 'manual';

export interface MapLocation {
  id: string;
  title: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  location_type: LocationType;
  created_at?: string;
  updated_at?: string;
  couple_id?: string;
}

interface GeocodingResult {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
}

interface SelectedLocationState {
  latitude: number;
  longitude: number;
  address?: string;
  source: LocationSource;
}

const TYPE_STYLES: Record<LocationType, { bg: string; text: string; ring: string; badge: string }> = {
  where_met: { bg: 'bg-rose-500', text: 'text-rose-400', ring: 'ring-rose-500/40', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  date: { bg: 'bg-pink-500', text: 'text-pink-400', ring: 'ring-pink-500/40', badge: 'bg-pink-500/10 text-pink-300 border-pink-500/20' },
  trip: { bg: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500/40', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  special: { bg: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/40', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  future: { bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/40', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
};

/**
 * Hàm kiểm tra tọa độ hợp lệ, chấp nhận giá trị 0 (Xích đạo / Kinh tuyến gốc)
 */
function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export default function LoveMap() {
  const { t, profile } = useApp();
  const modalHeadingId = useId();

  // Danh sách địa điểm gốc (Không sinh dữ liệu giả)
  const [locations, setLocations] = useState<MapLocation[]>(() => {
    return safeGetStorage<MapLocation[]>('cuongisme_locations', []);
  });

  const [activeLocation, setActiveLocation] = useState<MapLocation | null>(() => {
    const saved = safeGetStorage<MapLocation[]>('cuongisme_locations', []);
    return saved.length > 0 ? saved[0] : null;
  });

  const [filter, setFilter] = useState<'all' | LocationType>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<MapLocation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Trạng thái Form
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<LocationType>('date');
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationState | null>(null);

  // Tab chọn tọa độ & Inputs tạm thời
  const [inputMode, setInputMode] = useState<LocationSource>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [manualLatInput, setManualLatInput] = useState('');
  const [manualLngInput, setManualLngInput] = useState('');
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Refs quản lý bất đồng bộ
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Tải và đồng bộ dữ liệu từ Supabase khi khởi chạy
  useEffect(() => {
    let isMounted = true;
    if (!isSupabaseConfigured) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('map_locations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (error) {
          console.error('[LoveMap] Không thể tải từ Supabase:', error);
          setStatusMessage({ type: 'info', text: 'Đang hiển thị dữ liệu lưu cục bộ trên thiết bị.' });
          return;
        }

        if (data) {
          setLocations(data);
          safeSetStorage('cuongisme_locations', data);
          setActiveLocation((prev) => {
            if (data.length === 0) return null;
            if (!prev) return data[0];
            const exists = data.find((l) => l.id === prev.id);
            return exists || data[0];
          });
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[LoveMap] Ngoại lệ kết nối máy chủ:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Dọn dẹp Timeout & AbortController khi unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (searchAbortControllerRef.current) searchAbortControllerRef.current.abort();
    };
  }, []);

  // 3. Tự tắt Toast sau 4.5s
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // 4. Lắng nghe phím ESC để đóng modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSaving]);

  // Đồng bộ Filter với Active Location (Tránh trạng thái mâu thuẫn)
  const handleFilterChange = (newFilter: 'all' | LocationType) => {
    setFilter(newFilter);
    const filtered = newFilter === 'all' ? locations : locations.filter((l) => l.location_type === newFilter);
    if (filtered.length > 0) {
      if (!activeLocation || (newFilter !== 'all' && activeLocation.location_type !== newFilter)) {
        setActiveLocation(filtered[0]);
      }
    } else {
      setActiveLocation(null);
    }
  };

  // Tìm kiếm địa điểm an toàn (Debounced + Abort Request)
  const executeSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    setIsSearching(true);
    setSearchError(null);

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`,
      {
        signal: abortController.signal,
        headers: { 'Accept-Language': 'vi,en;q=0.9' },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error('Không thể kết nối đến máy chủ tìm kiếm địa điểm.');
        return res.json();
      })
      .then((data: GeocodingResult[]) => {
        setIsSearching(false);
        if (!Array.isArray(data) || data.length === 0) {
          setSearchResults([]);
          setSearchError('Không tìm thấy kết quả phù hợp. Bạn hãy thử nhập tọa độ hoặc dùng GPS.');
        } else {
          setSearchResults(data);
        }
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setIsSearching(false);
        setSearchError('Lỗi mạng khi tìm kiếm. Bạn có thể chuyển sang tab Nhập tọa độ hoặc GPS.');
      });
  }, []);

  const handleSearchInputChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(val);
    }, 400);
  };

  const handleSelectSearchResult = (item: GeocodingResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (isValidCoordinate(lat, lon)) {
      setSelectedLocation({
        latitude: lat,
        longitude: lon,
        address: item.display_name,
        source: 'search',
      });

      if (!formTitle.trim()) {
        const shortName = item.display_name.split(',')[0].trim();
        setFormTitle(shortName);
      }
      setSearchResults([]);
      setSearchError(null);
      setSaveError(null);
    } else {
      setSearchError('Tọa độ từ kết quả tìm kiếm không hợp lệ.');
    }
  };

  // Áp dụng tọa độ thủ công
  const handleApplyManualCoordinates = () => {
    const lat = parseFloat(manualLatInput.trim());
    const lng = parseFloat(manualLngInput.trim());

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setSearchError('Vĩ độ (Latitude) phải là số thực từ -90 đến 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setSearchError('Kinh độ (Longitude) phải là số thực từ -180 đến 180.');
      return;
    }

    setSelectedLocation({
      latitude: lat,
      longitude: lng,
      address: `Tọa độ nhập tay (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      source: 'manual',
    });
    setSearchError(null);
    setSaveError(null);
  };

  // Lấy GPS với mã lỗi chi tiết & kiểm tra HTTPS
  const handleGetCurrentGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setSearchError('Trình duyệt hoặc thiết bị này không hỗ trợ định vị GPS.');
      return;
    }

    if (window.isSecureContext === false) {
      setSearchError('GPS yêu cầu kết nối bảo mật HTTPS. Bạn hãy dùng tính năng Tìm kiếm hoặc Nhập tọa độ.');
      return;
    }

    setIsGettingGps(true);
    setSearchError(null);
    setSaveError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (isValidCoordinate(lat, lng)) {
          setSelectedLocation({
            latitude: lat,
            longitude: lng,
            address: `Vị trí GPS thiết bị (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            source: 'gps',
          });
          if (!formTitle.trim()) {
            setFormTitle('Vị trí hiện tại của hai bạn');
          }
        }
      },
      (err) => {
        setIsGettingGps(false);
        let msg = 'Không thể lấy vị trí GPS.';
        if (err.code === 1) msg = 'Bạn đã từ chối quyền truy cập vị trí. Hãy bật lại quyền trong cài đặt trình duyệt.';
        else if (err.code === 2) msg = 'Tín hiệu GPS không khả dụng vào lúc này.';
        else if (err.code === 3) msg = 'Quá thời gian xác định vị trí GPS.';
        setSearchError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Mở Modal Thêm mới
  const handleOpenAddModal = () => {
    setEditingLoc(null);
    setFormTitle('');
    setFormDescription('');
    setFormType('date');
    setSelectedLocation(null);
    setManualLatInput('');
    setManualLngInput('');
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setSaveError(null);
    setInputMode('search');
    setIsModalOpen(true);
  };

  // Mở Modal Chỉnh sửa
  const handleOpenEditModal = (loc: MapLocation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingLoc(loc);
    setFormTitle(loc.title || '');
    setFormDescription(loc.description || '');
    setFormType(loc.location_type || 'date');
    setSelectedLocation({
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: loc.address,
      source: 'manual',
    });
    setManualLatInput(loc.latitude.toString());
    setManualLngInput(loc.longitude.toString());
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setSaveError(null);
    setInputMode('manual');
    setIsModalOpen(true);
  };

  // Lưu địa điểm với cơ chế bảo vệ form khi gặp sự cố mạng
  const handleSaveLocation = async (forceOffline = false) => {
    if (!formTitle.trim()) {
      setSaveError('Vui lòng nhập tên địa điểm kỷ niệm.');
      return;
    }

    if (!selectedLocation || !isValidCoordinate(selectedLocation.latitude, selectedLocation.longitude)) {
      setSaveError('Vui lòng xác định vị trí hợp lệ trước khi lưu.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const isEditing = Boolean(editingLoc);
    const now = new Date().toISOString();

    const locationPayload: MapLocation = {
      id: isEditing ? editingLoc!.id : `loc-${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      address: selectedLocation.address?.trim() || undefined,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      location_type: formType,
      created_at: isEditing ? editingLoc!.created_at : now,
      updated_at: now,
      couple_id: profile?.id && profile.id !== 'default-profile' ? profile.id : undefined,
    };

    let canonicalLocation = locationPayload;
    let remoteFailed = false;
    let remoteErrorMessage = '';

    // Lưu vào Supabase nếu có cấu hình và không ép lưu offline
    if (isSupabaseConfigured && !forceOffline) {
      try {
        if (isEditing) {
          const { error } = await supabase
            .from('map_locations')
            .update({
              title: locationPayload.title,
              description: locationPayload.description,
              address: locationPayload.address,
              latitude: locationPayload.latitude,
              longitude: locationPayload.longitude,
              location_type: locationPayload.location_type,
              updated_at: now,
            })
            .eq('id', locationPayload.id);

          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('map_locations')
            .insert({
              title: locationPayload.title,
              description: locationPayload.description,
              address: locationPayload.address,
              latitude: locationPayload.latitude,
              longitude: locationPayload.longitude,
              location_type: locationPayload.location_type,
              couple_id: locationPayload.couple_id,
            })
            .select()
            .maybeSingle();

          if (error) throw error;
          if (data) {
            canonicalLocation = data;
          }
        }
      } catch (err: unknown) {
        console.error('[LoveMap] Lỗi lưu lên Supabase:', err);
        remoteFailed = true;
        remoteErrorMessage = err instanceof Error ? err.message : 'Không thể kết nối máy chủ.';
      }
    }

    // NẾU LƯU SERVER THẤT BẠI: Giữ nguyên Form trong Modal để người dùng thử lại hoặc lưu offline
    if (remoteFailed) {
      setIsSaving(false);
      setSaveError(`Lỗi đồng bộ máy chủ: ${remoteErrorMessage}. Dữ liệu của bạn vẫn được giữ nguyên. Bạn có thể thử lại hoặc chọn Lưu Ngoại Tuyến.`);
      return;
    }

    // Cập nhật State Cục Bộ & Storage
    setLocations((prev) => {
      let updated: MapLocation[];
      if (isEditing) {
        updated = prev.map((l) => (l.id === editingLoc!.id ? canonicalLocation : l));
      } else {
        updated = [canonicalLocation, ...prev];
      }
      safeSetStorage('cuongisme_locations', updated);
      return updated;
    });

    setActiveLocation(canonicalLocation);
    setIsSaving(false);
    setIsModalOpen(false);

    setStatusMessage({
      type: forceOffline ? 'info' : 'success',
      text: forceOffline
        ? 'Đã lưu địa điểm tạm thời trên thiết bị này.'
        : isEditing
        ? 'Đã cập nhật địa điểm thành công.'
        : 'Đã thêm địa điểm mới vào bản đồ.',
    });
  };

  // Xóa địa điểm có Rollback an toàn
  const handleDeleteLocation = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = locations.find((l) => l.id === id);
    if (!target) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${target.title}" khỏi bản đồ không?`)) {
      return;
    }

    const previousLocations = [...locations];
    const previousActive = activeLocation;
    const updated = locations.filter((l) => l.id !== id);

    // Cập nhật ngay lập tức trên giao diện
    setLocations(updated);
    safeSetStorage('cuongisme_locations', updated);

    if (activeLocation?.id === id) {
      setActiveLocation(updated.length > 0 ? updated[0] : null);
    }

    setStatusMessage({ type: 'success', text: `Đã xóa địa điểm "${target.title}".` });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('map_locations').delete().eq('id', id);
        if (error) {
          // Rollback nếu máy chủ báo lỗi
          console.error('[LoveMap] Lỗi khi xóa trên máy chủ:', error);
          setLocations(previousLocations);
          setActiveLocation(previousActive);
          safeSetStorage('cuongisme_locations', previousLocations);
          setStatusMessage({ type: 'error', text: 'Lỗi từ máy chủ khi xóa. Đã khôi phục lại địa điểm.' });
        }
      } catch (err) {
        console.error('[LoveMap] Ngoại lệ khi xóa:', err);
      }
    }
  };

  const typeLabels: Record<LocationType, string> = {
    where_met: t('map.whereMet') || 'Nơi gặp gỡ',
    date: t('map.dates') || 'Hẹn hò',
    trip: t('map.trips') || 'Chuyến đi',
    special: t('map.special') || 'Kỷ niệm đặc biệt',
    future: t('map.future') || 'Dự định tương lai',
  };

  const filteredLocations =
    filter === 'all' ? locations : locations.filter((l) => l.location_type === filter);

  // URL Google Maps Embed chính xác
  const mapEmbedUrl =
    activeLocation && isValidCoordinate(activeLocation.latitude, activeLocation.longitude)
      ? `https://maps.google.com/maps?q=${activeLocation.latitude},${activeLocation.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      : null;

  return (
    <main className="pt-24 sm:pt-28 pb-16 min-h-screen text-zinc-100 relative">
      <div className="section-container max-w-5xl mx-auto px-4">
        {/* Status Toast Notification */}
        <AnimatePresence>
          {statusMessage && (
            <motion.aside
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              aria-live="polite"
              className={`mb-6 p-3 sm:p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between border shadow-lg ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-950/90 border-red-500/30 text-red-200'
                  : 'bg-zinc-900/90 border-white/10 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {statusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="truncate">{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                aria-label="Đóng thông báo"
                className="p-1 hover:opacity-75 rounded-lg shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <header className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight truncate text-zinc-100">
              {t('map.title') || 'Love Map'}
            </h1>
            <p className="text-xs sm:text-sm mt-1 text-zinc-400 truncate">
              Lưu giữ những tọa độ gắn liền với hành trình tình yêu
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn-pill shrink-0 min-h-[42px] px-4 text-xs font-bold flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('memories.add') || 'Thêm Địa Điểm'}</span>
          </button>
        </header>

        {/* Category Filters */}
        <nav
          aria-label="Lọc địa điểm theo phân loại"
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none snap-x select-none"
        >
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 snap-start transition-all active:scale-95 ${
              filter === 'all'
                ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-100 border border-white/10'
            }`}
          >
            {t('memories.all') || 'Tất cả'} ({locations.length})
          </button>
          {(['where_met', 'date', 'trip', 'special', 'future'] as LocationType[]).map((typeKey) => {
            const count = locations.filter((l) => l.location_type === typeKey).length;
            const isCurrent = filter === typeKey;
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => handleFilterChange(typeKey)}
                className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 snap-start transition-all active:scale-95 ${
                  isCurrent
                    ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-100 border border-white/10'
                }`}
              >
                {typeLabels[typeKey]} ({count})
              </button>
            );
          })}
        </nav>

        {/* Bản đồ chính hoặc Trạng thái trống */}
        {locations.length > 0 && activeLocation && mapEmbedUrl ? (
          <section className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl overflow-hidden mb-8 border border-white/[0.08] shadow-2xl relative">
            {/* Active Location Detail Panel */}
            <div className="p-4 sm:px-6 sm:py-4 border-b border-white/[0.08] bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-2xl ${
                    TYPE_STYLES[activeLocation.location_type]?.bg || 'bg-rose-500'
                  } flex items-center justify-center text-white shadow-md shrink-0 mt-0.5 sm:mt-0`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 truncate">
                      {activeLocation.title}
                    </h2>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold border ${
                        TYPE_STYLES[activeLocation.location_type]?.badge
                      }`}
                    >
                      {typeLabels[activeLocation.location_type]}
                    </span>
                  </div>
                  {activeLocation.address && (
                    <p className="text-xs text-zinc-400 truncate mt-0.5 font-mono">
                      📍 {activeLocation.address}
                    </p>
                  )}
                  {activeLocation.description && (
                    <p className="text-xs text-zinc-300 mt-1 whitespace-pre-wrap leading-relaxed line-clamp-2">
                      {activeLocation.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(activeLocation)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white rounded-full bg-white/[0.05] border border-white/10 hover:border-white/20 transition-all min-h-[36px] active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${activeLocation.latitude},${activeLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white rounded-full bg-white/10 border border-white/15 hover:border-white/25 transition-all min-h-[36px] active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Google Maps</span>
                </a>
              </div>
            </div>

            {/* Responsive Map Viewport */}
            <div className="w-full h-[320px] sm:h-[420px] relative bg-zinc-950">
              <iframe
                key={`${activeLocation.id}-${activeLocation.latitude}-${activeLocation.longitude}`}
                title={`Bản đồ hiển thị ${activeLocation.title}`}
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                loading="lazy"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </section>
        ) : (
          /* Empty State */
          <section className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-8 sm:p-14 text-center border border-white/[0.08] mb-8 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Compass className="w-7 h-7 opacity-70" />
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-zinc-100 mb-2">
              Bản Đồ Kỷ Niệm Tình Yêu
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
              {filter === 'all'
                ? 'Chưa có địa điểm nào được lưu lại. Hãy thêm nơi gặp gỡ hoặc chuyến đi đầu tiên của hai bạn.'
                : 'Chưa có địa điểm nào thuộc nhóm phân loại này.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="btn-pill min-h-[44px] px-6 text-xs font-bold inline-flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm Địa Điểm Mới
            </button>
          </section>
        )}

        {/* Danh sách địa điểm */}
        {locations.length > 0 && (
          <section aria-labelledby="location-list-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="location-list-heading" className="text-xs sm:text-sm font-bold text-zinc-300 tracking-wider uppercase font-mono flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-zinc-400" />
                <span>Danh Sách Địa Điểm ({filteredLocations.length})</span>
              </h2>
              <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                Chạm để định vị trên bản đồ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredLocations.map((loc) => {
                const style = TYPE_STYLES[loc.location_type] || TYPE_STYLES.date;
                const isActive = activeLocation?.id === loc.id;

                return (
                  <div
                    key={loc.id}
                    className={`rounded-2xl p-3.5 sm:p-4 transition-all duration-200 flex items-center justify-between gap-3 shadow-lg select-none ${
                      isActive
                        ? 'border border-white/30 bg-white/[0.09] shadow-2xl'
                        : 'bg-zinc-900/60 backdrop-blur-md border border-white/[0.08] hover:border-white/20 hover:bg-zinc-900/80'
                    }`}
                  >
                    {/* Nút chọn địa điểm semantic */}
                    <button
                      type="button"
                      onClick={() => setActiveLocation(loc)}
                      className="flex items-center gap-3.5 min-w-0 text-left flex-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl"
                      aria-label={`Chọn và xem địa điểm ${loc.title}`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full shrink-0 ${style.bg} ${
                          isActive ? `ring-4 ${style.ring}` : ''
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm font-bold truncate ${
                              isActive ? 'text-white' : 'text-zinc-200'
                            }`}
                          >
                            {loc.title}
                          </h3>
                          {isActive && (
                            <span className="text-[9px] font-mono bg-white/20 text-white px-1.5 py-0.5 rounded shrink-0">
                              ĐANG CHỌN
                            </span>
                          )}
                        </div>
                        {loc.address ? (
                          <p className="text-xs text-zinc-400 truncate mt-0.5 font-mono">
                            {loc.address}
                          </p>
                        ) : loc.description ? (
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {loc.description}
                          </p>
                        ) : null}
                      </div>
                    </button>

                    {/* Nút Sửa/Xóa tách biệt, luôn hiển thị trên Mobile */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(loc)}
                        aria-label={`Chỉnh sửa ${loc.title}`}
                        className="p-2 sm:p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
                      >
                        <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(loc.id)}
                        aria-label={`Xóa ${loc.title}`}
                        className="p-2 sm:p-1.5 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredLocations.length === 0 && (
                <div className="sm:col-span-2 bg-zinc-900/40 rounded-2xl p-8 text-center border border-white/[0.06]">
                  <p className="text-xs text-zinc-400">Không có địa điểm nào thuộc nhóm phân loại này.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Add / Edit Location Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalHeadingId}
          >
            {/* Backdrop Dismiss */}
            <div
              className="absolute inset-0 -z-10"
              onClick={() => !isSaving && setIsModalOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-[#18181b] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl relative max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-7 flex flex-col"
            >
              <button
                type="button"
                onClick={() => !isSaving && setIsModalOpen(false)}
                disabled={isSaving}
                aria-label="Đóng cửa sổ"
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 id={modalHeadingId} className="text-base sm:text-lg font-serif font-bold mb-1 text-zinc-100 pr-8">
                {editingLoc ? 'Chỉnh Sửa Địa Điểm Kỷ Niệm' : 'Thêm Địa Điểm Kỷ Niệm Mới'}
              </h2>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Xác định tọa độ thực tế và lưu lại khoảnh khắc của hai bạn.
              </p>

              {/* Thông báo lỗi Save / Network Recovery */}
              {saveError && (
                <div className="mb-4 p-3 rounded-2xl bg-red-950/70 border border-red-500/30 text-red-200 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{saveError}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSaveLocation(false)}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-xs font-semibold text-red-100 transition"
                    >
                      <RefreshCw className="w-3 h-3 inline mr-1" /> Thử Lại
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveLocation(true)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-xs font-semibold text-zinc-200 transition"
                    >
                      Lưu Ngoại Tuyến (Offline)
                    </button>
                  </div>
                </div>
              )}

              {searchError && (
                <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{searchError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* 1. Tên Địa Điểm */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Tên địa điểm *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (saveError) setSaveError(null);
                    }}
                    placeholder="Ví dụ: Quán cafe lần đầu gặp, Homestay Đà Lạt..."
                    className="w-full min-h-[44px] px-4 py-2.5 bg-zinc-900 rounded-xl text-base sm:text-sm text-zinc-100 border border-white/10 outline-none focus:border-rose-500 transition-all"
                  />
                </div>

                {/* 2. Unified Location Selection Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Xác định vị trí trên bản đồ *
                    </label>
                    {selectedLocation && (
                      <button
                        type="button"
                        onClick={() => setSelectedLocation(null)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 underline font-semibold"
                      >
                        Đổi vị trí khác
                      </button>
                    )}
                  </div>

                  {/* KHUNG A: CHƯA CÓ VỊ TRÍ HOẶC ĐANG CHỌN (Tabs Picker) */}
                  {!selectedLocation ? (
                    <div className="space-y-3">
                      {/* Mode switcher tabs */}
                      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setInputMode('search')}
                          className={`min-h-[38px] py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 ${
                            inputMode === 'search'
                              ? 'bg-white/15 text-white shadow-sm font-bold'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          🔍 Tìm kiếm
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputMode('manual')}
                          className={`min-h-[38px] py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 ${
                            inputMode === 'manual'
                              ? 'bg-white/15 text-white shadow-sm font-bold'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          📍 Nhập tọa độ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInputMode('gps');
                            handleGetCurrentGps();
                          }}
                          className={`min-h-[38px] py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 active:scale-95 ${
                            inputMode === 'gps'
                              ? 'bg-white/15 text-white shadow-sm font-bold'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <Crosshair className="w-3.5 h-3.5" /> GPS
                        </button>
                      </div>

                      {/* Mode 1: Search Geocoding */}
                      {inputMode === 'search' && (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => handleSearchInputChange(e.target.value)}
                              placeholder="Nhập tên quán, số nhà, địa chỉ, thành phố..."
                              className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-zinc-900 rounded-xl text-base sm:text-sm text-zinc-100 border border-white/10 outline-none focus:border-rose-500 transition-all"
                            />
                            {isSearching && (
                              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 animate-spin" />
                            )}
                          </div>

                          {/* Search Results List */}
                          {searchResults.length > 0 && (
                            <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
                              {searchResults.map((result) => (
                                <button
                                  key={result.place_id}
                                  type="button"
                                  onClick={() => handleSelectSearchResult(result)}
                                  className="w-full p-3 text-left text-xs hover:bg-white/5 transition flex items-start gap-2.5 min-h-[44px] active:bg-white/10"
                                >
                                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                  <span className="text-zinc-300 leading-relaxed line-clamp-2">
                                    {result.display_name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mode 2: Manual Coordinates */}
                      {inputMode === 'manual' && (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-zinc-400 mb-1 font-mono">
                                Vĩ độ (Latitude: -90 đến 90)
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={manualLatInput}
                                onChange={(e) => setManualLatInput(e.target.value)}
                                placeholder="10.7769"
                                className="w-full min-h-[42px] px-3 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-zinc-400 mb-1 font-mono">
                                Kinh độ (Longitude: -180 đến 180)
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={manualLngInput}
                                onChange={(e) => setManualLngInput(e.target.value)}
                                placeholder="106.7009"
                                className="w-full min-h-[42px] px-3 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500 font-mono"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleApplyManualCoordinates}
                            className="w-full min-h-[40px] py-2 bg-white/[0.06] hover:bg-white/10 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition active:scale-95"
                          >
                            Xác Nhận Tọa Độ Này
                          </button>
                        </div>
                      )}

                      {/* Mode 3: GPS Status */}
                      {inputMode === 'gps' && (
                        <div className="p-4 bg-zinc-900 rounded-xl border border-white/10 text-center space-y-2">
                          {isGettingGps ? (
                            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 py-2">
                              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                              <span>Đang kết nối vệ tinh GPS của thiết bị...</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleGetCurrentGps}
                              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl bg-rose-500/10 active:scale-95"
                            >
                              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Lấy Lại Vị Trí GPS
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* KHUNG B: ĐÃ CÓ TỌA ĐỘ VÀ VỊ TRÍ XÁC THỰC (Location Preview Card) */
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-emerald-300">
                        <div className="flex items-center gap-2 truncate">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-mono font-bold truncate">
                            {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                          {selectedLocation.source === 'gps'
                            ? 'GPS THIẾT BỊ'
                            : selectedLocation.source === 'search'
                            ? 'TÌM KIẾM'
                            : 'NHẬP TAY'}
                        </span>
                      </div>

                      {selectedLocation.address && (
                        <p className="text-[11px] text-zinc-300 font-mono leading-relaxed line-clamp-2">
                          📍 {selectedLocation.address}
                        </p>
                      )}

                      <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedLocation(null)}
                          className="text-[11px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 font-semibold"
                        >
                          <RotateCcw className="w-3 h-3" /> Đổi vị trí khác
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1 font-semibold"
                        >
                          <MapIcon className="w-3 h-3" /> Kiểm tra trên Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Phân Loại */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Phân loại kỷ niệm
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as LocationType)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-zinc-900 text-zinc-100 rounded-xl text-base sm:text-xs border border-white/10 outline-none focus:border-rose-500"
                  >
                    <option value="where_met">{typeLabels.where_met}</option>
                    <option value="date">{typeLabels.date}</option>
                    <option value="trip">{typeLabels.trip}</option>
                    <option value="special">{typeLabels.special}</option>
                    <option value="future">{typeLabels.future}</option>
                  </select>
                </div>

                {/* 4. Ghi Chú Kỷ Niệm */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Ghi chú / Cảm xúc (tùy chọn)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ghi lại khoảnh khắc hoặc kỷ niệm đáng nhớ tại đây..."
                    rows={3}
                    className="w-full p-3.5 bg-zinc-900 rounded-xl text-base sm:text-sm text-zinc-100 border border-white/10 outline-none resize-none focus:border-rose-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Actions Footer */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="flex-1 min-h-[44px] py-2.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-zinc-100 border border-white/10 hover:bg-white/5 transition active:scale-95"
                  >
                    {t('common.cancel') || 'Hủy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveLocation(false)}
                    disabled={!formTitle.trim() || !selectedLocation || isSaving}
                    className="flex-1 min-h-[44px] btn-pill py-2.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isSaving ? 'Đang lưu...' : editingLoc ? 'Cập Nhật' : t('common.save') || 'Lưu Địa Điểm'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}