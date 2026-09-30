import React, { useState, useMemo } from 'react';
import { generateSingleHtml } from '../utils/generateSingleHtml';
import { Download, Copy, Check, ExternalLink, Code, X, Play, Sliders } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
}

const THEMES = [
  { label: 'Cyan Cyber', primary: '#06b6d4', secondary: '#ec4899' },
  { label: 'Neon Violet', primary: '#a855f7', secondary: '#06b6d4' },
  { label: 'Solar Amber', primary: '#f59e0b', secondary: '#ef4444' },
  { label: 'Matrix Emerald', primary: '#10b981', secondary: '#06b6d4' },
  { label: 'Crimson Plasma', primary: '#ef4444', secondary: '#f59e0b' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  defaultTitle = 'NEON VOID: RETRO SURVIVOR',
}) => {
  const [gameTitle, setGameTitle] = useState(defaultTitle);
  const [gameSubtitle, setGameSubtitle] = useState('Deep Space Cybernetic Roguelite');
  const [selectedThemeIdx, setSelectedThemeIdx] = useState(0);
  const [enableCrt, setEnableCrt] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'preview_code' | 'sandbox'>('settings');
  const [isCopied, setIsCopied] = useState(false);

  const currentTheme = THEMES[selectedThemeIdx];

  const htmlContent = useMemo(() => {
    return generateSingleHtml({
      gameTitle,
      gameSubtitle,
      themeColor: currentTheme.primary,
      secondaryColor: currentTheme.secondary,
      enableCrtScanlines: enableCrt,
    });
  }, [gameTitle, gameSubtitle, currentTheme, enableCrt]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const safeName = gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName || 'game'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-cyan-400" />
              Single HTML Game Exporter
            </h2>
            <p className="text-xs text-slate-400">
              Generate a 100% self-contained, standalone single HTML file with embedded CSS and JavaScript.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 gap-2 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Customize [Game Name] & Style
          </button>
          <button
            onClick={() => setActiveTab('preview_code')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'preview_code'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            Inspect HTML Code ({Math.round(htmlContent.length / 1024)} KB)
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'sandbox'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4" />
            Standalone Sandbox Test
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Target Game Name (<span className="text-cyan-400">[Game Name]</span>)
                </label>
                <input
                  type="text"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="e.g. NEON VOID: RETRO SURVIVOR"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Replaces the [Game Name] placeholder in the HTML title, headings, and persistent local storage keys.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Game Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={gameSubtitle}
                  onChange={(e) => setGameSubtitle(e.target.value)}
                  placeholder="e.g. Deep Space Cybernetic Roguelite"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Retro Arcade Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {THEMES.map((theme, idx) => (
                    <button
                      key={theme.label}
                      onClick={() => setSelectedThemeIdx(idx)}
                      className={`p-3 rounded-lg border text-left flex flex-col gap-2 transition-all ${
                        selectedThemeIdx === idx
                          ? 'border-cyan-400 bg-cyan-950/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-1.5 items-center">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
                      </div>
                      <span className="text-xs font-medium text-slate-200">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-semibold text-white">Embed CRT Scanlines & Phosphor Glow</div>
                  <div className="text-xs text-slate-400">Simulates authentic 80s arcade monitor phosphors and scanline beam sweep.</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableCrt}
                  onChange={(e) => setEnableCrt(e.target.checked)}
                  className="w-5 h-5 rounded accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-cyan-300">Self-Contained File Guarantee:</div>
                <div>• Zero external dependencies or CDN links (runs 100% offline).</div>
                <div>• Built-in Web Audio API synthesizer for retro sound effects.</div>
                <div>• Touch joystick for phones/tablets + Keyboard/Mouse for desktop.</div>
                <div>• Embedded high-score storage via HTML5 localStorage.</div>
              </div>
            </div>
          )}

          {activeTab === 'preview_code' && (
            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[460px] select-text">
                {htmlContent}
              </pre>
            </div>
          )}

          {activeTab === 'sandbox' && (
            <div className="w-full h-[460px] rounded-xl overflow-hidden border border-slate-800 bg-black">
              <iframe
                title="Single HTML Game Sandbox"
                srcDoc={htmlContent}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
          <div className="text-xs text-slate-400">
            Ready to download: <span className="text-white font-mono">{gameTitle}.html</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors border border-slate-700"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'Copied to Clipboard!' : 'Copy Single HTML Code'}
            </button>

            <button
              onClick={handleDownload}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download .html File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
