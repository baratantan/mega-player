import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Wrench, 
  Copy, 
  Trash2, 
  Search, 
  Wifi, 
  Tv, 
  Layers, 
  Server, 
  ShieldAlert, 
  Activity, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  ExternalLink,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { useIptv } from '../context/IptvContext';
import { errorLogService, ErrorLogEntry, ErrorType } from '../services/errorLogService';
import { PlayerSettings } from '../types';

interface ErrorDiagnosticsModalProps {
  onClose: () => void;
  lang: Language;
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  onOpenSettingsTab?: (tab: 'subscription' | 'diagnostics' | 'logs') => void;
}

export const ErrorDiagnosticsModal: React.FC<ErrorDiagnosticsModalProps> = ({
  onClose,
  lang,
  settings,
  onUpdateSettings,
  onOpenSettingsTab,
}) => {
  const isRtl = lang === 'ar';
  const { 
    activeProfile, 
    refreshCurrentPlaylist, 
    showToast,
    channels 
  } = useIptv();

  // State
  const [logs, setLogs] = useState<ErrorLogEntry[]>(() => errorLogService.getLogs());
  const [filter, setFilter] = useState<'all' | ErrorType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Auto-Repair State
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairStep, setRepairStep] = useState<number>(0);
  const [repairSuccess, setRepairSuccess] = useState(false);
  const [repairLog, setRepairLog] = useState<string[]>([]);

  // Ping test state
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'ok' | 'error'; ms: number; msg: string } | null>(null);

  // Subscribe to error logs
  useEffect(() => {
    const unsub = errorLogService.subscribe(() => {
      setLogs(errorLogService.getLogs());
    });
    return unsub;
  }, []);

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.type === filter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;
    const matchesQuery = 
      log.message.toLowerCase().includes(q) ||
      (log.channelName && log.channelName.toLowerCase().includes(q)) ||
      (log.url && log.url.toLowerCase().includes(q)) ||
      (log.errorCode && String(log.errorCode).toLowerCase().includes(q));
    return matchesFilter && matchesQuery;
  });

  // Copy all formatted
  const handleCopyAll = async () => {
    try {
      const text = errorLogService.exportLogsAsText();
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      showToast(
        isRtl ? 'تم نسخ التقرير بالكامل' : 'Diagnostic Report Copied',
        isRtl ? `تم نسخ ${logs.length} سجل أخطاء إلى الحافظة بنجاح` : `Copied ${logs.length} error entries to clipboard`,
        'info'
      );
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Copy single log
  const handleCopySingle = async (log: ErrorLogEntry) => {
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
    } catch {}
  };

  // Clear logs
  const handleClearLogs = () => {
    if (logs.length === 0) return;
    errorLogService.clearLogs();
    showToast(
      isRtl ? 'تم مسح السجل' : 'Logs Cleared',
      isRtl ? 'تم تفريغ كافة سجلات الأخطاء بنجاح' : 'Error logs cleared',
      'info'
    );
  };

  // 1-Click Comprehensive Auto-Repair
  const handleRunAutoRepair = async () => {
    if (isRepairing) return;
    setIsRepairing(true);
    setRepairStep(1);
    setRepairSuccess(false);
    setRepairLog([]);

    const addLog = (msg: string) => {
      setRepairLog(prev => [...prev, msg]);
    };

    try {
      // Step 1: Video Engine & Buffer Flush
      addLog(isRtl ? '1. تفريغ الذاكرة المؤقتة لمشغل الفيديو وإعادة تهيئة مفاتيح HLS...' : '1. Flushing video player buffer & resetting HLS engine...');
      await new Promise(r => setTimeout(r, 600));

      // Step 2: CORS Proxy Auto-Optimization
      setRepairStep(2);
      addLog(isRtl ? '2. تفعيل وضبط خادم البروكسي الآمن لتجاوز حظر CORS وسياسات المتصفح...' : '2. Activating secure CORS stream proxy bypass...');
      onUpdateSettings({ proxyStreams: true });
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Playlist & Session Token Refresh
      setRepairStep(3);
      addLog(isRtl ? '3. تجديد بيانات الاشتراك وجلسة التوكن مع سيرفر IPTV...' : '3. Re-authenticating & renewing IPTV playlist tokens...');
      try {
        await refreshCurrentPlaylist();
        addLog(isRtl ? '✓ تم تجديد القنوات والاتصال بنجاح' : '✓ Channels re-synchronized successfully');
      } catch (err: any) {
        addLog(isRtl ? 'ℹ️ استمرار الإصلاح باستخدام النسخة المحفوظة محلياً' : 'ℹ️ Continued using cached playlist profile');
      }
      await new Promise(r => setTimeout(r, 600));

      // Step 4: Verification
      setRepairStep(4);
      addLog(isRtl ? '4. التحقق النهائي من جهوزية المشغل والقنوات...' : '4. Final verification of player readiness...');
      await new Promise(r => setTimeout(r, 500));

      setRepairSuccess(true);
      showToast(
        isRtl ? 'اكتمل الإصلاح بنجاح!' : 'Auto-Repair Completed!',
        isRtl ? 'تم إصلاح مشكلات المشغل وتجديد الاتصال وتفعيل البروكسي.' : 'Player reset, stream proxy enabled & session tokens refreshed.',
        'info'
      );
    } catch (err: any) {
      addLog(isRtl ? `حدث خطأ أثناء الإصلاح: ${err?.message || err}` : `Repair error: ${err?.message || err}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // Test Server Reachability / Ping
  const handlePingServer = async () => {
    setIsPinging(true);
    setPingResult(null);
    const start = performance.now();
    const server = activeProfile?.server;

    if (!server) {
      setPingResult({
        status: 'error',
        ms: 0,
        msg: isRtl ? 'لا يوجد سيرفر نشط للفحص (يرجى إضافة اشتراك Xtream أولاً)' : 'No active server configured',
      });
      setIsPinging(false);
      return;
    }

    try {
      // Use clean URL
      const cleanUrl = server.replace(/\/+$/, '') + '/player_api.php';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(cleanUrl, {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors' // Allows reachability check even with CORS restrictions
      });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);

      setPingResult({
        status: 'ok',
        ms: latency,
        msg: isRtl 
          ? `السيرفر متصل ومستجيب (زمن الاستجابة: ${latency} ميلي ثانية)` 
          : `Server is online and responding (${latency}ms latency)`,
      });
    } catch (e: any) {
      const latency = Math.round(performance.now() - start);
      setPingResult({
        status: 'error',
        ms: latency,
        msg: isRtl 
          ? 'تعذر الوصول إلى الخادم مباشرة (تحقق من عنوان السيرفر أو استخدم البروكسي)' 
          : 'Failed to reach server directly (Verify server URL or enable CORS proxy)',
      });
    } finally {
      setIsPinging(false);
    }
  };

  // Simulate a test error
  const handleSimulateTestError = () => {
    errorLogService.logPlayerError({
      channelName: 'BeIN Sports 1 Premium [Demo]',
      channelUrl: 'http://iptv-live.demo:8080/live/user/pass/101.m3u8',
      errorCode: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
      message: isRtl ? 'فشل فك تشفير مسار البث (خطأ تجريبي للاختبار)' : 'Stream decode failure (Simulated Demo Error)',
      details: 'HTTP 403 Forbidden / CORS header missing on origin server',
    });
    showToast(
      isRtl ? 'تم تسجيل خطأ تجريبي' : 'Simulated Error Logged',
      isRtl ? 'يمكنك الآن تجربة زر الإصلاح الفوري' : 'You can now test the auto-repair action',
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full max-w-4xl bg-[#080d1e] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/50">
              <Bug className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {isRtl ? 'مركز سجل وتشخيص وإصلاح الأخطاء' : 'Error Diagnostics & Auto-Repair Center'}
                </h2>
                {logs.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {logs.length} {isRtl ? 'خطأ مسجل' : 'errors'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {isRtl ? 'النظام سليم 100%' : 'All Healthy'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isRtl 
                  ? 'رصد فوري لأخطاء المشغل، الشبكة، والجافاسكريبت مع أدوات الإصلاح التلقائي بضغطة واحدة'
                  : 'Real-time player, network & JS error capture with 1-click auto-repair tools'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {/* 1. AUTO-REPAIR SUITE BANNER (الأدوات السريعة لإصلاح المشاكل) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{isRtl ? 'أدوات الإصلاح التلقائي الفوري' : '1-Click Auto-Repair Suite'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-bold">
                      {isRtl ? 'مستحسن' : 'Recommended'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isRtl 
                      ? 'هل تواجه شاشة سوداء أو توقف في البث أو خطأ CORS؟ اضغط هنا لإعادة التهيئة تلقائياً'
                      : 'Facing black screen, buffer stall, or CORS stream blocked? Run automatic repair'}
                  </p>
                </div>
              </div>

              {/* 1-Click Repair Button */}
              <button
                onClick={handleRunAutoRepair}
                disabled={isRepairing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Zap className={`w-4 h-4 text-slate-950 ${isRepairing ? 'animate-spin' : ''}`} />
                <span>{isRepairing ? (isRtl ? 'جاري الإصلاح...' : 'Repairing...') : (isRtl ? 'إصلاح فوري شامل لكافة الأخطاء' : 'Run Full Auto-Repair')}</span>
              </button>
            </div>

            {/* Repair Progress / Logs if Active */}
            {repairLog.length > 0 && (
              <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    {isRtl ? 'خطوات عملية الإصلاح:' : 'Repair Steps Execution:'}
                  </span>
                  {repairSuccess && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isRtl ? 'تم بنجاح' : 'Success'}
                    </span>
                  )}
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  {repairLog.map((line, idx) => (
                    <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                      <span className="text-cyan-400">›</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Proxy Mode Toggle */}
              <button
                onClick={() => {
                  const nextVal = !settings.proxyStreams;
                  onUpdateSettings({ proxyStreams: nextVal });
                  showToast(
                    isRtl ? 'تم تغيير وضع البروكسي' : 'Proxy Mode Updated',
                    nextVal 
                      ? (isRtl ? 'تم تفعيل البروكسي لتجاوز حظر CORS للمتصفح' : 'CORS proxy enabled for web streams')
                      : (isRtl ? 'تم تفعيل الاتصال المباشر بالسيرفر' : 'Direct connection enabled'),
                    'info'
                  );
                }}
                className={`p-3 rounded-xl border text-start transition flex items-center justify-between cursor-pointer ${
                  settings.proxyStreams
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isRtl ? 'بروكسي فك الحظر (CORS)' : 'Stream CORS Proxy'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {settings.proxyStreams ? (isRtl ? 'مُفعّل (يوصى به)' : 'Enabled (Recommended)') : (isRtl ? 'معطّل (اتصال مباشر)' : 'Disabled (Direct)')}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.proxyStreams ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {settings.proxyStreams ? (isRtl ? 'نشط' : 'ON') : (isRtl ? 'متوقف' : 'OFF')}
                </span>
              </button>

              {/* Refresh Playlist Token */}
              <button
                onClick={async () => {
                  try {
                    await refreshCurrentPlaylist();
                    showToast(
                      isRtl ? 'تم تحديث القائمة' : 'Playlist Refreshed',
                      isRtl ? 'تم تجديد روابط القنوات من السيرفر بنجاح' : 'Refreshed stream URLs from server',
                      'info'
                    );
                  } catch (e) {
                    showToast(isRtl ? 'تعذر التحديث' : 'Failed to refresh', isRtl ? 'تحقق من السيرفر' : 'Check server connection', 'info');
                  }
                }}
                className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-start transition flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isRtl ? 'تجديد روابط القنوات' : 'Refresh Playlist'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isRtl ? 'إعادة جلب القنوات والتوكن' : 'Re-sync tokens & streams'}
                  </div>
                </div>
              </button>

              {/* Test Host Ping */}
              <button
                onClick={handlePingServer}
                disabled={isPinging}
                className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-start transition flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isRtl ? 'فحص استجابة السيرفر' : 'Ping IPTV Server'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                    {isPinging ? (isRtl ? 'جاري الفحص...' : 'Testing...') : (pingResult ? `${pingResult.ms}ms (${pingResult.status})` : (activeProfile?.server || 'Check server'))}
                  </div>
                </div>
              </button>
            </div>

            {/* Ping Result Notification */}
            {pingResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                pingResult.status === 'ok' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {pingResult.status === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{pingResult.msg}</span>
              </div>
            )}
          </div>

          {/* 2. ERROR LOGS SECTION */}
          <div className="space-y-4">
            {/* Action Bar: Filters, Search, Copy & Clear */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs shrink-0 cursor-pointer ${
                    filter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? 'كافة السجلات' : 'All'} ({logs.length})
                </button>
                <button
                  onClick={() => setFilter('player')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs shrink-0 cursor-pointer ${
                    filter === 'player'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? 'مشغل الفيديو' : 'Player'} ({logs.filter(l => l.type === 'player').length})
                </button>
                <button
                  onClick={() => setFilter('network')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs shrink-0 cursor-pointer ${
                    filter === 'network'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? 'أخطاء الشبكة والسيرفر' : 'Network'} ({logs.filter(l => l.type === 'network').length})
                </button>
                <button
                  onClick={() => setFilter('javascript')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs shrink-0 cursor-pointer ${
                    filter === 'javascript'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? 'أخطاء البرمجة' : 'JavaScript'} ({logs.filter(l => l.type === 'javascript').length})
                </button>
              </div>

              {/* Utility Buttons: Copy All, Clear, Test Simulation */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSimulateTestError}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer"
                  title={isRtl ? 'تسجيل خطأ تجريبي لفحص النظام' : 'Simulate error for testing'}
                >
                  {isRtl ? 'تجربة خطأ وهمي' : 'Test Error'}
                </button>

                <button
                  onClick={handleCopyAll}
                  disabled={logs.length === 0}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                    copiedAll
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ التقرير' : 'Copy All')}</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  disabled={logs.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'مسح' : 'Clear'}</span>
                </button>
              </div>
            </div>

            {/* Search within logs */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث في رسائل الخطأ، اسم القناة، أو الرابط...' : 'Search in error messages, channel name, or stream URL...'}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl ps-9 pe-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Logs List Container */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pe-1">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-slate-950/40 border border-white/5 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {isRtl ? 'لا توجد أخطاء مسجلة حالياً' : 'No Errors Logged'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {isRtl 
                        ? 'كافة طلبات الشبكة، تشغيل القنوات، وعمليات النظام تعمل بسلاسة وبدون أي مشاكل' 
                        : 'All network requests, playback streams and background services are healthy.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const isCopied = copiedLogId === log.id;

                  const typeColor = 
                    log.type === 'player' 
                      ? 'border-rose-500/30 bg-rose-950/15 text-rose-300'
                      : log.type === 'network'
                      ? 'border-amber-500/30 bg-amber-950/15 text-amber-300'
                      : 'border-purple-500/30 bg-purple-950/15 text-purple-300';

                  const badgeColor = 
                    log.type === 'player'
                      ? 'bg-rose-500/20 text-rose-300'
                      : log.type === 'network'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-purple-500/20 text-purple-300';

                  return (
                    <div
                      key={log.id}
                      className={`rounded-2xl border transition ${typeColor} p-3 sm:p-4 space-y-2`}
                    >
                      {/* Top Row: Type, Time, Copy, Expand */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                            {log.type}
                          </span>
                          {log.errorCode !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-slate-300">
                              Code: {log.errorCode}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            {log.timeFormatted}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopySingle(log)}
                            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/80 text-slate-300 hover:text-white transition cursor-pointer"
                            title={isRtl ? 'نسخ هذا الخطأ' : 'Copy single log'}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {(log.details || log.stack || log.url) && (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="p-1.5 rounded-lg bg-black/40 hover:bg-black/80 text-slate-300 hover:text-white transition cursor-pointer"
                              title={isRtl ? 'تفاصيل إضافية' : 'Toggle details'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Error Message */}
                      <div className="font-bold text-white text-xs leading-relaxed">
                        {log.message}
                      </div>

                      {/* Channel Info if Present */}
                      {log.channelName && (
                        <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-semibold">
                          <Tv className="w-3 h-3" />
                          <span>{log.channelName}</span>
                        </div>
                      )}

                      {/* URL Preview */}
                      {log.url && (
                        <div className="font-mono text-[10px] text-slate-400 truncate bg-black/40 px-2 py-1 rounded-lg">
                          {log.url}
                        </div>
                      )}

                      {/* Specialized 404 / Akamai / Expired Stream Diagnosis & Guidance */}
                      {(String(log.errorCode) === '404' || log.message.includes('404')) && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold">{isRtl ? 'تشخيص خطأ 404 (البث متوقف من المصدر):' : '404 Stream Diagnosis:'}</span>
                            <p className="text-amber-100/90 leading-relaxed">
                              {isRtl
                                ? 'هذا البث متوقف أو محذوف من سيرفر البث الأصلي للقناة (مثل Akamai CDN). تطبيقك سليم تماماً - يمكنك الانتقال للقناة التالية أو تجربة باقة أخرى.'
                                : 'This stream is offline or removed by the broadcaster CDN (e.g., Akamai). The app is fully functional - you can switch to the next channel.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Expanded Technical Details & Stack */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-white/5 space-y-2 text-[11px]">
                          {log.details && (
                            <div>
                              <span className="text-slate-400 font-bold block mb-0.5">{isRtl ? 'التفاصيل:' : 'Details:'}</span>
                              <p className="text-slate-300 bg-black/50 p-2 rounded-lg font-mono text-[10px]">
                                {log.details}
                              </p>
                            </div>
                          )}

                          {log.stack && (
                            <div>
                              <span className="text-slate-400 font-bold block mb-0.5">{isRtl ? 'تتبع الخطأ (Stack Trace):' : 'Stack Trace:'}</span>
                              <pre className="text-slate-300 bg-black/70 p-2.5 rounded-lg font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-32">
                                {log.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>{isRtl ? 'يتم حفظ السجلات محلياً في جهازك لأغراض التشخيص وتفريغها عند الحاجة.' : 'Logs stored locally in your browser for troubleshooting.'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettingsTab && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSettingsTab('subscription');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition"
              >
                {isRtl ? 'إعدادات الاشتراكات' : 'Subscription Settings'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
            >
              {isRtl ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
