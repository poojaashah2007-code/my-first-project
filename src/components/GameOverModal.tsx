import React from 'react';
import { RotateCcw, Download, Crosshair, Trophy } from 'lucide-react';
import { ShipConfig } from '../game/types';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  highScore: number;
  wave: number;
  selectedShip: ShipConfig;
  onRestart: () => void;
  onOpenShipSelect: () => void;
  onOpenExport: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  highScore,
  wave,
  selectedShip,
  onRestart,
  onOpenShipSelect,
  onOpenExport,
}) => {
  if (!isOpen) return null;

  const isNewHigh = score > 0 && score >= highScore;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-8 text-center space-y-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
            HULL BREACH DETECTED
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1 text-red-500">
            MISSION TERMINATED
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Vessel lost in sector {wave}. Black box telemetry synchronized.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono">
          <div className="p-3 bg-slate-900/60 rounded-lg text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">FINAL SCORE</span>
            <span className="text-2xl font-bold text-white">{score.toLocaleString()}</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> HIGH SCORE
            </span>
            <span className={`text-2xl font-bold ${isNewHigh ? 'text-amber-400' : 'text-slate-300'}`}>
              {highScore.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SECTORS CLEARED</span>
            <span className="text-xl font-bold text-cyan-400">{wave - 1}</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">VESSEL</span>
            <span className="text-sm font-bold text-slate-200 truncate block">{selectedShip.name}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="w-full py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Launch New Sortie (Play Again)
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenShipSelect}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Crosshair className="w-4 h-4 text-cyan-400" />
              Change Vessel
            </button>

            <button
              onClick={onOpenExport}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-purple-400" />
              Export Single HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
