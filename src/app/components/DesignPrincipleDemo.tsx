import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

type Stage = 'unity' | 'dichotomy' | 'hierarchy';

const STAGES: { id: Stage; label: string; subtitle: string; color: string }[] = [
  { id: 'unity',     label: '01 UNITY',     subtitle: 'The Problem', color: '#6B7280' },
  { id: 'dichotomy', label: '02 DICHOTOMY', subtitle: 'The Break',   color: '#FFE500' },
  { id: 'hierarchy', label: '03 HIERARCHY', subtitle: 'The Fix',     color: '#00E5FF' },
];

const PRINCIPLE_COPY: Record<Stage, { heading: string; body: string; tag: string; tagColor: string }> = {
  unity: {
    heading: 'MONOTONY BY UNITY',
    body: 'When every element is the same size, weight, and spacing, the eye has no entry point. Everything competes equally. Nothing wins. The design becomes wallpaper — functional but forgettable.',
    tag: '⚠ DESIGN PROBLEM', tagColor: '#6B7280',
  },
  dichotomy: {
    heading: 'BREAKING WITH DICHOTOMY',
    body: 'We shatter the uniform grid: one element dominates at massive scale while others shrink to tiny rows. The contrast is electric — the eye snaps to the hero instantly. But now there\'s imbalance: the giant crushes the rest. Visual tension without resolution.',
    tag: '⚡ PATTERN BROKEN', tagColor: '#FFE500',
  },
  hierarchy: {
    heading: 'RESTORED BY HIERARCHY',
    body: 'Three deliberate weight tiers — Dominant (1), Supporting (2), Accent (3) — create a structured path for the eye. The drama of Dichotomy is preserved, but every element now has a clear role. Balance is restored without losing the tension.',
    tag: '✦ PRINCIPLE APPLIED', tagColor: '#00E5FF',
  },
};

/* ─── STAGE 1: UNITY ────────────────────────────────────────── */
function UnityStage({ items }: { items: any[] }) {
  const six = items.slice(0, 6);
  return (
    <motion.div key="unity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: '#111', position: 'relative' }}>
      {/* 6 identical cards, same size, same weight */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 200px)', gap: '2px' }}>
        {six.map((item) => (
          <div key={item.id} style={{ position: 'relative', overflow: 'hidden', background: '#1a1a1a' }}>
            <img src={item.imageUrl} alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
              padding: '12px 10px 8px' }}>
              <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '10px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>${item.price}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Label */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(10,10,10,0.85)',
        color: '#6B7280', fontSize: '9px', letterSpacing: '0.25em', padding: '5px 12px',
        fontFamily: "'Orbitron', sans-serif", border: '1px solid rgba(107,114,128,0.3)' }}>
        EQUAL WEIGHT · NO FOCAL POINT · VISUAL MONOTONY
      </div>
    </motion.div>
  );
}

/* ─── STAGE 2: DICHOTOMY ────────────────────────────────────── */
function DichotomyStage({ items }: { items: any[] }) {
  const [hero, ...rest] = items.slice(0, 6);
  const small = rest.slice(0, 5); // exactly 5 small items
  return (
    <motion.div key="dichotomy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: '#111', position: 'relative',
        display: 'grid', gridTemplateColumns: '3fr 1fr', gridTemplateRows: '1fr', gap: '2px', height: '400px' }}>

      {/* LEFT — giant hero */}
      <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }}
        style={{ position: 'relative', overflow: 'hidden', border: '2px solid #FFE500', gridRow: '1', gridColumn: '1' }}>
        <img src={hero.imageUrl} alt={hero.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 60%)' }} />
        <div style={{ position: 'absolute', top: 14, left: 14,
          background: '#FFE500', color: '#0A0A0A', fontSize: '9px', fontWeight: 900,
          padding: '3px 10px', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.12em' }}>
          DICHOTOMY ⚡
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '9px', letterSpacing: '0.3em', marginBottom: '4px' }}>DOMINATING ELEMENT</div>
          <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '24px', fontWeight: 900, lineHeight: 1.1 }}>{hero.name}</div>
          <div style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '20px', fontWeight: 700 }}>${hero.price}</div>
        </div>
      </motion.div>

      {/* RIGHT — 5 crushed tiny items stacked */}
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(5, 1fr)', gap: '2px', gridColumn: '2', gridRow: '1' }}>
        {small.map((item: any, i: number) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06 }}
            style={{ position: 'relative', overflow: 'hidden', background: '#1a1a1a' }}>
            <img src={item.imageUrl} alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.6)' }} />
            <div style={{ position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }} />
            <div style={{ position: 'absolute', bottom: 2, left: 4,
              color: 'rgba(255,255,255,0.5)', fontSize: '7px',
              fontFamily: "'Orbitron', sans-serif", overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              maxWidth: '90%' }}>
              {item.name}
            </div>
          </motion.div>
        ))}
      </div>

      {/* IMBALANCE warning */}
      <div style={{ position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(10,10,10,0.85)', color: '#FFE500', fontSize: '9px',
        letterSpacing: '0.2em', padding: '5px 12px',
        fontFamily: "'Orbitron', sans-serif", border: '1px solid rgba(255,229,0,0.4)' }}>
        HERO DOMINATES · CONTRAST ACHIEVED · BUT IMBALANCED
      </div>
    </motion.div>
  );
}

/* ─── STAGE 3: HIERARCHY ────────────────────────────────────── */
function HierarchyStage({ items }: { items: any[] }) {
  const six = items.slice(0, 6);
  // tier1 = [0], tier2 = [1, 2], tier3 = [3, 4, 5]
  return (
    <motion.div key="hierarchy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: '#111', position: 'relative' }}>

      {/* TOP ROW: hero (big) + 2 supporting (medium) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '280px', gap: '2px' }}>

        {/* TIER 1 — Dominant */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
          style={{ position: 'relative', overflow: 'hidden', background: '#1a1a1a' }}>
          <img src={six[0].imageUrl} alt={six[0].name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.07) 0%, transparent 50%, rgba(0,0,0,0.85) 100%)' }} />
          <div style={{ position: 'absolute', top: 12, left: 12,
            background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.45)',
            color: '#00E5FF', fontSize: '8px', fontWeight: 700, padding: '3px 9px',
            fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.15em' }}>
            TIER 1 · DOMINANT
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.2em', fontFamily: "'Orbitron', sans-serif" }}>HERO PIECE</div>
            <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 900, marginTop: '2px' }}>{six[0].name}</div>
            <div style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700 }}>${six[0].price}</div>
          </div>
        </motion.div>

        {/* TIER 2 — Supporting (items 1 & 2) */}
        {six.slice(1, 3).map((item: any, i: number) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.1 }}
            style={{ position: 'relative', overflow: 'hidden', background: '#1a1a1a' }}>
            <img src={item.imageUrl} alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
            <div style={{ position: 'absolute', top: 8, right: 8,
              background: 'rgba(255,229,0,0.14)', border: '1px solid rgba(255,229,0,0.4)',
              color: '#FFE500', fontSize: '7px', fontWeight: 700, padding: '2px 7px',
              fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}>
              TIER 2
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 10px' }}>
              <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.name}</div>
              <div style={{ color: '#FFE500', fontSize: '11px', fontWeight: 700 }}>${item.price}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* BOTTOM ROW: 3 accent items at equal smaller height */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '120px', gap: '2px', marginTop: '2px' }}>
        {six.slice(3, 6).map((item: any, i: number) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.07 }}
            style={{ position: 'relative', overflow: 'hidden', background: '#1a1a1a', display: 'flex', alignItems: 'flex-end' }}>
            <img src={item.imageUrl} alt={item.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.75)' }} />
            <div style={{ position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: '0 10px 8px', width: '100%' }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)', fontSize: '7px', fontWeight: 700,
                padding: '1px 6px', letterSpacing: '0.1em', fontFamily: "'Orbitron', sans-serif", marginBottom: '3px' }}>
                TIER 3
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Orbitron', sans-serif",
                fontSize: '10px', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {item.name}
              </div>
              <div style={{ color: 'rgba(255,229,0,0.7)', fontSize: '10px', fontWeight: 600 }}>${item.price}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* BALANCE label */}
      <div style={{ padding: '10px 12px 4px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(10,10,10,0.9)', color: '#00E5FF',
          fontSize: '9px', letterSpacing: '0.25em', padding: '5px 12px',
          fontFamily: "'Orbitron', sans-serif", border: '1px solid rgba(0,229,255,0.4)' }}>
          3-TIER HIERARCHY · DRAMA PRESERVED · BALANCE RESTORED ✦
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export function DesignPrincipleDemo() {
  const { items } = useApp();
  const [stage, setStage] = useState<Stage>('unity');
  const current = PRINCIPLE_COPY[stage];

  const stageIndex = STAGES.findIndex(s => s.id === stage);

  return (
    <section style={{ background: '#0D0D0D', borderTop: '1px solid rgba(255,229,0,0.08)', borderBottom: '1px solid rgba(255,229,0,0.08)', padding: '64px 32px' }}>

      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ color: '#FFE500', fontSize: '10px', letterSpacing: '0.5em', marginBottom: '10px', fontFamily: "'Orbitron', sans-serif" }}>
            // DESIGN LAB · GOLD CHALLENGE
          </div>
          <h2 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 900, lineHeight: 1.05, margin: 0 }}>
            BREAKING &amp; REBUILDING<br />
            <span style={{ color: '#FFE500' }}>DESIGN PATTERNS</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '10px', lineHeight: 1.7, maxWidth: '500px' }}>
            Watch the same six products transform as we break the UNITY pattern with DICHOTOMY,
            then restore visual balance using VISUAL HIERARCHY.
          </p>
        </div>

        {/* Stage selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
          {STAGES.map((s) => (
            <motion.button key={s.id} onClick={() => setStage(s.id)} whileHover={{ x: 4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer',
                background: stage === s.id ? `${s.color}12` : 'rgba(255,255,255,0.025)',
                border: `1px solid ${stage === s.id ? s.color : 'rgba(255,255,255,0.07)'}`,
                transition: 'all 0.2s',
              }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: stage === s.id ? s.color : 'rgba(255,255,255,0.15)',
                boxShadow: stage === s.id ? `0 0 8px ${s.color}` : 'none',
              }} />
              <div>
                <div style={{ color: stage === s.id ? s.color : 'rgba(255,255,255,0.4)', fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {s.label}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{s.subtitle}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Principle explanation */}
      <AnimatePresence mode="wait">
        <motion.div key={stage + '-copy'}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '14px',
            padding: '16px 18px', borderRadius: '6px', marginBottom: '24px',
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${current.tagColor}22`,
          }}>
          <span style={{
            background: `${current.tagColor}18`, color: current.tagColor,
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em',
            padding: '4px 10px', fontFamily: "'Orbitron', sans-serif",
            flexShrink: 0, marginTop: '2px', border: `1px solid ${current.tagColor}35`,
            whiteSpace: 'nowrap',
          }}>
            {current.tag}
          </span>
          <div>
            <div style={{ color: current.tagColor, fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '5px' }}>
              {current.heading}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{current.body}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* THE CANVAS */}
      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
        <AnimatePresence mode="wait">
          {stage === 'unity'     && <UnityStage     key="u" items={items} />}
          {stage === 'dichotomy' && <DichotomyStage key="d" items={items} />}
          {stage === 'hierarchy' && <HierarchyStage key="h" items={items} />}
        </AnimatePresence>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: '28px' }}>
        {STAGES.map((s, i) => (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => setStage(s.id)}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: stageIndex >= i ? s.color : 'rgba(255,255,255,0.12)',
                border: `2px solid ${s.color}`,
                boxShadow: stage === s.id ? `0 0 10px ${s.color}` : 'none',
                transition: 'all 0.3s',
              }} />
              <span style={{
                color: stage === s.id ? s.color : 'rgba(255,255,255,0.3)',
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em',
                fontFamily: "'Orbitron', sans-serif", whiteSpace: 'nowrap',
              }}>
                {s.label.split(' ')[1]}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.08)', margin: '0 10px', marginBottom: '18px' }}>
                <motion.div style={{ height: '100%', background: STAGES[i].color }}
                  animate={{ width: stageIndex > i ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
