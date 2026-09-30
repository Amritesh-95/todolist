"use client";

import { memo, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Analog stopwatch countdown.                                        */
/*  - Big red hand sweeps the seconds, small dial shows minutes.       */
/*  - Top crown: start / pause     Right pusher: reset                 */
/*  - Left pusher: cycle presets   Drag the small dial: set minutes    */
/* ------------------------------------------------------------------ */

const PRESETS = [5, 15, 25];
const MAX_MIN = 30;

const CX = 120; // dial centre
const CY = 150;
const SCX = 120; // sub-dial centre
const SCY = 118;

const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  // round so server (Node) and browser produce identical attribute strings
  const round = (n) => Math.round(n * 100) / 100;
  return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))];
};

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.22);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {}
}

/* Static dial face: ticks + numerals. Memoised so it doesn't re-render every frame. */
const DialFace = memo(function DialFace() {
  const ticks = [];
  for (let i = 0; i < 300; i++) {
    const deg = i * 1.2;
    const isFive = i % 25 === 0;
    const isSec = i % 5 === 0;
    const len = isFive ? 9 : isSec ? 6 : 3;
    const [x1, y1] = polar(CX, CY, 79, deg);
    const [x2, y2] = polar(CX, CY, 79 - len, deg);
    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#1b1b1b"
        strokeWidth={isFive ? 1.6 : isSec ? 0.9 : 0.45}
      />
    );
  }

  const numerals = [];
  for (let i = 0; i < 12; i++) {
    const [x, y] = polar(CX, CY, 60, i * 30);
    numerals.push(
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Helvetica, Arial, sans-serif"
        fontWeight="600"
        fontSize="12.5"
        fill="#111"
      >
        {i === 0 ? 60 : i * 5}
      </text>
    );
  }

  const subTicks = [];
  for (let i = 0; i < 30; i++) {
    const deg = i * 12;
    const big = i % 5 === 0;
    const [x1, y1] = polar(SCX, SCY, 18, deg);
    const [x2, y2] = polar(SCX, SCY, big ? 15 : 16.5, deg);
    subTicks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#222" strokeWidth={big ? 0.8 : 0.4} />);
  }
  const subNums = [];
  for (let i = 0; i < 6; i++) {
    const [x, y] = polar(SCX, SCY, 11, i * 60);
    subNums.push(
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="4.6"
        fill="#222"
      >
        {i === 0 ? 30 : i * 5}
      </text>
    );
  }

  return (
    <g>
      {ticks}
      {numerals}
      <circle cx={SCX} cy={SCY} r="19.5" fill="none" stroke="#222" strokeWidth="0.7" />
      {subTicks}
      {subNums}
    </g>
  );
});

export default function StopwatchTimer({ defaultMinutes = 25 }) {
  const [setMs, setSetMs] = useState(defaultMinutes * 60000);
  const [leftMs, setLeftMs] = useState(defaultMinutes * 60000);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const endRef = useRef(0);
  const dragRef = useRef(false);
  const svgRef = useRef(null);

  /* countdown loop (end-time based, so it stays accurate in background tabs) */
  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + leftMs;
    const id = setInterval(() => {
      const left = Math.max(0, endRef.current - Date.now());
      setLeftMs(left);
      if (left <= 0) {
        clearInterval(id);
        setRunning(false);
        setDone(true);
        beep();
      }
    }, 40);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const totalSec = Math.ceil(leftMs / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  useEffect(() => {
    document.title = running ? `${mm}:${ss} · Focus` : "Tasks";
    return () => {
      document.title = "Tasks";
    };
  }, [running, mm, ss]);

  const setDuration = (minutes) => {
    const m = Math.min(MAX_MIN, Math.max(1, minutes));
    setRunning(false);
    setDone(false);
    setSetMs(m * 60000);
    setLeftMs(m * 60000);
  };

  const toggle = () => {
    if (running) {
      setRunning(false);
      return;
    }
    if (leftMs <= 0) setLeftMs(setMs);
    setDone(false);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    setLeftMs(setMs);
  };

  const cyclePreset = () => {
    const cur = setMs / 60000;
    const i = PRESETS.indexOf(cur);
    setDuration(PRESETS[(i + 1) % PRESETS.length]);
  };

  /* drag the small dial to set minutes */
  const setFromPointer = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    let deg = (Math.atan2(p.x - SCX, -(p.y - SCY)) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    let m = Math.round(deg / 12);
    if (m === 0) m = setMs / 60000 > 15 ? 30 : 1;
    if (m !== setMs / 60000) setDuration(m);
  };

  const secAngle = (((leftMs / 1000) % 60) / 60) * 360;
  const minAngle = (Math.min(MAX_MIN, leftMs / 60000) / MAX_MIN) * 360;

  const key = (fn) => (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className={`sw2-card${done ? " sw2-done" : ""}${running ? " sw2-run" : ""}`}>
      <svg ref={svgRef} viewBox="0 0 240 262" className="sw2-svg" role="group" aria-label="Stopwatch timer">
        <defs>
          <linearGradient id="sw2-bezel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fafafa" />
            <stop offset="28%" stopColor="#9c9c9c" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="75%" stopColor="#7c7c7c" />
            <stop offset="100%" stopColor="#e9e9e9" />
          </linearGradient>
          <linearGradient id="sw2-bezel2" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f2f2f2" />
            <stop offset="35%" stopColor="#8b8b8b" />
            <stop offset="60%" stopColor="#f8f8f8" />
            <stop offset="100%" stopColor="#8f8f8f" />
          </linearGradient>
          <linearGradient id="sw2-push" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#747474" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#8a8a8a" />
          </linearGradient>
          <radialGradient id="sw2-dial" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="80%" stopColor="#f6f7f8" />
            <stop offset="100%" stopColor="#dfe2e5" />
          </radialGradient>
          <linearGradient id="sw2-gloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="sw2-body">
          {/* ring loop */}
          <circle cx="120" cy="24" r="12" fill="none" stroke="url(#sw2-bezel)" strokeWidth="3.6" />

          {/* left pusher: presets */}
          <g transform={`rotate(-40 ${CX} ${CY})`}>
            <g
              className="sw2-push"
              role="button"
              tabIndex={0}
              aria-label="Cycle preset: 5, 15, 25 minutes"
              onClick={cyclePreset}
              onKeyDown={key(cyclePreset)}
            >
              <title>Cycle preset (5 / 15 / 25 min)</title>
              <rect x="115" y="43" width="10" height="16" rx="1.5" fill="url(#sw2-push)" />
              <rect x="111.5" y="32" width="17" height="12" rx="3" fill="url(#sw2-push)" stroke="#6d6d6d" strokeWidth="0.6" />
            </g>
          </g>

          {/* right pusher: reset */}
          <g transform={`rotate(40 ${CX} ${CY})`}>
            <g
              className="sw2-push"
              role="button"
              tabIndex={0}
              aria-label="Reset timer"
              onClick={reset}
              onKeyDown={key(reset)}
            >
              <title>Reset</title>
              <rect x="115" y="43" width="10" height="16" rx="1.5" fill="url(#sw2-push)" />
              <rect x="111.5" y="32" width="17" height="12" rx="3" fill="url(#sw2-push)" stroke="#6d6d6d" strokeWidth="0.6" />
            </g>
          </g>

          {/* crown: start / pause */}
          <g
            className="sw2-push"
            role="button"
            tabIndex={0}
            aria-label={running ? "Pause timer" : "Start timer"}
            onClick={toggle}
            onKeyDown={key(toggle)}
          >
            <title>{running ? "Pause" : "Start"}</title>
            <rect x="114" y="42" width="12" height="14" rx="1.5" fill="url(#sw2-push)" />
            <rect x="109" y="31" width="22" height="13" rx="3" fill="url(#sw2-push)" stroke="#6d6d6d" strokeWidth="0.6" />
          </g>

          {/* case */}
          <circle cx={CX} cy={CY} r="100" fill="url(#sw2-bezel)" />
          <circle cx={CX} cy={CY} r="93" fill="url(#sw2-bezel2)" />
          <circle cx={CX} cy={CY} r="87" fill="#bdbdbd" />
          <circle cx={CX} cy={CY} r="84" fill="url(#sw2-dial)" />

          <DialFace />

          {/* small minute hand */}
          <g transform={`rotate(${minAngle} ${SCX} ${SCY})`} style={{ pointerEvents: "none" }}>
            <line x1={SCX} y1={SCY + 3} x2={SCX} y2={SCY - 15.5} stroke="#1c1c1c" strokeWidth="1.1" strokeLinecap="round" />
          </g>
          <circle cx={SCX} cy={SCY} r="1.9" fill="#1c1c1c" style={{ pointerEvents: "none" }} />

          {/* red seconds hand */}
          <g transform={`rotate(${secAngle} ${CX} ${CY})`} style={{ pointerEvents: "none" }}>
            <line x1={CX} y1={CY + 22} x2={CX} y2={CY - 70} stroke="#d1201d" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx={CX} cy={CY} r="4.6" fill="#d1201d" />
            <circle cx={CX} cy={CY} r="1.7" fill="#fff" />
          </g>

          {/* glass highlight */}
          <ellipse
            cx="92"
            cy="102"
            rx="56"
            ry="30"
            transform="rotate(-32 92 102)"
            fill="url(#sw2-gloss)"
            style={{ pointerEvents: "none" }}
          />

          {/* drag target for the small dial */}
          <circle
            className={running ? "sw2-sub" : "sw2-sub sw2-sub-on"}
            cx={SCX}
            cy={SCY}
            r="21"
            fill="transparent"
            onPointerDown={(e) => {
              if (running) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = true;
              setFromPointer(e);
            }}
            onPointerMove={(e) => dragRef.current && setFromPointer(e)}
            onPointerUp={() => (dragRef.current = false)}
            onPointerCancel={() => (dragRef.current = false)}
          />
        </g>
      </svg>

      <div className="sw2-readout" aria-live="off">
        {mm}:{ss}
      </div>

      <div className="sw2-row">
        <button className="sw2-btn sw2-btn-main" onClick={toggle}>
          {running ? "Pause" : leftMs > 0 && leftMs < setMs ? "Resume" : "Start"}
        </button>
        <button className="sw2-btn" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="sw2-chips">
        {PRESETS.map((m) => (
          <button
            key={m}
            className={setMs / 60000 === m ? "sw2-chip sw2-chip-on" : "sw2-chip"}
            onClick={() => setDuration(m)}
          >
            {m} min
          </button>
        ))}
      </div>

      {!running && !done && <div className="sw2-hint">Drag the small dial to set minutes</div>}
      {done && <div className="sw2-hint sw2-hint-done">Time's up</div>}

      <style>{`
        .sw2-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 12px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; gap: 10px; color: #f3efe6; font-size: 13px; }
        .sw2-svg { width: 100%; max-width: 230px; align-self: center; overflow: visible; filter: drop-shadow(0 8px 10px rgba(0,0,0,0.45)); }
        .sw2-run .sw2-svg { filter: drop-shadow(0 8px 10px rgba(0,0,0,0.45)) drop-shadow(0 0 10px rgba(255,90,80,0.25)); }
        .sw2-done .sw2-svg { animation: sw2-shake 0.5s ease-in-out 3; transform-origin: 50% 60%; }

        .sw2-push { cursor: pointer; transition: transform 0.08s; outline: none; }
        .sw2-push:active { transform: translateY(3px); }
        .sw2-push:focus-visible rect { stroke: #4f8bff; stroke-width: 1.6; }
        .sw2-push:hover rect { filter: brightness(1.08); }

        .sw2-sub-on { cursor: grab; }
        .sw2-sub-on:hover { stroke: rgba(209,32,29,0.55); stroke-width: 1.2; }
        .sw2-sub { touch-action: none; }

        .sw2-readout { text-align: center; font-size: 26px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: 1px; }
        .sw2-done .sw2-readout { color: #ff7a72; }

        .sw2-row { display: flex; gap: 8px; }
        .sw2-btn { flex: 1; padding: 8px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.08); color: inherit; cursor: pointer; font: inherit; transition: background 0.2s, transform 0.1s; }
        .sw2-btn:hover { background: rgba(255,255,255,0.15); }
        .sw2-btn:active { transform: scale(0.97); }
        .sw2-btn-main { background: linear-gradient(135deg, #e5443b, #ff8a4c); border-color: transparent; font-weight: 600; }
        .sw2-btn-main:hover { filter: brightness(1.1); background: linear-gradient(135deg, #e5443b, #ff8a4c); }

        .sw2-chips { display: flex; gap: 6px; }
        .sw2-chip { flex: 1; padding: 5px 0; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: inherit; opacity: 0.7; cursor: pointer; font: inherit; font-size: 12px; transition: all 0.2s; }
        .sw2-chip:hover { opacity: 1; }
        .sw2-chip-on { opacity: 1; background: rgba(255,255,255,0.16); }

        .sw2-hint { text-align: center; font-size: 12px; opacity: 0.55; }
        .sw2-hint-done { opacity: 1; color: #ff9d95; font-weight: 600; }

        .sw2-btn:focus-visible, .sw2-chip:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

        @keyframes sw2-shake {
          0%,100% { transform: rotate(0); }
          20% { transform: rotate(-3deg); }
          40% { transform: rotate(3deg); }
          60% { transform: rotate(-2deg); }
          80% { transform: rotate(2deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sw2-done .sw2-svg { animation: none; }
          .sw2-push { transition: none; }
        }
      `}</style>
    </div>
  );
}
