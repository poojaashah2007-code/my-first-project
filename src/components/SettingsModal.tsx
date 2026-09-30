import React from 'react';
import { soundEngine } from '../game/audio';
import { Volume2, VolumeX, Music, Monitor, X, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enableCrt: boolean;
  setEnableCrt: (val: boolean) => void;
  onResetHighScore: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  enableCrt,
  setEnableCrt,
  onResetHighScore,
}) => {
  const [sfxEnabled, setSfxEnabled] = React.useState(soundEngine.sfxEnabled);
  const [musicEnabled, setMusicEnabled] = React.useState(soundEngine.musicEnabled);
  const [sfxVol, setSfxVol] = React.useState(soundEngine.sfxVolume * 100);
  const [musicVol, setMusicVol] = React.useState(soundEngine.musicVolume * 100);

  if (!isOpen) return null;

  const toggleSfx = () => {
    soundEngine.sfxEnabled = !soundEngine.sfxEnabled;
    setSfxEnabled(soundEngine.sfxEnabled);
    if (soundEngine.sfxEnabled) soundEngine.playLaser();
  };

  const toggleMusic = () => {
    soundEngine.musicEnabled = !soundEngine.musicEnabled;
    setMusicEnabled(soundEngine.musicEnabled);
    if (soundEngine.musicEnabled) {
      soundEngine.startMusic();
    } else {
      soundEngine.stopMusic();
    }
  };

  const handleSfxVol = (val: number) => {
    setSfxVol(val);
    soundEngine.setSfxVolume(val / 100);
  };

  const handleMusicVol = (val: number) => {
    setMusicVol(val);
    soundEngine.setMusicVolume(val / 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Game System Preferences
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Sound FX */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-slate-300 flex items-center gap-2">
                {sfxEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                Sound Synthesizer FX
              </span>
              <button
                onClick={toggleSfx}
                className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {sfxEnabled ? 'ENABLED' : 'MUTED'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVol}
              onChange={(e) => handleSfxVol(Number(e.target.value))}
              disabled={!sfxEnabled}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Synthwave BGM */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-slate-300 flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-400" />
                Procedural Synthwave BGM
              </span>
              <button
                onClick={toggleMusic}
                className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {musicEnabled ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVol}
              onChange={(e) => handleMusicVol(Number(e.target.value))}
              disabled={!musicEnabled}
              className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* CRT Scanlines */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-300 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              Retro CRT Scanline Overlay
            </span>
            <input
              type="checkbox"
              checked={enableCrt}
              onChange={(e) => setEnableCrt(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* High Score Reset */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">Telemetry Data</span>
            <button
              onClick={onResetHighScore}
              className="px-3 py-1.5 text-xs font-mono rounded bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/40 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Reset High Score
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
