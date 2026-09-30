import React from 'react';
import { ShipConfig } from '../game/types';
import { SHIPS } from '../game/constants';
import { X, Shield, Zap, Gauge, Crosshair, Sparkles } from 'lucide-react';

interface ShipSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShip: ShipConfig;
  onSelectShip: (ship: ShipConfig) => void;
}

export const ShipSelectModal: React.FC<ShipSelectModalProps> = ({
  isOpen,
  onClose,
  selectedShip,
  onSelectShip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-cyan-400" />
              Hangar & Vessel Customization
            </h2>
            <p className="text-xs text-slate-400">
              Select your combat starfighter class before launching into the anomaly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ship Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {SHIPS.map((ship) => {
            const isSelected = ship.id === selectedShip.id;

            return (
              <div
                key={ship.id}
                onClick={() => onSelectShip(ship)}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shadow-xs"
                        style={{ backgroundColor: ship.color }}
                      />
                      <h3 className="text-base font-bold text-white">{ship.name}</h3>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Selected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-cyan-400 font-mono mb-2">{ship.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {ship.description}
                  </p>

                  {/* Stat Meters */}
                  <div className="space-y-2 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> SPEED</span>
                        <span className="text-white">{ship.speed}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400"
                          style={{ width: `${(ship.speed / 450) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> HULL & SHIELD</span>
                        <span className="text-white">{ship.maxHp + ship.maxShield}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${((ship.maxHp + ship.maxShield) / 330) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> FIRE RATE</span>
                        <span className="text-white">{ship.fireRate}/s</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${(ship.fireRate / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500 mr-1">ABILITY:</span>
                    <span className="text-slate-200">{ship.specialAbility}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectShip(ship);
                      onClose();
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Ready' : 'Equip Vessel'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
