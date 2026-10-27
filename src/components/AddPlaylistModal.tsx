import React, { useState } from 'react';
import { 
  X, 
  Link, 
  Upload, 
  Server, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Tv, 
  Layers,
  Radio,
  Flame,
  Camera,
  Film,
  ArrowRight,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { useIptv } from '../context/IptvContext';
import { PRESET_PLAYLISTS, PresetPlaylist } from '../services/iptvService';
import { Language, translations } from '../utils/translations';

interface AddPlaylistModalProps {
  onClose: () => void;
  lang: Language;
}

type TabType = 'url' | 'file' | 'xtream' | 'preset';

export const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const { 
    importM3uUrl, 
    importM3uFile, 
    importXtreamCodes, 
    loadPreset, 
    isLoading, 
    loadProgress, 
    error 
  } = useIptv();

  const [activeTab, setActiveTab] = useState<TabType>('preset');

  // Form states
  const [playlistName, setPlaylistName] = useState<string>('');
  const [m3uUrl, setM3uUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Xtream states
  const [serverUrl, setServerUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [localError, setLocalError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle M3U URL Import
  const handleImportUrl = async () => {
    if (!m3uUrl.trim()) {
      setLocalError(isRtl ? 'يرجى إدخال رابط M3U صالح.' : 'Please enter a valid M3U URL.');
      return;
    }

    setLocalError('');
    const success = await importM3uUrl(m3uUrl.trim(), playlistName.trim() || undefined);
    if (success) {
      setSuccessMessage(isRtl ? 'تم استيراد القنوات وتحديث المكتبة بنجاح!' : 'Playlist imported successfully!');
      setTimeout(() => onClose(), 900);
    }
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    if (!playlistName) {
      setPlaylistName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleImportFile = async () => {
    if (!selectedFile) {
      setLocalError(isRtl ? 'يرجى اختيار ملف M3U من جهازك.' : 'Please select an M3U file.');
      return;
    }

    setLocalError('');
    const success = await importM3uFile(selectedFile, playlistName.trim() || undefined);
    if (success) {
      setSuccessMessage(isRtl ? 'تم قراءة الملف وبناء القنوات بنجاح!' : 'M3U file parsed successfully!');
      setTimeout(() => onClose(), 900);
    }
  };

  // Handle Xtream Codes Login
  const handleImportXtream = async () => {
    if (!serverUrl.trim() || !username.trim() || !password.trim()) {
      setLocalError(isRtl ? 'يرجى ملء جميع حقول Xtream Codes (السيرفر، المستخدم، كلمة المرور).' : 'Please fill all Xtream Codes fields.');
      return;
    }

    setLocalError('');
    const success = await importXtreamCodes(
      serverUrl.trim(),
      username.trim(),
      password.trim(),
      playlistName.trim() || undefined
    );

    if (success) {
      setSuccessMessage(isRtl ? 'تم الاتصال بسيرفر Xtream وسحب القنوات بنجاح!' : 'Xtream connected successfully!');
      setTimeout(() => onClose(), 900);
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = async (preset: PresetPlaylist) => {
    setLocalError('');
    const success = await loadPreset(preset);
    if (success) {
      setSuccessMessage(isRtl ? `تم تفعيل باقة: ${preset.name}` : `Activated package: ${preset.name}`);
      setTimeout(() => onClose(), 900);
    }
  };

  const getPresetIcon = (icon: string) => {
    switch (icon) {
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Tv': return <Tv className="w-5 h-5 text-cyan-400" />;
      case 'Radio': return <Radio className="w-5 h-5 text-emerald-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-red-400" />;
      case 'Camera': return <Camera className="w-5 h-5 text-purple-400" />;
      case 'Film': return <Film className="w-5 h-5 text-pink-400" />;
      default: return <Globe className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div 
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={onClose}
      />

      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl bg-[#080d1e]/95 border border-cyan-500/30 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Top Accent Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{t.addPlaylist}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  IPTV Core Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRtl ? 'استقبل القنوات الحية، الأفلام، والمسلسلات عبر M3U أو Xtream Codes API' : 'Stream live channels, movies and series via M3U or Xtream API'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-black/30 border-b border-white/10 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('preset'); setLocalError(''); }}
            className={`py-2.5 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'preset' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="truncate">{isRtl ? 'باقات جاهزة' : 'Presets'}</span>
          </button>
          <button
            onClick={() => { setActiveTab('url'); setLocalError(''); }}
            className={`py-2.5 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'url' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            <span className="truncate">{t.importM3uUrl}</span>
          </button>
          <button
            onClick={() => { setActiveTab('xtream'); setLocalError(''); }}
            className={`py-2.5 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'xtream' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span className="truncate">{t.importXtream}</span>
          </button>
          <button
            onClick={() => { setActiveTab('file'); setLocalError(''); }}
            className={`py-2.5 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'file' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="truncate">{t.importM3uFile}</span>
          </button>
        </div>

        {/* Dynamic Loading Progress Bar */}
        {isLoading && loadProgress && (
          <div className="p-4 bg-cyan-950/60 border-b border-cyan-500/30 animate-pulse">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-200 mb-2">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                {loadProgress.status}
              </span>
              <span className="font-mono text-cyan-400">{loadProgress.percent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${loadProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 max-h-[58vh]">
          {/* Error Message Display */}
          {(localError || error) && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="font-medium">{localError || error}</span>
            </div>
          )}

          {/* Success Message Display */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="font-black">{successMessage}</span>
            </div>
          )}

          {/* TAB 1: CURATED PRESETS */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                {isRtl ? 'اختر باقة مجانية حقيقية ومفحوصة جاهزة للبث المباشر فوراً بنقرة واحدة:' : 'Select a verified, working public package ready for instant playback:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {PRESET_PLAYLISTS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    disabled={isLoading}
                    className="p-4 rounded-2xl bg-[#0d1428] hover:bg-[#121c38] border border-white/10 hover:border-cyan-500/50 text-start flex flex-col justify-between gap-3 group transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-500/30 transition">
                          {getPresetIcon(preset.icon)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition">
                            {preset.name}
                          </h4>
                          <span className="text-[10px] text-cyan-400/90 font-mono font-semibold">
                            {preset.channelCountEstimate}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold shrink-0">
                        {preset.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-bold text-slate-300 group-hover:text-cyan-300">
                      <span>{isRtl ? 'تحميل الباقة وتفعيلها' : 'Load Package'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: M3U URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.playlistName} ({isRtl ? 'اختياري' : 'Optional'})
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder={isRtl ? 'مثال: باقتي الرياضية / My Sports List' : 'e.g. My Premium Playlist'}
                  className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.enterUrl} <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="url"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  placeholder="https://example.com/playlist.m3u8"
                  className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-mono transition"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {isRtl ? 'يقوم المحرك بجلب الرابط وفك تشفير وسوم #EXTINF وتوزيع القنوات تلقائياً في الواجهة.' : 'The engine fetches the URL, parses #EXTINF tags and categorizes media dynamically.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: XTREAM CODES API */}
          {activeTab === 'xtream' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isRtl ? 'اسم الاشتراك (اختياري)' : 'Playlist Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Xtream VIP Server"
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.enterServer} <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://iptv-server.com:8080"
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.username} <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user123"
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.password} <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300">
                {isRtl ? 'يدعم الاتصال المباشر بـ Xtream Codes API لسحب القنوات المباشرة، الأفلام، والمسلسلات مع البوسترات ومعلومات الحلقات.' : 'Supports full Xtream Codes API integration with live streams, VOD, and series info.'}
              </div>
            </div>
          )}

          {/* TAB 4: M3U FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.playlistName} ({isRtl ? 'اختياري' : 'Optional'})
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder={isRtl ? 'اسم القائمة' : 'Playlist name'}
                  className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.importM3uFile} (.m3u, .m3u8, .txt)
                </label>
                <label className="border-2 border-dashed border-white/20 hover:border-cyan-400/80 rounded-3xl p-7 flex flex-col items-center justify-center cursor-pointer bg-black/40 hover:bg-black/60 transition group">
                  <Upload className="w-10 h-10 text-cyan-400 mb-2 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-200 mb-1">
                    {fileName ? fileName : (isRtl ? 'انقر لاختيار ملف M3U أو اسحبه هنا' : 'Click or drop M3U file here')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    M3U / M3U_PLUS with #EXTINF
                  </span>
                  <input
                    type="file"
                    accept=".m3u,.m3u8,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab !== 'preset' && (
          <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              onClick={
                activeTab === 'url'
                  ? handleImportUrl
                  : activeTab === 'file'
                  ? handleImportFile
                  : handleImportXtream
              }
              disabled={isLoading}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isLoading ? (isRtl ? 'جاري الاستيراد...' : 'Importing...') : t.importBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
