import React, { useEffect, useMemo, useRef, useState } from "react";

// Pomodoro React App — Theme Switcher (Redesigned Default Theme)
// ✅ All features preserved. Default theme is now "redesigned" (cyan/emerald on deep slate).
// You can still toggle to the warm "sunrise" theme. Press T or use the button.

const BEEP_BASE64 =
  "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAAAACAAACcQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const DEFAULTS = {
  pomodoroMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  autoStart: true,
  sound: true,
  notify: true,
};

const STORAGE_KEY = "pomox-kyaw-v1";
const todayKey = () => new Date().toISOString().slice(0, 10);

// ---- THEME TOKENS -----------------------------------------------------------
const THEMES = {
  redesigned: {
    id: "redesigned",
    bg: "min-h-screen w-full bg-gradient-to-br from-cyan-950 via-slate-900 to-emerald-950 text-slate-50",
    cardA: "bg-slate-900/60 border border-cyan-500/30 rounded-3xl p-6 shadow-xl backdrop-blur",
    cardB: "bg-slate-900/60 border border-emerald-500/30 rounded-3xl p-6 shadow-xl backdrop-blur",
    h1: "text-2xl md:text-3xl font-extrabold tracking-tight text-cyan-100",
    sub: "text-slate-300 text-sm md:text-base",
    tabsWrap: "inline-flex rounded-2xl bg-slate-800/70 p-1 border border-cyan-500/30",
    tabActive: "bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 shadow",
    tabIdle: "text-slate-200 hover:bg-slate-700/50",
    statWrap: "rounded-2xl bg-slate-800/70 border border-slate-700 p-3",
    statLabel: "text-xs text-cyan-300",
    statValue: "text-lg font-bold text-emerald-300",
    kbd: "kbd",
    btnPrimary: "bg-cyan-400 text-slate-900 border-cyan-300 hover:bg-cyan-300",
    btnSecondary: "bg-emerald-400 text-slate-900 border-emerald-300 hover:bg-emerald-300",
    btnGhost: "bg-slate-800/50 text-slate-200 border border-slate-600 hover:bg-slate-700",
    fieldLabel: "text-sm text-slate-200 mb-1",
    input: "w-24 px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400",
    toggleOn: "bg-emerald-400",
    toggleOff: "bg-slate-600",
    ringTrack: "rgba(255,255,255,0.15)",
    ringGradId: "grad-redesigned",
    ringStops: [
      { offset: "0%", color: "#22d3ee" },
      { offset: "100%", color: "#34d399" },
    ],
    headerBadge: "hidden",
    headerBtn: "px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-sm",
    footer: "mt-10 text-xs text-slate-400 text-center",
    switcher: "px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-sm",
    highlightText: "text-slate-300",
  },
  sunrise: {
    id: "sunrise",
    bg: "min-h-screen w-full bg-gradient-to-br from-amber-50 via-rose-50 to-white text-slate-800",
    cardA: "bg-white rounded-3xl p-6 shadow-xl border border-amber-100",
    cardB: "bg-white rounded-3xl p-6 shadow-xl border border-rose-100",
    h1: "mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900",
    sub: "text-slate-600 text-sm md:text-base",
    tabsWrap: "inline-flex rounded-2xl bg-amber-50 p-1 border border-amber-200",
    tabActive: "bg-white text-slate-900 shadow-sm border border-amber-200",
    tabIdle: "text-slate-600 hover:bg-white/60",
    statWrap: "rounded-2xl bg-amber-50 border border-amber-200 p-3",
    statLabel: "text-xs text-amber-700",
    statValue: "text-lg font-bold text-slate-900",
    kbd: "kbd",
    btnPrimary: "bg-amber-500 text-white border-amber-400 hover:bg-amber-400",
    btnSecondary: "bg-rose-500 text-white border-rose-400 hover:bg-rose-400",
    btnGhost: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
    fieldLabel: "text-sm text-slate-600 mb-1",
    input: "w-24 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-200",
    toggleOn: "bg-rose-500",
    toggleOff: "bg-slate-200",
    ringTrack: "#f1f5f9",
    ringGradId: "grad-sunrise",
    ringStops: [
      { offset: "0%", color: "#fb923c" },
      { offset: "100%", color: "#f43f5e" },
    ],
    headerBadge:
      "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-200 to-rose-200 text-amber-800 px-3 py-1 text-xs font-medium border border-amber-300/50",
    headerBtn:
      "px-3 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-slate-800 text-sm shadow-sm",
    footer: "mt-10 text-xs text-slate-500 text-center",
    switcher: "px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-800 text-sm shadow-sm",
    highlightText: "text-slate-600",
  },
};

function useLocalStorageState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

function useInterval(callback, delay) {
  const saved = useRef(callback);
  useEffect(() => { saved.current = callback; }, [callback]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

const MODES = [
  { id: "focus", label: "Pomodoro" },
  { id: "short", label: "Short Break" },
  { id: "long", label: "Long Break" },
];

export default function App() {
  const [settings, setSettings] = useLocalStorageState(STORAGE_KEY + ":settings", DEFAULTS);
  const [mode, setMode] = useLocalStorageState(STORAGE_KEY + ":mode", "focus");
  const [cycleCount, setCycleCount] = useLocalStorageState(STORAGE_KEY + ":cycles", 0);
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useLocalStorageState(STORAGE_KEY + ":remaining", settings.pomodoroMin * 60);
  const [theme, setTheme] = useLocalStorageState(STORAGE_KEY + ":theme", "redesigned");
  const audioRef = useRef(null);

  const themeObj = THEMES[theme] || THEMES.redesigned;

  const [stats, setStats] = useLocalStorageState(STORAGE_KEY + ":stats", {
    [todayKey()]: { focusSec: 0, sessions: 0 },
  });

  useEffect(() => {
    if (isRunning) return;
    const map = { focus: settings.pomodoroMin, short: settings.shortMin, long: settings.longMin };
    setRemaining(map[mode] * 60);
  }, [mode, settings.pomodoroMin, settings.shortMin, settings.longMin]);

  useEffect(() => {
    if (!settings.notify || !("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, [settings.notify]);

  useInterval(() => {
    setRemaining((prev) => {
      if (prev <= 1) { onFinish(); return 0; }
      if (mode === "focus") incrementTodayFocus(1);
      return prev - 1;
    });
  }, isRunning ? 1000 : null);

  function incrementTodayFocus(deltaSec) {
    setStats((prev) => {
      const k = todayKey();
      const day = prev[k] || { focusSec: 0, sessions: 0 };
      return { ...prev, [k]: { ...day, focusSec: day.focusSec + deltaSec } };
    });
  }

  function incSessionsToday() {
    setStats((prev) => {
      const k = todayKey();
      const day = prev[k] || { focusSec: 0, sessions: 0 };
      return { ...prev, [k]: { ...day, sessions: day.sessions + 1 } };
    });
  }

  function ringAndNotify(title, body) {
    try { if (settings.sound && audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); } } catch {}
    if (settings.notify && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  }

  function onFinish() {
    setIsRunning(false);
    if (mode === "focus") {
      setCycleCount((c) => c + 1);
      incSessionsToday();
      ringAndNotify("Focus complete", "Time for a break!");
      const nextIsLong = (cycleCount + 1) % settings.longEvery === 0;
      const nextMode = nextIsLong ? "long" : "short";
      setMode(nextMode);
      const nextLen = nextIsLong ? settings.longMin : settings.shortMin;
      setRemaining(nextLen * 60);
      if (settings.autoStart) setIsRunning(true);
    } else {
      ringAndNotify("Break finished", "Back to focus ✨");
      setMode("focus");
      setRemaining(settings.pomodoroMin * 60);
      if (settings.autoStart) setIsRunning(true);
    }
  }

  const startPause = () => setIsRunning((r) => !r);
  const reset = () => {
    const map = { focus: settings.pomodoroMin, short: settings.shortMin, long: settings.longMin };
    setRemaining(map[mode] * 60);
    setIsRunning(false);
  };
  const skip = () => { setIsRunning(false); onFinish(); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") { e.preventDefault(); startPause(); }
      else if (e.key.toLowerCase() === "r") { reset(); }
      else if (e.key.toLowerCase() === "n") { skip(); }
      else if (e.key.toLowerCase() === "t") { toggleTheme(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startPause, theme]);

  function toggleTheme() { setTheme(theme === "redesigned" ? "sunrise" : "redesigned"); }

  const total = useMemo(() => {
    const map = { focus: settings.pomodoroMin * 60, short: settings.shortMin * 60, long: settings.longMin * 60 };
    return map[mode];
  }, [mode, settings]);
  const pct = clamp(1 - remaining / Math.max(total, 1), 0, 1);

  const day = stats[todayKey()] || { focusSec: 0, sessions: 0 };

  return (
    <div className={`${themeObj.bg} flex items-center justify-center p-5`}>
      <audio ref={audioRef} src={BEEP_BASE64} preload="auto" />
      <div className="w-full max-w-5xl">
        <Header theme={theme} themeObj={themeObj} onToggleTheme={toggleTheme} />

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* LEFT: Timer Card */}
          <div className={themeObj.cardA}>
            <ModeTabs themeObj={themeObj} mode={mode} setMode={(id) => { setMode(id); }} isRunning={isRunning} />

            <div className="mt-6 flex items-center gap-6">
              <ProgressRing size={230} stroke={16} progress={pct} themeObj={themeObj}>
                <div className="text-center">
                  <div className={`text-[3.25rem] font-semibold tabular-nums tracking-tight ${theme === 'redesigned' ? 'text-slate-50 drop-shadow' : 'text-slate-900'}`}>
                    {formatTime(remaining)}
                  </div>
                  <div className={`text-sm ${themeObj.highlightText}`}>{labelForMode(mode)}</div>
                </div>
              </ProgressRing>

              <div className="flex-1 space-y-3">
                <ControlButton themeObj={themeObj} onClick={startPause} variant={isRunning ? "secondary" : "primary"}>
                  {isRunning ? "Pause" : "Start"}
                </ControlButton>
                <div className="flex gap-3">
                  <ControlButton themeObj={themeObj} onClick={reset} variant="ghost">Reset</ControlButton>
                  <ControlButton themeObj={themeObj} onClick={skip} variant="ghost">Skip</ControlButton>
                </div>
                <div className={`text-xs ${themeObj.highlightText}`}>
                  Shortcuts: <kbd className={themeObj.kbd}>Space</kbd>, <kbd className={themeObj.kbd}>R</kbd>, <kbd className={themeObj.kbd}>N</kbd>, <kbd className={themeObj.kbd}>T</kbd> (theme)
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <Stat themeObj={themeObj} label="Cycles Done" value={`${cycleCount % settings.longEvery}/${settings.longEvery}`} />
              <Stat themeObj={themeObj} label="Focus Today" value={`${Math.floor(day.focusSec / 60)}m`} />
              <Stat themeObj={themeObj} label="Sessions Today" value={`${day.sessions}`} />
            </div>
          </div>

          {/* RIGHT: Settings */}
          <div className={themeObj.cardB}>
            <h2 className={`text-lg font-semibold ${theme === 'redesigned' ? 'text-slate-50' : 'text-slate-900'}`}>Settings</h2>
            <div className="mt-4 space-y-5">
              <NumberField themeObj={themeObj} label="Pomodoro (min)" value={settings.pomodoroMin} onChange={(v) => setSettings({ ...settings, pomodoroMin: clamp(v, 1, 180) })} />
              <NumberField themeObj={themeObj} label="Short Break (min)" value={settings.shortMin} onChange={(v) => setSettings({ ...settings, shortMin: clamp(v, 1, 60) })} />
              <NumberField themeObj={themeObj} label="Long Break (min)" value={settings.longMin} onChange={(v) => setSettings({ ...settings, longMin: clamp(v, 1, 90) })} />
              <NumberField themeObj={themeObj} label="Long Break Every" suffix="sessions" value={settings.longEvery} onChange={(v) => setSettings({ ...settings, longEvery: clamp(v, 2, 12) })} />

              <ToggleField themeObj={themeObj} label="Auto-start next session" checked={settings.autoStart} onChange={(c) => setSettings({ ...settings, autoStart: c })} />
              <ToggleField themeObj={themeObj} label="Play sound on end" checked={settings.sound} onChange={(c) => setSettings({ ...settings, sound: c })} />
              <ToggleField themeObj={themeObj} label="Desktop notifications" checked={settings.notify} onChange={(c) => setSettings({ ...settings, notify: c })} />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className={theme === 'redesigned' ? 'px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-sm' : 'px-3 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-slate-800 text-sm shadow-sm'}
                onClick={() => { localStorage.removeItem(STORAGE_KEY + ":settings"); window.location.reload(); }}
              >
                Reset Settings
              </button>
              <button
                className={theme === 'redesigned' ? 'px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-sm' : 'px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-800 text-sm shadow-sm'}
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY + ":stats");
                  localStorage.removeItem(STORAGE_KEY + ":cycles");
                  setStats({ [todayKey()]: { focusSec: 0, sessions: 0 } });
                  setCycleCount(0);
                }}
              >
                Clear Stats
              </button>
            </div>
          </div>
        </div>

        <Footer themeObj={themeObj} />
      </div>
    </div>
  );
}

function labelForMode(mode) { return mode === "focus" ? "Stay focused" : mode === "short" ? "Quick breather" : "Deep break"; }

function Header({ theme, themeObj, onToggleTheme }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        {theme === 'sunrise' ? (
          <div className={themeObj.headerBadge}><span>Sunrise Edition</span></div>
        ) : theme === 'redesigned' ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 px-3 py-1 text-xs font-medium border border-cyan-300/50 mb-2"><span>Midnight Edition</span></div>
        ) : null}
        <h1 className={themeObj.h1}>Pomodoro — Focus with Flow</h1>
        <p className={themeObj.sub}>Switch between Midnight (default) and Sunrise themes anytime.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onToggleTheme} className={themeObj.switcher}>
          {theme === 'redesigned' ? 'Switch to Sunrise' : 'Switch to Midnight'} (T)
        </button>
        <a
          href="https://github.com/kyaw-nyc/pomox"
          target="_blank"
          rel="noreferrer"
          className={themeObj.headerBtn}
        >
          ⭐ Star on GitHub
        </a>
      </div>
    </header>
  );
}

function Footer({ themeObj }) {
  return (
    <footer className={themeObj.footer}>
      Built with React & Tailwind v4 · Shortcuts: Space / R / N · Theme: T
    </footer>
  );
}

function ModeTabs({ themeObj, mode, setMode, isRunning }) {
  return (
    <div className={themeObj.tabsWrap}>
      {MODES.map((m) => {
        const active = m.id === mode;
        const disabled = isRunning;
        return (
          <button
            key={m.id}
            onClick={() => { if (!disabled) setMode(m.id); }}
            disabled={disabled}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            title={disabled ? "Pause or reset to change mode" : ""}
            className={
              "px-3 py-1.5 rounded-lg text-sm transition " +
              (active ? themeObj.tabActive : themeObj.tabIdle) +
              (disabled ? " opacity-50 cursor-not-allowed" : "")
            }
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function ControlButton({ themeObj, children, onClick, variant = "primary" }) {
  const base = "w-full px-4 py-2 rounded-xl text-base font-semibold transition border text-center";
  const map = { primary: themeObj.btnPrimary, secondary: themeObj.btnSecondary, ghost: themeObj.btnGhost };
  return (
    <button className={`${base} ${map[variant]}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Stat({ themeObj, label, value }) {
  return (
    <div className={themeObj.statWrap}>
      <div className={themeObj.statLabel}>{label}</div>
      <div className={themeObj.statValue}>{value}</div>
    </div>
  );
}

function NumberField({ themeObj, label, value, onChange, suffix }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <label className="block">
      <div className={themeObj.fieldLabel}>{label}</div>
      <div className="flex items-center gap-2">
        <input
          className={themeObj.input}
          type="number"
          min={1}
          max={999}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const n = parseInt(draft || "0", 10);
            if (!Number.isFinite(n)) return setDraft(String(value));
            onChange(n);
          }}
        />
        {suffix && <span className={themeObj.highlightText}>{suffix}</span>}
      </div>
    </label>
  );
}

function ToggleField({ themeObj, label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 select-none">
      <span className={themeObj.highlightText}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${checked ? themeObj.toggleOn : themeObj.toggleOff}`}
        aria-pressed={checked}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white ${checked ? 'translate-x-6' : 'translate-x-1'} transition`} />
      </button>
    </label>
  );
}

function ProgressRing({ size = 200, stroke = 12, progress = 0, children, themeObj }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={themeObj.ringTrack} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${themeObj.ringGradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="grad-redesigned" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="grad-sunrise" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
