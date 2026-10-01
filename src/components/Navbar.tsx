import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, Share2, Check, Smartphone } from 'lucide-react';
import { sounds } from '../utils/audio';

interface NavbarProps {
  roomId?: string;
  onOpenRules: () => void;
  onShareLink?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ roomId, onOpenRules }) => {
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [copied, setCopied] = useState(false);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundEnabled(sounds.enabled);
    if (sounds.enabled) {
      sounds.playDing();
    }
  };

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      sounds.playDing();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5">
          <a
            href="/"
            className="flex items-center gap-2 text-base sm:text-lg font-black tracking-tight text-white hover:text-amber-400 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-base shadow-md shadow-amber-500/30">
              🚫
            </span>
            <span className="font-extrabold tracking-tight">不要做挑戰</span>
            <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              橫向手遊版
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation & Room Info */}
        <div className="flex items-center gap-3">
          {roomId ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-amber-500/30 text-xs shadow-inner">
              <span className="text-slate-400 hidden xs:inline">房號</span>
              <span className="font-mono font-black text-amber-400 tracking-widest text-sm">{roomId}</span>
              <button
                onClick={handleCopyLink}
                className="ml-1 p-1 hover:text-amber-300 text-slate-400 transition-colors"
                title="複製房號與邀請連結"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>建議手機橫放 · 掌機式對戰視角</span>
            </div>
          )}
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {roomId && (
            <button
              onClick={handleCopyLink}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                copied
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 shadow-sm shadow-amber-500/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製' : '邀請好友'}</span>
            </button>
          )}

          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
            title="查看規則指南"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">規則</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? '音效已開啟' : '音效已靜音'}
            aria-label={soundEnabled ? '音效已開啟' : '音效已靜音'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
