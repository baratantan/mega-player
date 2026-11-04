import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  X, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  Tv, 
  KeyRound, 
  Lock, 
  Unlock, 
  ArrowRight,
  ExternalLink,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { licenseService, AppLicense } from '../services/licenseService';

interface PremiumLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const PremiumLicenseModal: React.FC<PremiumLicenseModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
}) => {
  const [license, setLicense] = useState<AppLicense>(() => licenseService.getLicense());
  const [inputKey, setInputKey] = useState<string>('');
  const [activationResult, setActivationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCopiedDevice, setIsCopiedDevice] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isCopiedGenerated, setIsCopiedGenerated] = useState<boolean>(false);

  useEffect(() => {
    const unsub = licenseService.subscribe(() => {
      setLicense(licenseService.getLicense());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  const handleCopyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(license.deviceId);
      setIsCopiedDevice(true);
      setTimeout(() => setIsCopiedDevice(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    const res = licenseService.activateKey(inputKey);
    setActivationResult(res);
    if (res.success) {
      setInputKey('');
      setTimeout(() => {
        setActivationResult(null);
      }, 4000);
    }
  };

  const handleGenerateCode = (type: 'annual' | 'lifetime') => {
    setAdminError(null);
    const res = licenseService.generateCode(type, adminPin);
    if (res.success && res.code) {
      setGeneratedCode(res.code);
    } else {
      setAdminError(res.error || 'فشل التوليد، تأكد من الرمز السري');
    }
  };

  const handleCopyGenerated = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setIsCopiedGenerated(true);
      setTimeout(() => setIsCopiedGenerated(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  // WhatsApp order link with device ID pre-filled
  const whatsappMessage = encodeURIComponent(
    `مرحباً، أود شراء كود تفعيل لتطبيق Cinema Pro Player.\nكود جهازي هو: ${license.deviceId}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-[#101726] to-[#070b14] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Golden Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 p-[1.5px] shadow-lg shadow-amber-500/25">
              <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isRtl ? 'ترخيص تطبيق Cinema Pro VIP' : 'Cinema Pro Player License'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300">
                  {license.isActivated ? 'مفعّل VIP' : (license.daysRemaining > 0 ? `تجريبي (${license.daysRemaining} يوم)` : 'منتهي')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRtl 
                  ? 'رخصة المشغل الخاصة بجهازك لفتح كافة الميزات الخارقة'
                  : 'Player software license to unlock all premium features'}
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* Device ID Card */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isRtl ? 'معرف هذا الجهاز (Device Key)' : 'Device Identifier'}
              </span>
              <div className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider">
                {license.deviceId}
              </div>
            </div>

            <button
              onClick={handleCopyDeviceId}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              {isCopiedDevice ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{isRtl ? 'تم النسخ' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>{isRtl ? 'نسخ معرف الجهاز' : 'Copy ID'}</span>
                </>
              )}
            </button>
          </div>

          {/* Status Message if Activated */}
          {license.isActivated ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-emerald-300">
                  {isRtl ? 'رخصة المشغل مفعّلة ونشطة بنجاح!' : 'Player license is active!'}
                </h4>
                <p className="text-[11px] text-emerald-400/80 mt-1">
                  {license.licenseType === 'lifetime'
                    ? (isRtl ? 'رخصة دائمة مدى الحياة بدون أي قيود.' : 'Lifetime VIP license activated.')
                    : (isRtl ? `الرخصة سارية حتى ${license.daysRemaining} يوماً قادمة.` : `Valid for ${license.daysRemaining} days.`)}
                </p>
              </div>
            </div>
          ) : null}

          {/* Pricing Tiers (باقات ترخيص التطبيق) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Plan 1: Annual */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-white">{isRtl ? 'رخصة سنوية (1 Year)' : 'Annual License'}</span>
                  <span className="text-sm font-black text-amber-400 font-mono">$5.99</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'تفعيل كامل لمدة 365 يوماً' : 'Full 365-day activation'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'شاشة العرض الرباعي (Multi-Screen)' : '4-screen multi-view'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'دعم جميع صيغ البث 4K / HLS / TS' : '4K HLS / TS playback boost'}</span>
                  </li>
                </ul>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-white/5">
                {isRtl ? 'تجدد سنوياً لكل جهاز' : 'Renews annually per device'}
              </p>
            </div>

            {/* Plan 2: Lifetime (Best Value) */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/40 relative flex flex-col justify-between shadow-lg shadow-amber-500/5">
              <span className="absolute -top-2.5 end-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px]">
                {isRtl ? 'الأكثر طلباً ⭐' : 'Best Value'}
              </span>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-300">{isRtl ? 'رخصة مدى الحياة (Lifetime)' : 'Lifetime VIP'}</span>
                  <span className="text-base font-black text-amber-300 font-mono">$14.99</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{isRtl ? 'دفع لمرة واحدة للأبد بدون تجديد' : 'One-time payment forever'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{isRtl ? 'جميع الميزات الحالية والمستقبلية' : 'All future VIP upgrades'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{isRtl ? 'أولوية في سرعة الخادم وتخفيف الضغط' : 'Fast proxy streaming priority'}</span>
                  </li>
                </ul>
              </div>
              <p className="text-[10px] text-amber-400/80 mt-3 pt-2 border-t border-amber-500/20">
                {isRtl ? 'تفعيل فوري ودائم' : 'Permanent instant activation'}
              </p>
            </div>
          </div>

          {/* Activation Code Redemption Form */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'هل لديك كود تفعيل؟ أدخله هنا لتفعيل رخصتك:' : 'Have an activation code? Redeem it here:'}</span>
            </h4>

            <form onSubmit={handleActivate} className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="مثال: CPRO-LIFE-XXXX-XXXX"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400 uppercase tracking-wider"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer shrink-0"
              >
                {isRtl ? 'تفعيل الآن' : 'Activate'}
              </button>
            </form>

            {activationResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                activationResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/40 text-red-300'
              }`}>
                {activationResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                <span>{activationResult.message}</span>
              </div>
            )}
          </div>

          {/* Buy License via Direct Contact */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? 'شراء كود التفعيل والدفع الفوري' : 'Buy Code Directly'}</span>
              </h5>
              <p className="text-[11px] text-slate-300">
                {isRtl 
                  ? 'تواصل مباشرة للحصول على كود التفعيل عبر مختلف طرق الدفع المتاحة'
                  : 'Contact directly to buy activation code via PayPal, card or local transfers'}
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950"
            >
              <span>{isRtl ? 'طلب التفعيل الآن' : 'Order License'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* ADMIN CODE GENERATOR TOOL FOR APP OWNER (لوحة مالك التطبيق لتوليد الأكواد وبيعها) */}
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>{isRtl ? 'لوحة مالك التطبيق لتوليد الأكواد للزبائن (خاص بالمالك)' : 'Owner Code Generator Tool'}</span>
            </button>

            {showAdminPanel && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs">
                    {isRtl ? 'توليد كود مدفوع لبيعه للمشترك' : 'Generate Paid Customer Code'}
                  </span>
                  <span className="text-[10px] text-slate-500">رمز المرور الافتراضي: 8899</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value)}
                    placeholder="رمز المالك (8899)"
                    className="w-36 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs text-center"
                  />
                  <button
                    onClick={() => handleGenerateCode('annual')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
                  >
                    {isRtl ? '+ كود سنة ($5.99)' : '+ 1 Year Code'}
                  </button>
                  <button
                    onClick={() => handleGenerateCode('lifetime')}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition cursor-pointer"
                  >
                    {isRtl ? '+ كود دائم ($14.99)' : '+ Lifetime Code'}
                  </button>
                </div>

                {adminError && (
                  <p className="text-[11px] text-rose-400 font-bold">{adminError}</p>
                )}

                {generatedCode && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase">{isRtl ? 'الكود المولد بنجاح:' : 'Generated Code:'}</span>
                      <div className="font-mono text-sm font-black text-white">{generatedCode}</div>
                    </div>
                    <button
                      onClick={handleCopyGenerated}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                    >
                      {isCopiedGenerated ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopiedGenerated ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ الكود' : 'Copy')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#060a14] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'رخصة مشغل رسمية وآمنة 100%' : '100% Genuine Software License'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
