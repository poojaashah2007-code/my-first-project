/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, ShipConfig, UpgradeCard } from './game/types';
import { SHIPS } from './game/constants';
import { soundEngine } from './game/audio';
import { GameCanvas } from './game/GameCanvas';
import { TitleScreen } from './components/TitleScreen';
import { UpgradeModal } from './components/UpgradeModal';
import { ShipSelectModal } from './components/ShipSelectModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { Pause, Play, RotateCcw, Download, Crosshair, Sliders } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedShip, setSelectedShip] = useState<ShipConfig>(SHIPS[0]);
  const [score, setScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(0);
  const [enableCrt, setEnableCrt] = useState<boolean>(true);

  // Modals
  const [isShipSelectOpen, setIsShipSelectOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [upgradeCards, setUpgradeCards] = useState<UpgradeCard[]>([]);

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('neon_void_highscore');
      if (saved) {
        setHighScore(parseInt(saved, 10));
      }
    } catch {
      // localStorage may be disabled
    }
  }, []);

  const handleResetHighScore = () => {
    setHighScore(0);
    try {
      localStorage.removeItem('neon_void_highscore');
    } catch {
      // ignore
    }
  };

  const handleStartGame = () => {
    setScore(0);
    setWave(1);
    setGameState('PLAYING');
  };

  const handleRestart = () => {
    setScore(0);
    setWave(1);
    setGameState('PLAYING');
  };

  const handleSelectUpgrade = (upgradeId: string) => {
    // Return to playing after choosing upgrade
    setUpgradeCards([]);
    setGameState('PLAYING');
  };

  const handleOpenUpgradeModal = (cards: UpgradeCard[]) => {
    setUpgradeCards(cards);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Active Game Engine Canvas */}
      <GameCanvas
        selectedShip={selectedShip}
        gameState={gameState}
        setGameState={setGameState}
        enableCrt={enableCrt}
        score={score}
        setScore={setScore}
        wave={wave}
        setWave={setWave}
        highScore={highScore}
        setHighScore={setHighScore}
        onOpenUpgradeModal={handleOpenUpgradeModal}
      />

      {/* Floating Pause Button during gameplay */}
      {gameState === 'PLAYING' && (
        <button
          onClick={() => setGameState('PAUSED')}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg"
          title="Pause Game (ESC)"
        >
          <Pause className="w-4 h-4" />
        </button>
      )}

      {/* Title Screen Overlay */}
      {gameState === 'MENU' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenShipSelect={() => setIsShipSelectOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          selectedShip={selectedShip}
          highScore={highScore}
        />
      )}

      {/* Pause Screen Overlay */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              TACTICAL PAUSE
            </h2>
            <p className="text-xs text-slate-400">
              Engines halted. Systems holding steady in Sector {wave}.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setGameState('PLAYING')}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-4 h-4 fill-current" /> Resume Sortie
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" /> Restart Mission
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
              >
                <Sliders className="w-4 h-4" /> Audio & Settings
              </button>

              <button
                onClick={() => setIsExportOpen(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
              >
                <Download className="w-4 h-4 text-cyan-400" /> Export Single HTML
              </button>

              <button
                onClick={() => setGameState('MENU')}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-mono"
              >
                Abort to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roguelite Upgrade Card Picker */}
      <UpgradeModal
        isOpen={gameState === 'UPGRADE_SELECT' && upgradeCards.length > 0}
        cards={upgradeCards}
        onSelect={handleSelectUpgrade}
      />

      {/* Game Over Screen */}
      <GameOverModal
        isOpen={gameState === 'GAME_OVER'}
        score={score}
        highScore={highScore}
        wave={wave}
        selectedShip={selectedShip}
        onRestart={handleRestart}
        onOpenShipSelect={() => setIsShipSelectOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Ship Selection Drawer / Modal */}
      <ShipSelectModal
        isOpen={isShipSelectOpen}
        onClose={() => setIsShipSelectOpen(false)}
        selectedShip={selectedShip}
        onSelectShip={(ship) => setSelectedShip(ship)}
      />

      {/* Standalone Single HTML Exporter Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultTitle="NEON VOID: RETRO SURVIVOR"
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        enableCrt={enableCrt}
        setEnableCrt={setEnableCrt}
        onResetHighScore={handleResetHighScore}
      />
    </div>
  );
}
