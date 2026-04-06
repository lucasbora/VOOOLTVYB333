/**
 * VOLT SIGNATURE — The BAZINGA Feature
 *
 * Generates a unique, algorithmically-driven frequency waveform
 * "fingerprint" for any outfit combination. Like a sound equalizer
 * for fashion — the visual DNA of two pieces combined.
 *
 * How it works:
 * - Each clothing item's properties (color hex → HSL, price, rating,
 *   style tags) are converted into waveform parameters (frequency,
 *   amplitude, phase offset, decay).
 * - Two waveforms are composited with interference patterns.
 * - The result is a UNIQUE visual signature no two outfits share.
 *
 * No other fashion app does this. This is VOLT VYBE's identity.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { ClothingItem } from '../data/items';

interface VoltSignatureProps {
  item1: ClothingItem;
  item2: ClothingItem;
  score: number;
  gradeColor: string;
  width?: number;
  height?: number;
}

// Convert hex color to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

const STYLE_TAG_VALUES: Record<string, number> = {
  streetwear: 1.0,
  sporty: 0.7,
  minimal: 0.3,
  'avant-garde': 1.5,
  casual: 0.5,
  techwear: 1.2,
};

function itemToWaveParams(item: ClothingItem) {
  const hsl = hexToHsl(item.colorHex.startsWith('#') ? item.colorHex : '#888888');
  const tagEnergy = item.styleTags.reduce((s, t) => s + (STYLE_TAG_VALUES[t] || 0.5), 0) / item.styleTags.length;
  return {
    frequency: 0.003 + (hsl.h / 360) * 0.012,    // color hue → wave frequency
    amplitude: 20 + (item.price / 150) * 40,       // price → how tall the wave is
    phase: (hsl.s / 100) * Math.PI * 2,            // saturation → phase shift
    decay: 0.92 + (item.rating / 5) * 0.07,        // rating → how quickly it decays
    energy: tagEnergy,                               // style tags → additional harmonic
    lightness: hsl.l,                               // lightness → secondary frequency
    hue: hsl.h,
  };
}

function lerpColor(c1: string, c2: string, t: number): string {
  const h1 = hexToHsl(c1.startsWith('#') ? c1 : '#888888');
  const h2 = hexToHsl(c2.startsWith('#') ? c2 : '#888888');
  const h = h1.h + (h2.h - h1.h) * t;
  const s = h1.s + (h2.s - h1.s) * t;
  const l = h1.l + (h2.l - h1.l) * t;
  return `hsl(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%)`;
}

export function VoltSignature({ item1, item2, score, gradeColor, width = 600, height = 140 }: VoltSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const w1 = useMemo(() => itemToWaveParams(item1), [item1.id]);
  const w2 = useMemo(() => itemToWaveParams(item2), [item2.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * DPR;
    canvas.height = canvas.offsetHeight * DPR;
    ctx.scale(DPR, DPR);

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const cx = H / 2;

    function draw(t: number) {
      ctx!.clearRect(0, 0, W, H);

      // Dark background with subtle grid
      ctx!.fillStyle = '#0A0A0A';
      ctx!.fillRect(0, 0, W, H);

      // Horizontal center line (faint)
      ctx!.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(0, cx);
      ctx!.lineTo(W, cx);
      ctx!.stroke();

      // Vertical tick marks
      for (let x = 0; x < W; x += 40) {
        ctx!.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx!.beginPath();
        ctx!.moveTo(x, cx - 4);
        ctx!.lineTo(x, cx + 4);
        ctx!.stroke();
      }

      // ——— WAVE 1 (item1 base frequency) ———
      const scoreNorm = score / 100;

      const drawWave = (
        wave: ReturnType<typeof itemToWaveParams>,
        color: string,
        opacity: number,
        lineW: number,
        timeOffset: number,
        invert: boolean,
      ) => {
        ctx!.beginPath();
        ctx!.strokeStyle = color;
        ctx!.globalAlpha = opacity;
        ctx!.lineWidth = lineW;
        ctx!.shadowColor = color;
        ctx!.shadowBlur = 8;

        for (let x = 0; x <= W; x += 1) {
          const tOffset = t * 0.0008 + timeOffset;
          // Primary sine
          const y1 = Math.sin(x * wave.frequency * 6 + tOffset + wave.phase) * wave.amplitude;
          // Harmonic (higher frequency, lower amplitude)
          const y2 = Math.sin(x * wave.frequency * 14 + tOffset * 1.3 + wave.phase * 0.5) * (wave.amplitude * 0.3 * wave.energy);
          // Decay envelope — fades at edges
          const edgeFade = Math.min(x / (W * 0.15), 1) * Math.min((W - x) / (W * 0.15), 1);
          // Score influence — high score = bigger amplitude
          const scoreMod = 0.6 + scoreNorm * 0.7;
          const y = (y1 + y2) * edgeFade * scoreMod * (invert ? -1 : 1);

          if (x === 0) ctx!.moveTo(x, cx + y);
          else ctx!.lineTo(x, cx + y);
        }
        ctx!.stroke();
        ctx!.shadowBlur = 0;
        ctx!.globalAlpha = 1;
      };

      // Wave 1 — item1's frequency signature
      drawWave(w1, item1.colorHex, 0.8, 2, 0, false);
      // Wave 1 glow echo
      drawWave(w1, item1.colorHex, 0.2, 6, 0, false);

      // Wave 2 — item2's frequency signature (phase shifted, inverted for interference)
      drawWave(w2, item2.colorHex, 0.7, 2, Math.PI * 0.6, true);
      // Wave 2 glow echo
      drawWave(w2, item2.colorHex, 0.15, 8, Math.PI * 0.6, true);

      // ——— INTERFERENCE COMPOSITE WAVE ———
      // This is the "combined outfit signature" — composite of both
      ctx!.beginPath();
      ctx!.globalAlpha = 0.9;
      ctx!.lineWidth = 1.5;
      ctx!.shadowColor = gradeColor;
      ctx!.shadowBlur = 14;

      let prevX = 0, prevY = cx;
      for (let x = 0; x <= W; x += 1) {
        const tOff = t * 0.0008;
        const y1 = Math.sin(x * w1.frequency * 6 + tOff + w1.phase) * w1.amplitude;
        const y2h = Math.sin(x * w1.frequency * 14 + tOff * 1.3 + w1.phase * 0.5) * (w1.amplitude * 0.3 * w1.energy);
        const y3 = Math.sin(x * w2.frequency * 6 + tOff * 1.0 + Math.PI * 0.6 + w2.phase) * w2.amplitude;
        const y4h = Math.sin(x * w2.frequency * 14 + tOff * 1.3 * 1.0 + (Math.PI * 0.6) * 0.5 + w2.phase * 0.5) * (w2.amplitude * 0.3 * w2.energy);
        const edgeFade = Math.min(x / (W * 0.1), 1) * Math.min((W - x) / (W * 0.1), 1);
        const scoreMod = 0.5 + (score / 100) * 0.8;
        const composite = (y1 + y2h - y3 - y4h) * 0.5 * edgeFade * scoreMod;

        // Color the composite wave based on grade color
        const grad = ctx!.createLinearGradient(prevX, 0, x, 0);
        grad.addColorStop(0, gradeColor + 'BB');
        grad.addColorStop(1, gradeColor + 'BB');
        ctx!.strokeStyle = grad;

        if (x === 0) ctx!.moveTo(x, cx + composite);
        else ctx!.lineTo(x, cx + composite);
        prevX = x; prevY = cx + composite;
      }
      ctx!.stroke();
      ctx!.shadowBlur = 0;
      ctx!.globalAlpha = 1;

      // ——— SCORE AMPLITUDE MARKERS ———
      // Small vertical bars showing score as a spectrum analyzer
      const barCount = 32;
      const barW = (W / barCount) - 1;
      for (let i = 0; i < barCount; i++) {
        const x = i * (W / barCount);
        const phase = (i / barCount) * Math.PI * 2;
        const barH = Math.abs(Math.sin(phase + t * 0.001 + w1.phase + w2.phase)) * (score / 100) * 18;
        const alpha = 0.15 + (barH / 18) * 0.25;
        ctx!.fillStyle = gradeColor;
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(x, H - 4 - barH, barW, barH);
        ctx!.fillRect(x, 4, barW, barH);
        ctx!.globalAlpha = 1;
      }

      // ——— ID LABEL ———
      ctx!.font = `600 9px 'Orbitron', monospace`;
      ctx!.fillStyle = 'rgba(255,255,255,0.15)';
      ctx!.letterSpacing = '2px';
      const id = `SIG·${item1.id.padStart(3,'0')}×${item2.id.padStart(3,'0')}·SCORE:${score}`;
      ctx!.fillText(id, 10, H - 10);
    }

    let start: number | null = null;
    function loop(ts: number) {
      if (!start) start = ts;
      timeRef.current = ts - start;
      draw(timeRef.current);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [item1.id, item2.id, score, gradeColor, w1, w2]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div style={{ color: '#00E5FF', fontFamily: "'Orbitron', sans-serif", fontSize: '10px', letterSpacing: '0.3em', marginBottom: '2px' }}>
            ⬡ VOLT SIGNATURE™
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
            Unique frequency fingerprint of this outfit combo
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: gradeColor, fontFamily: "'Orbitron', sans-serif", fontSize: '9px', letterSpacing: '0.15em' }}>
            {item1.colorName} × {item2.colorName}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden rounded" style={{ border: `1px solid ${gradeColor}30`, background: '#0A0A0A' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        />
        {/* Corner annotations */}
        <div className="absolute top-2 left-2" style={{ color: 'rgba(255,255,255,0.15)', fontSize: '8px', fontFamily: 'monospace' }}>
          CH1:{item1.name.slice(0, 4)}
        </div>
        <div className="absolute top-2 right-2" style={{ color: 'rgba(255,255,255,0.15)', fontSize: '8px', fontFamily: 'monospace' }}>
          CH2:{item2.name.slice(0, 4)}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div style={{ width: 24, height: 2, background: item1.colorHex }} />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{item1.name.slice(0, 12)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 24, height: 2, background: item2.colorHex }} />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{item2.name.slice(0, 12)}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div style={{ width: 24, height: 2, background: gradeColor }} />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>COMPOSITE</span>
        </div>
      </div>
    </div>
  );
}
