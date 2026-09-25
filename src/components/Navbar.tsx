import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, Share2, Check, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2.5 text-lg sm:text-xl font-black tracking-tight text-white hover:text-amber-400 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm shadow-amber-500/20">
              🚫
            </span>
            <span className="font-extrabold tracking-tight">不要做挑戰</span>
          </a>

          {roomId && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">房間號:</span>
              <span className="font-mono font-bold text-amber-400 tracking-wider">{roomId}</span>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>玩法規則</span>
          </button>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            綜藝經典 · 派對爆笑聯機
          </span>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {roomId && (
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                copied
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
              }`}
              title="複製邀請連結發給好友"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>已複製連結</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>邀請好友</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenRules}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="查看規則"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? '靜音' : '開啟音效'}
            aria-label={soundEnabled ? '靜音' : '開啟音效'}
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
