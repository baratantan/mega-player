import React, { useState, useEffect } from 'react';
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
  Database,
  Activity,
  Gauge,
  Lock,
  Unlock,
  Baby,
  KeyRound,
  Wifi,
  Play,
  Bug,
  Copy,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Code,
  ExternalLink,
  Tv,
  Clock,
  Wrench,
  Zap,
  ArrowRight,
  Smartphone,
  Download,
  CheckCircle2,
  Maximize2,
  MoreVertical
} from 'lucide-react';
import { PlayerSettings, PlaylistProfile } from '../types';
import { Language, translations } from '../utils/translations';
import { useIptv } from '../context/IptvContext';
import { networkDiagnosticService, DiagnosticResult } from '../services/networkDiagnosticService';
import { errorLogService, ErrorLogEntry, ErrorType } from '../services/errorLogService';
import { PRESET_PLAYLISTS, PresetPlaylist, parseXtreamUrl } from '../services/iptvService';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsModalProps {
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  onResetAllData: () => void;
  onClose: () => void;
  lang: Language;
  onToggleLang: () => void;
  initialTab?: 'android' | 'subscription' | 'diagnostics' | 'parental' | 'general' | 'shortcuts' | 'logs';
  onOpenAddPlaylistModal?: (tab?: 'url' | 'file' | 'xtream' | 'preset') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  onClose,
  lang,
  onToggleLang,
  initialTab = 'subscription',
  onOpenAddPlaylistModal,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWAInstall();
  const [pwaInstalledSuccess, setPwaInstalledSuccess] = useState(false);
  const {
    profiles,
    activeProfile,
    switchProfile,
    deleteProfile,
    importXtreamCodes,
    importM3uUrl,
    importM3uFile,
    loadPreset,
    refreshCurrentPlaylist,
    isLoading,
    error: iptvError,
    showToast,
    isKidsMode,
    toggleKidsMode,
    parentalPin,
    setParentalPin,
    lockedCategories,
    toggleCategoryLock,
    categoryGroups,
  } = useIptv();

  const [activeTab, setActiveTab] = useState<'android' | 'subscription' | 'diagnostics' | 'parental' | 'general' | 'shortcuts' | 'logs'>(initialTab);

  // Error Log State
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>(() => errorLogService.getLogs());
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | ErrorType>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Subscribe to error log service updates
  useEffect(() => {
    const unsubscribe = errorLogService.subscribe(() => {
      setErrorLogs(errorLogService.getLogs());
    });
    return unsubscribe;
  }, []);

  // Copy all errors formatted text
  const handleCopyAllLogs = async () => {
    try {
      const text = errorLogService.exportLogsAsText();
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      showToast(
        isRtl ? 'تم نسخ سجل الأخطاء' : 'Error Log Copied',
        isRtl ? `تم نسخ ${errorLogs.length} سجل أخطاء إلى الحافظة بنجاح` : `Copied ${errorLogs.length} error entries to clipboard`,
        'info'
      );
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  };

  // Copy single error entry
  const handleCopySingleLog = async (log: ErrorLogEntry) => {
    try {
      const text = [
        `[${log.timeFormatted}] [${log.type.toUpperCase()}] ${log.message}`,
        log.channelName ? `Channel: ${log.channelName}` : null,
        log.url ? `URL: ${log.url}` : null,
        log.errorCode !== undefined ? `Error Code: ${log.errorCode}` : null,
        log.details ? `Details: ${log.details}` : null,
        log.stack ? `Stack:\n${log.stack}` : null,
      ].filter(Boolean).join('\n');

      await navigator.clipboard.writeText(text);
      setCopiedLogId(log.id);
      setTimeout(() => setCopiedLogId(null), 2000);
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  };

  // Clear all error logs
  const handleClearLogs = () => {
    if (errorLogs.length === 0) return;
    errorLogService.clearLogs();
    showToast(
      isRtl ? 'تم مسح السجل' : 'Logs Cleared',
      isRtl ? 'تم تفريغ كافة سجلات الأخطاء بنجاح' : 'Error log history cleared',
      'info'
    );
  };

  // Simulate a test error for demonstration
  const handleSimulateTestError = () => {
    errorLogService.logPlayerError({
      channelName: 'BeIN Sports 1 HD [Test Stream]',
      channelUrl: 'http://iptv-live.stream:8080/live/user/pass/101.m3u8',
      errorCode: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
      message: isRtl ? 'تعذر فك تشفير دفق الفيديو (خطأ اختبار تجريبي)' : 'Failed to decode media source (Simulated Test)',
      details: 'HLS segment HTTP 404 / CORS preflight failure',
    });
  };

  // 1-Click Auto-Repair State & Handler
  const [isRepairingLogs, setIsRepairingLogs] = useState(false);
  const handleAutoRepair = async () => {
    setIsRepairingLogs(true);
    try {
      onUpdateSettings({ proxyStreams: true });
      await new Promise(r => setTimeout(r, 600));
      await refreshCurrentPlaylist();
      showToast(
        isRtl ? 'تم الإصلاح التلقائي بنجاح!' : 'Auto-Repair Completed!',
        isRtl ? 'تم تفعيل بروكسي CORS الآمن وتجديد روابط القنوات وحل تعارض البث.' : 'Stream proxy enabled and playlist URLs refreshed.',
        'info'
      );
    } catch (e: any) {
      showToast(isRtl ? 'تم تحديث الإعدادات' : 'Settings Updated', isRtl ? 'تم ضبط البروكسي، يرجى إعادة فحص القناة' : 'Proxy enabled', 'info');
    } finally {
      setIsRepairingLogs(false);
    }
  };

  // Quick Xtream Inputs in Settings
  const [serverUrl, setServerUrl] = useState(activeProfile?.server || '');
  const [username, setUsername] = useState(activeProfile?.username || '');
  const [password, setPassword] = useState(activeProfile?.password || '');
  const [playlistName, setPlaylistName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localMessage, setLocalMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Speedtest & Diagnostics State
  const [isTestingSpeed, setIsTestingSpeed] = useState<boolean>(false);
  const [testProgressMsg, setTestProgressMsg] = useState<string>('');
  const [testProgressPercent, setTestProgressPercent] = useState<number>(0);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  // Parental PIN change state
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  // Kids Mode PIN input for unlocking
  const [unlockPinInput, setUnlockPinInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [showPinPrompt, setShowPinPrompt] = useState<boolean>(false);

  // Run Diagnostics test
  const handleRunDiagnostics = async () => {
    setIsTestingSpeed(true);
    setTestProgressPercent(10);
    setTestProgressMsg(isRtl ? 'جاري الاتصال بالسيرفر وقياس زمن الاستجابة...' : 'Pinging server...');
    
    try {
      const result = await networkDiagnosticService.runFullDiagnostics(
        activeProfile?.server || serverUrl,
        (msg, percent) => {
          setTestProgressMsg(msg);
          setTestProgressPercent(percent);
        }
      );
      setDiagnosticResult(result);
      showToast(
        isRtl ? 'اكتمل فحص الاتصال والسيرفر' : 'Diagnostics Complete',
        `${result.downloadSpeedMbps} Mbps | Ping: ${result.pingMs}ms`,
        'info'
      );
    } catch (e) {
      // Diagnostic fallback
    } finally {
      setIsTestingSpeed(false);
    }
  };

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
  const [subMethod, setSubMethod] = useState<'xtream' | 'm3u_url' | 'm3u_file' | 'preset'>('xtream');
  const [m3uUrlInput, setM3uUrlInput] = useState<string>('');
  const [m3uFileInput, setM3uFileInput] = useState<File | null>(null);
  const [fullXtreamExtractInput, setFullXtreamExtractInput] = useState<string>('');

  // Auto-extract Xtream full URL in Settings
  const handleAutoExtractXtream = (inputVal: string) => {
    setFullXtreamExtractInput(inputVal);
    if (!inputVal.trim()) return;
    const parsed = parseXtreamUrl(inputVal.trim());
    if (parsed) {
      setServerUrl(parsed.serverUrl);
      setUsername(parsed.username);
      setPassword(parsed.password);
      setLocalMessage({
        text: isRtl ? 'تم استخراج بيانات السيرفر والمستخدم وكلمة المرور بنجاح!' : 'Extracted credentials successfully!',
        type: 'success',
      });
    } else {
      setLocalMessage({
        text: isRtl ? 'تعذر استخراج البيانات تلقائياً من الرابط. يمكنك إدخال الحقول يدوياً.' : 'Could not parse URL. Please fill fields below.',
        type: 'error',
      });
    }
  };

  // Handle M3U URL Save
  const handleSaveM3uUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uUrlInput.trim()) {
      setLocalMessage({
        text: isRtl ? 'يرجى إدخال رابط M3U صالح.' : 'Please enter a valid M3U URL.',
        type: 'error',
      });
      return;
    }
    setLocalMessage(null);
    const success = await importM3uUrl(m3uUrlInput.trim(), playlistName.trim() || undefined);
    if (success) {
      setLocalMessage({
        text: isRtl ? 'تم تحميل قائمة M3U وبناء القنوات بنجاح!' : 'M3U imported successfully!',
        type: 'success',
      });
      showToast(isRtl ? 'تم تحميل القائمة بنجاح' : 'Playlist Loaded', undefined, 'info');
    } else {
      setLocalMessage({
        text: iptvError || (isRtl ? 'فشل تحميل قائمة M3U.' : 'Failed to load M3U.'),
        type: 'error',
      });
    }
  };

  // Handle M3U File Save
  const handleSaveM3uFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uFileInput) {
      setLocalMessage({
        text: isRtl ? 'يرجى اختيار ملف M3U من جهازك.' : 'Please select an M3U file.',
        type: 'error',
      });
      return;
    }
    setLocalMessage(null);
    const success = await importM3uFile(m3uFileInput, playlistName.trim() || undefined);
    if (success) {
      setLocalMessage({
        text: isRtl ? 'تم استيراد ملف M3U وبناء المكتبة بنجاح!' : 'M3U file parsed successfully!',
        type: 'success',
      });
      showToast(isRtl ? 'تم استيراد الملف بنجاح' : 'File Imported', undefined, 'info');
    } else {
      setLocalMessage({
        text: iptvError || (isRtl ? 'فشل استيراد ملف M3U.' : 'Failed to parse M3U file.'),
        type: 'error',
      });
    }
  };

  // Handle Free Preset Selection
  const handleSelectFreePreset = async (preset: PresetPlaylist) => {
    setLocalMessage(null);
    const success = await loadPreset(preset);
    if (success) {
      setLocalMessage({
        text: isRtl ? `تم تفعيل باقة: ${preset.name} بنجاح!` : `Activated: ${preset.name}`,
        type: 'success',
      });
      showToast(isRtl ? 'تم تفعيل الباقة المجانية' : 'Preset Activated', preset.name, 'info');
    } else {
      setLocalMessage({
        text: iptvError || (isRtl ? 'فشل تحميل الباقة.' : 'Failed to load preset.'),
        type: 'error',
      });
    }
  };

  // Handle Update Parental PIN
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinChangeMsg(isRtl ? 'رمز PIN يجب أن يتكون من 4 أرقام بالضبط (مثال: 1234)' : 'PIN must be exactly 4 digits');
      return;
    }
    setParentalPin(newPinInput);
    setNewPinInput('');
    setPinChangeMsg(isRtl ? 'تم تحديث رمز PIN بنجاح!' : 'Parental PIN updated successfully!');
    setTimeout(() => setPinChangeMsg(null), 3000);
  };

  // Handle Kids Mode Toggle
  const handleKidsToggleClick = () => {
    if (isKidsMode) {
      setShowPinPrompt(true);
      setUnlockError(null);
    } else {
      toggleKidsMode();
    }
  };

  const handleConfirmUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const res = toggleKidsMode(unlockPinInput);
    if (res.success) {
      setShowPinPrompt(false);
      setUnlockPinInput('');
      setUnlockError(null);
    } else {
      setUnlockError(res.error || (isRtl ? 'رمز PIN غير صحيح' : 'Incorrect PIN'));
    }
  };

  // All extracted categories from active playlist
  const allGroups = [
    ...categoryGroups.live,
    ...categoryGroups.movie,
    ...categoryGroups.series,
  ].filter((v, i, a) => a.indexOf(v) === i && v.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {isRtl ? 'إعدادات المنصة والمشغل' : 'Cinema Platform Settings'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl ? 'إدارة اشتراكات Xtream، فحص سرعة السيرفر، والقفل الأبوي' : 'Manage Xtream subscriptions, speed diagnostics & parental control'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-3 sm:px-6 gap-1 overflow-x-auto scrollbar-none pt-2">
          {/* TAB 0: ANDROID APP */}
          <button
            onClick={() => setActiveTab('android')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'android'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'تطبيق أندرويد' : 'Android App'}</span>
            {!isStandalone && !isInstalled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'subscription'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>{isRtl ? 'الاشتراكات و Xtream' : 'Xtream & Profiles'}</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'فحص سرعة السيرفر' : 'Server Speedtest'}</span>
          </button>

          <button
            onClick={() => setActiveTab('parental')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'parental'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{isRtl ? 'الأمان الأبوي والأطفال' : 'Parental & Kids'}</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isRtl ? 'عام والشبكة' : 'General'}</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>{isRtl ? 'الريموت' : 'Remote'}</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-rose-400 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bug className="w-4 h-4 text-rose-400" />
            <span>{t.errorLogs}</span>
            {errorLogs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono font-bold">
                {errorLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {/* TAB 0: ANDROID APP NATIVE INSTALLATION */}
          {activeTab === 'android' && (
            <div className="space-y-5">
              {/* App Status Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-tr from-[#0b172a] via-[#07101f] to-[#040813] border border-cyan-500/30 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/25 shrink-0">
                      <div className="w-full h-full bg-[#070b18] rounded-[14px] flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">
                          Cinema Pro 4K (Android App)
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          {isStandalone ? (isRtl ? 'مثبت ويعمل كأندرويد' : 'Running as Standalone') : (isRtl ? 'جاهز للتثبيت' : 'Ready to Install')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {isRtl 
                          ? 'تحويل الموقع بالكامل إلى تطبيق أندرويد حقيقي يفتح من شاشة الهاتف بدون شريط المتصفح'
                          : 'Full standalone Android WebAPK without browser bars or Chrome headers'}
                      </p>
                    </div>
                  </div>

                  {isInstallable && !isStandalone && !pwaInstalledSuccess && (
                    <button
                      onClick={async () => {
                        const outcome = await promptInstall();
                        if (outcome === 'accepted') {
                          setPwaInstalledSuccess(true);
                        }
                      }}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>{isRtl ? 'تثبيت التطبيق الآن' : 'Install App Now'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              {isStandalone || pwaInstalledSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">
                      {isRtl ? 'التطبيق مثبت ومحمل على هاتفك الأندرويد' : 'Installed and running as native app'}
                    </h4>
                    <p className="text-[11px] text-emerald-400/80">
                      {isRtl 
                        ? 'يعمل التطبيق الآن بكامل شاشة الهاتف وبدون شريط عنوان المتصفح وبأقصى سرعة ممكنة.'
                        : 'The app is running fullscreen with native Android lifecycle and wake-lock enabled.'}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    {isRtl ? 'شاشة سينمائية كاملة' : 'Fullscreen Immersion'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isRtl ? 'إخفاء شريط المتصفح Chrome لتبدو الواجهة كتطبيق أندرويد حقيقي' : 'Hides Chrome URL bar and browser frame'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    {isRtl ? 'أيقونة على الشاشة الرئيسية' : 'Home Screen Icon'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isRtl ? 'أيقونة 4K فاخرة في قائمة تطبيقات الهاتف لفتحه بلمسة واحدة' : 'Launch with 1 tap from launcher or home screen'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Tv className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    {isRtl ? 'بقاء الشاشة مضاءة (WakeLock)' : 'Screen Wake Lock'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isRtl ? 'لا تنطفئ شاشة الهاتف إطلاقاً أثناء مشاهدة المباريات والقنوات' : 'Display remains active throughout live playback'}
                  </p>
                </div>
              </div>

              {/* Instructions on Android Chrome */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>{isRtl ? 'خطوات تثبيت التطبيق على متصفح أندرويد (Google Chrome):' : 'Installation steps on Android Chrome:'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{isRtl ? 'اضغط على زر الخيارات' : 'Tap options'}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">
                          <MoreVertical className="w-3 h-3" />
                          {isRtl ? 'النقاط الثلاث' : 'Three dots'}
                        </span>
                        <span>{isRtl ? 'في زاوية الشاشة' : 'in Chrome'}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isRtl ? 'تجدها في أعلى يمين أو يسار شاشة المتصفح' : 'Located at top edge of Google Chrome'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{isRtl ? 'اختر' : 'Choose'}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          <Download className="w-3 h-3" />
                          {isRtl ? 'تثبيت التطبيق' : 'Install App'}
                        </span>
                        <span>{isRtl ? 'أو إضافة للشاشة الرئيسية' : 'or Add to Home'}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isRtl ? 'سيتم تحميله ووضعه مع تطبيقات هاتفك الأندرويد فوراً' : 'Android creates an app entry in your app drawer'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SUBSCRIPTION & XTREAM */}
          {activeTab === 'subscription' && (
            <div className="space-y-5">
              {/* Active Subscription Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
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
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isRtl ? 'تحديث القنوات' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Methods Sub-Bar: Xtream, M3U URL, M3U File, Free Presets */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="font-black text-white text-xs">
                      {isRtl ? 'طرق ربط وإضافة القنوات والاشتراكات:' : 'Playlist & Subscription Methods:'}
                    </span>
                  </div>
                  {onOpenAddPlaylistModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAddPlaylistModal(subMethod === 'm3u_url' ? 'url' : subMethod === 'm3u_file' ? 'file' : subMethod === 'preset' ? 'preset' : 'xtream')}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'فتح في نافذة كاملة' : 'Open in Modal'}</span>
                    </button>
                  )}
                </div>

                {/* Sub-Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setSubMethod('xtream'); setLocalMessage(null); }}
                    className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      subMethod === 'xtream'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/25'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'سيرفر اكستريم' : 'Xtream API'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSubMethod('m3u_url'); setLocalMessage(null); }}
                    className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      subMethod === 'm3u_url'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'رابط M3U' : 'M3U Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSubMethod('m3u_file'); setLocalMessage(null); }}
                    className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      subMethod === 'm3u_file'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'رفع ملف M3U' : 'Upload File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSubMethod('preset'); setLocalMessage(null); }}
                    className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      subMethod === 'preset'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-md shadow-indigo-600/25'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isRtl ? 'قنوات مجانية' : 'Free Lists'}</span>
                  </button>
                </div>
              </div>

              {localMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  localMessage.type === 'success' 
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{localMessage.text}</span>
                </div>
              )}

              {/* METHOD 1: XTREAM CODES API */}
              {subMethod === 'xtream' && (
                <form onSubmit={handleSaveXtream} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
                  {/* Smart Auto-Extract from full link */}
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                    <span className="text-[11px] font-bold text-cyan-300 block">
                      {isRtl ? '⚡ قراءة واستخراج ذكي من أي رابط Xtream كامل:' : '⚡ Auto-extract from full Xtream URL:'}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={fullXtreamExtractInput}
                        onChange={(e) => setFullXtreamExtractInput(e.target.value)}
                        placeholder="http://server:port/get.php?username=...&password=..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAutoExtractXtream(fullXtreamExtractInput)}
                        className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0"
                      >
                        {isRtl ? 'استخراج' : 'Extract'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        {isRtl ? 'رابط الخادم (Server URL):' : 'Server URL:'}
                      </label>
                      <input
                        type="text"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        placeholder="http://iptv-server.com:8080"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        {isRtl ? 'اسم المستخدم (Username):' : 'Username:'}
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        {isRtl ? 'كلمة المرور (Password):' : 'Password:'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full ps-3.5 pe-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        {isRtl ? 'اسم ملف الاشتراك (اختياري):' : 'Profile Name (Optional):'}
                      </label>
                      <input
                        type="text"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        placeholder={isRtl ? 'مثال: اشتراك البيت VIP 4K' : 'e.g. VIP 4K Home'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>{isRtl ? 'حفظ والاتصال الآن' : 'Save & Connect'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* METHOD 2: M3U URL (مكان إدخال رابط M3U) */}
              {subMethod === 'm3u_url' && (
                <form onSubmit={handleSaveM3uUrl} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2">
                    <Link className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{isRtl ? 'أدخل رابط M3U أو M3U8 لتحميل القنوات وتحديث المكتبة تلقائياً.' : 'Enter remote M3U URL to stream channels.'}</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {isRtl ? 'رابط القائمة (M3U URL):' : 'M3U URL:'} <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={m3uUrlInput}
                      onChange={(e) => setM3uUrlInput(e.target.value)}
                      placeholder="https://example.com/playlist.m3u8"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {isRtl ? 'اسم القائمة (اختياري):' : 'Playlist Name (Optional):'}
                    </label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      placeholder={isRtl ? 'مثال: باقتي الرياضية' : 'e.g. My Sports List'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                      <span>{isRtl ? 'تحميل وحفظ القائمة' : 'Import M3U URL'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* METHOD 3: M3U FILE UPLOAD (مكان تحميل ملف M3U) */}
              {subMethod === 'm3u_file' && (
                <form onSubmit={handleSaveM3uFile} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{isRtl ? 'اختر ملف M3U محفوظ على جهازك لاستيراد القنوات فوراً.' : 'Upload an M3U file from your device.'}</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {isRtl ? 'اسم القائمة (اختياري):' : 'Playlist Name (Optional):'}
                    </label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      placeholder={isRtl ? 'مثال: ملف القنوات المفضل' : 'e.g. Local M3U'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <input
                      type="file"
                      id="settings-m3u-file-input"
                      accept=".m3u,.m3u8,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setM3uFileInput(file);
                          if (!playlistName) setPlaylistName(file.name.replace(/\.[^/.]+$/, ''));
                        }
                      }}
                      className="block w-full text-xs text-slate-400 file:me-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{isRtl ? 'قراءة واستيراد الملف' : 'Upload & Parse'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* METHOD 4: FREE M3U PRESETS (باقات M3U مجانية جاهزة) */}
              {subMethod === 'preset' && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{isRtl ? 'اختر باقة مجانية حقيقية ومفحوصة للتشغيل الفوري بنقرة واحدة:' : 'Choose a verified public package for instant streaming:'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {PRESET_PLAYLISTS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectFreePreset(preset)}
                        disabled={isLoading}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-start flex flex-col justify-between gap-2 group transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300">{preset.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-300 font-mono font-bold shrink-0">{preset.badge}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</p>
                        <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                          <span>{isRtl ? 'تفعيل الآن' : 'Activate'}</span>
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Profiles Manager list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>{isRtl ? 'قوائم التشغيل والاشتراكات المحفوظة' : 'Saved Playlists'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{profiles.length} {isRtl ? 'اشتراكات' : 'profiles'}</span>
                </div>

                <div className="space-y-2">
                  {profiles.map((p) => {
                    const isActive = p.id === activeProfile?.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-cyan-950/30 border-cyan-500/40'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isActive ? <Check className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{p.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {p.channelCount} {isRtl ? 'عنصر' : 'channels'} • {p.type.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <button
                              onClick={() => switchProfile(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                            >
                              {isRtl ? 'تفعيل' : 'Switch'}
                            </button>
                          )}
                          {profiles.length > 1 && (
                            <button
                              onClick={() => deleteProfile(p.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition"
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

          {/* TAB 2: SERVER SPEEDTEST & DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-950 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isRtl ? 'فحص جودة سيرفر الـ IPTV وسرعة البث' : 'IPTV Server & Network Speed Diagnostic'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isRtl ? 'اختبار زمن الاستجابة (Ping)، معدل نقل البيانات (Mbps)، وتوافق دقة 4K' : 'Measure latency, streaming bitrate, and 4K readiness'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunDiagnostics}
                  disabled={isTestingSpeed}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <Gauge className={`w-4 h-4 ${isTestingSpeed ? 'animate-spin' : ''}`} />
                  <span>{isTestingSpeed ? (isRtl ? 'جاري الفحص...' : 'Testing...') : (isRtl ? 'بدء الفحص الآن' : 'Run Diagnostics')}</span>
                </button>
              </div>

              {/* Progress indicator during test */}
              {isTestingSpeed && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-300 font-semibold">
                    <span>{testProgressMsg}</span>
                    <span className="text-emerald-400 font-mono">{Math.round(testProgressPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${testProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Diagnostic Results Card */}
              {diagnosticResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {isRtl ? 'سرعة التنزيل والبث' : 'Streaming Speed'}
                      </span>
                      <div className="text-2xl font-black text-emerald-400 font-mono">
                        {diagnosticResult.downloadSpeedMbps} <span className="text-xs font-normal text-slate-400">Mbps</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">تدفق مباشر عالي الدقة</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {isRtl ? 'زمن الاستجابة (Ping)' : 'Server Latency (Ping)'}
                      </span>
                      <div className="text-2xl font-black text-cyan-400 font-mono">
                        {diagnosticResult.pingMs} <span className="text-xs font-normal text-slate-400">ms</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">استجابة تبديل القنوات</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {isRtl ? 'أعلى دقة موصى بها' : 'Recommended Quality'}
                      </span>
                      <div className="text-xl font-black text-amber-300">
                        {diagnosticResult.details.recommendedMaxResolution}
                      </div>
                      <span className="text-[10px] text-slate-500 block">بناءً على الاختبار الحي</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">{isRtl ? diagnosticResult.statusMessageAr : diagnosticResult.statusMessageEn}</div>
                      <div className="text-[10px] text-slate-400">
                        السيرفر المستهدف: {activeProfile?.server || 'خادم البث الافتراضي'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : !isTestingSpeed && (
                <div className="p-8 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-2">
                  <Wifi className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    {isRtl ? 'اضغط على زر "بدء الفحص الآن" لقياس أداء سيرفر IPTV وسرعة النت الحقيقية.' : 'Click "Run Diagnostics" to benchmark server ping and throughput.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PARENTAL CONTROL & KIDS MODE */}
          {activeTab === 'parental' && (
            <div className="space-y-5">
              {/* Kids Mode Toggle Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-slate-950 border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Baby className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{isRtl ? 'وضع الأطفال والملف العائلي' : 'Kids Mode Profile'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isKidsMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isKidsMode ? (isRtl ? 'مُفعّل' : 'Active') : (isRtl ? 'مُعطّل' : 'Inactive')}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isRtl ? 'تصفية المحتوى لعرض قنوات الكرتون والأفلام العائلية فقط، وقفل الباقات الحساسة' : 'Filter content strictly to family-safe and animation channels'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleKidsToggleClick}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                    isKidsMode
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isKidsMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <span>{isKidsMode ? (isRtl ? 'إيقاف وضع الأطفال' : 'Exit Kids Mode') : (isRtl ? 'تفعيل وضع الأطفال' : 'Enable Kids Mode')}</span>
                </button>
              </div>

              {/* Unlock PIN Prompt (Shown when exiting Kids Mode) */}
              {showPinPrompt && (
                <form onSubmit={handleConfirmUnlock} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <KeyRound className="w-4 h-4" />
                    <span>{isRtl ? 'أدخل رمز PIN الأبوي للتعطيل:' : 'Enter Parental PIN to unlock:'}</span>
                  </div>
                  {unlockError && (
                    <div className="text-xs text-rose-400 font-semibold">{unlockError}</div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={unlockPinInput}
                      onChange={e => setUnlockPinInput(e.target.value)}
                      placeholder="0000"
                      className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center tracking-widest text-sm w-32 focus:outline-none focus:border-amber-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      {isRtl ? 'تأكيد الرمز' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPinPrompt(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              )}

              {/* Change Parental PIN */}
              <form onSubmit={handleSavePin} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span>{isRtl ? 'تغيير رمز PIN الأبوي (المكون من 4 أرقام):' : 'Change Parental 4-digit PIN:'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    الرمز الحالي: ****
                  </span>
                </div>

                {pinChangeMsg && (
                  <div className="text-xs text-cyan-300 font-medium">{pinChangeMsg}</div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={e => setNewPinInput(e.target.value)}
                    placeholder="رمز جديد (مثال: 1234)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono tracking-widest w-48 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                  >
                    {isRtl ? 'حفظ الرمز الجديد' : 'Save PIN'}
                  </button>
                </div>
              </form>

              {/* Individual Category Locks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>{isRtl ? 'قفل باقات وقنوات محددة برمز سري' : 'Lock Specific Categories'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {lockedCategories.length} {isRtl ? 'باقات مقفلة' : 'locked'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {allGroups.slice(0, 16).map(group => {
                    const isLocked = lockedCategories.includes(group);
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => toggleCategoryLock(group)}
                        className={`p-2.5 rounded-xl text-start text-xs flex items-center justify-between border transition cursor-pointer ${
                          isLocked
                            ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{group}</span>
                        {isLocked ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {isRtl ? 'مقفل' : 'Locked'}
                          </span>
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GENERAL & NETWORK */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Language Setting */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-bold text-slate-200 block">{t.language}</span>
                    <span className="text-[11px] text-slate-400">تغيير لغة الواجهة والاتجاه</span>
                  </div>
                </div>
                <button
                  onClick={onToggleLang}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
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
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إعادة ضبط</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: REMOTE & KEYBOARD SHORTCUTS */}
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

          {/* TAB 6: ERROR LOGS (سجل الأخطاء) */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Header Controls Bar */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                    <Bug className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">
                        {t.errorLogs}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        {errorLogs.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isRtl 
                        ? 'التقاط أخطاء مشغل الفيديو وروابط القنوات وأخطاء الشبكة و JavaScript تلقائياً' 
                        : 'Capturing video player failures, stream URLs, network errors & JS exceptions'}
                    </p>
                  </div>
                </div>

                {/* Main Action Buttons: Copy All & Clear */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAllLogs}
                    disabled={errorLogs.length === 0}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                      copiedAll
                        ? 'bg-emerald-600 text-white'
                        : errorLogs.length === 0
                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500/40 active:scale-95'
                    }`}
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAll ? (isRtl ? 'تم النسخ!' : 'Copied!') : t.copyAllLogs}</span>
                  </button>

                  <button
                    onClick={handleClearLogs}
                    disabled={errorLogs.length === 0}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      errorLogs.length === 0
                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
                        : 'bg-red-600/90 hover:bg-red-500 text-white border border-red-500/40 active:scale-95'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clearLogs}</span>
                  </button>

                  {/* Simulate Test Error button */}
                  <button
                    onClick={handleSimulateTestError}
                    title={isRtl ? 'إضافة خطأ تجريبي للتأكد من عمل السجل' : 'Simulate a test error'}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1-Click Auto-Repair Tools */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{isRtl ? 'الإصلاح التلقائي الشامل للمشاكل' : '1-Click Auto-Repair Suite'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {isRtl ? 'تفعيل البروكسي وتجديد روابط وتوكن القنوات فورياً لحل الشاشة السوداء أو حظر CORS' : 'Auto-fix black screens, stream stalls & CORS blocks'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAutoRepair}
                  disabled={isRepairingLogs}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 text-slate-950 ${isRepairingLogs ? 'animate-spin' : ''}`} />
                  <span>{isRepairingLogs ? (isRtl ? 'جاري الإصلاح...' : 'Repairing...') : (isRtl ? 'إصلاح المشاكل الآن' : 'Run Auto-Repair')}</span>
                </button>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute start-3 top-2.5" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder={isRtl ? 'بحث في السجل بالرسالة، الرابط، أو القناة...' : 'Filter logs by message, URL, or channel...'}
                    className="w-full ps-8 pe-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                  {logSearchQuery && (
                    <button
                      onClick={() => setLogSearchQuery('')}
                      className="absolute end-2.5 top-2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setLogFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      logFilter === 'all'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.allLogs} ({errorLogs.length})
                  </button>
                  <button
                    onClick={() => setLogFilter('player')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      logFilter === 'player'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Tv className="w-3 h-3 text-rose-400" />
                    <span>{t.playerErrors}</span>
                    <span className="text-[10px] opacity-80">
                      ({errorLogs.filter(l => l.type === 'player').length})
                    </span>
                  </button>
                  <button
                    onClick={() => setLogFilter('network')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      logFilter === 'network'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Wifi className="w-3 h-3 text-sky-400" />
                    <span>{t.networkErrors}</span>
                    <span className="text-[10px] opacity-80">
                      ({errorLogs.filter(l => l.type === 'network').length})
                    </span>
                  </button>
                  <button
                    onClick={() => setLogFilter('javascript')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      logFilter === 'javascript'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-3 h-3 text-amber-400" />
                    <span>JavaScript</span>
                    <span className="text-[10px] opacity-80">
                      ({errorLogs.filter(l => l.type === 'javascript').length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Logs List Area */}
              {(() => {
                const filtered = errorLogs.filter(log => {
                  if (logFilter !== 'all' && log.type !== logFilter) return false;
                  if (!logSearchQuery.trim()) return true;
                  const q = logSearchQuery.toLowerCase();
                  return (
                    log.message.toLowerCase().includes(q) ||
                    (log.channelName && log.channelName.toLowerCase().includes(q)) ||
                    (log.url && log.url.toLowerCase().includes(q)) ||
                    (log.errorCode && String(log.errorCode).toLowerCase().includes(q)) ||
                    (log.details && log.details.toLowerCase().includes(q))
                  );
                });

                if (errorLogs.length === 0) {
                  return (
                    <div className="py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/5">
                        <Check className="w-7 h-7 stroke-[2.5]" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 mb-1">
                        {t.noErrors}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mb-4">
                        {t.noErrorsDesc}
                      </p>
                      <button
                        onClick={handleSimulateTestError}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تجربة تسجيل خطأ اختباري' : 'Simulate Test Error'}</span>
                      </button>
                    </div>
                  );
                }

                if (filtered.length === 0) {
                  return (
                    <div className="py-10 px-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                      <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">
                        {isRtl ? 'لا توجد أخطاء تطابق معايير البحث المحددة.' : 'No logs match your filter criteria.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pe-1 scrollbar-thin">
                    {filtered.map(log => {
                      const isExpanded = expandedLogId === log.id;
                      const isCopied = copiedLogId === log.id;

                      const typeColor = 
                        log.type === 'player'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          : log.type === 'network'
                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300';

                      const typeLabel = 
                        log.type === 'player'
                          ? (isRtl ? 'مشغل الفيديو' : 'Player Error')
                          : log.type === 'network'
                          ? (isRtl ? 'الشبكة والاتصال' : 'Network')
                          : 'JavaScript';

                      const typeIcon = 
                        log.type === 'player' ? (
                          <Tv className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : log.type === 'network' ? (
                          <Wifi className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        ) : (
                          <Code className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        );

                      return (
                        <div
                          key={log.id}
                          className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 transition space-y-2 group"
                        >
                          {/* Row 1: Badges, Timestamp & Actions */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Type Badge */}
                              <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${typeColor}`}>
                                {typeIcon}
                                <span>{typeLabel}</span>
                              </div>

                              {/* Error Code Pill */}
                              {log.errorCode !== undefined && (
                                <div className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-300 text-[10px] font-mono font-bold">
                                  {log.errorCode}
                                </div>
                              )}

                              {/* Timestamp */}
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{log.timeFormatted}</span>
                              </div>
                            </div>

                            {/* Card Quick Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopySingleLog(log)}
                                title={isRtl ? 'نسخ هذا الخطأ' : 'Copy this error'}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                  isCopied
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                                }`}
                              >
                                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{isCopied ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ' : 'Copy')}</span>
                              </button>

                              {(log.stack || log.details) && (
                                <button
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
                                  title={isExpanded ? (isRtl ? 'طي التفاصيل' : 'Collapse') : (isRtl ? 'عرض التفاصيل' : 'Expand')}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Error Message */}
                          <div className="text-xs font-semibold text-slate-200 break-words leading-relaxed">
                            {log.message}
                          </div>

                          {/* Row 3: Channel Name (if applicable) */}
                          {log.channelName && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800/80">
                              <Tv className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="font-bold text-slate-400">{isRtl ? 'القناة:' : 'Channel:'}</span>
                              <span className="text-white font-medium">{log.channelName}</span>
                            </div>
                          )}

                          {/* Row 4: URL (if applicable) */}
                          {log.url && (
                            <div className="flex items-start gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 break-all">
                              <Link className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                              <span className="select-all text-slate-300">{log.url}</span>
                            </div>
                          )}

                          {/* Row 5: Expandable Details & Stack Trace */}
                          {isExpanded && (
                            <div className="space-y-2 pt-1">
                              {log.details && (
                                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
                                  <div className="font-bold text-slate-400 mb-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-amber-400" />
                                    <span>{isRtl ? 'معلومات تفصيلية:' : 'Details:'}</span>
                                  </div>
                                  <p className="text-slate-300 leading-relaxed">{log.details}</p>
                                </div>
                              )}

                              {log.stack && (
                                <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 font-mono text-[10px] text-rose-300/80 overflow-x-auto whitespace-pre leading-normal">
                                  <div className="text-slate-500 font-bold mb-1">{isRtl ? 'تتبع الخطأ (Stack Trace):' : 'Stack Trace:'}</div>
                                  {log.stack}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
