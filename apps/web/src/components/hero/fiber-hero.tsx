'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, ChevronDown } from 'lucide-react';

// ─── colour palette ────────────────────────────────────────────────────────
const COLORS = [
  '#60a5fa', '#818cf8', '#a78bfa', '#38bdf8',
  '#c084fc', '#7dd3fc', '#6366f1', '#0ea5e9',
  '#93c5fd', '#a5b4fc', '#34d399', '#22d3ee',
];

// ─── path maths ───────────────────────────────────────────────────────────
interface Strand {
  d: string;
  color: string;
  width: number;
  delay: number;   // ms before the draw starts
  duration: number; // ms for full draw
}

function buildStrands(W: number, H: number): Strand[] {
  const N = 34;
  return Array.from({ length: N }, (_, i) => {
    const t = i / N;

    // Vertical distribution: spread from –10 % to 110 % of height
    const sy = -H * 0.1 + H * 1.2 * t + Math.sin(t * 9.31) * H * 0.07;
    const drift = Math.sin(t * 6.71 + 0.8) * H * 0.48;
    const ey = sy + drift;

    // Bezier control points: graceful sweeping S-curves
    const cx1 = W * 0.25 + Math.cos(t * 4.17) * W * 0.08;
    const cy1 = sy + drift * 0.28 + Math.sin(t * 5.13) * H * 0.26;
    const cx2 = W * 0.74 + Math.sin(t * 3.83 + 1) * W * 0.09;
    const cy2 = ey - drift * 0.28 + Math.cos(t * 4.71 + 0.5) * H * 0.21;

    const f = (n: number) => n.toFixed(2);
    return {
      d: `M -80,${f(sy)} C ${f(cx1)},${f(cy1)} ${f(cx2)},${f(cy2)} ${f(W + 80)},${f(ey)}`,
      color: COLORS[i % COLORS.length],
      // thin threads interspersed with bolder ones
      width: 0.45 + Math.abs(Math.sin(t * 8.27)) * 1.55,
      delay: i * 72,
      duration: 1400 + (i % 9) * 220,
    };
  });
}

// ─── web audio ────────────────────────────────────────────────────────────
function createAudio(): () => void {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const AudioCtx =
    window.AudioContext ??
    (window as any).webkitAudioContext as typeof AudioContext;
  const ctx = new AudioCtx();

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.5);
  master.connect(ctx.destination);

  // Ambient drone – A1, A2, E3, A3
  [55, 110, 165, 220].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime([0.45, 0.25, 0.14, 0.08][i], ctx.currentTime);
    osc.connect(g);
    g.connect(master);
    osc.start();
  });

  // High shimmer (fiber-optic light quality)
  const shimmer = ctx.createOscillator();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(1320, ctx.currentTime);
  const shimG = ctx.createGain();
  shimG.gain.setValueAtTime(0, ctx.currentTime);
  shimG.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 3);
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(0.28, ctx.currentTime);
  const lfoG = ctx.createGain();
  lfoG.gain.setValueAtTime(14, ctx.currentTime);
  lfo.connect(lfoG);
  lfoG.connect(shimmer.frequency);
  lfo.start();
  shimmer.connect(shimG);
  shimG.connect(master);
  shimmer.start();

  return () => {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => { try { ctx.close(); } catch { /**/ } }, 1700);
  };
}

// ─── component ────────────────────────────────────────────────────────────
export function FiberHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);
  const [dims, setDims] = useState({ w: 1280, h: 720 });
  const [soundOn, setSoundOn] = useState(false);

  // ── resize observer ────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.round(width), h: Math.round(height) });
    });
    obs.observe(el);
    const r = el.getBoundingClientRect();
    setDims({ w: Math.round(r.width), h: Math.round(r.height) });
    return () => obs.disconnect();
  }, []);

  // ── stroke-dashoffset animation ────────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const pathEls = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-s]'));
    const strands = buildStrands(dims.w, dims.h);
    const flags = pathEls.map(() => ({ dead: false }));

    pathEls.forEach((el, i) => {
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;

      const delay = strands[i]?.delay ?? i * 72;
      const dur = strands[i]?.duration ?? 1800;
      const flag = flags[i];
      let startAt = -1;

      function draw(now: number) {
        if (flag.dead) return;
        if (startAt < 0) startAt = now + delay;
        const elapsed = Math.max(0, now - startAt);
        const p = Math.min(elapsed / dur, 1);
        // cubic ease-out
        el.style.strokeDashoffset = `${len * Math.pow(1 - p, 3)}`;
        if (p < 1) requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    });

    return () => flags.forEach((f) => { f.dead = true; });
  }, [dims]);

  // ── audio cleanup ──────────────────────────────────────────────────────
  useEffect(() => () => { stopAudioRef.current?.(); }, []);

  function toggleSound() {
    if (soundOn) {
      stopAudioRef.current?.();
      stopAudioRef.current = null;
      setSoundOn(false);
    } else {
      stopAudioRef.current = createAudio();
      setSoundOn(true);
    }
  }

  const strands = buildStrands(dims.w, dims.h);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[93vh] flex-col items-center justify-center overflow-hidden bg-[#07071a]"
    >
      {/* ── gradient radial glow behind text ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(99,102,241,0.13) 0%, transparent 70%)',
        }}
      />

      {/* ── fiber SVG — mix-blend-mode:screen makes strands weave through the white headline ── */}
      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ mixBlendMode: 'screen' }}
      >
        {strands.map((s, i) => (
          <path
            key={i}
            data-s={i}
            d={s.d}
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            fill="none"
            opacity={0.72}
          />
        ))}
      </svg>

      {/* ── eyebrow ── */}
      <p
        className="relative z-10 mb-8 select-none font-mono text-[0.65rem] uppercase tracking-[0.35em] text-blue-400/60"
        aria-hidden="true"
      >
        [ marketplace · sri lanka ]
      </p>

      {/* ── headline: clamp() fills the viewport, heavy sans against the fiber ── */}
      <h1
        className="relative z-10 select-none text-center font-black uppercase leading-[0.86] tracking-tighter text-white"
        style={{ fontSize: 'clamp(3rem, 12.5vw, 9.5rem)' }}
      >
        Find
        <br />
        Trusted
        <br />
        Services
        <br />
        Near&nbsp;You
      </h1>

      {/* ── mono sub-labels ── */}
      <div className="relative z-10 mt-9 flex flex-wrap justify-center gap-6 font-mono text-[0.65rem] tracking-[0.25em] text-blue-300/50 uppercase">
        <span>[ Verified Providers ]</span>
        <span>[ All Sri Lanka ]</span>
        <span>[ Free to Search ]</span>
      </div>

      {/* ── CTA ── */}
      <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-3">
        <a
          href="#search"
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500 active:scale-95"
        >
          Search services
        </a>
        <Link
          href="/auth/register?role=PROVIDER"
          className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
        >
          List your business
        </Link>
      </div>

      {/* ── sound toggle (top-right, gated behind user interaction) ── */}
      <button
        onClick={toggleSound}
        className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-white/40 backdrop-blur transition hover:bg-white/10 hover:text-white/70"
        aria-label={soundOn ? 'Mute ambient sound' : 'Enable ambient sound'}
      >
        {soundOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
        {soundOn ? 'Sound on' : 'Sound off'}
      </button>

      {/* ── scroll cue ── */}
      <a
        href="#search"
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/25 transition hover:text-white/50"
        aria-label="Scroll to search"
      >
        <ChevronDown className="h-6 w-6" />
      </a>
    </section>
  );
}
