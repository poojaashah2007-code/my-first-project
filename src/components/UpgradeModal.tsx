import React from 'react';
import { UpgradeCard } from '../game/types';
import { Zap, Sparkles, Shield, Cpu, Compass, Heart, Flame, Radio } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  cards: UpgradeCard[];
  onSelect: (upgradeId: string) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, cards, onSelect }) => {
  if (!isOpen) return null;

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-cyan-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-amber-400" />;
      case 'Radio': return <Radio className="w-6 h-6 text-indigo-400" />;
      case 'Shield': return <Shield className="w-6 h-6 text-blue-400" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-purple-400" />;
      case 'Compass': return <Compass className="w-6 h-6 text-emerald-400" />;
      case 'Heart': return <Heart className="w-6 h-6 text-rose-400" />;
      case 'Flame': return <Flame className="w-6 h-6 text-orange-400" />;
      default: return <Zap className="w-6 h-6 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl text-center space-y-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            LEVEL UP ACHIEVED
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-1 arcade-glow">
            SYSTEM OVERCHARGE
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Choose a cybernetic weapon or hull enhancement to integrate:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {cards.map((card) => {
            const isEpic = card.rarity === 'epic';
            const isRare = card.rarity === 'rare';

            return (
              <button
                key={card.id}
                onClick={() => onSelect(card.id)}
                className={`group relative p-5 rounded-xl border transition-all text-left flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl ${
                  isEpic
                    ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-400 hover:shadow-purple-500/20'
                    : isRare
                    ? 'bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-400 hover:shadow-cyan-500/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:shadow-cyan-500/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform">
                      {renderIcon(card.icon)}
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                      Tier {card.level}/{card.maxLevel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                    isEpic ? 'text-purple-400' : isRare ? 'text-cyan-400' : 'text-slate-400'
                  }`}>
                    {card.rarity}
                  </span>
                  <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    INSTALL →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
