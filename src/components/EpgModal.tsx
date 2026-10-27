import React, { useState } from 'react';
import { Tv, X, Calendar, Clock, Play } from 'lucide-react';
import { PlaylistItem } from '../types';
import { Language, translations } from '../utils/translations';

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
  const liveChannels = channels.filter(c => c.category === 'live' && c.epg && c.epg.length > 0);
  const [selectedChannel, setSelectedChannel] = useState<PlaylistItem>(liveChannels[0] || channels[0]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {t.programGuide}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ar' ? 'جدول البرامج المباشرة ومواعيد البث لليوم' : 'Daily TV broadcast timeline & program schedule'}
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

        {/* 2-Column Guide Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Left Column: Channels list */}
          <div className="p-3 border-b md:border-b-0 md:border-e border-slate-800/80 overflow-y-auto max-h-48 md:max-h-none space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase px-2 py-1">
              {t.allChannels} ({liveChannels.length})
            </div>
            {liveChannels.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className={`w-full text-start p-2.5 rounded-xl text-xs flex items-center gap-2.5 transition ${
                  selectedChannel?.id === ch.id
                    ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                {ch.logo ? (
                  <img src={ch.logo} alt="" className="w-6 h-6 object-contain rounded bg-slate-950" />
                ) : (
                  <Tv className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>

          {/* Right Column: Schedule timeline for selected channel */}
          <div className="md:col-span-2 p-5 overflow-y-auto flex flex-col justify-between">
            {selectedChannel ? (
              <div className="space-y-4">
                {/* Channel banner */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-3">
                    {selectedChannel.logo && (
                      <img src={selectedChannel.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-slate-900 p-1" />
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedChannel.name}</h3>
                      <p className="text-xs text-slate-400">{selectedChannel.group}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onPlayChannel(selectedChannel);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تشغيل الآن</span>
                  </button>
                </div>

                {/* Timeline programs */}
                <div className="space-y-2.5">
                  {selectedChannel.epg?.map((prog, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border ${
                        idx === 0
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1 text-xs font-bold text-cyan-400">
                          <Clock className="w-3.5 h-3.5" />
                          {prog.start} - {prog.end}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/80 px-2 py-0.5 rounded-md border border-red-800 animate-pulse">
                            {t.nowPlaying}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 mb-1">{prog.title}</h4>
                      {prog.desc && (
                        <p className="text-xs text-slate-400 leading-relaxed">{prog.desc}</p>
                      )}
                      {prog.progress !== undefined && (
                        <div className="mt-2.5 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog.progress}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 p-8">
                اختر قناة لعرض دليل البرامج
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
