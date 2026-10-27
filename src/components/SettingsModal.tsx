import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  X, 
  Globe, 
  ShieldCheck, 
  Keyboard, 
  Trash2, 
  Check, 
  Layers, 
  Server,
  Link,
  Upload,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Database
} from 'lucide-react';
import { PlayerSettings, PlaylistProfile } from '../types';
import { Language, translations } from '../utils/translations';
import { useIptv } from '../context/IptvContext';

interface SettingsModalProps {
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  onResetAllData: () => void;
  onClose: () => void;
  lang: Language;
  onToggleLang: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  onClose,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const {
    profiles,
    activeProfile,
    switchProfile,
    deleteProfile,
    importXtreamCodes,
    importM3uUrl,
    refreshCurrentPlaylist,
    isLoading,
    loadProgress,
    error: iptvError,
    showToast
  } = useIptv();

  const [activeTab, setActiveTab] = useState<'subscription' | 'general' | 'shortcuts'>('subscription');

  // Quick Xtream Inputs in Settings
  const [serverUrl, setServerUrl] = useState(activeProfile?.server || '');
  const [username, setUsername] = useState(activeProfile?.username || '');
  const [password, setPassword] = useState(activeProfile?.password || '');
  const [playlistName, setPlaylistName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localMessage, setLocalMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Handle Quick Xtream Save & Connect
  const handleSaveXtream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim() || !username.trim() || !password.trim()) {
      setLocalMessage({
        text: isRtl ? 'يرجى إدخال عنوان السيرفر واسم المستخدم وكلمة المرور.' : 'Please fill all Xtream credentials.',
        type: 'error',
      });
      return;
    }

    setLocalMessage(null);
    const success = await importXtreamCodes(
      serverUrl.trim(),
      username.trim(),
      password.trim(),
      playlistName.trim() || undefined
    );

    if (success) {
      setLocalMessage({
        text: isRtl ? 'تم الاتصال بسيرفر Xtream وحفظ البيانات في التخزين المحلي بنجاح!' : 'Connected & credentials saved in LocalStorage successfully!',
        type: 'success',
      });
      showToast(
        isRtl ? 'تم تحديث الاشتراك بنجاح' : 'Subscription updated',
        isRtl ? 'تم ربط الحساب واستيراد كافة القنوات والأفلام' : 'All channels & movies loaded',
        'info'
      );
    } else {
      setLocalMessage({
        text: iptvError || (isRtl ? 'فشل الاتصال بسيرفر IPTV. تأكد من صحة البيانات.' : 'Failed to connect. Please verify credentials.'),
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isRtl ? 'إعدادات المشغل والاشتراكات' : 'Player & Subscription Settings'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl ? 'إدارة بيانات IPTV (Xtream / M3U) وحفظها محلياً' : 'Manage & persist Xtream/M3U subscription in LocalStorage'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 sm:px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'subscription'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>{isRtl ? 'بيانات الاشتراك و Xtream' : 'Subscription & Xtream'}</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isRtl ? 'الإعدادات العامة والشبكة' : 'General & Network'}</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'shortcuts'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>{isRtl ? 'اختصارات الريموت ولوحة المفاتيح' : 'Shortcuts & Remote'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {activeTab === 'subscription' && (
            <div className="space-y-5">
              {/* Active Subscription Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                      {isRtl ? 'الاشتراك النشط حالياً' : 'Active Subscription'}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {activeProfile?.name || (isRtl ? 'الباقة الافتراضية' : 'Default Preset')}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {activeProfile?.channelCount || 0} {isRtl ? 'قناة وفيلم ومسلسل محملة' : 'items loaded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refreshCurrentPlaylist()}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isRtl ? 'تحديث القنوات' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* Enter Xtream Credentials Form */}
              <form onSubmit={handleSaveXtream} className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span>{isRtl ? 'إدخال / تحديث بيانات Xtream Codes API' : 'Xtream Codes API Credentials'}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    {isRtl ? 'حفظ تلقائي في LocalStorage' : 'Saved to LocalStorage'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      {isRtl ? 'عنوان السيرفر (Server URL & Port)' : 'Server URL & Port'}
                    </label>
                    <input
                      type="text"
                      placeholder="http://example.com:8080"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                        {isRtl ? 'اسم المستخدم (Username)' : 'Username'}
                      </label>
                      <input
                        type="text"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                        {isRtl ? 'كلمة المرور (Password)' : 'Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pe-9 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      {isRtl ? 'اسم الباقة / الاشتراك (اختياري)' : 'Playlist Name (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={isRtl ? 'مثال: اشتراك الباقة الذهبية' : 'e.g. VIP Subscription'}
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                    />
                  </div>
                </div>

                {/* Progress bar during sync */}
                {isLoading && loadProgress && (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-cyan-300">
                      <span>{loadProgress.status}</span>
                      <span>{loadProgress.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${loadProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Local Feedback */}
                {localMessage && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${
                      localMessage.type === 'success'
                        ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950/40 border border-red-500/40 text-red-300'
                    }`}
                  >
                    {localMessage.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{localMessage.text}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/30 transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isRtl ? 'جاري الاتصال والتحميل...' : 'Connecting...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isRtl ? 'حفظ والاتصال الآن' : 'Save & Connect'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Saved Playlists Profiles in LocalStorage */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>{isRtl ? 'الاشتراكات والقوائم المحفوظة في الذاكرة' : 'Saved Subscriptions & Profiles'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {profiles.length} {isRtl ? 'اشتراكات' : 'profiles'}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {profiles.map((p) => {
                    const isSelected = p.id === activeProfile?.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center shrink-0">
                            {p.type === 'xtream' ? <Server className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold truncate text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>{p.channelCount || 0} {isRtl ? 'عنصر' : 'items'}</span>
                              <span>•</span>
                              <span className="uppercase text-[9px] px-1.5 rounded bg-slate-800 text-slate-300 font-mono">
                                {p.type}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isSelected ? (
                            <button
                              onClick={() => switchProfile(p.id)}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                            >
                              {isRtl ? 'تفعيل' : 'Activate'}
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center gap-1 border border-cyan-500/30">
                              <Check className="w-3 h-3" />
                              <span>{isRtl ? 'نشط' : 'Active'}</span>
                            </span>
                          )}

                          {profiles.length > 1 && (
                            <button
                              onClick={() => {
                                if (window.confirm(isRtl ? `حذف اشتراك "${p.name}"؟` : `Delete profile "${p.name}"?`)) {
                                  deleteProfile(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                              title={isRtl ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Language selection */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-bold text-slate-200 block">لغة التطبيق / Interface Language</span>
                    <span className="text-[11px] text-slate-400">اختر اللغة المفضلة للواجهة</span>
                  </div>
                </div>
                <button
                  onClick={onToggleLang}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow"
                >
                  {lang === 'ar' ? 'العربية (AR)' : 'English (EN)'}
                </button>
              </div>

              {/* Proxy Setting */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 max-w-[70%]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">{t.enableProxy}</span>
                    <span className="text-[11px] text-slate-400 leading-relaxed block">
                      {isRtl ? 'يسمح بتخطي حظر شهادات الأمان وقيود CORS للبثوث الخارجية' : 'Bypass CORS restrictions for external streaming links'}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.proxyStreams}
                  onChange={(e) => onUpdateSettings({ proxyStreams: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              {/* Reset / Clear Data */}
              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-red-300 block">إعادة ضبط البيانات واستعادة الافتراضي</span>
                  <span className="text-[11px] text-slate-400">حذف القوائم المخصصة واستعادة الباقة الأساسية</span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط القوائم واستعادة الإعدادات الافتراضية؟')) {
                      onResetAllData();
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إعادة ضبط</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
                  <Keyboard className="w-4 h-4 text-indigo-400" />
                  <span>{t.keyboardShortcuts}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                    <span className="text-cyan-300 font-bold">مسافة (Space)</span>
                    <span className="text-slate-200 font-medium">تشغيل / إيقاف مؤقت</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                    <span className="text-cyan-300 font-bold">F</span>
                    <span className="text-slate-200 font-medium">إضافة / إزالة من المفضلة ⭐</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                    <span className="text-cyan-300 font-bold">Z</span>
                    <span className="text-slate-200 font-medium">وضع ملء الشاشة (Fullscreen)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                    <span className="text-cyan-300 font-bold">M</span>
                    <span className="text-slate-200 font-medium">كتم / تفعيل الصوت</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                    <span className="text-cyan-300 font-bold">الأسهم ↑ ↓</span>
                    <span className="text-slate-200 font-medium">تبديل القنوات (Channel Zap)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                    <span className="text-cyan-300 font-bold">الأسهم ← →</span>
                    <span className="text-slate-200 font-medium">تقديم / ترجيع 10 ثوانٍ</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                    <span className="text-cyan-300 font-bold">P</span>
                    <span className="text-slate-200 font-medium">صورة داخل صورة (PiP)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                    <span className="text-cyan-300 font-bold">Ctrl + K</span>
                    <span className="text-slate-200 font-medium">البحث الفوري الذكي</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

