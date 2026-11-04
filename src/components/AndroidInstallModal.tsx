import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  Sparkles, 
  MoreVertical, 
  Tv, 
  ShieldCheck, 
  Zap, 
  Maximize2,
  Share2
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
}) => {
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };

  const isArabic = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0e1628] to-[#070b14] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-5 pb-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070b19] rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isArabic ? 'تثبيت تطبيق أندرويد الحقيقي' : 'Install Real Android App'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400">
                  APK / PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isArabic 
                  ? 'تشغيل مستقل بدون شريط المتصفح وبسرعة فائقة'
                  : 'Standalone launch without browser URL bar'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status Banner */}
          {isStandalone || isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">
                  {isArabic ? 'التطبيق مثبت ومفتوح في الوضع المستقل!' : 'App is installed and running in standalone mode!'}
                </h4>
                <p className="text-xs text-emerald-400/80 mt-1">
                  {isArabic 
                    ? 'أنت تستخدم الآن تطبيق Cinema Pro 4K كأندرويد حقيقي بدون شريط عناوين.'
                    : 'You are now running Cinema Pro 4K as a native Android application.'}
                </p>
              </div>
            </div>
          ) : installSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-white">
                {isArabic ? 'تم قبول التثبيت بنجاح!' : 'Installation accepted!'}
              </h4>
              <p className="text-xs text-slate-300">
                {isArabic 
                  ? 'يقوم نظام أندرويد الآن بإضافة أيقونة Cinema Pro إلى شاشتك الرئيسية وقائمة التطبيقات.'
                  : 'Android is now adding Cinema Pro to your home screen and app drawer.'}
              </p>
            </div>
          ) : (
            <>
              {/* Native App Features Showcase */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {isArabic ? 'شاشة كاملة بدون متصفح' : 'No Browser Bar'}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isArabic ? 'يختفي شريط Chrome العلوي والسفلي تماماً' : 'Hides Chrome URL bar and toolbars'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {isArabic ? 'أيقونة وتطبيق حقيقي' : 'Real App Icon'}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isArabic ? 'على الشاشة الرئيسية ودرج تطبيقات الهاتف' : 'Lives in home screen & launcher'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {isArabic ? 'منع انطفاء الشاشة' : 'Screen Wake Lock'}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isArabic ? 'شاشة الهاتف تبقى مضاءة طوال مشاهدة البث' : 'Keeps display on during streaming'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {isArabic ? 'تحديث تلقائي وأمان' : 'Auto-Updating'}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isArabic ? 'تحديث فوري دون الحاجة لتحميل ملفات يدوية' : 'Instant updates and sandbox security'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct 1-Click Install Button if supported */}
              {isInstallable ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-indigo-600/20 border border-cyan-500/40 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>{isArabic ? 'تثبيت فوري بضغطة زر واحدة' : '1-Click Instant Install'}</span>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-5 h-5 stroke-[2.5]" />
                    <span>{isArabic ? 'تثبيت Cinema Pro على أندرويد الآن' : 'Install Cinema Pro on Android Now'}</span>
                  </button>
                  <p className="text-[11px] text-slate-400">
                    {isArabic 
                      ? 'سيفتح نظام الأندرويد نافذة تثبيت التطبيق الرسمي فوراً'
                      : 'Android will prompt the official app installation dialog'}
                  </p>
                </div>
              ) : null}

              {/* Step-by-Step Android Chrome Instructions (Guaranteed to work for all Android devices) */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'طريقة التثبيت المباشرة عبر متصفح أندرويد (Chrome):' : 'How to install via Android Chrome:'}</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">خطوتان فقط</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{isArabic ? 'اضغط على زر الخيارات' : 'Tap the options menu'}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[11px]">
                          <MoreVertical className="w-3 h-3" />
                          {isArabic ? 'النقاط الثلاث' : 'Three dots'}
                        </span>
                        <span>{isArabic ? 'في أعلى أو أسفل المتصفح' : 'in Chrome'}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isArabic ? 'الموجودة في الزاوية العلوية لمتصفح جوجل كروم' : 'Located at the top right/left of Google Chrome'}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{isArabic ? 'اختر خيار' : 'Select'}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-[11px]">
                          <Download className="w-3 h-3" />
                          {isArabic ? 'تثبيت التطبيق' : 'Install App'}
                        </span>
                        <span>{isArabic ? 'أو' : 'or'}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-[11px]">
                          <Share2 className="w-3 h-3" />
                          {isArabic ? 'إضافة إلى الشاشة الرئيسية' : 'Add to Home screen'}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isArabic 
                          ? 'سيتم فوراً تحويل الموقع إلى تطبيق أندرويد حقيقي على هاتفك مع أيقونة 4K وشاشة سينمائية كاملة!'
                          : 'The website instantly installs as a real Android app with 4K launcher icon and fullscreen player.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#060a14] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isArabic ? 'متوافق 100% مع جميع هواتف وشاشات Android' : '100% Compatible with Android TV & Phones'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
