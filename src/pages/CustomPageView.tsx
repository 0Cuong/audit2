/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code, FileText, Palette, Sliders, Terminal, Sparkles, RefreshCw,
  MonitorPlay, Smartphone, Tablet, Monitor,
  CheckCircle2, AlertCircle, X
} from 'lucide-react';

// ============================================================================
// 1. TYPES & DATA MODELS
// ============================================================================

export interface CustomCodeModel {
  html: string;
  js: string;
  css: string;
  stateJson: string;
}

export interface ConsoleLogItem {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export interface AppToast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface AppTemplate {
  id: string;
  name: string;
  category: 'game' | 'utility' | 'productivity' | 'audio' | 'blank';
  description: string;
  iconName: string;
  code: CustomCodeModel;
}

// ============================================================================
// 2. BUILT-IN TEMPLATES
// ============================================================================

export const APP_TEMPLATES: AppTemplate[] = [
  {
    id: 'mini-game-reflex',
    name: '⚡ Cyber Reflex Mini-Game',
    category: 'game',
    description: 'Game phản xạ với combo điểm số, đếm ngược & Web Audio SFX.',
    iconName: 'Gamepad2',
    code: {
      html: `<div class="game-wrapper">
  <div class="hud">
    <div class="hud-item"><span class="label">SCORE</span><span id="score-val" class="value glow">0</span></div>
    <div class="hud-item"><span class="label">RECORD</span><span id="high-val" class="value">0</span></div>
    <div class="hud-item"><span class="label">COMBO</span><span id="combo-val" class="value combo">x1</span></div>
    <div class="hud-item"><span class="label">TIME</span><span id="time-val" class="value timer">30s</span></div>
  </div>
  <div class="arena" id="arena">
    <div id="start-overlay" class="overlay">
      <div class="overlay-card">
        <h2>⚡ CYBER REFLEX</h2>
        <p>Bấm vào các quả cầu năng lượng trước khi biến mất!</p>
        <button id="btn-start" class="btn-action">BẮT ĐẦU</button>
      </div>
    </div>
    <div id="target" class="target hidden"><div class="target-core"></div></div>
  </div>
</div>`,
      css: `* { box-sizing: border-box; user-select: none; }
body { margin: 0; padding: 16px; background: #09090e; color: #f1f5f9; font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.game-wrapper { width: 100%; max-width: 480px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 20px; backdrop-filter: blur(20px); }
.hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
.hud-item { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 8px 4px; text-align: center; }
.hud-item .label { font-size: 9px; color: #94a3b8; font-weight: 700; }
.hud-item .value { font-size: 18px; font-weight: 800; color: #fff; display: block; margin-top: 2px; }
.hud-item .value.glow { color: #38bdf8; }
.hud-item .value.combo { color: #f43f5e; }
.arena { position: relative; width: 100%; height: 280px; background: rgba(0,0,0,0.5); border: 1px dashed rgba(255,255,255,0.15); border-radius: 18px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.overlay { position: absolute; inset: 0; background: rgba(10,10,15,0.9); display: flex; align-items: center; justify-content: center; z-index: 10; text-align: center; padding: 20px; }
.overlay-card h2 { margin: 0 0 8px; color: #38bdf8; font-size: 20px; }
.overlay-card p { color: #94a3b8; font-size: 12px; margin-bottom: 16px; }
.btn-action { background: #f43f5e; color: white; border: none; font-weight: 700; padding: 10px 24px; border-radius: 999px; cursor: pointer; }
.target { position: absolute; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; transform: translate(-50%, -50%); }
.target-core { position: absolute; inset: 4px; background: radial-gradient(circle, #f43f5e, #e11d48); border-radius: 50%; box-shadow: 0 0 15px #f43f5e; }
.hidden { display: none !important; }`,
      js: `let score = 0, combo = 1, timeLeft = 30, timerId = null, targetTimerId = null, isPlaying = false;
const arena = document.getElementById('arena');
const target = document.getElementById('target');
const overlay = document.getElementById('start-overlay');
const scoreVal = document.getElementById('score-val');
const comboVal = document.getElementById('combo-val');
const timeVal = document.getElementById('time-val');
const highVal = document.getElementById('high-val');
highVal.innerText = app.storage.get('high_score', 0);

function spawnTarget() {
  if (!isPlaying) return;
  const p = 40;
  target.style.left = (p + Math.random() * (arena.clientWidth - p * 2)) + 'px';
  target.style.top = (p + Math.random() * (arena.clientHeight - p * 2)) + 'px';
  target.classList.remove('hidden');
  clearTimeout(targetTimerId);
  targetTimerId = setTimeout(() => {
    if (isPlaying) { combo = 1; comboVal.innerText = 'x1'; app.audio.playBeep(); spawnTarget(); }
  }, Math.max(700, 1400 - score * 10));
}

target.addEventListener('pointerdown', () => {
  if (!isPlaying) return;
  score += 10 * combo;
  combo++;
  scoreVal.innerText = score;
  comboVal.innerText = 'x' + combo;
  app.audio.playTap();
  spawnTarget();
});

function startGame() {
  score = 0; combo = 1; timeLeft = 30; isPlaying = true;
  scoreVal.innerText = '0'; comboVal.innerText = 'x1'; timeVal.innerText = '30s';
  overlay.classList.add('hidden');
  app.audio.playSuccess();
  spawnTarget();
  timerId = setInterval(() => {
    timeLeft--;
    timeVal.innerText = timeLeft + 's';
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  isPlaying = false;
  clearInterval(timerId);
  clearTimeout(targetTimerId);
  target.classList.add('hidden');
  const high = app.storage.get('high_score', 0);
  if (score > high) { app.storage.set('high_score', score); highVal.innerText = score; app.audio.playFanfare(); }
  else { app.audio.playError(); }
  overlay.innerHTML = '<div class="overlay-card"><h2>HẾT GIỜ!</h2><p>Điểm của bạn: <strong>' + score + '</strong></p><button id="btn-re" class="btn-action">CHƠI LẠI</button></div>';
  overlay.classList.remove('hidden');
  document.getElementById('btn-re').onclick = startGame;
}
document.getElementById('btn-start').onclick = startGame;`,
      stateJson: `{\n  "score": 0,\n  "highScore": 0\n}`,
    },
  },
  {
    id: 'glass-calculator',
    name: '🧮 Glass Calculator',
    category: 'utility',
    description: 'Máy tính phong cách Glassmorphism với Web Audio Tap SFX.',
    iconName: 'Calculator',
    code: {
      html: `<div class="calc-card">
  <div class="calc-screen" id="display">0</div>
  <div class="calc-grid">
    <button class="btn fn" data-act="clear">AC</button>
    <button class="btn fn" data-act="del">DEL</button>
    <button class="btn fn" data-act="pct">%</button>
    <button class="btn op" data-act="/">÷</button>
    <button class="btn" data-val="7">7</button><button class="btn" data-val="8">8</button><button class="btn" data-val="9">9</button>
    <button class="btn op" data-act="*">×</button>
    <button class="btn" data-val="4">4</button><button class="btn" data-val="5">5</button><button class="btn" data-val="6">6</button>
    <button class="btn op" data-act="-">−</button>
    <button class="btn" data-val="1">1</button><button class="btn" data-val="2">2</button><button class="btn" data-val="3">3</button>
    <button class="btn op" data-act="+">+</button>
    <button class="btn zero" data-val="0">0</button><button class="btn" data-val=".">.</button>
    <button class="btn eq" data-act="eq">=</button>
  </div>
</div>`,
      css: `* { box-sizing: border-box; }
body { margin: 0; padding: 20px; background: #09090b; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; color: #fff; }
.calc-card { width: 100%; max-width: 320px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 20px; backdrop-filter: blur(20px); }
.calc-screen { font-size: 36px; font-weight: 800; text-align: right; padding: 12px 0; min-height: 60px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 16px; }
.calc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.btn { height: 50px; border: none; border-radius: 14px; font-size: 16px; font-weight: bold; cursor: pointer; background: rgba(255,255,255,0.07); color: #fff; }
.btn:hover { background: rgba(255,255,255,0.15); }
.btn.fn { background: rgba(244,63,94,0.2); color: #fb7185; }
.btn.op { background: rgba(56,189,248,0.2); color: #38bdf8; font-size: 18px; }
.btn.eq { background: #f43f5e; color: #fff; }
.btn.zero { grid-column: span 2; }`,
      js: `let curr = '0', prev = '', op = null;
const display = document.getElementById('display');

function update() { display.innerText = curr; }

document.querySelectorAll('.btn').forEach(btn => {
  btn.onclick = () => {
    app.audio.playTap();
    const val = btn.dataset.val, act = btn.dataset.act;
    if (val !== undefined) {
      curr = (curr === '0' && val !== '.') ? val : (val === '.' && curr.includes('.')) ? curr : curr + val;
      update();
    } else if (act) {
      if (act === 'clear') { curr = '0'; prev = ''; op = null; update(); }
      else if (act === 'del') { curr = curr.length > 1 ? curr.slice(0, -1) : '0'; update(); }
      else if (act === 'pct') { curr = String(parseFloat(curr) / 100); update(); }
      else if (['+','-','*','/'].includes(act)) { op = act; prev = curr; curr = '0'; }
      else if (act === 'eq' && op && prev) {
        const a = parseFloat(prev), b = parseFloat(curr);
        let res = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : b !== 0 ? a / b : 'Error';
        curr = String(res); prev = ''; op = null; update();
        app.audio.playSuccess();
      }
    }
  };
});`,
      stateJson: `{}`,
    },
  },
  {
    id: 'blank-canvas',
    name: '✨ Blank App Template',
    category: 'blank',
    description: 'Bản mẫu sạch sẵn sàng lập trình với API app.state, app.storage, app.audio.',
    iconName: 'Sparkles',
    code: {
      html: `<div class="container">
  <h1>My Custom App</h1>
  <p>Sẵn sàng lập trình tính năng tùy chỉnh!</p>
  <button id="my-btn" class="btn">Bấm Vào Đây</button>
  <div id="result" class="box">Số lần bấm: 0</div>
</div>`,
      css: `body { margin: 0; padding: 24px; background: #09090b; color: #fff; font-family: sans-serif; display: flex; justify-content: center; }
.container { max-width: 440px; width: 100%; text-align: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 24px; border-radius: 20px; }
.btn { background: #f43f5e; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 12px; cursor: pointer; margin-top: 10px; }
.box { margin-top: 16px; font-size: 16px; color: #38bdf8; }`,
      js: `let count = app.storage.get('click_count', 0);
const res = document.getElementById('result');
res.innerText = 'Số lần bấm: ' + count;

document.getElementById('my-btn').onclick = () => {
  count++;
  app.storage.set('click_count', count);
  res.innerText = 'Số lần bấm: ' + count;
  app.audio.playTap();
  app.toast('Đã cập nhật count = ' + count);
};`,
      stateJson: `{\n  "count": 0\n}`,
    },
  },
];

// ============================================================================
// 3. SECURE SANDBOXED RUNTIME HTML GENERATOR
// ============================================================================

export function generateSandboxedHtml({ html, css, js, stateJson, pageKey }: CustomCodeModel & { pageKey: string }): string {
  let parsedState = {};
  try { parsedState = JSON.parse(stateJson || '{}'); } catch (e) { /* ignore */ }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    :root { --primary: #f43f5e; --accent: #38bdf8; --bg: #09090b; }
    ${css || ''}
  </style>
</head>
<body>
  ${html || '<div style="padding:20px; color:#a1a1aa; font-family:sans-serif;">Chưa có HTML</div>'}

  <script>
    (function() {
      function sendLog(type, args) {
        try {
          const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          window.parent.postMessage({ type: 'SANDBOX_LOG', logType: type, message: msg }, '*');
        } catch(e) {}
      }

      console.log = function(...args) { sendLog('log', args); };
      console.warn = function(...args) { sendLog('warn', args); };
      console.error = function(...args) { sendLog('error', args); };
      console.info = function(...args) { sendLog('info', args); };

      window.onerror = function(message, source, lineno) {
        window.parent.postMessage({ type: 'SANDBOX_ERROR', message: message, line: lineno }, '*');
        return false;
      };

      // App SDK
      const initialData = ${JSON.stringify(parsedState)};
      window.app = {
        state: {
          _data: initialData,
          get: function(key, def) { return key ? (this._data[key] !== undefined ? this._data[key] : def) : this._data; },
          set: function(k, v) {
            if (typeof k === 'object') Object.assign(this._data, k);
            else this._data[k] = v;
            window.parent.postMessage({ type: 'APP_STATE_UPDATE', payload: this._data }, '*');
          }
        },
        storage: {
          get: function(key, def) {
            try { const v = localStorage.getItem('${pageKey}_' + key); return v ? JSON.parse(v) : def; } catch(e) { return def; }
          },
          set: function(key, val) {
            try { localStorage.setItem('${pageKey}_' + key, JSON.stringify(val)); } catch(e) {}
          }
        },
        toast: function(message, type) {
          window.parent.postMessage({ type: 'APP_TOAST', message: message, toastType: type || 'info' }, '*');
        },
        audio: {
          _ctx: null,
          _getCtx: function() {
            if (!this._ctx) {
              const A = window.AudioContext || window.webkitAudioContext;
              if (A) this._ctx = new A();
            }
            if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
            return this._ctx;
          },
          playTone: function(freq, type, dur, gainVal) {
            try {
              const ctx = this._getCtx(); if (!ctx) return;
              const osc = ctx.createOscillator(), gain = ctx.createGain();
              osc.type = type || 'sine';
              osc.frequency.setValueAtTime(freq || 440, ctx.currentTime);
              gain.gain.setValueAtTime(gainVal || 0.08, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.15));
              osc.connect(gain); gain.connect(ctx.destination);
              osc.start(); osc.stop(ctx.currentTime + (dur || 0.15));
            } catch(e) {}
          },
          playBeep: function() { this.playTone(600, 'sine', 0.1, 0.08); },
          playTap: function() { this.playTone(800, 'triangle', 0.05, 0.06); },
          playSuccess: function() {
            this.playTone(523.25, 'sine', 0.1, 0.08);
            setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.08), 80);
          },
          playError: function() {
            this.playTone(220, 'sawtooth', 0.15, 0.1);
            setTimeout(() => this.playTone(180, 'sawtooth', 0.2, 0.1), 100);
          },
          playFanfare: function() {
            [523.25, 659.25, 783.99].forEach((f, i) => setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.08), i * 90));
          }
        }
      };

      try {
        ${js || ''}
      } catch(err) {
        console.error("Runtime Error:", err);
      }
    })();
  </script>
</body>
</html>`;
}

// ============================================================================
// 4. MAIN VISUAL CODE STUDIO COMPONENT
// ============================================================================

export default function VisualCodeStudio({ storageKey = 'visual_code_studio' }: { storageKey?: string }) {
  // Load initial code from storage or fallback to template
  const [code, setCode] = useState<CustomCodeModel>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return APP_TEMPLATES[0].code;
  });

  const [activeTab, setActiveTab] = useState<'js' | 'html' | 'css' | 'state' | 'console'>('js');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [logs, setLogs] = useState<ConsoleLogItem[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [compileCount, setCompileCount] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  // Toast Helper
  const addToast = useCallback((message: string, type: AppToast['type'] = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(code));
    } catch (e) { /* ignore */ }
  }, [code, storageKey]);

  // Handle postMessage from Sandbox Iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SANDBOX_LOG') {
        setLogs((prev) => [
          {
            id: `log-${Date.now()}-${Math.random()}`,
            type: data.logType || 'log',
            message: data.message,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 50));
      } else if (data.type === 'SANDBOX_ERROR') {
        setRuntimeError(`Dòng ${data.line || '?'}: ${data.message}`);
      } else if (data.type === 'APP_TOAST') {
        addToast(data.message, data.toastType);
      }
    };

    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [addToast]);

  // Tab key handler for code indentation
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const updated = val.substring(0, start) + '  ' + val.substring(end);
      if (activeTab === 'js') setCode({ ...code, js: updated });
      if (activeTab === 'html') setCode({ ...code, html: updated });
      if (activeTab === 'css') setCode({ ...code, css: updated });
      if (activeTab === 'state') setCode({ ...code, stateJson: updated });

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Compile sandboxed doc
  const sandboxedSrc = useMemo(() => {
    return generateSandboxedHtml({
      html: code.html,
      css: code.css,
      js: code.js,
      stateJson: code.stateJson,
      pageKey: storageKey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, storageKey, compileCount]);

  const getViewportWidth = () => {
    if (viewport === 'mobile') return 'max-w-[375px]';
    if (viewport === 'tablet') return 'max-w-[720px]';
    return 'w-full';
  };

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-zinc-100 p-4 sm:p-6 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-900/80 border border-white/10 rounded-2xl mb-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Visual Code Studio</h1>
            <p className="text-xs text-zinc-400">Trình lập trình HTML / CSS / JS Sandbox trực quan</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Templates Picker Button */}
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition border border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Bản Mẫu Có Sẵn
          </button>

          {/* Reset / Reload Button */}
          <button
            type="button"
            onClick={() => {
              setCompileCount((c) => c + 1);
              setRuntimeError(null);
              addToast('Đã chạy lại mã nguồn', 'info');
            }}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition"
            title="Khởi động lại Runtime"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Grid (Left: IDE, Right: Preview) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
        {/* LEFT: Code Editor Pane */}
        <div className="flex flex-col bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Editor Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-white/10 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('js')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'js' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" /> app.js
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('html')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'html' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> index.html
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('css')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'css' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" /> style.css
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('state')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'state' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> state.json
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('console')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'console' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Console
                {logs.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Editor Input Area */}
          <div className="flex-1 relative flex flex-col min-h-0 bg-black/40">
            {activeTab === 'js' && (
              <textarea
                value={code.js}
                onChange={(e) => setCode({ ...code, js: e.target.value })}
                onKeyDown={handleEditorKeyDown}
                spellCheck={false}
                placeholder="// Viết code JavaScript tại đây (hỗ trợ app.state, app.storage, app.audio, app.toast)..."
                className="w-full flex-1 min-h-[380px] p-4 font-mono text-xs text-rose-200/90 bg-transparent outline-none resize-none leading-relaxed"
              />
            )}

            {activeTab === 'html' && (
              <textarea
                value={code.html}
                onChange={(e) => setCode({ ...code, html: e.target.value })}
                onKeyDown={handleEditorKeyDown}
                spellCheck={false}
                placeholder="<!-- Soạn thảo cấu trúc HTML tại đây -->"
                className="w-full flex-1 min-h-[380px] p-4 font-mono text-xs text-sky-200/90 bg-transparent outline-none resize-none leading-relaxed"
              />
            )}

            {activeTab === 'css' && (
              <textarea
                value={code.css}
                onChange={(e) => setCode({ ...code, css: e.target.value })}
                onKeyDown={handleEditorKeyDown}
                spellCheck={false}
                placeholder="/* Viết CSS trang trí tại đây */"
                className="w-full flex-1 min-h-[380px] p-4 font-mono text-xs text-purple-200/90 bg-transparent outline-none resize-none leading-relaxed"
              />
            )}

            {activeTab === 'state' && (
              <textarea
                value={code.stateJson}
                onChange={(e) => setCode({ ...code, stateJson: e.target.value })}
                onKeyDown={handleEditorKeyDown}
                spellCheck={false}
                placeholder='{\n  "score": 0\n}'
                className="w-full flex-1 min-h-[380px] p-4 font-mono text-xs text-amber-200/90 bg-transparent outline-none resize-none leading-relaxed"
              />
            )}

            {activeTab === 'console' && (
              <div className="flex-1 flex flex-col p-4 font-mono text-xs overflow-y-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-zinc-500">
                  <span>Nhật ký Console ({logs.length})</span>
                  <button type="button" onClick={() => setLogs([])} className="hover:text-white transition text-[11px]">
                    Xóa nhật ký
                  </button>
                </div>
                <div className="space-y-1.5">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 py-1 px-2 rounded ${
                        log.type === 'error' ? 'bg-rose-950/40 text-rose-300' : 'text-zinc-300'
                      }`}
                    >
                      <span className="text-[10px] text-zinc-600">[{log.timestamp}]</span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-zinc-600 py-6 text-center">Console sẵn sàng nhận log...</div>
                  )}
                </div>
              </div>
            )}

            {/* Error banner */}
            {runtimeError && (
              <div className="p-3 bg-rose-950/90 border-t border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{runtimeError}</span>
                </div>
                <button type="button" onClick={() => setRuntimeError(null)} className="text-xs text-rose-300 hover:text-white underline">
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Sandbox Preview Pane */}
        <div className="flex flex-col bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Top Preview Controls & Simulator Switcher */}
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <MonitorPlay className="w-4 h-4 text-emerald-400" />
              <span>Trực Tiếp (Sandbox IFrame)</span>
            </div>

            {/* Viewport Modes */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={`p-1.5 rounded-lg ${viewport === 'desktop' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'}`}
                title="Desktop (100%)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('tablet')}
                className={`p-1.5 rounded-lg ${viewport === 'tablet' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'}`}
                title="Tablet (720px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                className={`p-1.5 rounded-lg ${viewport === 'mobile' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'}`}
                title="Mobile (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* IFrame Area */}
          <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-auto">
            <div className={`h-full min-h-[440px] w-full transition-all duration-300 flex ${getViewportWidth()}`}>
              <iframe
                key={compileCount}
                title="Code Sandbox Live"
                srcDoc={sandboxedSrc}
                sandbox="allow-scripts allow-modals allow-pointer-lock"
                className="w-full h-full border-0 rounded-2xl bg-zinc-950 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18181b] border border-white/15 rounded-3xl p-6 w-full max-w-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold text-white">Chọn Bản Mẫu Khởi Tạo</h3>
                </div>
                <button type="button" onClick={() => setShowTemplateModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
                {APP_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-rose-500/40 transition flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{tmpl.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{tmpl.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCode(tmpl.code);
                        setCompileCount((c) => c + 1);
                        setShowTemplateModal(false);
                        addToast(`Đã áp dụng mẫu "${tmpl.name}"`, 'success');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition shrink-0"
                    >
                      Dùng Mẫu
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="pointer-events-auto p-3 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white shadow-xl flex items-center gap-2 backdrop-blur-md"
            >
              {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-sky-400" />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}