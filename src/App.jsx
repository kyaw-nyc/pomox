import React, { useEffect, useMemo, useRef, useState } from "react";

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
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

function useInterval(callback, delay) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const MODES = [
  { id: "focus", label: "Pomodoro" },
  { id: "short", label: "Short Break" },
  { id: "long", label: "Long Break" },
];

export default function App() {
  const [settings, setSettings] = useLocalStorageState(STORAGE_KEY + ":settings", DEFAULTS);
  const [mode, setMode] = useLocalStorageState(STORAGE_KEY + ":mode", "focus");
  const [cycleCount, setCycleCount] = useLocalStorageState(STORAGE_KEY + ":cycles", 0); // completed pomodoros in current block
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useLocalStorageState(
    STORAGE_KEY + ":remaining",
    settings.pomodoroMin * 60
  );
  const audioRef = useRef(null);

  // Stats: track completed focus minutes per day
  const [stats, setStats] = useLocalStorageState(STORAGE_KEY + ":stats", {
    [todayKey()]: { focusSec: 0, sessions: 0 },
  });

  // Sync remaining when settings or mode changes (only if not running)
  useEffect(() => {
    if (isRunning) return;
    const map = {
      focus: settings.pomodoroMin,
      short: settings.shortMin,
      long: settings.longMin,
    };
    setRemaining(map[mode] * 60);
  }, [mode, settings.pomodoroMin, settings.shortMin, settings.longMin]);

  // Request Notification permission once if enabled
  useEffect(() => {
    if (!settings.notify || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [settings.notify]);

  // Tick
  useInterval(
    () => {
      setRemaining((prev) => {
        if (prev <= 1) {
          // Session finished
          onFinish();
          return 0;
        }
        // Increment stats during focus
        if (mode === "focus") incrementTodayFocus(1);
        return prev - 1;
      });
    },
    isRunning ? 1000 : null
  );

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
    try {
      if (settings.sound && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {}
    if (settings.notify && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch {}
    }
  }

  function onFinish() {
    setIsRunning(false);
    // Update sessions/statistics
    if (mode === "focus") {
      setCycleCount((c) => c + 1);
      incSessionsToday();
      ringAndNotify("Focus complete", "Time for a break!");
      // Decide next mode
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

  // Controls
  const startPause = () => setIsRunning((r) => !r);
  const reset = () => {
    const map = {
      focus: settings.pomodoroMin,
      short: settings.shortMin,
      long: settings.longMin,
    };
    setRemaining(map[mode] * 60);
    setIsRunning(false);
  };
  const skip = () => {
    // Finish the current session immediately (works even if paused)
    setIsRunning(false);
    onFinish();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        startPause();
      } else if (e.key.toLowerCase() === "r") {
        reset();
      } else if (e.key.toLowerCase() === "n") {
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startPause]);

  // Derived values
  const total = useMemo(() => {
    const map = {
      focus: settings.pomodoroMin * 60,
      short: settings.shortMin * 60,
      long: settings.longMin * 60,
    };
    return map[mode];
  }, [mode, settings]);
  const pct = clamp(1 - remaining / Math.max(total, 1), 0, 1);

  const day = stats[todayKey()] || { focusSec: 0, sessions: 0 };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-fuchsia-950 text-slate-50 flex items-center justify-center p-4">
      <audio ref={audioRef} src={BEEP_BASE64} preload="auto" />
      <div className="w-full max-w-4xl">
        <Header />

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* LEFT: Timer Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur">
            <ModeTabs mode={mode} setMode={(id) => { setMode(id); }} />

            <div className="mt-6 flex items-center gap-6">
              <ProgressRing size={220} stroke={14} progress={pct}>
                <div className="text-center">
                  <div className="text-[3.25rem] font-semibold tabular-nums drop-shadow">
                    {formatTime(remaining)}
                  </div>
                  <div className="text-sm text-slate-300">{labelForMode(mode)}</div>
                </div>
              </ProgressRing>

              <div className="flex-1 space-y-3">
                <ControlButton onClick={startPause} variant={isRunning ? "secondary" : "primary"}>
                  {isRunning ? "Pause" : "Start"}
                </ControlButton>
                <div className="flex gap-3">
                  <ControlButton onClick={reset} variant="ghost">Reset</ControlButton>
                  <ControlButton onClick={skip} variant="ghost">Skip</ControlButton>
                </div>
                <div className="text-xs text-slate-300">
                  Shortcuts: <kbd className="kbd">Space</kbd>, <kbd className="kbd">R</kbd>, <kbd className="kbd">N</kbd>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <Stat label="Cycles Done" value={`${cycleCount % settings.longEvery}/${settings.longEvery}`} />
              <Stat label="Focus Today" value={`${Math.floor(day.focusSec / 60)}m`} />
              <Stat label="Sessions Today" value={`${day.sessions}`} />
            </div>
          </div>

          {/* RIGHT: Settings */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur">
            <h2 className="text-lg font-semibold">Settings</h2>
            <div className="mt-4 space-y-5">
              <NumberField
                label="Pomodoro (min)"
                value={settings.pomodoroMin}
                onChange={(v) => setSettings({ ...settings, pomodoroMin: clamp(v, 1, 180) })}
              />
              <NumberField
                label="Short Break (min)"
                value={settings.shortMin}
                onChange={(v) => setSettings({ ...settings, shortMin: clamp(v, 1, 60) })}
              />
              <NumberField
                label="Long Break (min)"
                value={settings.longMin}
                onChange={(v) => setSettings({ ...settings, longMin: clamp(v, 1, 90) })}
              />
              <NumberField
                label="Long Break Every"
                suffix="sessions"
                value={settings.longEvery}
                onChange={(v) => setSettings({ ...settings, longEvery: clamp(v, 2, 12) })}
              />

              <ToggleField
                label="Auto-start next session"
                checked={settings.autoStart}
                onChange={(c) => setSettings({ ...settings, autoStart: c })}
              />
              <ToggleField
                label="Play sound on end"
                checked={settings.sound}
                onChange={(c) => setSettings({ ...settings, sound: c })}
              />
              <ToggleField
                label="Desktop notifications"
                checked={settings.notify}
                onChange={(c) => setSettings({ ...settings, notify: c })}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 text-sm"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY + ":settings");
                  window.location.reload();
                }}
              >
                Reset Settings
              </button>
              <button
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-sm"
                onClick={() => {
                  // Clear daily stats + cycle counter
                  localStorage.removeItem(STORAGE_KEY + ":stats");
                  localStorage.removeItem(STORAGE_KEY + ":cycles");

                  // Reset in-memory state so UI updates immediately
                  setStats({ [todayKey()]: { focusSec: 0, sessions: 0 } });
                  setCycleCount(0);
                }}
              >
                Clear Stats
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

function labelForMode(mode) {
  return mode === "focus" ? "Stay focused" : mode === "short" ? "Quick breather" : "Deep break";
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pomodoro</h1>
        <p className="text-slate-300 text-sm md:text-base">A sleek, keyboard-friendly timer with cycles, stats, and notifications.</p>
      </div>
      <a
        href="https://github.com/kyaw-nyc/pomox"
        target="_blank"
        rel="noreferrer"
        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm"
      >
        ⭐ Star this on GitHub
      </a>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-10 text-xs text-slate-400 text-center">
    </footer>
  );
}

function ModeTabs({ mode, setMode }) {
  return (
    <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/10">
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={
              "px-3 py-1.5 rounded-lg text-sm transition " +
              (active
                ? "bg-white text-slate-900 shadow"
                : "text-slate-200 hover:bg-white/10")
            }
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function ControlButton({ children, onClick, variant = "primary" }) {
  const base =
    "w-full px-4 py-2 rounded-xl text-base font-medium transition border text-center";
  const styles = {
    primary:
      "bg-emerald-400 text-slate-900 border-emerald-300 hover:bg-emerald-300",
    secondary:
      "bg-amber-400 text-slate-900 border-amber-300 hover:bg-amber-300",
    ghost: "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/10 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, suffix }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <label className="block">
      <div className="text-sm text-slate-300 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input
          className="w-24 px-3 py-2 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
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
        {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 select-none">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={
          "relative inline-flex h-7 w-12 items-center rounded-full transition " +
          (checked ? "bg-emerald-400" : "bg-white/10")
        }
        aria-pressed={checked}
      >
        <span
          className={
            "inline-block h-5 w-5 transform rounded-full bg-white transition " +
            (checked ? "translate-x-6" : "translate-x-1")
          }
        />
      </button>
    </label>
  );
}

function ProgressRing({ size = 200, stroke = 12, progress = 0, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#grad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        {children}
      </div>
    </div>
  );
}
