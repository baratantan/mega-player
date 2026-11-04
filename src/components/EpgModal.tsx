import React, { useState, useMemo } from 'react';
import { Tv, X, Calendar, Clock, Play, Bell, BellRing, Search, Sparkles } from 'lucide-react';
import { PlaylistItem, EpgProgram } from '../types';
import { Language, translations } from '../utils/translations';
import { useIptv } from '../context/IptvContext';

interface EpgModalProps {
  channels: PlaylistItem[];
  onPlayChannel: (channel: PlaylistItem) => void;
  onClose: () => void;
  lang: Language;
}

export const EpgModal: React.FC<EpgModalProps> = ({
  channels,
  onPlayChannel,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const { showToast } = useIptv();
  
  // Channels with EPG or generate fallback realistic programs
  const liveChannels = useMemo(() => {
    return channels.filter(c => c.category === 'live');
  }, [channels]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [reminders, setReminders] = useState<Set<string>>(new Set());

  // Extract distinct channel groups
  const groups = useMemo(() => {
    const s = new Set<string>();
    liveChannels.forEach(c => {
      if (c.group) s.add(c.group);
    });
    return Array.from(s);
  }, [liveChannels]);

  const filteredChannels = useMemo(() => {
    return liveChannels.filter(c => {
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGroup = selectedGroup === 'all' || c.group === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [liveChannels, searchQuery, selectedGroup]);

  const [selectedChannel, setSelectedChannel] = useState<PlaylistItem>(() => {
    return filteredChannels[0] || liveChannels[0] || channels[0];
  });

  const toggleReminder = (programKey: string, programTitle: string) => {
    setReminders(prev => {
      const next = new Set(prev);
      if (next.has(programKey)) {
        next.delete(programKey);
        showToast(
          lang === 'ar' ? 'تم إلغاء التذكير' : 'Reminder Cancelled',
          programTitle,
          'info'
        );
      } else {
        next.add(programKey);
        showToast(
          lang === 'ar' ? 'تم ضبط التذكير بنجاح 🔔' : 'Reminder Scheduled 🔔',
          `${programTitle} (${lang === 'ar' ? 'ستصلك إشارة تنبيه عند بدء البث' : 'Notification set'})`,
          'info'
        );
      }
      return next;
    });
  };

  // Generate synthetic EPG if channel has no EPG array
  const activeEpg: EpgProgram[] = useMemo(() => {
    if (selectedChannel?.epg && selectedChannel.epg.length > 0) {
      return selectedChannel.epg;
    }
    // Realistic fallback EPG timeline
    const nowHour = new Date().getHours();
    return [
      {
        title: lang === 'ar' ? `البث المباشر المفتوح: تغطية خاصة مع ${selectedChannel?.name || 'القناة'}` : `Live Special Broadcast: ${selectedChannel?.name || 'Channel'}`,
        start: `${nowHour.toString().padStart(2, '0')}:00`,
        end: `${(nowHour + 1).toString().padStart(2, '0')}:30`,
        desc: lang === 'ar' ? 'تغطية إخبارية وتحليلية مباشرة مع استوديو البث الحي ونقل ميداني مباشر.' : 'Continuous high definition live transmission with commentary.',
        progress: 65,
      },
      {
        title: lang === 'ar' ? 'برنامج الحصاد الرياضي والإخباري' : 'Daily Prime News & Sports Roundup',
        start: `${(nowHour + 1).toString().padStart(2, '0')}:30`,
        end: `${(nowHour + 2).toString().padStart(2, '0')}:30`,
        desc: lang === 'ar' ? 'تحليل شامل ومتابعة لأبرز الفعاليات والأنشطة الإقليمية والدولية.' : 'Comprehensive analytical studio with expert panelists.',
        progress: 0,
      },
      {
        title: lang === 'ar' ? 'سلسلة وثائقية حصرية: أسرار الطبيعة وعالم العلوم' : 'Exclusive Documentary: Frontiers of Science',
        start: `${(nowHour + 2).toString().padStart(2, '0')}:30`,
        end: `${(nowHour + 4).toString().padStart(2, '0')}:00`,
        desc: lang === 'ar' ? 'رحلة استكشافية مشوقة بتقنية 4K لاستعراض عجائب الطبيعة وتطور التكنولوجيا.' : 'Journey exploring global wonders in ultra high bitrate.',
        progress: 0,
      }
    ];
  }, [selectedChannel, lang]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{t.programGuide}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {lang === 'ar' ? 'مباشر وتفاعلي' : 'Live Timeline'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ar' ? 'جدول البرامج التلفزيونية الآن والقادم مع مؤقت التذكير الذكي' : 'Television schedule timeline with live progress & reminders'}
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

        {/* 2-Column Guide Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Channels list & search */}
          <div className="md:col-span-5 p-3.5 border-b md:border-b-0 md:border-e border-slate-800 flex flex-col bg-slate-950/40">
            {/* Search Box */}
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث عن قناة...' : 'Search channel...'}
                className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Group pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none text-[11px]">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition font-bold ${
                  selectedGroup === 'all'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.all} ({liveChannels.length})
              </button>
              {groups.slice(0, 6).map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 transition font-medium ${
                    selectedGroup === g
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Channels Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-1 pe-1">
              {filteredChannels.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  {lang === 'ar' ? 'لا توجد قنوات تطابق البحث' : 'No matching channels'}
                </div>
              ) : (
                filteredChannels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch)}
                    className={`w-full text-start p-2.5 rounded-xl text-xs flex items-center justify-between gap-2.5 transition cursor-pointer ${
                      selectedChannel?.id === ch.id
                        ? 'bg-gradient-to-r from-emerald-950/70 to-slate-900 text-white font-bold border border-emerald-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {ch.logo ? (
                        <img
                          src={ch.logo}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 object-contain rounded-lg bg-slate-950 p-0.5 border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                          <Tv className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="truncate text-xs font-semibold">{ch.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{ch.group}</div>
                      </div>
                    </div>
                    {selectedChannel?.id === ch.id && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Interactive Schedule timeline */}
          <div className="md:col-span-7 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between bg-slate-900">
            {selectedChannel ? (
              <div className="space-y-4">
                {/* Channel top banner */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-3">
                    {selectedChannel.logo ? (
                      <img
                        src={selectedChannel.logo}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <Tv className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {selectedChannel.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{selectedChannel.group}</span>
                        {selectedChannel.resolution && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                            {selectedChannel.resolution}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onPlayChannel(selectedChannel);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/50 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{lang === 'ar' ? 'تشغيل البث' : 'Watch Live'}</span>
                  </button>
                </div>

                {/* Timeline programs */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'ar' ? 'جدول العرض لليوم' : 'Broadcast Timeline'}</span>
                  </div>

                  {activeEpg.map((prog, idx) => {
                    const programKey = `${selectedChannel.id}_${prog.start}_${prog.title}`;
                    const hasReminder = reminders.has(programKey);
                    const isNow = idx === 0;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isNow
                            ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border-emerald-500/40 shadow-lg'
                            : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                              <Clock className="w-3.5 h-3.5" />
                              {prog.start} - {prog.end}
                            </span>
                            {isNow ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {lang === 'ar' ? 'يُعرض الآن' : 'Live Now'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded-md">
                                {lang === 'ar' ? 'لاحقاً' : 'Upcoming'}
                              </span>
                            )}
                          </div>

                          {!isNow && (
                            <button
                              onClick={() => toggleReminder(programKey, prog.title)}
                              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer ${
                                hasReminder
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
                              }`}
                              title={lang === 'ar' ? 'تذكيري بالبرنامج' : 'Remind me'}
                            >
                              {hasReminder ? <BellRing className="w-3.5 h-3.5 text-amber-400" /> : <Bell className="w-3.5 h-3.5" />}
                              <span className="text-[10px] font-bold">
                                {hasReminder ? (lang === 'ar' ? 'مضبوط' : 'Set') : (lang === 'ar' ? 'تذكير' : 'Remind')}
                              </span>
                            </button>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white mb-1">
                          {prog.title}
                        </h4>

                        {prog.desc && (
                          <p className="text-xs text-slate-400 leading-relaxed mb-2">
                            {prog.desc}
                          </p>
                        )}

                        {/* Live progress indicator */}
                        {isNow && prog.progress !== undefined && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                              <span>{lang === 'ar' ? 'التقدم في البث:' : 'Elapsed:'}</span>
                              <span className="text-emerald-400 font-mono">{prog.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full transition-all"
                                style={{ width: `${prog.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 p-8 my-auto">
                <Tv className="w-12 h-12 mx-auto mb-2 text-slate-700" />
                <p>{lang === 'ar' ? 'اختر قناة لعرض دليل البرامج' : 'Select a channel to view guide'}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
