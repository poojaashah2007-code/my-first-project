import React from 'react';
import { Play, Download, Sliders, Crosshair, Trophy, Volume2, VolumeX, Shield, Zap } from 'lucide-react';
import { ShipConfig } from '../game/types';
import { soundEngine } from '../game/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenShipSelect: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  selectedShip: ShipConfig;
  highScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenShipSelect,
  onOpenExport,
  onOpenSettings,
  selectedShip,
  highScore,
}) => {
  const [audioActive, setAudioActive] = React.useState(soundEngine.sfxEnabled);

  const toggleQuickAudio = () => {
    soundEngine.unlock();
    soundEngine.sfxEnabled = !soundEngine.sfxEnabled;
    soundEngine.musicEnabled = soundEngine.sfxEnabled;
    setAudioActive(soundEngine.sfxEnabled);
    if (soundEngine.sfxEnabled) {
      soundEngine.playPowerup();
      soundEngine.startMusic();
    } else {
      soundEngine.stopMusic();
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 md:p-10 pointer-events-auto bg-slate-950/70 backdrop-blur-xs select-none">
      {/* Top Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
            ARCADE SIMULATOR v2.6 · READY
          </span>
        </div>

        <div className="flex items-center gap-2">
          {highScore > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>RECORD: {highScore.toLocaleString()}</span>
            </div>
          )}

          <button
            onClick={toggleQuickAudio}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
            title="Toggle Sound"
          >
            {audioActive ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Brand & Call to Action */}
      <div className="text-center max-w-2xl my-auto space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-[11px] font-mono font-medium text-cyan-300">
            <span>SELF-CONTAINED HTML5 RETRO GAME</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-linear-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-xl">
            NEON VOID
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Fast-paced top-down cosmic space combat. Eliminate hostile armadas, collect overcharge crystals, and upgrade your tactical starfighter.
          </p>
        </div>

        {/* Active Ship Teaser Card */}
        <div
          onClick={onOpenShipSelect}
          className="mx-auto max-w-sm p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-slate-700"
              style={{ backgroundColor: `${selectedShip.color}15` }}
            >
              <div
                className="w-3.5 h-3.5 rotate-45"
                style={{ backgroundColor: selectedShip.color }}
              />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">SELECTED SHIP</div>
              <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                {selectedShip.name}
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Switch →
          </span>
        </div>

        {/* Main Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              soundEngine.unlock();
              if (soundEngine.musicEnabled) soundEngine.startMusic();
              onStartGame();
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-400/25 transition-all transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            Launch Sortie
          </button>

          <button
            onClick={onOpenExport}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-400/50 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export Single HTML File
          </button>
        </div>
      </div>

      {/* Bottom Controls Legend */}
      <div className="w-full max-w-4xl pt-4 border-t border-slate-900 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-mono">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">WASD</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">ARROWS</kbd> Flight
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">MOUSE</kbd> Aim
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">SPACE</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">CLICK</kbd> Primary Fire
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">SHIFT</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">R-CLICK</kbd> Dash Special
        </span>
      </div>
    </div>
  );
};
